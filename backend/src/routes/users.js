const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware pour vérifier les permissions selon le rôle
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    next();
  };
};

// Route d'inscription (réservée à l'administrateur)
router.post('/register', auth, checkRole(['administrateur']), async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }
    
    // Créer un nouvel utilisateur
    user = new User({
      nom,
      prenom,
      email,
      motDePasse,
      role
    });
    
    await user.save();
    
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(401).json({ message: 'Compte désactivé' });
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparerMotDePasse(motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    // Mettre à jour la date de dernière connexion
    user.dernierConnexion = Date.now();
    await user.save();
    
    // Générer un token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour la photo de profil
router.put('/photo', auth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.photoProfil = photoUrl;
    await user.save();
    
    res.json({ message: 'Photo de profil mise à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour récupérer tous les utilisateurs (admin et directeur uniquement)
router.get('/', auth, checkRole(['administrateur', 'directeur']), async (req, res) => {
  try {
    const users = await User.find().select('-motDePasse');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour activer/désactiver un utilisateur (admin uniquement)
router.put('/status/:id', auth, checkRole(['administrateur']), async (req, res) => {
  try {
    const { actif } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.actif = actif;
    await user.save();
    
    res.json({ message: `Utilisateur ${actif ? 'activé' : 'désactivé'} avec succès` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
