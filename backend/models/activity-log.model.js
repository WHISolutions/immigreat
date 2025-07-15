const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Action effectuée (create_client, update_client, delete_client, create_lead, etc.)'
    },
    entite: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type d\'entité modifiée (Client, Lead, User, etc.)'
    },
    entite_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID de l\'entité modifiée'
    },
    anciennes_valeurs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Anciennes valeurs au format JSON'
    },
    nouvelles_valeurs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nouvelles valeurs au format JSON'
    },
    adresse_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Adresse IP de l\'utilisateur'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent du navigateur'
    },
    date_action: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    createdAt: 'date_action',
    updatedAt: false,
    indexes: [
      {
        fields: ['utilisateur_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entite']
      },
      {
        fields: ['entite_id']
      },
      {
        fields: ['date_action']
      }
    ]
  });

  ActivityLog.associate = (models) => {
    // Association avec User
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur'
    });
  };

  return ActivityLog;
};
