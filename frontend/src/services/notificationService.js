// Service de notifications en temps réel
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Méthodes de base
  addNotification(notification) {
    console.log('Notification ajoutée:', notification);
  }

  getNotifications() {
    return this.notifications;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
}

// Créer une instance unique du service
const notificationService = new NotificationService();

export default notificationService;
