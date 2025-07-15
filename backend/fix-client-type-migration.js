const { getSequelize } = require('./config/db.config');

async function addClientTypeColumn() {
  let sequelize;
  
  try {
    sequelize = getSequelize();
    console.log('🚀 Correction de la base de données pour supporter les leads...\n');
    
    // Vérifier si la colonne existe déjà
    console.log('🔍 Vérification de l\'existence de la colonne client_type...');
    
    try {
      const [results] = await sequelize.query("DESCRIBE rendezvous");
      const hasClientType = results.some(column => column.Field === 'client_type');
      
      if (hasClientType) {
        console.log('✅ La colonne client_type existe déjà !');
        return;
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification:', error.message);
    }
    
    console.log('📝 La colonne client_type n\'existe pas, création en cours...\n');
    
    // Étape 1: Ajouter la colonne client_type
    console.log('1️⃣ Ajout de la colonne client_type...');
    await sequelize.query(`
      ALTER TABLE rendezvous 
      ADD COLUMN client_type ENUM('client', 'lead') 
      NOT NULL DEFAULT 'client' 
      COMMENT 'Type de contact : client ou lead'
    `);
    console.log('✅ Colonne client_type ajoutée');
    
    // Étape 2: Supprimer la contrainte de clé étrangère
    console.log('2️⃣ Suppression de la contrainte de clé étrangère...');
    try {
      // Trouver le nom de la contrainte
      const [constraints] = await sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = '${sequelize.config.database}' 
        AND TABLE_NAME = 'rendezvous' 
        AND COLUMN_NAME = 'client_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      if (constraints.length > 0) {
        const constraintName = constraints[0].CONSTRAINT_NAME;
        await sequelize.query(`ALTER TABLE rendezvous DROP FOREIGN KEY ${constraintName}`);
        console.log(`✅ Contrainte ${constraintName} supprimée`);
      } else {
        console.log('✅ Aucune contrainte de clé étrangère trouvée');
      }
    } catch (error) {
      console.log('⚠️ Erreur suppression contrainte (peut-être déjà supprimée):', error.message);
    }
    
    // Étape 3: Modifier la colonne client_id pour permettre NULL
    console.log('3️⃣ Modification de la colonne client_id...');
    await sequelize.query(`
      ALTER TABLE rendezvous 
      MODIFY COLUMN client_id INT NULL 
      COMMENT 'ID du client (NULL pour les leads)'
    `);
    console.log('✅ Colonne client_id modifiée');
    
    // Étape 4: Mettre à jour les enregistrements existants
    console.log('4️⃣ Mise à jour des enregistrements existants...');
    const [updateResult] = await sequelize.query(`
      UPDATE rendezvous 
      SET client_type = 'client' 
      WHERE client_id IS NOT NULL
    `);
    console.log(`✅ ${updateResult.affectedRows || 0} enregistrements mis à jour`);
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const [finalResults] = await sequelize.query("DESCRIBE rendezvous");
    const clientTypeColumn = finalResults.find(col => col.Field === 'client_type');
    const clientIdColumn = finalResults.find(col => col.Field === 'client_id');
    
    if (clientTypeColumn) {
      console.log(`✅ client_type: ${clientTypeColumn.Type} ${clientTypeColumn.Null === 'YES' ? '(NULL autorisé)' : '(NOT NULL)'}`);
    }
    
    if (clientIdColumn) {
      console.log(`✅ client_id: ${clientIdColumn.Type} ${clientIdColumn.Null === 'YES' ? '(NULL autorisé)' : '(NOT NULL)'}`);
    }
    
    console.log('\n🎉 Base de données mise à jour avec succès !');
    console.log('📋 Vous pouvez maintenant créer des rendez-vous avec des leads sans erreur.');
    console.log('\n🔄 IMPORTANT: Redémarrez votre serveur backend maintenant !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la base de données:');
    console.error(error);
    
    if (error.message.includes('Duplicate column name')) {
      console.log('\n💡 La colonne existe peut-être déjà. Vérifiez avec:');
      console.log('   DESCRIBE rendezvous;');
    }
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Exécuter immédiatement
if (require.main === module) {
  addClientTypeColumn()
    .then(() => {
      console.log('\n✅ Script terminé. Redémarrez votre serveur backend !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { addClientTypeColumn }; 