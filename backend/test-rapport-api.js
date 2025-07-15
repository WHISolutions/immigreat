const axios = require('axios');

async function testRapportAPI() {
  try {
    console.log('🧪 Test de l\'API de rapports...');
    
    // Test avec un client existant (ID 1 par exemple)
    const clientId = 1;
    const url = `http://localhost:5000/api/rapports/client/${clientId}/rapport-donnees`;
    
    console.log(`📍 URL testée: ${url}`);
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      console.log('✅ API fonctionne !');
      console.log('📊 Données récupérées:');
      console.log('   - Client:', response.data.data.client.prenom, response.data.data.client.nom);
      console.log('   - Progression:', response.data.data.progression.pourcentage + '%');
      console.log('   - Documents:', response.data.data.documents.total);
      console.log('   - Rendez-vous:', response.data.data.rendez_vous.total);
      console.log('   - Factures:', response.data.data.finances.liste_factures.length);
      console.log('   - Actions requises:', response.data.data.actions_requises.length);
      console.log('   - Étapes:', response.data.data.progression.etapes.length);
    } else {
      console.log('❌ API retourne une erreur:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur HTTP:', error.response.status);
      console.log('💬 Message:', error.response.data.message || error.response.data);
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

testRapportAPI();
