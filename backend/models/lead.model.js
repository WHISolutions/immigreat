const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom est requis'
      },
      len: {
        args: [2, 100],
        msg: 'Le nom doit contenir entre 2 et 100 caractères'
      }
    }
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le prénom est requis'
      },
      len: {
        args: [2, 100],
        msg: 'Le prénom doit contenir entre 2 et 100 caractères'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Cette adresse email est déjà utilisée'
    },
    validate: {
      isEmail: {
        msg: 'Format d\'email invalide'
      },
      notEmpty: {
        msg: 'L\'email est requis'
      }
    }
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le téléphone est requis'
      }
    }
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Site web', 'LinkedIn', 'Facebook', 'Référence', 'Autre']],
        msg: 'Source invalide'
      }
    }
  },
  interet: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Citoyenneté', 'Autre']],
        msg: 'Intérêt invalide'
      }
    }
  },
  conseillere: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // Identifiant de la conseillère (référence à la table users)
  conseiller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Nouveau',
    validate: {
      isIn: {
        args: [['Nouveau', 'Contacté', 'À recontacter', 'Rendez-vous pris', 'Consultation effectuée', 'Consultation manquée', 'Qualifié', 'Non qualifié', 'Pas intéressé', 'Client']],
        msg: 'Statut invalide'
      }
    }
  },
  date_creation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'leads',
  timestamps: true,
  createdAt: 'date_creation',
  updatedAt: 'date_modification'
});

  return Lead;
};
