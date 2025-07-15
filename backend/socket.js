// backend/socket.js

// Module de gestion de Socket.IO
let io;

function init(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🛜  Nouvelle connexion WebSocket :', socket.id);
    
    // Gérer l'authentification utilisateur
    socket.on('authenticate', (data) => {
      const { userId, token } = data;
      
      if (userId) {
        socket.join(`user_${userId}`);
        socket.userId = userId;
        console.log(`✅ Utilisateur ${userId} authentifié sur socket ${socket.id}`);
        socket.emit('authenticated', { success: true });
      } else {
        console.log('❌ Échec authentification socket:', data);
        socket.emit('authenticated', { success: false });
      }
    });
    
    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`🔌 Utilisateur ${socket.userId} déconnecté`);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io non initialisé. Appelez init(server) d\'abord.');
  }
  return io;
}

module.exports = { init, getIO }; 