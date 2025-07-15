// Script pour exécuter la migration de la monnaie
const { getSequelize } = require('./config/db.config');

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration pour ajouter le champ monnaie...');
    
    const sequelize = getSequelize();
    
    // Vérifier si la colonne existe déjà
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Factures' AND COLUMN_NAME = 'monnaie'
    `);
    
    if (results.length > 0) {
      console.log('✅ La colonne monnaie existe déjà dans la table Factures');
      return;
    }
    
    // Ajouter la colonne monnaie
    await sequelize.query(`
      ALTER TABLE Factures 
      ADD COLUMN monnaie VARCHAR(3) NOT NULL DEFAULT 'MAD' 
      COMMENT 'Monnaie de la facture : CAD (Dollar Canadien) ou MAD (Dirham Marocain)'
    `);
    
    console.log('✅ Colonne monnaie ajoutée avec succès à la table Factures');
    
    // Mettre à jour les factures existantes
    const [updateResult] = await sequelize.query(`
      UPDATE Factures SET monnaie = 'MAD' WHERE monnaie IS NULL OR monnaie = ''
    `);
    
    console.log('✅ Factures existantes mises à jour avec la monnaie MAD par défaut');
    
    // Vérifier le résultat
    const [facturesCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM Factures
    `);
    
    console.log(`📊 Migration terminée. ${facturesCount[0].total} factures dans la base de données`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration si ce fichier est appelé directement
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
