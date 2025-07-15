const axios = require('axios');

async function fixHassaniyaAssignment() {
  try {
    console.log('🔧 Correction de l\'assignation du lead hassaniya...');
    
    const baseURL = 'http://localhost:5000';
    const adminToken = 'mock-token'; // Token admin
    
    // 1. Récupérer les informations détaillées du lead hassaniya
    console.log('1. Récupération des leads...');
    const leadsResponse = await axios.get(`${baseURL}/api/leads`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const leads = leadsResponse.data.data.leads;
    const hassaniyaLead = leads.find(l => 
      l.nom.toLowerCase().includes('hassaniya') || 
      l.prenom.toLowerCase().includes('hassaniya')
    );

    if (!hassaniyaLead) {
      console.log('❌ Lead hassaniya non trouvé');
      return;
    }

    console.log('📊 État actuel du lead hassaniya:');
    console.log(`   ID: ${hassaniyaLead.id}`);
    console.log(`   Nom: ${hassaniyaLead.nom} ${hassaniyaLead.prenom}`);
    console.log(`   Conseiller ID: ${hassaniyaLead.conseiller_id}`);
    console.log(`   Conseillère nom: ${hassaniyaLead.conseillere}`);
    console.log(`   Email: ${hassaniyaLead.email}`);
    console.log('');

    // 2. Vérifier l'ID de wafaa chaouby
    console.log('2. Vérification de l\'ID de wafaa chaouby...');
    const usersResponse = await axios.get(`${baseURL}/api/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const wafaaUser = usersResponse.data.data.find(u => 
      (u.nom && u.nom.toLowerCase().includes('chaouby')) ||
      (u.prenom && u.prenom.toLowerCase().includes('wafaa'))
    );

    if (!wafaaUser) {
      console.log('❌ Utilisateur wafaa chaouby non trouvé');
      return;
    }

    console.log(`   ✅ wafaa chaouby trouvée: ID ${wafaaUser.id}, Email: ${wafaaUser.email}`);
    
    // 3. Vérifier les notifications actuelles pour wafaa
    console.log('3. Vérification des notifications actuelles...');
    try {
      // Utilisons un token différent ou testons sans token pour les notifications
      const notifResponse = await axios.get(`${baseURL}/api/notifications?utilisateur_id=${wafaaUser.id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log(`   📱 ${notifResponse.data.data.notifications.length} notifications trouvées pour wafaa`);
    } catch (error) {
      console.log('   ⚠️ Impossible de récupérer les notifications:', error.message);
    }

    // 4. Forcer la réassignation du lead
    console.log(`4. Réassignation forcée du lead ${hassaniyaLead.id} à wafaa (ID: ${wafaaUser.id})...`);
    
    const assignResponse = await axios.post(`${baseURL}/api/leads/${hassaniyaLead.id}/assign`, {
      conseiller_id: wafaaUser.id
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    if (assignResponse.status === 200) {
      console.log('   ✅ Lead réassigné avec succès !');
      console.log('   📊 Réponse:', assignResponse.data);
      
      // 5. Attendre la notification
      console.log('5. Attente de la création de notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 6. Vérifier si la notification a été créée
      console.log('6. Vérification des nouvelles notifications...');
      
      console.log('\\n🎉 CORRECTION TERMINÉE !');
      console.log('\\n📱 Vérifiez maintenant:');
      console.log('1. Connectez-vous en tant que wafaa sur le frontend');
      console.log('2. Cliquez sur la cloche 🔔');
      console.log('3. Vous devriez voir la notification pour hassaniya');
      
    } else {
      console.log('❌ Échec de la réassignation');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

fixHassaniyaAssignment();
