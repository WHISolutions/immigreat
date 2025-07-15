const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getSequelize } = require('../config/db.config');

// Route de test pour créer un utilisateur admin sans authentification
router.post('/create-admin', async (req, res) => {
  try {
    console.log('🔄 Tentative de création d\'un admin...');
    
    const sequelize = getSequelize();
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Permissions admin complètes
    const adminPermissions = {
      users_create: true,
      users_read: true,
      users_update: true,
      users_delete: true,
      leads_create: true,
      leads_read: true,
      leads_update: true,
      leads_delete: true,
      clients_create: true,
      clients_read: true,
      clients_update: true,
      clients_delete: true,
      documents_create: true,
      documents_read: true,
      documents_update: true,
      documents_delete: true,
      factures_create: true,
      factures_read: true,
      factures_update: true,
      factures_delete: true,
      rapports_read: true,
      administration_access: true
    };
    
    // Vérifier si l'admin existe déjà
    const [existingUsers] = await sequelize.query(
      "SELECT * FROM users WHERE email = 'admin@immigration.ca'"
    );
    
    if (existingUsers.length > 0) {
      return res.json({
        success: true,
        message: 'Utilisateur admin existe déjà',
        data: {
          email: 'admin@immigration.ca',
          message: 'Utilisez ce compte pour vous connecter'
        }
      });
    }
    
    // Insérer directement avec SQL
    const query = `
      INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, permissions, actif, date_creation, date_modification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await sequelize.query(query, {
      replacements: [
        'Admin',
        'Système',
        'admin@immigration.ca',
        '+1-514-555-0001',
        hashedPassword,
        'admin',
        JSON.stringify(adminPermissions),
        true
      ]
    });
    
    res.json({
      success: true,
      message: 'Utilisateur admin créé avec succès',
      data: {
        email: 'admin@immigration.ca',
        password: 'admin123',
        message: 'Utilisez ces identifiants pour vous connecter'
      }
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin',
      error: error.message
    });
  }
});

// Route de test pour vérifier la connexion
router.post('/test-login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    console.log('Test de connexion pour:', email);
    
    const sequelize = getSequelize();
    
    // Chercher l'utilisateur
    const [users] = await sequelize.query(
      "SELECT * FROM users WHERE email = ? AND actif = 1",
      { replacements: [email] }
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }
    
    const user = users[0];
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }
    
    // Générer un token simple pour les tests
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions || '{}')
      }
    });
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// Route pour lister les utilisateurs (test)
router.get('/list', async (req, res) => {
  try {
    const sequelize = getSequelize();
    
    const [users] = await sequelize.query(`
      SELECT id, nom, prenom, email, role, actif, permissions, date_creation, derniere_connexion
      FROM users
      ORDER BY date_creation DESC
    `);
    
    res.json({
      success: true,
      data: users.map(user => ({
        ...user,
        permissions: JSON.parse(user.permissions || '{}')
      }))
    });
    
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
});

module.exports = router; 