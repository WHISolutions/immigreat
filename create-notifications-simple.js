const { getSequelize } = require('./backend/config/db.config');
const { DataTypes } = require('sequelize');

async function createNotificationsTable() {
  try {
    console.log('🚀 Création de la table notifications...');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Base de données connectée');

    // Créer la table notifications directement
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        utilisateur_id INT NOT NULL,
        type VARCHAR(50) NOT NULL COMMENT 'Type de notification: lead_assigned, payment_received, etc.',
        titre VARCHAR(255) NOT NULL COMMENT 'Titre de la notification',
        message TEXT NOT NULL COMMENT 'Contenu de la notification',
        priorite ENUM('basse', 'normale', 'haute', 'urgente') DEFAULT 'normale',
        lue BOOLEAN DEFAULT false COMMENT 'Indique si la notification a été lue',
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_lecture DATETIME NULL COMMENT 'Date de lecture de la notification',
        date_expiration DATETIME NULL COMMENT 'Date d expiration de la notification',
        donnees_metier JSON NULL COMMENT 'Données supplémentaires liées à la notification',
        entite_type VARCHAR(50) NULL COMMENT 'Type d entité liée (Lead, Client, Facture, etc.)',
        entite_id INT NULL COMMENT 'ID de l entité liée',
        cree_par_id INT NULL COMMENT 'ID de l utilisateur qui a déclenché la notification',
        lien_redirection VARCHAR(500) NULL COMMENT 'URL de redirection pour cette notification',
        
        INDEX idx_notifications_utilisateur_id (utilisateur_id),
        INDEX idx_notifications_type (type),
        INDEX idx_notifications_lue (lue),
        INDEX idx_notifications_date_creation (date_creation),
        INDEX idx_notifications_priorite (priorite),
        
        FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (cree_par_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Table notifications créée avec succès');

    // Insérer des notifications de test
    console.log('📝 Création de notifications de test...');

    // Récupérer quelques utilisateurs pour les tests
    const [users] = await sequelize.query('SELECT id, nom, prenom FROM users LIMIT 5');
    
    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé. Création d un utilisateur admin de test...');
      await sequelize.query(`
        INSERT INTO users (nom, prenom, email, mot_de_passe, role, date_creation) 
        VALUES ('Admin', 'Test', 'admin@test.com', '$2a$10$test', 'admin', NOW())
        ON DUPLICATE KEY UPDATE nom=nom;
      `);
      
      const [newUsers] = await sequelize.query('SELECT id, nom, prenom FROM users WHERE email = "admin@test.com"');
      users.push(...newUsers);
    }

    // Créer des notifications de démonstration
    const demoNotifications = [
      {
        utilisateur_id: users[0].id,
        type: 'lead_assigned',
        titre: 'Nouveau lead assigné',
        message: 'Un nouveau lead "Sarah Johnson" vous a été assigné pour une demande d études au Canada.',
        priorite: 'haute',
        entite_type: 'Lead',
        entite_id: 1,
        cree_par_id: users[0].id,
        lien_redirection: '/leads/1'
      },
      {
        utilisateur_id: users[0].id,
        type: 'payment_received',
        titre: 'Paiement reçu',
        message: 'Paiement de 500 CAD reçu pour la facture #INV-2025-001',
        priorite: 'normale',
        entite_type: 'Facture',
        entite_id: 1,
        cree_par_id: users[0].id,
        lien_redirection: '/factures/1'
      },
      {
        utilisateur_id: users[0].id,
        type: 'appointment_reminder',
        titre: 'Rappel de rendez-vous',
        message: 'Rendez-vous avec Marc Dubois prévu aujourd hui à 14h00',
        priorite: 'haute',
        entite_type: 'RendezVous',
        entite_id: 1,
        cree_par_id: users[0].id,
        lien_redirection: '/rendezvous/1'
      },
      {
        utilisateur_id: users[0].id,
        type: 'document_uploaded',
        titre: 'Nouveau document',
        message: 'Client Julie Martin a téléchargé son passeport',
        priorite: 'normale',
        entite_type: 'Document',
        entite_id: 1,
        cree_par_id: users[0].id,
        lien_redirection: '/clients/1/documents'
      },
      {
        utilisateur_id: users[0].id,
        type: 'system',
        titre: 'Mise à jour système',
        message: 'Le système de notifications a été activé avec succès',
        priorite: 'basse',
        entite_type: 'System',
        entite_id: null,
        cree_par_id: users[0].id,
        lien_redirection: null
      }
    ];

    // Insérer les notifications
    for (const notif of demoNotifications) {
      await sequelize.query(`
        INSERT INTO notifications (
          utilisateur_id, type, titre, message, priorite, entite_type, 
          entite_id, cree_par_id, lien_redirection, date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, {
        replacements: [
          notif.utilisateur_id, notif.type, notif.titre, notif.message,
          notif.priorite, notif.entite_type, notif.entite_id,
          notif.cree_par_id, notif.lien_redirection
        ]
      });
    }

    // Créer une notification pour chaque utilisateur s'il y en a plusieurs
    if (users.length > 1) {
      for (let i = 1; i < users.length; i++) {
        await sequelize.query(`
          INSERT INTO notifications (
            utilisateur_id, type, titre, message, priorite, 
            entite_type, entite_id, cree_par_id, lien_redirection, date_creation
          ) VALUES (?, 'lead_assigned', ?, ?, 'normale', 'Lead', 1, ?, '/leads/1', NOW())
        `, {
          replacements: [
            users[i].id,
            `Bienvenue ${users[i].prenom}`,
            `Votre compte conseiller a été activé. Vous pouvez maintenant recevoir des leads.`,
            users[0].id
          ]
        });
      }
    }

    console.log(`✅ ${demoNotifications.length + (users.length > 1 ? users.length - 1 : 0)} notifications de test créées`);

    // Vérifier les notifications créées
    const [notifications] = await sequelize.query('SELECT COUNT(*) as count FROM notifications');
    console.log(`📊 Total notifications en base: ${notifications[0].count}`);

    console.log('🎉 Système de notifications initialisé avec succès !');
    console.log('');
    console.log('📝 Prochaines étapes:');
    console.log('1. Démarrer le frontend: cd frontend && npm start');
    console.log('2. Se connecter à l application');
    console.log('3. Cliquer sur l icône 🔔 pour voir les notifications');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    process.exit(1);
  }
}

createNotificationsTable();
