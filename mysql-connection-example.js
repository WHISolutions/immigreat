// Exemple de configuration de connexion MySQL avec mysql2 et Sequelize
// Ce fichier montre comment utiliser les variables d'environnement Docker

const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// Configuration de connexion directe avec mysql2
const createMySQLConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'immigration_production',
      port: process.env.DB_PORT || 3306,
      charset: 'utf8mb4',
      timezone: '+00:00', // UTC
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      // Pool de connexions
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Connexion MySQL établie avec mysql2');
    return connection;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    throw error;
  }
};

// Configuration Sequelize avec les variables d'environnement Docker
const createSequelizeConnection = () => {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'immigration_production',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timezone: '+00:00',
      
      // Configuration du pool de connexions
      pool: {
        max: 10,           // Nombre maximum de connexions
        min: 0,            // Nombre minimum de connexions
        acquire: 30000,    // Temps maximum pour obtenir une connexion (ms)
        idle: 10000        // Temps maximum d'inactivité avant fermeture (ms)
      },
      
      // Configuration des retry
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /TIMEOUT/,
          /Deadlock/i,
        ],
        max: 3
      },
      
      // Logging (désactivé en production)
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      
      // Options additionnelles
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true,
        underscored: false,
        freezeTableName: true
      }
    }
  );

  return sequelize;
};

// Fonction de test de connexion avec retry
const testDatabaseConnection = async (maxRetries = 5) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const sequelize = createSequelizeConnection();
      await sequelize.authenticate();
      
      console.log(`✅ Connexion à la base de données réussie (tentative ${retries + 1})`);
      console.log(`📊 Base: ${process.env.DB_NAME}`);
      console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`👤 User: ${process.env.DB_USER}`);
      
      return sequelize;
    } catch (error) {
      retries++;
      console.error(`❌ Tentative ${retries}/${maxRetries} échouée:`, error.message);
      
      if (retries >= maxRetries) {
        console.error('🚨 Impossible de se connecter à la base de données après', maxRetries, 'tentatives');
        throw error;
      }
      
      // Attendre avant la prochaine tentative
      const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Backoff exponentiel
      console.log(`⏳ Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Exemple d'utilisation simple
const exemple = async () => {
  try {
    // Méthode 1: Connexion directe avec mysql2
    const connection = await createMySQLConnection();
    const [rows] = await connection.execute('SELECT 1 + 1 as result');
    console.log('Résultat mysql2:', rows[0].result);
    await connection.end();
    
    // Méthode 2: Connexion avec Sequelize
    const sequelize = await testDatabaseConnection();
    const result = await sequelize.query('SELECT 1 + 1 as result');
    console.log('Résultat Sequelize:', result[0][0].result);
    await sequelize.close();
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

module.exports = {
  createMySQLConnection,
  createSequelizeConnection,
  testDatabaseConnection
};

// Pour tester ce fichier directement
if (require.main === module) {
  exemple();
}
