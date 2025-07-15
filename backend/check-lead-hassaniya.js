const mysql = require('mysql2/promise');

async function checkLeadHassaniya() {
  try {
    console.log('🔍 Recherche du lead "hassaniya"...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'immigration_production'
    });

    // Rechercher le lead hassaniya
    const [leads] = await connection.execute(`
      SELECT 
        id, 
        nom, 
        prenom, 
        conseiller_id,
        conseillere,
        date_creation,
        date_modification
      FROM leads 
      WHERE nom LIKE '%hassaniya%' OR prenom LIKE '%hassaniya%'
      ORDER BY date_modification DESC
    `);

    console.log(`📊 ${leads.length} lead(s) trouvé(s) avec "hassaniya":`);
    
    if (leads.length === 0) {
      console.log('❌ Aucun lead trouvé avec "hassaniya"');
      
      // Cherchons des leads récents modifiés
      const [recentLeads] = await connection.execute(`
        SELECT 
          id, 
          nom, 
          prenom, 
          conseiller_id,
          conseillere,
          date_modification
        FROM leads 
        ORDER BY date_modification DESC 
        LIMIT 10
      `);
      
      console.log('\n📅 10 leads récemment modifiés:');
      recentLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. Lead ${lead.id}: ${lead.nom} ${lead.prenom}`);
        console.log(`      Conseiller ID: ${lead.conseiller_id || 'NULL'}`);
        console.log(`      Conseillère: ${lead.conseillere || 'Non assigné'}`);
        console.log(`      Modifié: ${lead.date_modification}`);
        console.log('');
      });
      
    } else {
      leads.forEach((lead, index) => {
        console.log(`\n   ${index + 1}. Lead ${lead.id}: ${lead.nom} ${lead.prenom}`);
        console.log(`      Conseiller ID: ${lead.conseiller_id || 'NULL'}`);
        console.log(`      Conseillère: ${lead.conseillere || 'Non assigné'}`);
        console.log(`      Créé: ${lead.date_creation}`);
        console.log(`      Modifié: ${lead.date_modification}`);
      });
    }

    // Vérifier les logs d'activité récents pour les assignations
    console.log('\n🔍 Vérification des logs d\'activité récents...');
    const [activityLogs] = await connection.execute(`
      SELECT 
        id,
        action,
        entite_type,
        entite_id,
        utilisateur_id,
        details,
        date_creation
      FROM logs_activite 
      WHERE action = 'update_lead' OR action = 'assign_lead'
      ORDER BY date_creation DESC 
      LIMIT 10
    `);

    console.log(`📋 ${activityLogs.length} logs d'activité trouvés:`);
    activityLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} sur ${log.entite_type} ${log.entite_id}`);
      console.log(`      Par utilisateur: ${log.utilisateur_id}`);
      console.log(`      Détails: ${log.details}`);
      console.log(`      Date: ${log.date_creation}`);
      console.log('');
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkLeadHassaniya();
