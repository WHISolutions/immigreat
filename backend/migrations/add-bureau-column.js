const { getSequelize } = require('../config/db.config');

async function addBureauColumn() {
  try {
    const sequelize = getSequelize();
    
    // Ajouter la colonne bureau à la table users
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN bureau VARCHAR(100) NULL
    `);
    
    console.log('✅ Colonne bureau ajoutée avec succès à la table users');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ La colonne bureau existe déjà');
    } else {
      console.error('❌ Erreur lors de l\'ajout de la colonne bureau:', error);
      throw error;
    }
  }
}

// Exporter la fonction pour l'utiliser
module.exports = { addBureauColumn };

// Exécuter si appelé directement
if (require.main === module) {
  addBureauColumn()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur de migration:', error);
      process.exit(1);
    });
}
