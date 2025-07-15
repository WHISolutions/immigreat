const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Consultation = sequelize.define('Consultation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    conseillerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'consultations',
    timestamps: true,
    indexes: [
      { fields: ['leadId'] },
      { fields: ['conseillerId'] },
      { fields: ['isValid'] },
      { fields: ['createdAt'] }
    ]
  });

  // Définir les associations
  Consultation.associate = function(models) {
    // Association avec Lead
    Consultation.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead'
    });

    // Association avec User (conseiller)
    Consultation.belongsTo(models.User, {
      foreignKey: 'conseillerId',
      as: 'conseiller'
    });
  };

  return Consultation;
};
