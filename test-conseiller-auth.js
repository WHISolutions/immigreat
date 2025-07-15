// Test de connexion d'une conseillère
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testConseillerAuth() {
    try {
        console.log('🔄 Test de connexion conseillère...');
        
        // Essayer plusieurs mots de passe possibles
        const motsDePasse = ['password123', 'password', '123456', 'secret', 'hamza123', 'admin'];
        let loginSuccess = false;
        let token = null;
        
        for (const mdp of motsDePasse) {
            try {
                console.log(`🔑 Tentative avec mot de passe: ${mdp}`);
                const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
                    email: 'hamza@example.com',
                    mot_de_passe: mdp
                });
                
                if (loginResponse.data.success) {
                    console.log('✅ Connexion réussie:', loginResponse.data);
                    token = loginResponse.data.data.token;
                    loginSuccess = true;
                    break;
                }
            } catch (error) {
                console.log(`❌ Échec avec ${mdp}:`, error.response?.data?.message || error.message);
            }
        }
        
        if (!loginSuccess) {
            console.log('❌ Aucun mot de passe ne fonctionne');
            return;
        }
        
        console.log('🔑 Token reçu:', token.substring(0, 20) + '...');
        
        // 2. Tester l'accès aux clients avec ce token
        const clientsResponse = await axios.get(`${BASE_URL}/clients`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Accès clients réussi:', clientsResponse.data);
        console.log('📊 Nombre de clients:', clientsResponse.data.data?.count || 0);
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testConseillerAuth();
