const { getSequelize } = require('./backend/config/db.config');
const { NotificationService } = require('./backend/services/notificationService');

async function initializeNotifications() {
  try {
    console.log('🚀 Initialisation du système de notifications...');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Base de données connectée');

    // Initialiser les modèles
    const initializeModels = require('./backend/models');
    const db = initializeModels();
    console.log('📦 Modèles initialisés');

    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ alter: true });
    console.log('🔄 Tables synchronisées');

    // Trouver un utilisateur admin pour créer des notifications de test
    const adminUser = await db.User.findOne({
      where: {
        role: 'admin'
      }
    });

    if (adminUser) {
      console.log(`👤 Utilisateur admin trouvé: ${adminUser.prenom} ${adminUser.nom} (ID: ${adminUser.id})`);
      
      // Vérifier s'il y a déjà des notifications
      const existingNotifications = await db.Notification.count({
        where: {
          utilisateur_id: adminUser.id
        }
      });

      if (existingNotifications === 0) {
        console.log('📱 Création de notifications de démonstration...');
        await NotificationService.createDemoNotifications(adminUser.id);
      } else {
        console.log(`📱 ${existingNotifications} notifications existantes trouvées pour l'admin`);
      }
    } else {
      console.log('⚠️ Aucun utilisateur admin trouvé');
    }

    // Trouver les conseillers et créer quelques notifications
    const conseillers = await db.User.findAll({
      where: {
        role: 'conseillere'
      },
      limit: 3
    });

    if (conseillers.length > 0) {
      console.log(`👥 ${conseillers.length} conseillers trouvés`);
      
      for (const conseiller of conseillers) {
        const existingCount = await db.Notification.count({
          where: {
            utilisateur_id: conseiller.id
          }
        });

        if (existingCount === 0) {
          console.log(`📱 Création de notifications pour ${conseiller.prenom} ${conseiller.nom}`);
          await NotificationService.createNotification({
            userId: conseiller.id,
            type: 'lead_assigned',
            title: 'Nouveau lead assigné',
            message: `Bonjour ${conseiller.prenom}, vous avez reçu un nouveau lead à traiter.`,
            priority: 'normale',
            metadata: {
              lead_name: 'Client Test',
              source: 'Site web'
            },
            redirectLink: '/leads'
          });
        }
      }
    }

    console.log('✅ Initialisation des notifications terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  initializeNotifications()
    .then(() => {
      console.log('🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { initializeNotifications };
