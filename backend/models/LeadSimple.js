const { DataTypes } = require('sequelize');

// Créer une instance Sequelize simple pour SQLite
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  interet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  conseillere: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Nouveau'
  }
}, {
  tableName: 'leads',
  timestamps: true
});

module.exports = { Lead, sequelize };
