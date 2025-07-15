const { getSequelize } = require('./config/db.config');

async function checkDataReferences() {
  try {
    console.log('🔍 VÉRIFICATION DES RÉFÉRENCES AUX ANCIENS UTILISATEURS DE TEST\n');
    
    const sequelize = getSequelize();
    
    // Liste des emails des utilisateurs de test supprimés
    const deletedTestEmails = [
      'admin@immigration.ca',
      'marie.tremblay@immigration.ca',
      'sophie.martin@immigration.ca',
      'julie.dupont@immigration.ca',
      'pierre.lavoie@immigration.ca',
      'test@example.com',
      'testuser@example.com'
    ];
    
    // Lister les utilisateurs réels restants
    console.log('👥 UTILISATEURS RÉELS DISPONIBLES:');
    console.log('================================');
    
    const [realUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role 
      FROM users 
      WHERE actif = 1
      ORDER BY role DESC, nom
    `);
    
    realUsers.forEach(user => {
      console.log(`${user.id}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🔍 DONNÉES AVEC RÉFÉRENCES OBSOLÈTES:');
    console.log('====================================\n');
    
    // 1. Vérifier les clients
    console.log('📋 1. CLIENTS avec conseillère obsolète:');
    const [clientsWithOldRefs] = await sequelize.query(`
      SELECT c.id, c.nom, c.prenom, c.email, c.conseillere, c.date_creation
      FROM clients c
      WHERE c.conseillere IN ('Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système', 'Julie Lefebvre')
      ORDER BY c.date_creation DESC
    `);
    
    if (clientsWithOldRefs.length > 0) {
      clientsWithOldRefs.forEach(client => {
        console.log(`   - Client: ${client.prenom} ${client.nom} (ID: ${client.id})`);
        console.log(`     Conseillère obsolète: ${client.conseillere}`);
        console.log(`     Créé: ${client.date_creation}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Aucun client avec conseillère obsolète');
    }
    
    // 2. Vérifier les factures - pas de colonne conseiller directe, on vérifie via validePar
    console.log('\n📋 2. FACTURES avec validePar obsolète:');
    const [facturesWithOldRefs] = await sequelize.query(`
      SELECT f.id, f.numero_facture, f.validePar, f.montant, f.date_creation
      FROM factures f
      WHERE f.validePar IN ('Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système')
      ORDER BY f.date_creation DESC
    `);
    
    if (facturesWithOldRefs.length > 0) {
      facturesWithOldRefs.forEach(facture => {
        console.log(`   - Facture: ${facture.numero_facture} (ID: ${facture.id})`);
        console.log(`     Validé par obsolète: ${facture.validePar}`);
        console.log(`     Montant: ${facture.montant}€`);
        console.log(`     Créée: ${facture.date_creation}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Aucune facture avec validateur obsolète');
    }
    
    // 3. Vérifier les leads
    console.log('\n📋 3. LEADS avec conseillère obsolète:');
    const [leadsWithOldRefs] = await sequelize.query(`
      SELECT l.id, l.nom, l.prenom, l.email, l.conseillere, l.date_creation
      FROM leads l
      WHERE l.conseillere IN ('Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système', 'Julie Lefebvre')
      ORDER BY l.date_creation DESC
    `);
    
    if (leadsWithOldRefs.length > 0) {
      leadsWithOldRefs.forEach(lead => {
        console.log(`   - Lead: ${lead.prenom} ${lead.nom} (ID: ${lead.id})`);
        console.log(`     Conseillère obsolète: ${lead.conseillere}`);
        console.log(`     Créé: ${lead.date_creation}`);
        console.log('');
      });
    } else {
      console.log('   ✅ Aucun lead avec conseillère obsolète');
    }
    
    // Résumé
    const totalProblems = clientsWithOldRefs.length + facturesWithOldRefs.length + 
                         leadsWithOldRefs.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ:');
    console.log('='.repeat(50));
    console.log(`• Clients avec conseillères obsolètes: ${clientsWithOldRefs.length}`);
    console.log(`• Factures avec validateurs obsolètes: ${facturesWithOldRefs.length}`);
    console.log(`• Leads avec conseillères obsolètes: ${leadsWithOldRefs.length}`);
    console.log(`\n🔢 TOTAL D'ÉLÉMENTS À CORRIGER: ${totalProblems}`);
    
    if (totalProblems > 0) {
      console.log('\n⚠️  RECOMMANDATION: Exécutez le script de correction des données');
      console.log('   node fix-data-references.js');
    } else {
      console.log('\n✅ Toutes les données sont à jour !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkDataReferences().then(() => process.exit(0)); 