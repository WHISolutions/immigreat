const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données avec fallback SQLite
let sequelize;
let usingMySQL = false;

const createMySQLConnection = () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'immigration_production',
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  };

  return new Sequelize(
    dbConfig.database,
    dbConfig.user,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      pool: dbConfig.pool,
      logging: dbConfig.logging
    }
  );
};

const createSQLiteConnection = () => {
  return new Sequelize({
    dialect: 'sqlite',
    storage: './leads_database.sqlite',
    logging: false
  });
};

// Initialisation immédiate (sans test)
// Par défaut, on essaie MySQL
try {
  sequelize = createMySQLConnection();
  usingMySQL = true;
  console.log('🔄 Configuration MySQL initialisée');
} catch (error) {
  console.log('⚠️ Basculement vers SQLite par défaut...');
  sequelize = createSQLiteConnection();
  usingMySQL = false;
}

// Test de connexion avec gestion des erreurs
const testConnection = async () => {
  try {
    if (!usingMySQL) {
      // Si on est déjà en SQLite, on tente de passer à MySQL
      console.log('🔄 Tentative de connexion à MySQL...');
      const mysqlInstance = createMySQLConnection();
      await mysqlInstance.authenticate();
      
      // Si ça marche, on change l'instance
      sequelize = mysqlInstance;
      usingMySQL = true;
      console.log('✅ Connexion MySQL établie avec succès');
      
      return {
        isConnected: true,
        database: 'MySQL'
      };
    } else {
      // Test de la connexion MySQL actuelle
      await sequelize.authenticate();
      console.log('✅ Connexion MySQL maintenue');
      
      return {
        isConnected: true,
        database: 'MySQL'
      };
    }
  } catch (error) {
    console.error('❌ Erreur MySQL:', error.message);
    
    if (usingMySQL) {
      console.log('⚠️ Basculement vers SQLite...');
      
      try {
        sequelize = createSQLiteConnection();
        usingMySQL = false;
        
        await sequelize.authenticate();
        console.log('✅ Connexion SQLite établie avec succès');
        
        return {
          isConnected: true,
          database: 'SQLite'
        };
      } catch (sqliteError) {
        console.error('❌ Erreur SQLite aussi:', sqliteError.message);
        throw sqliteError;
      }
    } else {
      // On est déjà en SQLite et ça ne marche pas
      throw error;
    }
  }
};

const getDatabaseType = () => {
  return usingMySQL ? 'MySQL' : 'SQLite';
};

// Fonction pour obtenir l'instance sequelize
const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Sequelize not initialized');
  }
  return sequelize;
};

module.exports = {
  testConnection,
  sequelize,
  getSequelize,
  getDatabaseType
};
