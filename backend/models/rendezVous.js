'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RendezVous = sequelize.define('RendezVous', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID du client (NULL pour les leads)'
    },
    // client_type: {
    //   type: DataTypes.ENUM('client', 'lead'),
    //   allowNull: false,
    //   defaultValue: 'client',
    //   comment: 'Type de contact : client ou lead'
    // }, // TEMPORAIREMENT DÉSACTIVÉ - À RÉACTIVER APRÈS MIGRATION
    client_nom: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    conseiller_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    conseillere_nom: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    date_rdv: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    heure_debut: {
      type: DataTypes.TIME,
      allowNull: false
    },
    heure_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    type_rdv: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Consultation initiale', 'Suivi de dossier', 'Consultation finale', 'Autre']],
          msg: 'Type de rendez-vous invalide'
        }
      }
    },
    statut: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Confirmé',
      validate: {
        isIn: {
          args: [['En attente', 'Confirmé', 'Terminé', 'Annulé']],
          msg: 'Statut invalide'
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cree_par_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    modifie_par_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'RendezVous',
    timestamps: true, // Utilise createdAt et updatedAt automatiquement
    underscored: false, // Garde le camelCase pour createdAt/updatedAt
    indexes: [
      {
        fields: ['client_id']
      },
      {
        fields: ['conseiller_id']
      },
      {
        fields: ['date_rdv']
      },
      {
        fields: ['statut']
      },
      {
        fields: ['date_rdv', 'heure_debut', 'conseiller_id'],
        name: 'idx_rdv_creneau_conseiller'
      }
    ],
    hooks: {
      beforeValidate: (rendezVous) => {
        // Validation que l'heure de fin soit après l'heure de début
        if (rendezVous.heure_debut && rendezVous.heure_fin) {
          const debut = new Date(`1970-01-01T${rendezVous.heure_debut}`);
          const fin = new Date(`1970-01-01T${rendezVous.heure_fin}`);
          
          if (fin <= debut) {
            throw new Error('L\'heure de fin doit être postérieure à l\'heure de début');
          }
        }
        
        // Validation que la date ne soit pas dans le passé (sauf pour les modifications)
        if (rendezVous.date_rdv && rendezVous.isNewRecord) {
          const aujourdhui = new Date();
          aujourdhui.setHours(0, 0, 0, 0);
          const dateRdv = new Date(rendezVous.date_rdv);
          
          if (dateRdv < aujourdhui) {
            throw new Error('La date du rendez-vous ne peut pas être dans le passé');
          }
        }
      }
    }
  });

  // Définir les associations
  RendezVous.associate = (models) => {
    // Un rendez-vous peut appartenir à un client (optionnel pour les leads)
    // TEMPORAIREMENT SANS CONTRAINTES
    RendezVous.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      constraints: false // Pas de contrainte de clé étrangère stricte
    });
    
    // Un rendez-vous appartient à une conseillère
    RendezVous.belongsTo(models.User, {
      foreignKey: 'conseiller_id',
      as: 'conseillere'
    });
    
    // Un rendez-vous est créé par un utilisateur
    RendezVous.belongsTo(models.User, {
      foreignKey: 'cree_par_id',
      as: 'createur'
    });
    
    // Un rendez-vous est modifié par un utilisateur
    RendezVous.belongsTo(models.User, {
      foreignKey: 'modifie_par_id',
      as: 'modificateur'
    });
  };

  return RendezVous;
};
