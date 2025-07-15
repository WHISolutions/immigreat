const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Informations personnelles
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le nom est requis'
        }
      }
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le prénom est requis'
        }
      }
    },
    date_naissance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    adresse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nationalite: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Contact alternatif
    contact_nom: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_prenom: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_relation: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contact_telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Format d\'email invalide pour le contact'
        }
      }
    },
    
    // Informations administratives
    type_procedure: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Citoyenneté', 'Regroupement familial', 'Investisseur', 'Autre']],
          msg: 'Type de procédure invalide'
        }
      }
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'En cours',
      validate: {
        isIn: {
          args: [['En cours', 'En attente', 'Terminé', 'Annulé', 'Suspendu']],
          msg: 'Statut invalide'
        }
      }
    },
    conseillere: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    urgence: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    numero_dossier: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    
    // Compte client
    login_client: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    mot_de_passe_client: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    // Informations spécifiques (JSON pour flexibilité)
    informations_specifiques: {
      type: DataTypes.JSON,
      allowNull: true
    },

    // Nouveau champ pour stocker les notes/remarques du client (JSON)
    notes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    
    // Dates
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
    tableName: 'clients',
    timestamps: true,
    createdAt: 'date_creation',
    updatedAt: 'date_modification',
    hooks: {
      beforeCreate: (client) => {
        // Générer un numéro de dossier si pas fourni
        if (!client.numero_dossier) {
          const year = new Date().getFullYear();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          client.numero_dossier = `CL-${year}-${random}`;
        }
      }
    }
  });

  Client.associate = (models) => {
    Client.hasMany(models.Document, { foreignKey: 'client_id', as: 'documents' });
    // Association avec les factures (seulement si le modèle existe)
    if (models.Facture) {
      Client.hasMany(models.Facture, { foreignKey: 'client_id', as: 'factures' });
    }
  };

  return Client;
};
