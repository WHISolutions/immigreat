const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, sequelize, getDatabaseType } = require('./config/db.config');
const bcrypt = require('bcryptjs');
const http = require('http');
const { init: initSocket } = require('./socket');

// Configuration des variables d'environnement
dotenv.config();

// Variable d'environnement
const env = process.env.NODE_ENV || 'development';

// Initialisation de l'application Express
const app = express();

// Middleware
app.set('trust proxy', true); // Pour récupérer la vraie IP derrière un proxy
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (documents uploadés)
app.use('/uploads', express.static('uploads'));

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: 'API de gestion des leads d\'immigration',
    version: '1.0.0',
    status: 'active',
    database: getDatabaseType()
  });
});

// Routes API - Les routes seront chargées après initialisation des modèles
let leadRoutes, clientRoutes;

// Initialisation de la base de données et démarrage du serveur
const startServer = async () => {
  try {
    console.log('📄 Initialisation du serveur...');
    
    // Test de connexion (MySQL avec fallback SQLite)
    const dbInfo = await testConnection();
    console.log(`✅ Connexion à la base de données ${dbInfo.database} vérifiée`);

    // Initialiser les modèles après la connexion
    const initializeModels = require('./models');
    const db = initializeModels();
    console.log('📦 Modèles initialisés avec succès');

    // Vérifier que les tables existent (sans altération automatique)
    const sequelizeInstance = require('./config/db.config').getSequelize();
    
    try {
      // Vérifier la connexion et que les tables existent
      await sequelizeInstance.authenticate();
      console.log('🔄 Base de données prête (utiliser migrations pour les changements de schéma)');
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
      throw error;
    }

    // Vérifier s'il existe déjà un administrateur. Sinon en créer un par défaut
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@immigration.ca';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const User = db.User;
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash(adminPassword, 12);
      await User.create({
        nom: 'Admin',
        prenom: 'Système',
        email: adminEmail,
        telephone: '+1-514-555-0000',
        mot_de_passe: hashed,
        role: 'admin',
        permissions: User.getDefaultPermissions ? User.getDefaultPermissions('admin') : {},
        actif: true
      });
      console.log(`👑 Compte administrateur créé : ${adminEmail} / ${adminPassword}`);
    }

    // Charger les routes après l'initialisation des modèles
    try {
      leadRoutes = require('./routes/leads-temp');
      clientRoutes = require('./routes/clients-temp');
      const documentsRoutes = require('./routes/documents');
      const dashboardRoutes = require('./routes/dashboard');
      const usersRoutes = require('./routes/users');
      const testUsersRoutes = require('./routes/test-users');
      const facturesRoutes = require('./routes/factures');
      const logsRoutes = require('./routes/logs');
      const rendezVousRoutes = require('./routes/rendezVous');
      const consultationsRoutes = require('./routes/consultations');
      const statsRoutes = require('./routes/stats');
      const statisticsRoutes = require('./routes/statistics');
      const searchRoutes = require('./routes/search'); // Route de recherche globale
      const notificationsRoutes = require('./routes/notifications'); // Route de notifications
      const rapportsRoutes = require('./routes/rapports'); // Route de rapports
      
      app.use('/api/leads', leadRoutes);
      app.use('/api/clients', clientRoutes);
      app.use('/api/documents', documentsRoutes);
      app.use('/api/dashboard', dashboardRoutes);
      app.use('/api/users', usersRoutes);
      app.use('/api/test-users', testUsersRoutes);
      app.use('/api/factures', facturesRoutes);
      app.use('/api/logs', logsRoutes);
      app.use('/api/rendez-vous', rendezVousRoutes);
      app.use('/api/consultations', consultationsRoutes);
      app.use('/api/stats', statsRoutes);
      app.use('/api/statistics', statisticsRoutes);
      app.use('/api/search', searchRoutes); // Route de recherche globale
      app.use('/api/notifications', notificationsRoutes); // Route de notifications
      app.use('/api/rapports', rapportsRoutes); // Route de rapports
      console.log('🛣️ Routes configurées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des routes:', error);
      throw error;
    }

    // Middleware de gestion d'erreurs globales (après les routes)
    app.use((err, req, res, next) => {
      console.error('Erreur globale:', err.stack);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
      });
    });

    // Route 404 (doit être la dernière)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route non trouvée'
      });
    });

    // Définition du port
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);
    const io = initSocket(server);
    server.listen(PORT, async () => {
      console.log('🚀 Serveur démarré avec succès !');
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Base de données: ${dbInfo.database}`);
      console.log(`📚 API Leads: http://localhost:${PORT}/api/leads`);
      console.log(`👥 API Clients: http://localhost:${PORT}/api/clients`);
      console.log('🔍 Pour tester l\'API:');
      console.log(`   GET  http://localhost:${PORT}/api/leads`);
      console.log(`   POST http://localhost:${PORT}/api/leads`);
      console.log(`   GET  http://localhost:${PORT}/api/clients`);
      console.log(`   POST http://localhost:${PORT}/api/clients`);
        // Vérification des données après démarrage
      try {
        const clientCount = await db.Client.count();
        const leadCount = await db.Lead.count();
        console.log(`\n📊 Données disponibles:`);
        console.log(`   👥 Clients: ${clientCount}`);
        console.log(`   🎯 Leads: ${leadCount}`);
      } catch (error) {
        console.error('❌ Erreur lors de la vérification des données:', error.message);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    console.error('💡 Vérifiez que MySQL est démarré et accessible');
    console.error('💡 Vérifiez les variables d\'environnement dans .env');
    process.exit(1);
  }
};

// Gestion des arrêts propres
process.on('SIGINT', async () => {
  console.log('\n📄 Arrêt du serveur...');
  try {
    await sequelize.close();
    console.log('✅ Connexion base de données fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
  }
  process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;


