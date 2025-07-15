'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Facture = sequelize.define('Facture', {
    // Ancien système (gardé pour compatibilité)
    numero: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // Nouveau système amélioré
    numero_facture: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isValidFormat(value) {
          if (value && !/^F\d{4}-\d{3}$/.test(value)) {
            throw new Error('Le numéro de facture doit avoir le format F2025-001');
          }
        }
      }
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    date_creation: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    
    // Champs existants
    montant: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    monnaie: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'MAD',
      validate: {
        isIn: [['CAD', 'MAD']]
      },
      comment: 'Monnaie de la facture : CAD (Dollar Canadien) ou MAD (Dirham Marocain)'
    },
    statut: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'brouillon',
      validate: {
        isIn: [['brouillon', 'payable', 'payee', 'annulee']]
      }
    },
    dateEmission: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dateEcheance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    datePaiement: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    methodePaiement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prestations_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string containing detailed prestations information'
    },
    validePar: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Utilisateur qui a validé/créé la facture'
    },
    dateValidation: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de validation/création de la facture'
    },
    // Champs pour l'annulation administrative
    annule_par: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Administrateur qui a annulé la facture'
    },
    date_annulation: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'annulation de la facture'
    },
    raison_annulation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Raison de l\'annulation de la facture'
    },
  }, {
    tableName: 'Factures',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['numero_facture']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['statut']
      },
      {
        fields: ['date_creation']
      }
    ],
    hooks: {
      beforeValidate: (facture) => {
        // Si pas de date_creation, utiliser la date actuelle
        if (!facture.date_creation) {
          facture.date_creation = new Date();
        }
        
        // Si pas de dateEmission, utiliser date_creation
        if (!facture.dateEmission && facture.date_creation) {
          facture.dateEmission = facture.date_creation;
        }
        
        // Si pas de dateEcheance, utiliser date_creation + 30 jours
        if (!facture.dateEcheance && facture.date_creation) {
          facture.dateEcheance = new Date(facture.date_creation.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
      }
    }
  });

  // Définir les associations
  Facture.associate = (models) => {
    // Une facture appartient à un client
    Facture.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'clientInfo'
    });
  };

  return Facture;
};