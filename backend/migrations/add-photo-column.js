const { getSequelize } = require('../config/db.config');

async function addPhotoColumn() {
  try {
    const sequelize = getSequelize();
    
    // Ajouter la colonne photo à la table users
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN photo VARCHAR(255) NULL COMMENT 'Chemin vers la photo de profil'
    `);
    
    console.log('✅ Colonne photo ajoutée avec succès à la table users');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ La colonne photo existe déjà');
    } else {
      console.error('❌ Erreur lors de l\'ajout de la colonne photo:', error);
      throw error;
    }
  }
}

// Exporter la fonction pour l'utiliser
module.exports = { addPhotoColumn };

// Exécuter si appelé directement
if (require.main === module) {
  addPhotoColumn()
    .then(() => {
      console.log('Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur de migration:', error);
      process.exit(1);
    });
}
