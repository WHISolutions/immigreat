const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
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
      allowNull: true,
      validate: {
        len: {
          args: [0, 20],
          msg: 'Le numéro de téléphone ne peut pas dépasser 20 caractères'
        },
        isValidPhone(value) {
          if (value && value.trim() !== '' && value.length < 10) {
            throw new Error('Le numéro de téléphone doit contenir au moins 10 caractères');
          }
        }
      }
    },
    photo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Chemin vers la photo de profil'
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le mot de passe est requis'
        },
        len: {
          args: [6, 255],
          msg: 'Le mot de passe doit contenir au moins 6 caractères'
        }
      }
    },
    role: {
      type: DataTypes.ENUM,
      values: ['admin', 'conseillere', 'secretaire', 'comptable'],
      allowNull: false,
      defaultValue: 'secretaire',
      validate: {
        isIn: {
          args: [['admin', 'conseillere', 'secretaire', 'comptable']],
          msg: 'Rôle invalide'
        }
      }
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Permissions spécifiques de l\'utilisateur'
    },
    actif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    derniere_connexion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    token_reset: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    token_reset_expire: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    date_modification: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'date_creation',
    updatedAt: 'date_modification',
    hooks: {
      beforeCreate: async (user) => {
        if (user.mot_de_passe) {
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 12);
        }
        
        // Définir les permissions par défaut selon le rôle
        if (!user.permissions || Object.keys(user.permissions).length === 0) {
          user.permissions = getDefaultPermissions(user.role);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('mot_de_passe')) {
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, 12);
        }
      }
    }
  });

  // Méthodes d'instance
  User.prototype.verifierMotDePasse = async function(motDePasse) {
    return await bcrypt.compare(motDePasse, this.mot_de_passe);
  };

  User.prototype.hasPermission = function(permission) {
    return this.permissions && this.permissions[permission] === true;
  };

  User.prototype.updateLastLogin = function() {
    this.derniere_connexion = new Date();
    return this.save();
  };

  // Associations
  User.associate = (models) => {
    User.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    User.hasMany(models.User, { foreignKey: 'created_by', as: 'createdUsers' });
  };

  // Exposer la fonction pour l'utiliser ailleurs (ex: création admin par défaut)
  User.getDefaultPermissions = getDefaultPermissions;

  return User;
};

// Fonction pour définir les permissions par défaut selon le rôle
function getDefaultPermissions(role) {
  const permissions = {
    admin: {
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
    },
    conseillere: {
      leads_create: true,
      leads_read: true,
      leads_update: true,
      leads_delete: false,
      clients_create: true,
      clients_read: true,
      clients_update: true,
      clients_delete: false,
      documents_create: true,
      documents_read: true,
      documents_update: true,
      documents_delete: false,
      factures_read: true,
      rapports_read: true
    },
    secretaire: {
      leads_create: true,
      leads_read: true,
      leads_update: true,
      leads_delete: false,
      clients_create: false,
      clients_read: true,
      clients_update: false,
      clients_delete: false,
      documents_create: true,
      documents_read: true,
      documents_update: false,
      documents_delete: false,
      factures_read: true
    },
    comptable: {
      leads_read: true,
      clients_read: true,
      documents_read: true,
      factures_create: true,
      factures_read: true,
      factures_update: true,
      factures_delete: true,
      rapports_read: true
    }
  };

  return permissions[role] || {};
}
