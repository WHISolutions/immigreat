const express = require('express');
const router = express.Router();
const { NotificationService } = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications - Récupérer mes notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`📱 Récupération des notifications pour l'utilisateur ${userId} (page: ${page}, limit: ${limit})`);

    const result = await NotificationService.getUserNotifications(userId, page, limit);

    res.json({
      success: true,
      message: `${result.notifications.length} notifications récupérées`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/unread-count - Nombre de notifications non lues
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    console.error('❌ Erreur comptage notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications',
      error: error.message
    });
  }
});

// PATCH /api/notifications/:id/read - Marquer une notification comme lue
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    console.log(`👀 Marquage comme lue: notification ${notificationId} par utilisateur ${userId}`);

    const notification = await NotificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    });
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    const statusCode = error.message.includes('non trouvée') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Erreur lors du marquage',
      error: error.message
    });
  }
});

// PATCH /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`👀 Marquage global comme lues pour utilisateur ${userId}`);

    const result = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${result.updatedCount} notifications marquées comme lues`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur marquage global:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage global',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    console.log(`🗑️ Suppression notification ${notificationId} par utilisateur ${userId}`);

    const result = await NotificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification supprimée',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    const statusCode = error.message.includes('non trouvée') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// POST /api/notifications - Créer une notification (admin uniquement)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Vérifier les permissions
    if (!['admin', 'administrateur', 'directeur'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: permissions insuffisantes'
      });
    }

    const {
      userId,
      type,
      title,
      message,
      priority = 'normale',
      metadata = {},
      relatedEntityType,
      relatedEntityId,
      redirectLink
    } = req.body;

    // Validation
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Les champs userId, type, title et message sont requis'
      });
    }

    console.log(`📱 Création notification pour utilisateur ${userId} par ${user.prenom} ${user.nom}`);

    const notification = await NotificationService.createNotification({
      userId,
      type,
      title,
      message,
      priority,
      metadata,
      relatedEntityType,
      relatedEntityId,
      triggeredByUserId: user.id,
      redirectLink
    });

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      data: notification
    });
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification',
      error: error.message
    });
  }
});

// GET /api/notifications/stats - Statistiques des notifications (admin uniquement)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    if (!['admin', 'administrateur', 'directeur'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: permissions insuffisantes'
      });
    }

    const stats = await NotificationService.getNotificationStats();

    res.json({
      success: true,
      message: 'Statistiques récupérées',
      data: stats
    });
  } catch (error) {
    console.error('❌ Erreur stats notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
});

module.exports = router;
