const { sequelize } = require('./config/db.config');
const db = require('./models');

const checkData = async () => {
  try {
    console.log('🔍 Vérification des données dans la base...');
    
    const clientCount = await db.Client.count();
    const leadCount = await db.Lead.count();
    
    console.log(`📊 Nombre de clients: ${clientCount}`);
    console.log(`📊 Nombre de leads: ${leadCount}`);
    
    if (clientCount > 0) {
      console.log('\n👥 Clients:');
      const clients = await db.Client.findAll();
      clients.forEach(client => {
        console.log(`  - ${client.prenom} ${client.nom} (${client.email})`);
      });
    }
    
    if (leadCount > 0) {
      console.log('\n🎯 Leads:');
      const leads = await db.Lead.findAll();
      leads.forEach(lead => {
        console.log(`  - ${lead.prenom} ${lead.nom} (${lead.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
};

checkData();
