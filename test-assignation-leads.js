const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAssignationLeads() {
  try {
    console.log('🧪 TEST D\'ASSIGNATION DES LEADS\n');

    // 0. Authentification avec le login fourni
    console.log('0. Authentification...');
    let authToken = null;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
        email: 'admin@immigration.ca',
        mot_de_passe: 'admin123'
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.token;
        console.log('✅ Authentification réussie');
      } else {
        console.log('❌ Authentification échouée:', loginResponse.data.message);
        return;
      }
    } catch (loginError) {
      console.log('❌ Authentification échouée:', loginError.message);
      return;
    }

    // Configuration des headers avec le token
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 1. Récupérer la liste des conseillers
    console.log('\n1. Récupération des conseillers...');
    const conseillersResponse = await axios.get(`${BASE_URL}/users/conseillers`);
    
    if (!conseillersResponse.data.success) {
      console.log('❌ Erreur lors de la récupération des conseillers');
      return;
    }
    
    const conseillers = conseillersResponse.data.data;
    console.log(`✅ ${conseillers.length} conseillers trouvés:`);
    conseillers.forEach(c => {
      console.log(`   - ${c.nomComplet} (ID: ${c.id}, Role: ${c.role})`);
    });

    // 2. Récupérer les leads non assignés
    console.log('\n2. Récupération des leads non assignés...');
    const leadsResponse = await axios.get(`${BASE_URL}/leads`, { headers });
    
    if (!leadsResponse.data.success) {
      console.log('❌ Erreur lors de la récupération des leads');
      console.log('Détails:', leadsResponse.data);
      return;
    }
    
    const leads = leadsResponse.data.data.leads || leadsResponse.data.data;
    const unassignedLeads = leads.filter(lead => !lead.conseillere && !lead.conseiller_id);
    
    console.log(`✅ ${leads.length} leads totaux, ${unassignedLeads.length} non assignés`);
    
    if (unassignedLeads.length === 0) {
      console.log('⚠️ Aucun lead non assigné trouvé');
      return;
    }

    // 3. Tester l'assignation avec le premier conseiller
    const testLead = unassignedLeads[0];
    const testConseiller = conseillers.find(c => c.role === 'conseillere');
    
    if (!testConseiller) {
      console.log('❌ Aucun conseiller avec le rôle "conseillere" trouvé');
      return;
    }

    console.log(`\n3. Test d'assignation du lead ${testLead.id} (${testLead.prenom} ${testLead.nom}) à ${testConseiller.nomComplet}...`);
    
    // Effectuer l'assignation avec authentification
    try {
      const assignResponse = await axios.post(`${BASE_URL}/leads/${testLead.id}/assign`, {
        conseiller_id: testConseiller.id
      }, { headers });
      
      console.log('✅ Assignation réussie !');
      console.log('📊 Réponse:', assignResponse.data);
      
    } catch (assignError) {
      console.log('❌ Erreur lors de l\'assignation:');
      if (assignError.response) {
        console.log(`   Status: ${assignError.response.status}`);
        console.log(`   Message: ${assignError.response.data.message}`);
        console.log(`   Détails:`, assignError.response.data);
      } else {
        console.log(`   Erreur: ${assignError.message}`);
      }
    }

    // 4. Vérifier l'état après assignation
    console.log('\n4. Vérification de l\'état après assignation...');
    try {
      const updatedLeadsResponse = await axios.get(`${BASE_URL}/leads`, { headers });
      const updatedLeads = updatedLeadsResponse.data.data.leads || updatedLeadsResponse.data.data;
      const updatedLead = updatedLeads.find(l => l.id === testLead.id);
      
      if (updatedLead) {
        console.log(`✅ Lead mis à jour:`);
        console.log(`   - conseiller_id: ${updatedLead.conseiller_id}`);
        console.log(`   - conseillere: "${updatedLead.conseillere}"`);
        console.log(`   - Statut: ${updatedLead.statut}`);
      } else {
        console.log('⚠️ Lead non trouvé après mise à jour');
      }
    } catch (error) {
      console.log('❌ Erreur lors de la vérification:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testAssignationLeads(); 