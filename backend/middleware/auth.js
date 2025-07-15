const jwt = require('jsonwebtoken');
const { getSequelize } = require('../config/db.config');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.split(' ')[1];

    // -----------------------
    // Mode développement : accepter le token factice "mock-token"
    // -----------------------
    if (token === 'mock-token') {
      const sequelize = getSequelize();
      const admin = await sequelize.models.User.findOne({ where: { role: 'admin', actif: true } });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Admin non trouvé (mock-token).' });
      }
      req.user = admin;
      return next();
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Récupérer l'utilisateur depuis la base de données
    const sequelize = getSequelize();
    const User = sequelize.models.User;
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['mot_de_passe', 'token_reset', 'token_reset_expire'] }
    });

    if (!user || !user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou désactivé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      error: error.message
    });
  }
};

// Middleware pour vérifier les permissions
const authorize = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!user.hasPermission(permission)) {
      // Les administrateurs ont accès à tout
      if (user.role === 'admin') {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' requise`
      });
    }

    next();
  };
};

// Middleware pour vérifier le rôle
const requireRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rôle requis: ${allowedRoles.join(' ou ')}`
      });
    }

    next();
  };
};

// Middleware optionnel (ne bloque pas si pas d'auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    const sequelize = getSequelize();
    const User = sequelize.models.User;
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['mot_de_passe', 'token_reset', 'token_reset_expire'] }
    });

    req.user = user && user.actif ? user : null;
    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  optionalAuth
}; 