const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    client_id: { type: DataTypes.INTEGER, allowNull: false },
    type_document: { type: DataTypes.STRING, allowNull: false },
    nom_fichier: { type: DataTypes.STRING, allowNull: false },
    chemin_fichier: { type: DataTypes.STRING, allowNull: false },
    date_televersement: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'documents_client',
    timestamps: false
  });

  Document.associate = (models) => {
    Document.belongsTo(models.Client, { foreignKey: 'client_id', as: 'client' });
  };

  return Document;
}; 