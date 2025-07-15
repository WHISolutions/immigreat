// Test simple de l'API clients
import clientsAPI from './clientsAPI.js';

async function testAPI() {
    try {
        console.log('🧪 Test de l\'API clients...');
        const result = await clientsAPI.getAllClients();
        console.log('✅ Résultat:', result);
        console.log('📊 Nombre de clients:', result.data?.clients?.length || 0);
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

testAPI();
