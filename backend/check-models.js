const { getSequelize } = require('./config/db.config');

async function checkModels() {
  try {
    console.log('🔍 Vérification des modèles disponibles...');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');
    
    // Charger les modèles via l'index
    const initializeModels = require('./models');
    const db = initializeModels();
    console.log('✅ Modèles initialisés via index.js');
    
    console.log('📋 Modèles disponibles:');
    Object.keys(sequelize.models).forEach(modelName => {
      console.log(`  - ${modelName}`);
    });
    
    // Test simple avec les leads
    if (sequelize.models.Lead) {
      const leadCount = await sequelize.models.Lead.count();
      console.log(`📊 Nombre de leads: ${leadCount}`);
    }
    
    // Test simple avec les utilisateurs  
    if (sequelize.models.User) {
      const userCount = await sequelize.models.User.count();
      console.log(`👥 Nombre d'utilisateurs: ${userCount}`);
    }
    
    // Test simple avec les notifications
    if (sequelize.models.Notification) {
      const notifCount = await sequelize.models.Notification.count();
      console.log(`🔔 Nombre de notifications: ${notifCount}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

checkModels();
