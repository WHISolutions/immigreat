const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['administrateur', 'directeur', 'conseillere', 'comptable', 'secretaire'],
    required: true
  },
  photoProfil: {
    type: String,
    default: null
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dernierConnexion: {
    type: Date,
    default: null
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthode pour hacher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparerMotDePasse = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

module.exports = mongoose.model('User', UserSchema);
