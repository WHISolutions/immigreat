const { getSequelize } = require('./config/db.config');

async function fixDataReferences() {
  try {
    console.log('🔧 CORRECTION DES RÉFÉRENCES AUX UTILISATEURS OBSOLÈTES\n');
    
    const sequelize = getSequelize();
    
    // 1. Lister les utilisateurs réels disponibles
    console.log('👥 UTILISATEURS RÉELS DISPONIBLES:');
    console.log('================================');
    
    const [realUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role 
      FROM users 
      WHERE actif = 1
      ORDER BY role DESC, nom
    `);
    
    if (realUsers.length === 0) {
      console.log('❌ Aucun utilisateur réel trouvé !');
      return;
    }
    
    realUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    // Choix automatique des conseillers pour replacement
    const availableConseillers = realUsers.filter(user => user.role === 'conseillere' || user.role === 'admin');
    const defaultConseiller = availableConseillers[0]; // Première conseillère disponible
    
    console.log(`\n🎯 CONSEILLER PAR DÉFAUT SÉLECTIONNÉ: ${defaultConseiller.prenom} ${defaultConseiller.nom}`);
    
    let totalUpdated = 0;
    
    // 2. Corriger les clients
    console.log('\n📋 CORRECTION DES CLIENTS...');
    console.log('-'.repeat(40));
    
    const obsoleteConseillers = ['Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système', 'Julie Lefebvre'];
    
    for (const oldConseiller of obsoleteConseillers) {
      const [result] = await sequelize.query(`
        UPDATE clients 
        SET conseillere = ?, date_modification = NOW()
        WHERE conseillere = ?
      `, {
        replacements: [`${defaultConseiller.prenom} ${defaultConseiller.nom}`, oldConseiller]
      });
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${result.affectedRows} client(s) mis à jour: "${oldConseiller}" → "${defaultConseiller.prenom} ${defaultConseiller.nom}"`);
        totalUpdated += result.affectedRows;
      }
    }
    
    // 3. Corriger les leads
    console.log('\n📋 CORRECTION DES LEADS...');
    console.log('-'.repeat(40));
    
    for (const oldConseiller of obsoleteConseillers) {
      const [result] = await sequelize.query(`
        UPDATE leads 
        SET conseillere = ?, date_modification = NOW()
        WHERE conseillere = ?
      `, {
        replacements: [`${defaultConseiller.prenom} ${defaultConseiller.nom}`, oldConseiller]
      });
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${result.affectedRows} lead(s) mis à jour: "${oldConseiller}" → "${defaultConseiller.prenom} ${defaultConseiller.nom}"`);
        totalUpdated += result.affectedRows;
      }
    }
    
    // 4. Correction optionnelle des factures si nécessaire
    console.log('\n📋 CORRECTION DES FACTURES (validePar)...');
    console.log('-'.repeat(40));
    
    for (const oldConseiller of obsoleteConseillers) {
      const [result] = await sequelize.query(`
        UPDATE factures 
        SET validePar = ?
        WHERE validePar = ?
      `, {
        replacements: [`${defaultConseiller.prenom} ${defaultConseiller.nom}`, oldConseiller]
      });
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${result.affectedRows} facture(s) mise(s) à jour: "${oldConseiller}" → "${defaultConseiller.prenom} ${defaultConseiller.nom}"`);
        totalUpdated += result.affectedRows;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA CORRECTION:');
    console.log('='.repeat(50));
    console.log(`🔢 Total d'éléments corrigés: ${totalUpdated}`);
    console.log(`👤 Nouveau conseiller assigné: ${defaultConseiller.prenom} ${defaultConseiller.nom}`);
    console.log(`📧 Email: ${defaultConseiller.email}`);
    
    if (totalUpdated > 0) {
      console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !');
      console.log('🔄 Redémarrez votre serveur pour voir les changements dans l\'interface.');
      
      // Vérification finale
      console.log('\n🔍 VÉRIFICATION FINALE...');
      const [remainingIssues] = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM clients WHERE conseillere IN (${obsoleteConseillers.map(() => '?').join(', ')})) as clients_restants,
          (SELECT COUNT(*) FROM leads WHERE conseillere IN (${obsoleteConseillers.map(() => '?').join(', ')})) as leads_restants
      `, {
        replacements: [...obsoleteConseillers, ...obsoleteConseillers]
      });
      
      const totalRemaining = remainingIssues[0].clients_restants + remainingIssues[0].leads_restants;
      
      if (totalRemaining === 0) {
        console.log('✅ Aucune référence obsolète restante !');
      } else {
        console.log(`⚠️  ${totalRemaining} référence(s) obsolète(s) restante(s)`);
      }
      
    } else {
      console.log('\n📋 Aucune donnée à corriger trouvée.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  }
}

async function interactiveAssignment() {
  try {
    console.log('🎯 ASSIGNATION PERSONNALISÉE DES DONNÉES\n');
    
    const sequelize = getSequelize();
    
    // Lister les utilisateurs réels
    const [realUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role 
      FROM users 
      WHERE actif = 1 AND (role = 'conseillere' OR role = 'admin')
      ORDER BY role DESC, nom
    `);
    
    if (realUsers.length === 0) {
      console.log('❌ Aucun conseiller disponible !');
      return;
    }
    
    console.log('Conseillers disponibles:');
    realUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Répartition équitable des données entre les conseillers
    console.log('\n🔄 Répartition équitable des données...');
    
    const [clientsWithOldRefs] = await sequelize.query(`
      SELECT id, nom, prenom, conseillere
      FROM clients
      WHERE conseillere IN ('Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système', 'Julie Lefebvre')
      ORDER BY id
    `);
    
    const [leadsWithOldRefs] = await sequelize.query(`
      SELECT id, nom, prenom, conseillere
      FROM leads
      WHERE conseillere IN ('Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système', 'Julie Lefebvre')
      ORDER BY id
    `);
    
    let totalAssigned = 0;
    
    // Répartir les clients équitablement
    for (let i = 0; i < clientsWithOldRefs.length; i++) {
      const client = clientsWithOldRefs[i];
      const assignedConseiller = realUsers[i % realUsers.length];
      
      await sequelize.query(`
        UPDATE clients 
        SET conseillere = ?, date_modification = NOW()
        WHERE id = ?
      `, {
        replacements: [`${assignedConseiller.prenom} ${assignedConseiller.nom}`, client.id]
      });
      
      console.log(`📋 Client ${client.prenom} ${client.nom} → ${assignedConseiller.prenom} ${assignedConseiller.nom}`);
      totalAssigned++;
    }
    
    // Répartir les leads équitablement
    for (let i = 0; i < leadsWithOldRefs.length; i++) {
      const lead = leadsWithOldRefs[i];
      const assignedConseiller = realUsers[i % realUsers.length];
      
      await sequelize.query(`
        UPDATE leads 
        SET conseillere = ?, date_modification = NOW()
        WHERE id = ?
      `, {
        replacements: [`${assignedConseiller.prenom} ${assignedConseiller.nom}`, lead.id]
      });
      
      console.log(`🎯 Lead ${lead.prenom} ${lead.nom} → ${assignedConseiller.prenom} ${assignedConseiller.nom}`);
      totalAssigned++;
    }
    
    rl.close();
    
    console.log(`\n✅ ${totalAssigned} éléments réassignés équitablement !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation:', error);
  }
}

// Permettre d'exécuter des actions spécifiques
const action = process.argv[2];

if (action === 'interactive') {
  interactiveAssignment().then(() => process.exit(0));
} else {
  console.log('🛠️  CORRECTION DES RÉFÉRENCES OBSOLÈTES\n');
  console.log('Usage:');
  console.log('  node fix-data-references.js               - Correction automatique');
  console.log('  node fix-data-references.js interactive   - Répartition équitable');
  console.log('');
  
  fixDataReferences().then(() => process.exit(0));
} 