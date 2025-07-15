const { getSequelize } = require('./config/db.config');

async function fixFacturesReferences() {
  try {
    console.log('🔧 CORRECTION DES RÉFÉRENCES DANS LES FACTURES\n');
    
    const sequelize = getSequelize();
    
    // 1. Lister les utilisateurs réels disponibles
    console.log('👥 UTILISATEURS RÉELS DISPONIBLES:');
    console.log('================================');
    
    const [realUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role 
      FROM users 
      WHERE actif = 1 AND (role = 'conseillere' OR role = 'admin')
      ORDER BY role DESC, nom
    `);
    
    realUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    if (realUsers.length === 0) {
      console.log('❌ Aucun conseiller disponible !');
      return;
    }
    
    // 2. Identifier les factures problématiques
    console.log('\n🔍 FACTURES AVEC RÉFÉRENCES OBSOLÈTES:');
    console.log('====================================');
    
    const [facturesProblematiques] = await sequelize.query(`
      SELECT id, numero_facture, client, validePar, montant, date_creation
      FROM factures 
      WHERE validePar IN ('Marie T.', 'Sophie M.', 'Julie L.', 'Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système')
      ORDER BY date_creation DESC
    `);
    
    if (facturesProblematiques.length === 0) {
      console.log('✅ Aucune facture avec référence obsolète trouvée');
      return;
    }
    
    console.log(`❌ ${facturesProblematiques.length} facture(s) avec références obsolètes:`);
    facturesProblematiques.forEach(facture => {
      console.log(`  - Facture ${facture.numero_facture || facture.id}: ${facture.client}`);
      console.log(`    Validé par: ${facture.validePar} → À corriger`);
      console.log(`    Montant: ${facture.montant}€`);
      console.log('');
    });
    
    // 3. Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const reponse = await new Promise((resolve) => {
      rl.question(`\n❓ Voulez-vous corriger ces ${facturesProblematiques.length} factures ? (o/n): `, resolve);
    });
    
    if (reponse.toLowerCase() !== 'o' && reponse.toLowerCase() !== 'oui') {
      console.log('❌ Correction annulée');
      rl.close();
      return;
    }
    
    // 4. Choisir le nouveau validateur
    console.log('\n🎯 CHOIX DU NOUVEAU VALIDATEUR:');
    console.log('==============================');
    
    realUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.role})`);
    });
    
    const choixValidateur = await new Promise((resolve) => {
      rl.question(`\nChoisissez le numéro du nouveau validateur (1-${realUsers.length}): `, resolve);
    });
    
    rl.close();
    
    const indexValidateur = parseInt(choixValidateur) - 1;
    if (indexValidateur < 0 || indexValidateur >= realUsers.length) {
      console.log('❌ Choix invalide');
      return;
    }
    
    const nouveauValidateur = realUsers[indexValidateur];
    const nouveauNom = `${nouveauValidateur.prenom} ${nouveauValidateur.nom}`;
    
    console.log(`\n🔄 MISE À JOUR AVEC: ${nouveauNom}`);
    console.log('='.repeat(40));
    
    // 5. Mettre à jour les factures
    let totalUpdated = 0;
    
    const obsoleteValidators = ['Marie T.', 'Sophie M.', 'Julie L.', 'Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système'];
    
    for (const oldValidator of obsoleteValidators) {
      const [result] = await sequelize.query(`
        UPDATE factures 
        SET validePar = ?, dateValidation = NOW()
        WHERE validePar = ?
      `, {
        replacements: [nouveauNom, oldValidator]
      });
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${result.affectedRows} facture(s) mise(s) à jour: "${oldValidator}" → "${nouveauNom}"`);
        totalUpdated += result.affectedRows;
      }
    }
    
    // 6. Vérification finale
    console.log('\n📊 RÉSUMÉ:');
    console.log('=========');
    console.log(`🔢 Total factures corrigées: ${totalUpdated}`);
    console.log(`👤 Nouveau validateur: ${nouveauNom}`);
    console.log(`📧 Email: ${nouveauValidateur.email}`);
    
    if (totalUpdated > 0) {
      console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS !');
      console.log('🔄 Les statistiques du tableau de bord vont maintenant afficher les bons noms.');
      console.log('📊 Redémarrez le serveur et actualisez le tableau de bord pour voir les changements.');
      
      // Vérification finale des données de ventes
      console.log('\n🔍 NOUVELLES DONNÉES DE VENTES:');
      console.log('==============================');
      
      const [nouvellesVentes] = await sequelize.query(`
        SELECT 
          validePar as conseillere,
          COUNT(*) as nombreFactures,
          SUM(montant) as totalMontant
        FROM factures 
        GROUP BY validePar
        ORDER BY totalMontant DESC
      `);
      
      nouvellesVentes.forEach(vente => {
        console.log(`✅ ${vente.conseillere}: ${vente.nombreFactures} facture(s), Total: ${vente.totalMontant}€`);
      });
      
    } else {
      console.log('\n📋 Aucune facture n\'a été corrigée.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function fixFacturesAuto() {
  try {
    console.log('🔧 CORRECTION AUTOMATIQUE DES FACTURES\n');
    
    const sequelize = getSequelize();
    
    // Prendre le premier utilisateur admin/conseillère disponible
    const [realUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role 
      FROM users 
      WHERE actif = 1 AND (role = 'conseillere' OR role = 'admin')
      ORDER BY role DESC, nom
      LIMIT 1
    `);
    
    if (realUsers.length === 0) {
      console.log('❌ Aucun conseiller disponible !');
      return;
    }
    
    const defaultValidateur = realUsers[0];
    const nouveauNom = `${defaultValidateur.prenom} ${defaultValidateur.nom}`;
    
    console.log(`🎯 VALIDATEUR SÉLECTIONNÉ: ${nouveauNom} (${defaultValidateur.role})`);
    
    const obsoleteValidators = ['Marie T.', 'Sophie M.', 'Julie L.', 'Marie Tremblay', 'Sophie Martin', 'Julie Dupont', 'Pierre Lavoie', 'Admin Système'];
    
    let totalUpdated = 0;
    
    for (const oldValidator of obsoleteValidators) {
      const [result] = await sequelize.query(`
        UPDATE factures 
        SET validePar = ?, dateValidation = NOW()
        WHERE validePar = ?
      `, {
        replacements: [nouveauNom, oldValidator]
      });
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${result.affectedRows} facture(s): "${oldValidator}" → "${nouveauNom}"`);
        totalUpdated += result.affectedRows;
      }
    }
    
    console.log(`\n🎉 ${totalUpdated} facture(s) corrigée(s) automatiquement !`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Mode d'exécution
const mode = process.argv[2];

if (mode === 'auto') {
  fixFacturesAuto().then(() => process.exit(0));
} else {
  console.log('🛠️  CORRECTION DES RÉFÉRENCES DANS LES FACTURES\n');
  console.log('Usage:');
  console.log('  node fix-factures-references.js        - Mode interactif');
  console.log('  node fix-factures-references.js auto   - Mode automatique');
  console.log('');
  
  fixFacturesReferences().then(() => process.exit(0));
} 