const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3').verbose();

// Configuration SQLite (source)
const sqliteDB = new Sequelize({
  dialect: 'sqlite',
  storage: './leads_database.sqlite',
  logging: false
});

// Configuration MySQL (destination)
const mysqlDB = new Sequelize(
  process.env.DB_NAME || 'immigration_production',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

// Import des modèles
const ClientModel = require('./models/client.model');
const LeadModel = require('./models/lead.model');

const migrateData = async () => {
  try {
    console.log('🔄 Début de la migration SQLite → MySQL...');
    
    // Test des connexions
    console.log('📋 Test de la connexion SQLite...');
    await sqliteDB.authenticate();
    console.log('✅ SQLite connecté');
    
    console.log('📋 Test de la connexion MySQL...');
    await mysqlDB.authenticate();
    console.log('✅ MySQL connecté');
    
    // Initialiser les modèles
    const SQLiteClient = ClientModel(sqliteDB);
    const SQLiteLead = LeadModel(sqliteDB);
    
    const MySQLClient = ClientModel(mysqlDB);
    const MySQLLead = LeadModel(mysqlDB);
    
    // Créer les tables MySQL
    console.log('🏗️ Création des tables MySQL...');
    await mysqlDB.sync({ force: false });
    console.log('✅ Tables MySQL créées');
    
    // Migrer les clients
    console.log('👥 Migration des clients...');
    const clients = await SQLiteClient.findAll({ raw: true });
    console.log(`📊 ${clients.length} clients trouvés dans SQLite`);
    
    if (clients.length > 0) {
      // Supprimer les champs auto-générés pour éviter les conflits
      const cleanClients = clients.map(client => {
        const { id, ...cleanClient } = client;
        return cleanClient;
      });
      
      await MySQLClient.bulkCreate(cleanClients, { 
        ignoreDuplicates: true,
        updateOnDuplicate: ['nom', 'prenom', 'email', 'telephone', 'statut']
      });
      console.log(`✅ ${clients.length} clients migrés vers MySQL`);
    }
    
    // Migrer les leads
    console.log('🎯 Migration des leads...');
    const leads = await SQLiteLead.findAll({ raw: true });
    console.log(`📊 ${leads.length} leads trouvés dans SQLite`);
    
    if (leads.length > 0) {
      // Supprimer les champs auto-générés pour éviter les conflits
      const cleanLeads = leads.map(lead => {
        const { id, ...cleanLead } = lead;
        return cleanLead;
      });
      
      await MySQLLead.bulkCreate(cleanLeads, { 
        ignoreDuplicates: true,
        updateOnDuplicate: ['nom', 'prenom', 'email', 'telephone', 'statut']
      });
      console.log(`✅ ${leads.length} leads migrés vers MySQL`);
    }
    
    // Vérification
    const mysqlClientCount = await MySQLClient.count();
    const mysqlLeadCount = await MySQLLead.count();
    
    console.log('🎉 Migration terminée avec succès !');
    console.log(`📊 Résultat:`);
    console.log(`   👥 Clients dans MySQL: ${mysqlClientCount}`);
    console.log(`   🎯 Leads dans MySQL: ${mysqlLeadCount}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    console.error('Détails:', error.message);
  } finally {
    await sqliteDB.close();
    await mysqlDB.close();
  }
};

// Exécuter la migration
if (require.main === module) {
  require('dotenv').config();
  migrateData();
}

module.exports = migrateData;
