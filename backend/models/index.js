'use strict';

const { getSequelize } = require('../config/db.config');
const { Sequelize } = require('sequelize');

// Fonction pour initialiser les modèles après connexion
const initializeModels = () => {
  const sequelize = getSequelize();
  
  // Importer et initialiser les modèles
  const Lead = require('./lead.model')(sequelize);
  const Client = require('./client.model')(sequelize);
  const Document = require('./document.model')(sequelize);
  // Facture (peut ne pas exister dans tous les environnements)
  let Facture;
  try {
    Facture = require('./facture')(sequelize);
  } catch (e) {
    console.warn('Modèle Facture non chargé :', e.message);
  }
  const ConversionLog = require('./conversion-log.model')(sequelize);
  const ActivityLog = require('./activity-log.model')(sequelize);
  const User = require('./user')(sequelize);
  const RendezVous = require('./rendezVous')(sequelize);
  const Consultation = require('./consultation')(sequelize);
  const Notification = require('./notification')(sequelize);

  // Enregistrer les modèles dans sequelize.models pour qu'ils soient accessibles
  sequelize.models.Lead = Lead;
  sequelize.models.Client = Client;
  sequelize.models.Document = Document;
  sequelize.models.ConversionLog = ConversionLog;
  sequelize.models.ActivityLog = ActivityLog;
  sequelize.models.User = User;
  sequelize.models.RendezVous = RendezVous;
  sequelize.models.Consultation = Consultation;
  sequelize.models.Notification = Notification;
  if (Facture) sequelize.models.Facture = Facture;

  const db = {
    Lead,
    Client,
    Document,
    ConversionLog,
    ActivityLog,
    User,
    RendezVous,
    Consultation,
    Notification,
    Facture,
    sequelize,
    Sequelize
  };

  // Définir les associations
  if (Lead.associate) {
    Lead.associate(db);
  }
  if (Client.associate) {
    Client.associate(db);
  }
  if (Document.associate) {
    Document.associate(db);
  }
  if (ConversionLog.associate) {
    ConversionLog.associate(db);
  }
  if (ActivityLog.associate) {
    ActivityLog.associate(db);
  }
  if (User.associate) {
    User.associate(db);
  }
  if (RendezVous.associate) {
    RendezVous.associate(db);
  }
  if (Consultation.associate) {
    Consultation.associate(db);
  }
  if (Notification.associate) {
    Notification.associate(db);
  }
  if (Facture && Facture.associate) {
    Facture.associate(db);
  }

  return db;
};

module.exports = initializeModels;
