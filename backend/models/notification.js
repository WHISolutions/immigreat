const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type de notification: lead_assigned, payment_received, appointment_reminder, etc.'
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Titre de la notification'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenu de la notification'
    },
    priorite: {
      type: DataTypes.ENUM('basse', 'normale', 'haute', 'urgente'),
      defaultValue: 'normale'
    },
    lue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indique si la notification a été lue'
    },
    date_creation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    date_lecture: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date de lecture de la notification'
    },
    date_modification: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date de dernière modification'
    },
    donnees_metier: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Données supplémentaires liées à la notification'
    },
    entite_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type d\'entité liée (Lead, Client, Facture, etc.)'
    },
    entite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de l\'entité liée'
    },
    cree_par_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID de l\'utilisateur qui a déclenché la notification'
    },
    lien_redirection: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL de redirection pour cette notification'
    }
  }, {
    tableName: 'notifications',
    timestamps: false,
    indexes: [
      {
        fields: ['utilisateur_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['lue']
      },
      {
        fields: ['date_creation']
      },
      {
        fields: ['priorite']
      }
    ]
  });

  // Associations
  Notification.associate = (models) => {
    // Une notification appartient à un utilisateur (destinataire)
    Notification.belongsTo(models.User, {
      foreignKey: 'utilisateur_id',
      as: 'recipient'
    });

    // Une notification peut être créée par un utilisateur (déclencheur)
    Notification.belongsTo(models.User, {
      foreignKey: 'cree_par_id',
      as: 'triggeredBy'
    });
  };

  return Notification;
};
