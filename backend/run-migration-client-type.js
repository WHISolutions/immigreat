const { exec } = require('child_process');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Exécution de la migration pour ajouter client_type à rendezvous...\n');
    
    // Exécuter la migration
    const migrationPath = path.join(__dirname, 'migrations', '20250131000000-add-client-type-to-rendezvous.js');
    
    console.log('📋 Migration:', migrationPath);
    console.log('🔄 Lancement de la migration Sequelize...\n');
    
    exec('npx sequelize-cli db:migrate', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur lors de l\'exécution de la migration:', error);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ Avertissement:', stderr);
      }
      
      console.log('✅ Migration exécutée avec succès !');
      console.log('📝 Sortie:', stdout);
      
      console.log('\n🎉 La base de données a été mise à jour avec succès !');
      console.log('\n📋 Changements apportés:');
      console.log('  ✅ Champ client_type ajouté (ENUM: client, lead)');
      console.log('  ✅ Contrainte de clé étrangère supprimée pour client_id');
      console.log('  ✅ client_id peut maintenant être NULL pour les leads');
      console.log('  ✅ Enregistrements existants mis à jour avec client_type="client"');
      
      console.log('\n🧪 Pour tester:');
      console.log('  1. Redémarrer le serveur backend');
      console.log('  2. Aller dans l\'interface Rendez-vous');
      console.log('  3. Créer un nouveau rendez-vous');
      console.log('  4. Rechercher un client ou un lead');
      console.log('  5. Vérifier que la création fonctionne sans erreur');
    });
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  }
}

// Fonction pour vérifier la structure de la table après migration
async function verifyMigration() {
  try {
    const { getSequelize } = require('./config/db.config');
    const sequelize = getSequelize();
    
    console.log('\n🔍 Vérification de la structure de la table rendezvous...');
    
    const [results] = await sequelize.query("DESCRIBE rendezvous");
    
    console.log('\n📋 Structure de la table rendezvous:');
    results.forEach(column => {
      if (column.Field === 'client_type' || column.Field === 'client_id') {
        console.log(`  ✅ ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL autorisé)' : '(NOT NULL)'} ${column.Default ? `défaut: ${column.Default}` : ''}`);
      }
    });
    
    // Vérifier s'il y a des contraintes de clé étrangère restantes
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
      AND TABLE_NAME = 'rendezvous' 
      AND COLUMN_NAME = 'client_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (constraints.length === 0) {
      console.log('  ✅ Aucune contrainte de clé étrangère sur client_id (correct pour les leads)');
    } else {
      console.log('  ⚠️ Contraintes de clé étrangère restantes:', constraints);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🎯 Script de migration pour support client/lead dans rendez-vous\n');
  
  // Demander confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Voulez-vous exécuter la migration ? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      runMigration();
      
      // Vérifier après un délai
      setTimeout(() => {
        verifyMigration();
      }, 3000);
    } else {
      console.log('Migration annulée.');
    }
    
    rl.close();
  });
}

module.exports = { runMigration, verifyMigration }; 