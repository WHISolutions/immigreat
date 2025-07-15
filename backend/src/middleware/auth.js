const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Récupérer le token du header
  const token = req.header('x-auth-token');

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé, token manquant' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};
