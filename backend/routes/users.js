const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize, requireRole } = require('../middleware/auth');
const initializeModels = require('../models');

// Routes publiques (sans authentification)
router.post('/login', userController.login);
router.post('/logout', authenticate, userController.logout);
router.post('/auto-logout', authenticate, userController.autoLogout);

// Route publique pour récupérer tous les conseillers - accessible sans authentification
router.get('/conseillers', async (req, res) => {
  try {
    const { User } = initializeModels();
    
    const conseillers = await User.findAll({
      where: {
        role: ['admin', 'conseillere']
      },
      attributes: ['id', 'nom', 'prenom', 'email', 'role'],
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });

    // Formater les noms complets pour l'affichage
    const conseillersList = conseillers.map(conseiller => ({
      id: conseiller.id,
      nomComplet: `${conseiller.prenom} ${conseiller.nom}`,
      email: conseiller.email,
      role: conseiller.role
    }));

    res.json({
      success: true,
      data: conseillersList
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des conseillers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conseillers',
      error: error.message
    });
  }
});

// Routes protégées (avec authentification)
router.use(authenticate);

// Route pour gérer son propre profil (accessible à tous les utilisateurs authentifiés)
router.get('/me', userController.getMyProfile);
router.put('/me', userController.updateMyProfile);
router.post('/change-password', userController.changeMyPassword);

// Routes pour la gestion des photos de profil
router.post('/upload-photo', userController.uploadProfilePhoto);
router.delete('/delete-photo', userController.deleteProfilePhoto);

// Routes pour l'administration (upload photo pour un utilisateur spécifique)
router.post('/:id/upload-photo', authorize('users_update'), userController.uploadUserPhoto);
router.delete('/:id/delete-photo', authorize('users_update'), userController.deleteUserPhoto);

// Obtenir les permissions disponibles
router.get('/permissions', userController.getPermissions);

// Routes pour la gestion des utilisateurs
router.get('/', authorize('users_read'), userController.getAllUsers);
router.get('/:id', authorize('users_read'), userController.getUserById);
router.post('/', authorize('users_create'), userController.createUser);
router.put('/:id', authorize('users_update'), userController.updateUser);
router.delete('/:id', authorize('users_delete'), userController.deleteUser);

// Route pour changer le mot de passe (accessible à tous les utilisateurs authentifiés)
router.put('/:id/password', userController.changePassword);

// reset mdp (admin)
router.post('/:id/password-reset', userController.resetPasswordAdmin);

// Routes spécifiques aux administrateurs
router.use('/admin', requireRole('admin'));

module.exports = router;
