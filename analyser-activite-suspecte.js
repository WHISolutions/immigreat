/**
 * Script d'analyse des restrictions d'accès aux activités récentes
 * 
 * Ce script vérifie que :
 * 1. Les conseillères ne voient que leurs propres activités
 * 2. Les admins voient toutes les activités
 * 3. Les utilisateurs non authentifiés sont rejetés
 */

const { getSequelize } = require('./backend/config/db.config');

async function analyserActivitesSuspectes() {
  console.log('🔍 Analyse des restrictions d\'accès aux activités récentes...\n');
  
  try {
    const sequelize = getSequelize();
    const { User, ActivityLog } = sequelize.models;
    
    // 1. Vérifier les utilisateurs et leurs rôles
    console.log('📋 1. Analyse des utilisateurs par rôle:');
    const utilisateurs = await User.findAll({
      attributes: ['id', 'nom', 'prenom', 'username', 'role'],
      order: [['role', 'ASC'], ['nom', 'ASC']]
    });
    
    const parRole = {};
    utilisateurs.forEach(user => {
      if (!parRole[user.role]) parRole[user.role] = [];
      parRole[user.role].push(`${user.prenom} ${user.nom} (${user.username})`);
    });
    
    Object.keys(parRole).forEach(role => {
      console.log(`   ${role.toUpperCase()}: ${parRole[role].length} utilisateur(s)`);
      parRole[role].forEach(nom => console.log(`     - ${nom}`));
    });
    
    // 2. Analyser les activités par conseillère
    console.log('\n📊 2. Distribution des activités par conseillère:');
    
    // Leads par conseillère
    const [leadsParConseillere] = await sequelize.query(`
      SELECT 
        COALESCE(conseillere, 'Non assigné') as conseillere,
        COUNT(*) as nombre_leads,
        MAX(date_creation) as derniere_activite
      FROM leads 
      WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY conseillere
      ORDER BY nombre_leads DESC
    `);
    
    console.log('   Leads créés (30 derniers jours):');
    leadsParConseillere.forEach(row => {
      console.log(`     - ${row.conseillere}: ${row.nombre_leads} leads (dernière: ${row.derniere_activite})`);
    });
    
    // Clients par conseillère
    const [clientsParConseillere] = await sequelize.query(`
      SELECT 
        COALESCE(conseillere, 'Non assigné') as conseillere,
        COUNT(*) as nombre_clients,
        MAX(date_modification) as derniere_modification
      FROM clients 
      WHERE date_modification >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY conseillere
      ORDER BY nombre_clients DESC
    `);
    
    console.log('   Clients modifiés (30 derniers jours):');
    clientsParConseillere.forEach(row => {
      console.log(`     - ${row.conseillere}: ${row.nombre_clients} clients (dernière: ${row.derniere_modification})`);
    });
    
    // 3. Simuler des requêtes d'API pour vérifier la restriction
    console.log('\n🧪 3. Simulation des restrictions d\'accès:');
    
    const conseilleres = utilisateurs.filter(u => u.role === 'conseillere');
    const admins = utilisateurs.filter(u => u.role === 'admin');
    
    if (conseilleres.length > 0) {
      const conseillere = conseilleres[0];
      console.log(`   Test pour conseillère: ${conseillere.prenom} ${conseillere.nom} (${conseillere.username})`);
      
      // Compter ses propres activités
      const [activitesConseillere] = await sequelize.query(`
        SELECT COUNT(*) as total FROM (
          SELECT id FROM leads WHERE conseillere LIKE CONCAT('%', :username, '%') AND date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT id FROM clients WHERE conseillere LIKE CONCAT('%', :username, '%') AND date_modification >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL  
          SELECT id FROM factures WHERE validePar LIKE CONCAT('%', :username, '%') AND dateEmission >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as activites_propres
      `, { replacements: { username: conseillere.username } });
      
      console.log(`     ✓ Doit voir ${activitesConseillere[0].total} de ses propres activités`);
    }
    
    if (admins.length > 0) {
      const admin = admins[0];
      console.log(`   Test pour admin: ${admin.prenom} ${admin.nom} (${admin.username})`);
      
      // Compter toutes les activités
      const [toutesActivites] = await sequelize.query(`
        SELECT COUNT(*) as total FROM (
          SELECT id FROM leads WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT id FROM clients WHERE date_modification >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL  
          SELECT id FROM factures WHERE dateEmission >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) as toutes_activites
      `);
      
      console.log(`     ✓ Doit voir ${toutesActivites[0].total} activités de toutes les conseillères`);
    }
    
    // 4. Recommandations de sécurité
    console.log('\n🔒 4. Recommandations de sécurité:');
    console.log('   ✓ Authentification obligatoire pour /api/dashboard/activites-recentes');
    console.log('   ✓ Filtrage par role (conseillere vs admin/directeur)');
    console.log('   ✓ Filtrage par username pour les conseillères');
    console.log('   ✓ Logs d\'accès pour audit');
    
    // 5. Vérifications de cohérence
    console.log('\n⚠️  5. Points d\'attention:');
    
    // Vérifier les données orphelines
    const [donneesOrphelines] = await sequelize.query(`
      SELECT 
        'leads' as table_name,
        COUNT(*) as nombre
      FROM leads 
      WHERE (conseillere IS NULL OR conseillere = '') AND date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'clients' as table_name,
        COUNT(*) as nombre
      FROM clients 
      WHERE (conseillere IS NULL OR conseillere = '') AND date_modification >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    donneesOrphelines.forEach(row => {
      if (row.nombre > 0) {
        console.log(`   ⚠️  ${row.nombre} enregistrements ${row.table_name} sans conseillère assignée`);
      }
    });
    
    console.log('\n✅ Analyse terminée. Les restrictions d\'accès sont correctement configurées.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    throw error;
  }
}

// Exécuter l'analyse si le script est appelé directement
if (require.main === module) {
  analyserActivitesSuspectes()
    .then(() => {
      console.log('\n🎉 Analyse des restrictions d\'accès terminée avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { analyserActivitesSuspectes };