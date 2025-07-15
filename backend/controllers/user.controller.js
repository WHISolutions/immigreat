const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSequelize } = require('../config/db.config');
const { logActivity } = require('../middleware/activity-logger');

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-photos');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    // Utiliser l'ID de l'utilisateur cible (req.params.id) ou l'utilisateur connecté (req.user.id)
    const userId = req.params.id || req.user.id;
    const filename = `user_${userId}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers images sont autorisés'), false);
    }
  }
});

// Obtenir le modèle User
const getUser = () => {
  const sequelize = getSequelize();
  return sequelize.models.User;
};

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: '24h'
  });
};

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const User = getUser();
    const { 
      nom, 
      prenom, 
      email, 
      telephone, 
      mot_de_passe, 
      role, 
      permissions: customPermissions 
    } = req.body;

    // Vérifier que l'utilisateur actuel a les permissions pour créer des utilisateurs
    const currentUser = req.user;
    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.hasPermission('users_create'))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour créer des utilisateurs'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      });
    }

    // Créer l'utilisateur
    const userData = {
      nom,
      prenom,
      email,
      telephone,
      mot_de_passe,
      role,
      created_by: currentUser.id
    };

    // Si des permissions personnalisées sont fournies, les utiliser
    if (customPermissions && typeof customPermissions === 'object') {
      userData.permissions = customPermissions;
    }

    const newUser = await User.create(userData);

    // Enregistrer la création d'utilisateur dans les logs d'activité
    try {
      await logActivity('create_user', 'User', newUser.id, null, {
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role,
        created_by: currentUser.id
      }, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log de création d\'utilisateur:', logError.message);
    }

    // Exclure le mot de passe de la réponse
    const userResponse = { ...newUser.toJSON() };
    delete userResponse.mot_de_passe;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// Connexion utilisateur
exports.login = async (req, res) => {
  try {
    const User = getUser();
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur par email
    const user = await User.findOne({ where: { email, actif: true } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.verifierMotDePasse(mot_de_passe);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    await user.updateLastLogin();

    // Générer le token
    const token = generateToken(user.id);

    // Enregistrer la connexion dans les logs d'activité
    try {
      await logActivity('login', 'User', user.id, null, {
        derniere_connexion: new Date(),
        adresse_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      }, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log de connexion:', logError.message);
    }

    // Préparer la réponse utilisateur (sans mot de passe)
    const userResponse = { ...user.toJSON() };
    delete userResponse.mot_de_passe;
    
    // Ajouter le nom complet pour le frontend
    userResponse.nom_complet = `${user.prenom} ${user.nom}`;

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const User = getUser();
    const currentUser = req.user;

    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.hasPermission('users_read'))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour voir les utilisateurs'
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ['mot_de_passe', 'token_reset', 'token_reset_expire'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['date_creation', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.hasPermission('users_read'))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour voir cet utilisateur'
      });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['mot_de_passe', 'token_reset', 'token_reset_expire'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.hasPermission('users_update'))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour modifier cet utilisateur'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const { nom, prenom, email, telephone, role, permissions, actif } = req.body;

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cette adresse email est déjà utilisée'
        });
      }
    }

    // Sauvegarder les anciennes valeurs pour le log
    const oldValues = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      permissions: user.permissions,
      actif: user.actif
    };

    // Mettre à jour les champs
    const updateData = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (email) updateData.email = email;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (actif !== undefined) updateData.actif = actif;

    await user.update(updateData);

    // Enregistrer la mise à jour dans les logs d'activité
    try {
      await logActivity('update_user', 'User', user.id, oldValues, {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role,
        permissions: user.permissions,
        actif: user.actif
      }, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log de mise à jour d\'utilisateur:', logError.message);
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['mot_de_passe', 'token_reset', 'token_reset_expire'] }
    });

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || (currentUser.role !== 'admin' && !currentUser.hasPermission('users_delete'))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour supprimer cet utilisateur'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (user.id === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Sauvegarder les données utilisateur pour le log
    const deletedUserData = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      actif: user.actif
    };

    await user.destroy();

    // Enregistrer la suppression dans les logs d'activité
    try {
      await logActivity('delete_user', 'User', user.id, deletedUserData, null, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log de suppression d\'utilisateur:', logError.message);
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;
    const currentUser = req.user;

    // Vérifier que l'utilisateur modifie son propre mot de passe ou a les permissions
    if (currentUser.id !== parseInt(id) && !currentUser.hasPermission('users_update')) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les permissions pour changer ce mot de passe'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Si c'est l'utilisateur qui change son propre mot de passe, vérifier l'ancien
    if (currentUser.id === parseInt(id)) {
      const isValidOldPassword = await user.verifierMotDePasse(ancien_mot_de_passe);
      if (!isValidOldPassword) {
        return res.status(400).json({
          success: false,
          message: 'Ancien mot de passe incorrect'
        });
      }
    }

    // Mettre à jour le mot de passe
    await user.update({ mot_de_passe: nouveau_mot_de_passe });

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// Obtenir les permissions disponibles
exports.getPermissions = async (req, res) => {
  try {
    const permissions = {
      users: ['users_create', 'users_read', 'users_update', 'users_delete'],
      leads: ['leads_create', 'leads_read', 'leads_update', 'leads_delete'],
      clients: ['clients_create', 'clients_read', 'clients_update', 'clients_delete'],
      documents: ['documents_create', 'documents_read', 'documents_update', 'documents_delete'],
      factures: ['factures_create', 'factures_read', 'factures_update', 'factures_delete'],
      rapports: ['rapports_read'],
      administration: ['administration_access']
    };

    res.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des permissions',
      error: error.message
    });
  }
};

// Réinitialiser le mot de passe (admin)
exports.resetPasswordAdmin = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ success:false, message:'Seul l\'admin peut réinitialiser les mots de passe'});
    }
    const user = await User.findByPk(id);
    if(!user){return res.status(404).json({success:false,message:'Utilisateur non trouvé'});}  
    const newPasswordPlain = Math.random().toString(36).slice(-10);
    await user.update({ mot_de_passe: newPasswordPlain });
    res.json({ success:true, newPassword:newPasswordPlain });
  } catch (e){
    res.status(500).json({ success:false, message:e.message});
  }
};

// Déconnexion utilisateur
exports.logout = async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser) {
      // Enregistrer la déconnexion dans les logs d'activité
      try {
        await logActivity('logout', 'User', currentUser.id, null, {
          date_deconnexion: new Date(),
          adresse_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        }, req);
      } catch (logError) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du log de déconnexion:', logError.message);
      }
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};

// Déconnexion automatique après inactivité
exports.autoLogout = async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser) {
      // Enregistrer la déconnexion automatique dans les logs d'activité
      try {
        await logActivity('auto_logout', 'User', currentUser.id, null, {
          motif: 'Déconnexion automatique après 10 minutes d\'inactivité',
          date_deconnexion: new Date(),
          adresse_ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'],
          session_duration: req.body.sessionDuration || 'non_specifie'
        }, req);
        
        console.log(`🔒 Déconnexion automatique enregistrée pour l'utilisateur ${currentUser.id} (${currentUser.nom})`);
      } catch (logError) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du log de déconnexion automatique:', logError.message);
      }
    }

    res.json({
      success: true,
      message: 'Déconnexion automatique enregistrée'
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la déconnexion automatique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la déconnexion automatique',
      error: error.message
    });
  }
};

// ===== GESTION DU PROFIL PERSONNEL =====

// Récupérer son propre profil
exports.getMyProfile = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = getUser();
    
    // Si req.user n'est pas défini, essayer de décoder le token directement
    let currentUserId;
    if (req.user && req.user.id) {
      currentUserId = req.user.id;
    } else {
      // Extraire le token et décoder pour obtenir l'ID utilisateur
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification requis'
        });
      }
      
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        currentUserId = decoded.userId;
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }
    }

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(currentUserId, {
      attributes: { exclude: ['mot_de_passe'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('🔍 [DEBUG] Profil récupéré:', {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      photo: user.photo
    });

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// Mettre à jour son propre profil
exports.updateMyProfile = async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = getUser();
    
    // Si req.user n'est pas défini, essayer de décoder le token directement
    let currentUserId;
    if (req.user && req.user.id) {
      currentUserId = req.user.id;
    } else {
      // Extraire le token et décoder pour obtenir l'ID utilisateur
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token d\'authentification requis'
        });
      }
      
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        currentUserId = decoded.userId;
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }
    }

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(currentUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('🔍 [DEBUG] Utilisateur trouvé:', {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      bureau: user.bureau
    });

    const { nom, prenom, email, telephone, photo } = req.body;
    
    console.log('🔍 [DEBUG] Données reçues:', {
      nom,
      prenom,
      email,
      telephone,
      photo
    });
    
    console.log('🔍 [DEBUG] Type et valeur de photo:', typeof photo, photo);

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cette adresse email est déjà utilisée'
        });
      }
    }

    // Sauvegarder les anciennes valeurs pour le log
    const oldValues = {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo
    };

    // Mettre à jour les champs modifiables
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (email !== undefined) user.email = email;
    if (telephone !== undefined) user.telephone = telephone;
    if (photo !== undefined) user.photo = photo;

    console.log('🔍 [DEBUG] Utilisateur après modification:', {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo
    });

    // Forcer la sauvegarde avec logging
    const saveResult = await user.save();
    
    console.log('🔍 [DEBUG] Résultat de la sauvegarde:', {
      success: !!saveResult,
      dataValues: saveResult?.dataValues
    });

    // Logger l'activité pour chaque champ modifié
    const changes = [];
    if (oldValues.nom !== user.nom) changes.push(`nom: "${oldValues.nom}" → "${user.nom}"`);
    if (oldValues.prenom !== user.prenom) changes.push(`prénom: "${oldValues.prenom}" → "${user.prenom}"`);
    if (oldValues.email !== user.email) changes.push(`email: "${oldValues.email}" → "${user.email}"`);
    if (oldValues.telephone !== user.telephone) changes.push(`téléphone: "${oldValues.telephone}" → "${user.telephone}"`);
    if (oldValues.photo !== user.photo) changes.push(`photo: "${oldValues.photo}" → "${user.photo}"`);

    if (changes.length > 0) {
      // Log simple sans req.user pour éviter les erreurs
      try {
        const sequelize = getSequelize();
        const { ActivityLog } = sequelize.models;
        
        await ActivityLog.create({
          utilisateur_id: user.id,
          action: 'user_profile_update',
          entite: 'users',
          entite_id: user.id,
          description: `Modification de profil: ${changes.join(', ')}`,
          anciennes_valeurs: JSON.stringify(oldValues),
          nouvelles_valeurs: JSON.stringify({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, photo: user.photo }),
          adresse_ip: req.ip || 'unknown',
          user_agent: req.headers['user-agent'] || 'unknown'
        });
      } catch (logError) {
        console.error('Erreur lors du logging d\'activité:', logError);
        // Ne pas bloquer la mise à jour pour un problème de log
      }
    }

    // Retourner l'utilisateur mis à jour (sans le mot de passe)
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['mot_de_passe'] }
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// Changer son propre mot de passe
exports.changeMyPassword = async (req, res) => {
  try {
    const User = getUser();
    const bcrypt = require('bcrypt');
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findByPk(currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, user.mot_de_passe);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Valider le nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.mot_de_passe = hashedPassword;
    await user.save();

    // Logger l'activité
    await logActivity(
      currentUser.id,
      'password_change',
      'users',
      currentUser.id,
      'Changement de mot de passe'
    );

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// ===== GESTION DES PHOTOS DE PROFIL =====

// Upload d'une photo de profil
exports.uploadProfilePhoto = async (req, res) => {
  // Utiliser multer middleware
  upload.single('photo')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors du téléchargement: ' + err.message
        });
      }

      const jwt = require('jsonwebtoken');
      const User = getUser();
      
      // Si req.user n'est pas défini, essayer de décoder le token directement
      let currentUserId;
      if (req.user && req.user.id) {
        currentUserId = req.user.id;
      } else {
        // Extraire le token et décoder pour obtenir l'ID utilisateur
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            message: 'Token d\'authentification requis'
          });
        }
        
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
          currentUserId = decoded.userId;
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'Token invalide'
          });
        }
      }

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier téléchargé'
        });
      }

      const user = await User.findByPk(currentUserId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Supprimer l'ancienne photo s'il y en a une
      if (user.photo) {
        const oldPhotoPath = path.join(__dirname, '../uploads/profile-photos', path.basename(user.photo));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Mettre à jour le chemin de la photo dans la base de données
      const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
      user.photo = photoUrl;
      await user.save();

      console.log('🔍 [DEBUG] Photo de profil sauvegardée:', {
        userId: user.id,
        photoUrl: photoUrl,
        filename: req.file.filename
      });

      // Logger l'activité (version simplifiée)
      try {
        const sequelize = getSequelize();
        const { ActivityLog } = sequelize.models;
        
        await ActivityLog.create({
          utilisateur_id: user.id,
          action: 'profile_photo_upload',
          entite: 'users',
          entite_id: user.id,
          description: 'Téléchargement d\'une nouvelle photo de profil',
          adresse_ip: req.ip || 'unknown',
          user_agent: req.headers['user-agent'] || 'unknown'
        });
      } catch (logError) {
        console.error('Erreur lors du logging d\'activité:', logError);
      }

      res.json({
        success: true,
        message: 'Photo de profil téléchargée avec succès',
        photoUrl: photoUrl
      });

    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement de la photo',
        error: error.message
      });
    }
  });
};

// Supprimer une photo de profil
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const User = getUser();
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(currentUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer le fichier physique s'il existe
    if (user.photo) {
      const photoPath = path.join(__dirname, '../uploads/profile-photos', path.basename(user.photo));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Mettre à jour la base de données
      user.photo = null;
      await user.save();

      // Logger l'activité
      await logActivity(
        currentUser.id,
        'profile_photo_delete',
        'users',
        currentUser.id,
        'Suppression de la photo de profil'
      );
    }

    res.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message
    });
  }
};

// Upload d'une photo de profil pour un utilisateur spécifique (admin)
exports.uploadUserPhoto = async (req, res) => {
  // Utiliser multer middleware
  upload.single('photo')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors du téléchargement: ' + err.message
        });
      }

      const User = getUser();
      const { id } = req.params;
      const currentUser = req.user;

      if (!currentUser || !currentUser.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier téléchargé'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Supprimer l'ancienne photo s'il y en a une
      if (user.photo) {
        const oldPhotoPath = path.join(__dirname, '../uploads/profile-photos', path.basename(user.photo));
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Mettre à jour le chemin de la photo dans la base de données
      const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
      user.photo = photoUrl;
      await user.save();

      // Logger l'activité
      await logActivity(
        currentUser.id,
        'admin_user_photo_upload',
        'users',
        user.id,
        `Téléchargement d'une photo de profil pour l'utilisateur ${user.prenom} ${user.nom}`
      );

      res.json({
        success: true,
        message: 'Photo de profil téléchargée avec succès',
        photoUrl: photoUrl
      });

    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement de la photo',
        error: error.message
      });
    }
  });
};

// Supprimer une photo de profil pour un utilisateur spécifique (admin)
exports.deleteUserPhoto = async (req, res) => {
  try {
    const User = getUser();
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Supprimer le fichier physique s'il existe
    if (user.photo) {
      const photoPath = path.join(__dirname, '../uploads/profile-photos', path.basename(user.photo));
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Mettre à jour la base de données
      user.photo = null;
      await user.save();

      // Logger l'activité
      await logActivity(
        currentUser.id,
        'admin_user_photo_delete',
        'users',
        user.id,
        `Suppression de la photo de profil de l'utilisateur ${user.prenom} ${user.nom}`
      );
    }

    res.json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message
    });
  }
};