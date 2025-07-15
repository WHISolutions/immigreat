const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testLeadUpdate() {
  console.log('🧪 TEST DE MISE À JOUR DE LEAD');
  console.log('='.repeat(40));

  try {
    // 1. Connexion administrateur
    console.log('1. Connexion administrateur...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@immigration.ca',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec de la connexion admin');
      return;
    }

    const adminToken = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${adminToken}` };
    console.log('✅ Connexion réussie');

    // 2. Récupérer les leads
    console.log('\n2. Récupération des leads...');
    const leadsResponse = await axios.get(`${BASE_URL}/leads`, { headers });
    
    if (!leadsResponse.data.success || leadsResponse.data.data.leads.length === 0) {
      console.log('❌ Aucun lead trouvé pour tester');
      return;
    }

    const testLead = leadsResponse.data.data.leads[0];
    console.log(`✅ Lead de test: ${testLead.prenom} ${testLead.nom} (ID: ${testLead.id})`);

    // 3. Test de mise à jour simple
    console.log('\n3. Test de mise à jour...');
    const updateData = {
      notes: `Notes mises à jour - ${new Date().toISOString()}`
    };

    const updateResponse = await axios.put(`${BASE_URL}/leads/${testLead.id}`, updateData, { headers });

    if (updateResponse.data.success) {
      console.log('✅ Mise à jour réussie !');
      console.log('📊 Réponse:', updateResponse.data.message);
    } else {
      console.log('❌ Échec de la mise à jour');
      console.log('Réponse:', updateResponse.data);
    }

    // 4. Test de réassignation (si possible)
    console.log('\n4. Test de réassignation...');
    const conseilleresResponse = await axios.get(`${BASE_URL}/users`, { headers });
    const conseillers = conseilleresResponse.data.data.filter(u => u.role === 'conseillere');

    if (conseillers.length > 0) {
      const nouveauConseiller = conseillers[0];
      const reassignData = {
        conseillere: `${nouveauConseiller.prenom} ${nouveauConseiller.nom}`
      };

      console.log(`   Réassignation à: ${reassignData.conseillere}`);
      
      const reassignResponse = await axios.put(`${BASE_URL}/leads/${testLead.id}`, reassignData, { headers });

      if (reassignResponse.data.success) {
        console.log('✅ Réassignation réussie !');
        console.log('📊 Réponse:', reassignResponse.data.message);
      } else {
        console.log('❌ Échec de la réassignation');
        console.log('Réponse:', reassignResponse.data);
      }
    } else {
      console.log('⚠️ Aucun conseiller trouvé pour tester la réassignation');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Données:', error.response.data);
    }
  }
}

// Exécuter le test
testLeadUpdate();
