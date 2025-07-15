const { getSequelize } = require('./config/db.config');

async function checkUserIds() {
  try {
    console.log('🔍 Vérification des IDs utilisateurs...');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    // Charger les modèles
    const initializeModels = require('./models');
    const db = initializeModels();
    
    const users = await sequelize.models.User.findAll({
      attributes: ['id', 'prenom', 'nom', 'role'],
      order: [['id', 'ASC']]
    });
    
    console.log('👥 Utilisateurs disponibles:');
    users.forEach(user => {
      console.log(`  ID: ${user.id} - ${user.prenom} ${user.nom} (${user.role})`);
    });
    
    // Trouver un admin
    const admin = users.find(u => u.role === 'admin');
    if (admin) {
      console.log(`\\n✅ Admin trouvé: ID ${admin.id} - ${admin.prenom} ${admin.nom}`);
    } else {
      console.log('\\n❌ Aucun admin trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkUserIds();
