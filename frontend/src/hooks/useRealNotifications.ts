import { useState, useEffect } from 'react';
import notificationApiService from '../services/notificationApiService';
import { socket } from '../services/socket';

interface Notification {
  id: string;
  type: string;
  message: string;
  title: string;
  date: string;
  isRead: boolean;
  priority: string;
  lienRedirection?: string;
  nomClient?: string;
  metadata?: any;
}

interface NotificationApiResponse {
  id: number;
  type: string;
  message: string;
  title: string;
  created_at: string;
  is_read: boolean;
  priority: string;
  metadata?: any;
  triggeredBy?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

export const useRealNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications initiales
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationApiService.getMyNotifications(1, 10), // Les 10 dernières
        notificationApiService.getUnreadCount()
      ]);

      if (notificationsResponse.success) {
        const transformedNotifications = notificationsResponse.data.notifications.map((notif: NotificationApiResponse) => ({
          id: notif.id.toString(),
          type: notif.type,
          message: notif.message,
          title: notif.title || '',
          date: notif.created_at,
          isRead: notif.is_read,
          priority: notif.priority,
          lienRedirection: '', // Le backend n'envoie pas ce champ pour l'instant
          nomClient: notif.metadata?.client_name || notif.metadata?.lead_name,
          metadata: notif.metadata
        }));
        
        setNotifications(transformedNotifications);
      }

      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.data.count);
      }

    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApiService.markAsRead(parseInt(notificationId));
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage comme lu:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await notificationApiService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur marquage global:', error);
    }
  };

  // Supprimer une notification
  const removeNotification = async (notificationId: string) => {
    try {
      await notificationApiService.deleteNotification(parseInt(notificationId));
      
      const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false;
      
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  // Ajouter une nouvelle notification (pour les mises à jour temps réel)
  const addNotification = (notificationData: any) => {
    const newNotification: Notification = {
      id: notificationData.id?.toString() || Date.now().toString(),
      type: notificationData.type,
      message: notificationData.message,
      title: notificationData.title || '',
      date: notificationData.created_at || new Date().toISOString(),
      isRead: false,
      priority: notificationData.priority || 'normale',
      lienRedirection: notificationData.redirect_link,
      nomClient: notificationData.metadata?.client_name || notificationData.metadata?.lead_name,
      metadata: notificationData.metadata
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  // Écouter les mises à jour temps réel via WebSocket
  useEffect(() => {
    if (socket && socket.connected) {
      // Nouvelle notification reçue
      socket.on('new_notification', (notificationData: any) => {
        console.log('📱 Nouvelle notification reçue:', notificationData);
        addNotification(notificationData);
      });

      // Mise à jour du compteur de non lues
      socket.on('unread_count_update', (newCount: number) => {
        console.log('🔢 Mise à jour compteur:', newCount);
        setUnreadCount(newCount);
      });

      // Notification supprimée
      socket.on('notification_deleted', (notificationId: number) => {
        console.log('🗑️ Notification supprimée:', notificationId);
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId.toString())
        );
      });

      // Toutes les notifications marquées comme lues
      socket.on('notifications_marked_read', () => {
        console.log('👀 Toutes les notifications marquées comme lues');
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      });

      return () => {
        if (socket) {
          socket.off('new_notification');
          socket.off('unread_count_update');
          socket.off('notification_deleted');
          socket.off('notifications_marked_read');
        }
      };
    }
  }, []);

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Recharger toutes les 5 minutes (fallback si WebSocket ne fonctionne pas)
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    loadNotifications
  };
};
