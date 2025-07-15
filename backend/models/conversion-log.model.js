const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConversionLog = sequelize.define('ConversionLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    numero_dossier: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    utilisateur: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date_conversion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'conversion_logs',
    timestamps: true,
    createdAt: 'date_conversion',
    updatedAt: false
  });

  ConversionLog.associate = (models) => {
    ConversionLog.belongsTo(models.Lead, { foreignKey: 'lead_id', as: 'lead' });
    ConversionLog.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
  };

  return ConversionLog;
}; 