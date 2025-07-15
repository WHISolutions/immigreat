const { getSequelize } = require('./config/db.config');

async function checkWafaaNotifications() {
  try {
    console.log('🔍 VÉRIFICATION DES NOTIFICATIONS DE WAFAA');
    console.log('=' .repeat(50));
    
    // 1. Initialiser la base de données
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    const initializeModels = require('./models');
    const db = initializeModels();
    
    const User = sequelize.models.User;
    const Notification = sequelize.models.Notification;
    
    // 2. Trouver wafaa
    const wafaa = await User.findOne({
      where: { email: 'wafaa@gmail.com' }
    });
    
    if (!wafaa) {
      console.log('❌ Utilisateur wafaa@gmail.com non trouvé');
      return;
    }
    
    console.log(`✅ Wafaa trouvée: ${wafaa.prenom} ${wafaa.nom} (ID: ${wafaa.id})`);
    
    // 3. Récupérer toutes les notifications de wafaa
    const allNotifications = await Notification.findAll({
      where: { utilisateur_id: wafaa.id },
      order: [['date_creation', 'DESC']],
      limit: 10
    });
    
    console.log(`📊 Total notifications pour wafaa: ${allNotifications.length}`);
    
    // 4. Compter les non lues
    const unreadCount = await Notification.count({
      where: { 
        utilisateur_id: wafaa.id,
        lue: false 
      }
    });
    
    console.log(`🔔 Notifications non lues: ${unreadCount}`);
    
    // 5. Afficher les 5 dernières notifications
    console.log('\n📋 5 DERNIÈRES NOTIFICATIONS:');
    allNotifications.slice(0, 5).forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.titre}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Statut: ${notif.lue ? '✅ LUE' : '🔔 NON LUE'}`);
      console.log(`   Créée: ${notif.date_creation}`);
      console.log(`   ID: ${notif.id}`);
      
      // Afficher les métadonnées si disponibles
      if (notif.donnees_metier) {
        try {
          const metadata = JSON.parse(notif.donnees_metier);
          console.log(`   Métadonnées: Lead "${metadata.lead_name}" (${metadata.lead_email})`);
        } catch (e) {
          console.log(`   Métadonnées: ${notif.donnees_metier}`);
        }
      }
      console.log('');
    });
    
    // 6. Vérifier les notifications de type lead_assigned
    const leadAssignedNotifications = await Notification.findAll({
      where: { 
        utilisateur_id: wafaa.id,
        type: 'lead_assigned'
      },
      order: [['date_creation', 'DESC']],
      limit: 5
    });
    
    console.log(`📋 NOTIFICATIONS D'ASSIGNATION DE LEAD: ${leadAssignedNotifications.length}`);
    leadAssignedNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.message} - ${notif.lue ? 'LUE' : 'NON LUE'}`);
      console.log(`   Créée: ${notif.date_creation}`);
    });
    
    // 7. Simuler la réponse de l'API REST
    console.log('\n🌐 SIMULATION API REST:');
    const apiResponse = {
      success: true,
      data: {
        notifications: allNotifications.slice(0, 5).map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.titre,
          message: notif.message,
          priority: notif.priorite,
          is_read: notif.lue,
          created_at: notif.date_creation,
          metadata: notif.donnees_metier ? JSON.parse(notif.donnees_metier) : null
        })),
        total: allNotifications.length,
        unread_count: unreadCount
      }
    };
    
    console.log('Réponse API simulée:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🎯 DIAGNOSTIC:');
    console.log(`✅ Notifications en base: ${allNotifications.length}`);
    console.log(`🔔 Non lues: ${unreadCount}`);
    console.log(`📱 Dernière assignation: ${leadAssignedNotifications.length > 0 ? leadAssignedNotifications[0].date_creation : 'Aucune'}`);
    
    console.log('\n🔧 ACTIONS À VÉRIFIER:');
    console.log('1. Le frontend appelle-t-il l\'API /api/notifications ?');
    console.log('2. Le WebSocket est-il connecté côté frontend ?');
    console.log('3. L\'utilisateur est-il bien authentifié avec le bon ID ?');
    console.log('4. Le serveur backend est-il en cours d\'exécution ?');
    
  } catch (error) {
    console.error('❌ Erreur durant la vérification:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

// Exécuter la vérification
checkWafaaNotifications(); 