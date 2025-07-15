const { getSequelize } = require('./config/db.config');

async function checkNotificationsInDB() {
  try {
    console.log('🔍 Vérification directe des notifications dans la base...');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    // Charger les modèles
    const initializeModels = require('./models');
    const db = initializeModels();
    
    const Notification = sequelize.models.Notification;
    const User = sequelize.models.User;
    
    // 1. Compter toutes les notifications
    const totalNotifications = await Notification.count();
    console.log(`📊 Total notifications en base: ${totalNotifications}`);
    
    // 2. Compter les notifications par utilisateur
    const notificationsByUser = await Notification.findAll({
      attributes: [
        'utilisateur_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['utilisateur_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    
    console.log('\\n👥 Notifications par utilisateur:');
    for (const notif of notificationsByUser) {
      const user = await User.findByPk(notif.utilisateur_id, {
        attributes: ['prenom', 'nom', 'role']
      });
      if (user) {
        console.log(`   👤 ${user.prenom} ${user.nom} (${user.role}): ${notif.dataValues.count} notifications`);
      } else {
        console.log(`   ❓ Utilisateur ID ${notif.utilisateur_id}: ${notif.dataValues.count} notifications`);
      }
    }
    
    // 3. Chercher spécifiquement les notifications de lead assigné
    const leadAssignedNotifications = await Notification.findAll({
      where: { type: 'lead_assigned' },
      order: [['date_creation', 'DESC']],
      limit: 10
    });
    
    console.log(`\\n🔔 Notifications de lead assigné (${leadAssignedNotifications.length} trouvées):`);
    for (const notif of leadAssignedNotifications) {
      const user = await User.findByPk(notif.utilisateur_id, {
        attributes: ['prenom', 'nom', 'role']
      });
      console.log(`\\n   📩 Notification ${leadAssignedNotifications.indexOf(notif) + 1}:`);
      console.log(`      Pour: ${user?.prenom || 'N/A'} ${user?.nom || 'N/A'} (ID: ${notif.utilisateur_id})`);
      console.log(`      Titre: ${notif.titre}`);
      console.log(`      Message: ${notif.message}`);
      console.log(`      Créée: ${notif.date_creation}`);
      console.log(`      Lue: ${notif.lue ? 'Oui' : 'Non'}`);
      console.log(`      Priorité: ${notif.priorite}`);
    }
    
    // 4. Vérifier spécifiquement pour wafaa chaouby (ID 18)
    const wafaaNotifications = await Notification.findAll({
      where: { utilisateur_id: 18 },
      order: [['date_creation', 'DESC']],
      limit: 5
    });
    
    console.log(`\\n👤 Notifications pour wafaa chaouby (ID 18): ${wafaaNotifications.length}`);
    wafaaNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.type}: ${notif.titre} (${notif.date_creation})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

checkNotificationsInDB();
