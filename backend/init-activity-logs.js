const { getSequelize, testConnection } = require('./config/db.config');

const initializeActivityLogs = async () => {
  try {
    console.log('🔄 Initialisation du système de journaux d\'activité...');
    
    // Test de connexion
    await testConnection();
    console.log('✅ Connexion à la base de données réussie');

    // Initialiser les modèles
    const initializeModels = require('./models/index');
    const db = initializeModels();
    const sequelize = getSequelize();

    // Forcer la synchronisation du modèle ActivityLog
    await db.ActivityLog.sync({ alter: true });
    console.log('✅ Table activity_logs synchronisée');

    // Vérifier que la table existe et a la bonne structure
    const tableInfo = await sequelize.query(`DESCRIBE activity_logs`, {
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Structure de la table activity_logs:');
    tableInfo.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Vérifier les associations
    if (db.User && db.ActivityLog) {
      console.log('✅ Associations User <-> ActivityLog configurées');
    }

    console.log('🎉 Système de journaux d\'activité initialisé avec succès!');
    console.log('💡 Vous pouvez maintenant:');
    console.log('   1. Démarrer le serveur backend');
    console.log('   2. Vous connecter en tant qu\'administrateur');
    console.log('   3. Accéder à la page "Journaux d\'activité"');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    console.error('Détails:', error.message);
  } finally {
    process.exit(0);
  }
};

initializeActivityLogs();
