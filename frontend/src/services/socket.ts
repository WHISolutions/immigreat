import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'; // Assurez-vous que le port est correct

let socket: Socket | null = null;

export const connectSocket = (userId?: string, token?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'], // Force WebSocket transport
    });

    socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
      
      // Authentifier automatiquement si on a les informations
      if (userId && token && socket) {
        socket.emit('authenticate', { userId, token });
      }
    });

    socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('✅ Authentifié sur WebSocket');
      } else {
        console.error('❌ Échec authentification WebSocket');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Déconnecté du serveur WebSocket:', reason);
      // Optionnel: tenter de se reconnecter ou gérer la déconnexion
      if (reason === 'io server disconnect') {
        // le serveur a déconnecté le socket, vous pourriez vouloir vous reconnecter manuellement
        socket?.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Erreur de connexion WebSocket:', err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket déconnecté manuellement');
  }
};

// Exportation pour s'assurer que le fichier est un module
export { socket };