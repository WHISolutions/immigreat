import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration d'axios avec le token d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const notificationService = {
  /**
   * Récupérer mes notifications
   */
  async getMyNotifications(page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { page, limit },
        headers: getAuthHeaders()
      });
      
      // L'API retourne: { success: true, data: { notifications: [...], total, totalPages } }
      if (response.data.success) {
        return {
          success: true,
          data: {
            notifications: response.data.data.notifications,
            total: response.data.data.total,
            totalPages: response.data.data.totalPages
          }
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  },

  /**
   * Obtenir le nombre de notifications non lues
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });
      
      // L'API retourne: { success: true, data: { unreadCount: number } }
      if (response.data.success) {
        return {
          success: true,
          data: {
            count: response.data.data.unreadCount // Convertir unreadCount en count
          }
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      throw error;
    }
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: number) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
      throw error;
    }
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: number) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  /**
   * Créer une notification manuelle (admin uniquement)
   */
  async createNotification(data: {
    userId: number;
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: any;
    expiresAt?: string;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/notifications`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de notification:', error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques des notifications (admin uniquement)
   */
  async getStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/stats`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};

export default notificationService;
