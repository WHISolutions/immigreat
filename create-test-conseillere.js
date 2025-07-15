// Créer une conseillère de test
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function createTestConseillere() {
    try {
        console.log('🔄 Connexion admin pour créer une conseillère...');
        
        // 1. Se connecter en tant qu'admin
        const adminLogin = await axios.post(`${BASE_URL}/users/login`, {
            email: 'admin@immigration.ca',
            mot_de_passe: 'admin123'
        });
        
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin connecté');
        
        // 2. Créer une nouvelle conseillère
        const newConseillere = {
            nom: 'Test',
            prenom: 'Conseillere',
            email: 'test.conseillere@example.com',
            telephone: '0123456789',
            role: 'conseillere',
            mot_de_passe: 'test123'
        };
        
        console.log('🔄 Création de la conseillère test...');
        const createResponse = await axios.post(`${BASE_URL}/users`, newConseillere, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        console.log('✅ Conseillère créée:', createResponse.data);
        
        // 3. Tester la connexion avec cette conseillère
        console.log('🔄 Test de connexion de la nouvelle conseillère...');
        const conseillerLogin = await axios.post(`${BASE_URL}/users/login`, {
            email: 'test.conseillere@example.com',
            mot_de_passe: 'test123'
        });
        
        console.log('✅ Conseillère connectée:', conseillerLogin.data);
        
        // 4. Tester l'accès aux clients
        const conseillerToken = conseillerLogin.data.token;
        const clientsResponse = await axios.get(`${BASE_URL}/clients`, {
            headers: {
                'Authorization': `Bearer ${conseillerToken}`
            }
        });
        
        console.log('✅ Accès clients par conseillère réussi:', clientsResponse.data);
        console.log('📊 Nombre de clients visibles:', clientsResponse.data.data?.count || 0);
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

createTestConseillere();
