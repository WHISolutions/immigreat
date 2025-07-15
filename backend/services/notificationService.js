const { getIO } = require('../socket');

class NotificationService {
  
  static getModels() {
    const initializeModels = require('../models');
    return initializeModels();
  }
  
  /**
   * Créer une nouvelle notification
   */
  static async createNotification({
    userId,
    type,
    title,
    message,
    priority = 'normale',
    metadata = {},
    relatedEntityType = null,
    relatedEntityId = null,
    triggeredByUserId = null,
    redirectLink = null
  }) {
    try {
      const db = this.getModels();
      
      // Convertir les priorités pour correspondre au schéma existant
      const priorityMap = {
        'low': 'basse',
        'medium': 'normale', 
        'high': 'haute',
        'urgent': 'urgente'
      };
      
      const mappedPriority = priorityMap[priority] || priority;

      const notification = await db.Notification.create({
        utilisateur_id: userId,
        type,
        titre: title,
        message,
        priorite: mappedPriority,
        donnees_metier: JSON.stringify(metadata),
        entite_type: relatedEntityType,
        entite_id: relatedEntityId,
        cree_par_id: triggeredByUserId,
        lien_redirection: redirectLink
      });

      // Charger la notification avec les associations
      const fullNotification = await db.Notification.findByPk(notification.id, {
        include: [
          {
            model: db.User,
            as: 'recipient',
            attributes: ['id', 'nom', 'prenom', 'email']
          },
          {
            model: db.User,
            as: 'triggeredBy',
            attributes: ['id', 'nom', 'prenom'],
            required: false
          }
        ]
      });

      console.log(`📱 Notification créée pour ${fullNotification.recipient.nom} ${fullNotification.recipient.prenom}: ${title}`);
      
      // Envoyer automatiquement la notification en temps réel
      try {
        await this.sendRealTimeNotification(fullNotification);
      } catch (realtimeError) {
        console.warn('⚠️ Erreur envoi temps réel (notification créée en base):', realtimeError.message);
      }
      
      return fullNotification;
    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      throw error;
    }
  }

  /**
   * Envoyer notification en temps réel via WebSocket
   */
  static async sendRealTimeNotification(notification) {
    try {
      const io = getIO();
      
      // Préparer les données pour le frontend
      const notificationData = {
        id: notification.id,
        type: notification.type,
        title: notification.titre,
        message: notification.message,
        priority: notification.priorite,
        metadata: notification.donnees_metier ? JSON.parse(notification.donnees_metier) : {},
        created_at: notification.date_creation,
        is_read: notification.lue
      };

      // Envoyer à l'utilisateur spécifique
      io.to(`user_${notification.utilisateur_id}`).emit('new_notification', notificationData);

      // Envoyer le compteur de notifications non lues
      const unreadCount = await this.getUnreadCount(notification.utilisateur_id);
      io.to(`user_${notification.utilisateur_id}`).emit('unread_count_update', unreadCount);

      console.log(`🔔 Notification temps réel envoyée à l'utilisateur ${notification.utilisateur_id}`);
    } catch (error) {
      // Ignorer l'erreur si WebSocket n'est pas initialisé (mode test)
      if (error.message.includes('Socket.io non initialisé')) {
        console.log('🔇 WebSocket non disponible (mode test)');
      } else {
        console.error('Erreur lors de l\'envoi temps réel:', error);
      }
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const db = this.getModels();
      const offset = (page - 1) * limit;
      
      const { count, rows } = await db.Notification.findAndCountAll({
        where: {
          utilisateur_id: userId
        },
        include: [
          {
            model: db.User,
            as: 'triggeredBy',
            attributes: ['id', 'nom', 'prenom'],
            required: false
          }
        ],
        order: [['date_creation', 'DESC']],
        limit,
        offset
      });

      // Transformer les données pour le frontend
      const notifications = rows.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.titre,
        message: notification.message,
        priority: notification.priorite,
        is_read: notification.lue,
        created_at: notification.date_creation,
        metadata: notification.donnees_metier ? JSON.parse(notification.donnees_metier) : {},
        triggeredBy: notification.triggeredBy
      }));

      return {
        notifications,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasMore: offset + limit < count
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  static async getUnreadCount(userId) {
    try {
      const db = this.getModels();
      return await db.Notification.count({
        where: {
          utilisateur_id: userId,
          lue: false
        }
      });
    } catch (error) {
      console.error('Erreur lors du comptage non lues:', error);
      return 0;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markAsRead(notificationId, userId) {
    try {
      const db = this.getModels();
      const notification = await db.Notification.findOne({
        where: {
          id: notificationId,
          utilisateur_id: userId
        }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      notification.lue = true;
      notification.date_lecture = new Date();
      await notification.save();

      // Envoyer mise à jour temps réel du compteur
      const unreadCount = await this.getUnreadCount(userId);
      try {
        const io = getIO();
        io.to(`user_${userId}`).emit('unread_count_update', unreadCount);
      } catch (error) {
        if (!error.message.includes('Socket.io non initialisé')) {
          console.error('Erreur WebSocket:', error);
        }
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead(userId) {
    try {
      const db = this.getModels();
      await db.Notification.update(
        { 
          lue: true,
          date_lecture: new Date()
        },
        {
          where: {
            utilisateur_id: userId,
            lue: false
          }
        }
      );

      // Envoyer mise à jour temps réel
      try {
        const io = getIO();
        io.to(`user_${userId}`).emit('unread_count_update', 0);
        io.to(`user_${userId}`).emit('notifications_marked_read');
      } catch (error) {
        if (!error.message.includes('Socket.io non initialisé')) {
          console.error('Erreur WebSocket:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage global comme lu:', error);
      throw error;
    }
  }

  /**
   * Notifications pour l'assignation d'un lead
   */
  static async notifyLeadAssigned(leadId, conseillereId, assignedByUserId = null, actionType = 'assigné') {
    try {
      const db = this.getModels();
      
      // Récupérer les informations du lead
      const lead = await db.Lead.findByPk(leadId);
      if (!lead) {
        throw new Error('Lead non trouvé');
      }

      // Adapter le message selon le type d'action
      let title, message;
      if (actionType === 'réassigné') {
        title = 'Nouveau lead qui vous a été assigné';
        message = `Vous avez un nouveau lead qui vous a été assigné : ${lead.prenom} ${lead.nom}`;
      } else {
        title = 'Nouveau lead assigné';
        message = `Vous avez reçu un nouveau lead : ${lead.prenom} ${lead.nom}`;
      }

      return await this.createNotification({
        userId: conseillereId,
        type: 'lead_assigned',
        title,
        message,
        priority: 'haute',
        metadata: {
          lead_id: leadId,
          lead_name: `${lead.prenom} ${lead.nom}`,
          lead_email: lead.email,
          lead_telephone: lead.telephone,
          action_type: actionType
        },
        relatedEntityType: 'Lead',
        relatedEntityId: leadId,
        triggeredByUserId: assignedByUserId,
        redirectLink: '/leads'
      });
    } catch (error) {
      console.error('Erreur notification lead assigné:', error);
      throw error;
    }
  }

  /**
   * Notifications pour l'assignation d'un client
   */
  static async notifyClientAssigned(clientId, conseillereId, assignedByUserId = null, actionType = 'assigné') {
    try {
      const db = this.getModels();
      
      // Récupérer les informations du client
      const client = await db.Client.findByPk(clientId);
      if (!client) {
        throw new Error('Client non trouvé');
      }

      // Adapter le message selon le type d'action
      let title, message;
      if (actionType === 'réassigné') {
        title = 'Nouveau client qui vous a été assigné';
        message = `Vous avez un nouveau client qui vous a été assigné : ${client.prenom} ${client.nom}`;
      } else {
        title = 'Nouveau client assigné';
        message = `Vous avez reçu un nouveau client : ${client.prenom} ${client.nom}`;
      }

      return await this.createNotification({
        userId: conseillereId,
        type: 'client_assigned',
        title,
        message,
        priority: 'haute',
        metadata: {
          client_id: clientId,
          client_name: `${client.prenom} ${client.nom}`,
          client_email: client.email,
          client_telephone: client.telephone,
          action_type: actionType,
          type_procedure: client.type_procedure
        },
        relatedEntityType: 'Client',
        relatedEntityId: clientId,
        triggeredByUserId: assignedByUserId,
        redirectLink: '/clients'
      });
    } catch (error) {
      console.error('Erreur notification client assigné:', error);
      throw error;
    }
  }

  /**
   * Notifications pour les paiements reçus
   */
  static async notifyPaymentReceived(factureId, userId, montantPaye) {
    try {
      const db = this.getModels();
      const facture = await db.Facture.findByPk(factureId);

      if (!facture) {
        throw new Error('Facture non trouvée');
      }

      const clientName = facture.client_nom || 'Client inconnu';

      const title = 'Paiement reçu';
      const message = `Paiement de ${montantPaye} MAD reçu pour la facture ${facture.numero_facture || facture.numero} (${clientName})`;

      return await this.createNotification({
        userId,
        type: 'payment_received',
        title,
        message,
        priority: 'normale',
        metadata: {
          facture_id: factureId,
          facture_numero: facture.numero_facture || facture.numero,
          client_name: clientName,
          montant_paye: montantPaye,
          montant_facture: facture.montant_total || facture.montant
        },
        relatedEntityType: 'Facture',
        relatedEntityId: factureId
      });
    } catch (error) {
      console.error('Erreur notification paiement reçu:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const db = this.getModels();
      const notification = await db.Notification.findOne({
        where: {
          id: notificationId,
          utilisateur_id: userId
        }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      await notification.destroy();

      // Envoyer mise à jour temps réel
      const unreadCount = await this.getUnreadCount(userId);
      try {
        const io = getIO();
        io.to(`user_${userId}`).emit('unread_count_update', unreadCount);
        io.to(`user_${userId}`).emit('notification_deleted', notificationId);
      } catch (error) {
        if (!error.message.includes('Socket.io non initialisé')) {
          console.error('Erreur WebSocket:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications
   */
  static async getNotificationStats() {
    try {
      const db = this.getModels();
      
      const stats = await Promise.all([
        // Total des notifications
        db.Notification.count(),
        
        // Notifications non lues
        db.Notification.count({ where: { lue: false } }),
        
        // Notifications par type
        db.Notification.findAll({
          attributes: [
            'type',
            [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
          ],
          group: ['type'],
          raw: true
        }),
        
        // Notifications par priorité
        db.Notification.findAll({
          attributes: [
            'priorite',
            [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']
          ],
          group: ['priorite'],
          raw: true
        }),

        // Notifications récentes (7 derniers jours)
        db.Notification.count({
          where: {
            date_creation: {
              [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        total: stats[0],
        unread: stats[1],
        byType: stats[2],
        byPriority: stats[3],
        recent7Days: stats[4]
      };
    } catch (error) {
      console.error('Erreur stats notifications:', error);
      throw error;
    }
  }

  /**
   * Créer des notifications automatiques basées sur les activités de l'application
   */
  static async createSystemNotifications() {
    try {
      const db = this.getModels();
      const now = new Date();

      // 1. Notifications pour les rendez-vous à venir (24h avant)
      const upcomingAppointments = await db.RendezVous.findAll({
        where: {
          date_rendez_vous: {
            [db.Sequelize.Op.between]: [
              new Date(now.getTime() + 23 * 60 * 60 * 1000), // Dans 23h
              new Date(now.getTime() + 25 * 60 * 60 * 1000)  // Dans 25h
            ]
          },
          statut: 'confirme'
        },
        include: [{
          model: db.Client,
          attributes: ['nom', 'prenom']
        }]
      });

      for (const rdv of upcomingAppointments) {
        if (rdv.conseillere_id) {
          await this.createNotification({
            userId: rdv.conseillere_id,
            type: 'appointment_reminder',
            title: 'Rendez-vous prévu demain',
            message: `Rendez-vous avec ${rdv.Client?.prenom} ${rdv.Client?.nom} prévu demain à ${rdv.heure_rendez_vous}`,
            priority: 'haute',
            metadata: {
              rdv_id: rdv.id,
              client_name: `${rdv.Client?.prenom} ${rdv.Client?.nom}`,
              date_rdv: rdv.date_rendez_vous,
              heure_rdv: rdv.heure_rendez_vous
            },
            relatedEntityType: 'RendezVous',
            relatedEntityId: rdv.id,
            redirectLink: `/rendez-vous/${rdv.id}`
          });
        }
      }

      // 2. Notifications pour les factures en retard
      if (db.Facture) {
        const overdueInvoices = await db.Facture.findAll({
          where: {
            date_echeance: {
              [db.Sequelize.Op.lt]: now
            },
            statut: 'en_attente'
          }
        });

        for (const facture of overdueInvoices) {
          if (facture.conseillere_id) {
            await this.createNotification({
              userId: facture.conseillere_id,
              type: 'invoice_overdue',
              title: 'Facture en retard',
              message: `Facture ${facture.numero_facture || facture.numero} en retard de paiement`,
              priority: 'urgente',
              metadata: {
                facture_id: facture.id,
                facture_numero: facture.numero_facture || facture.numero,
                montant: facture.montant_total || facture.montant,
                client_name: facture.client_nom
              },
              relatedEntityType: 'Facture',
              relatedEntityId: facture.id,
              redirectLink: `/factures/${facture.id}`
            });
          }
        }
      }

      console.log('✅ Notifications système créées');
    } catch (error) {
      console.error('❌ Erreur création notifications système:', error);
    }
  }

  /**
   * Créer des notifications de démonstration (pour les tests)
   */
  static async createDemoNotifications(userId) {
    try {
      const demoNotifications = [
        {
          type: 'lead_assigned',
          title: 'Nouveau lead assigné',
          message: 'Vous avez reçu un nouveau lead : Marie Dubois',
          priority: 'haute',
          metadata: {
            lead_name: 'Marie Dubois',
            lead_email: 'marie.dubois@email.com',
            lead_phone: '+33 6 12 34 56 78'
          },
          redirectLink: '/leads'
        },
        {
          type: 'payment_received',
          title: 'Paiement reçu',
          message: 'Paiement de 2500 MAD reçu pour la facture F2024-001',
          priority: 'normale',
          metadata: {
            amount: 2500,
            currency: 'MAD',
            invoice_number: 'F2024-001'
          },
          redirectLink: '/facturation'
        },
        {
          type: 'appointment_reminder',
          title: 'Rendez-vous prévu',
          message: 'Rendez-vous avec Jean Martin demain à 14h30',
          priority: 'haute',
          metadata: {
            client_name: 'Jean Martin',
            appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            appointment_time: '14:30'
          },
          redirectLink: '/rendez-vous'
        },
        {
          type: 'invoice_overdue',
          title: 'Facture en retard',
          message: 'La facture F2024-005 est en retard de 5 jours',
          priority: 'urgente',
          metadata: {
            invoice_number: 'F2024-005',
            days_overdue: 5,
            amount: 1800
          },
          redirectLink: '/facturation'
        },
        {
          type: 'document_uploaded',
          title: 'Document ajouté',
          message: 'Nouveau document ajouté pour le client Sophie Laurent',
          priority: 'basse',
          metadata: {
            client_name: 'Sophie Laurent',
            document_type: 'Passeport',
            document_name: 'passeport_sophie_laurent.pdf'
          },
          redirectLink: '/clients'
        }
      ];

      for (const notifData of demoNotifications) {
        await this.createNotification({
          userId,
          ...notifData
        });
      }

      console.log(`✅ ${demoNotifications.length} notifications de démonstration créées pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ Erreur création notifications de démonstration:', error);
    }
  }
}

module.exports = { NotificationService };
