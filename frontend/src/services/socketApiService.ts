import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  /**
   * Se connecter au serveur WebSocket
   */
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connecté au serveur WebSocket');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Déconnecté du serveur WebSocket');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Erreur de connexion WebSocket:', error);
        this.isConnected = false;
      });

      this.socket.on('connection_established', (data) => {
        console.log('✅ Connexion WebSocket établie pour l\'utilisateur:', data.userId);
      });

    } catch (error) {
      console.error('❌ Erreur lors de la connexion WebSocket:', error);
    }
  }

  /**
   * Se déconnecter du serveur WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Connexion WebSocket fermée');
    }
  }

  /**
   * Rejoindre la room de l'utilisateur pour recevoir ses notifications
   */
  joinUserRoom(userId: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_user_room', userId);
      console.log(`👤 Rejoint la room utilisateur: ${userId}`);
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible de rejoindre la room');
    }
  }

  /**
   * Écouter les nouvelles notifications
   */
  onNewNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on('new_notification', callback);
    }
  }

  /**
   * Écouter les mises à jour du compteur de notifications non lues
   */
  onUnreadCountUpdate(callback: (count: number) => void) {
    if (this.socket) {
      this.socket.on('unread_count_update', callback);
    }
  }

  /**
   * Écouter quand toutes les notifications sont marquées comme lues
   */
  onNotificationsMarkedRead(callback: () => void) {
    if (this.socket) {
      this.socket.on('notifications_marked_read', callback);
    }
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(eventName: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  /**
   * Vérifier si la connexion est établie
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Reconnecter manuellement
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }
}

// Instance singleton
const socketService = new SocketService();

export default socketService;
