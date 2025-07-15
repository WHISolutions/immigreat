// Script pour corriger les mots de passe des conseillères
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function fixConseilleresPasswords() {
    try {
        console.log('🔄 Connexion admin...');
        
        // 1. Se connecter en tant qu'admin
        const adminLogin = await axios.post(`${BASE_URL}/users/login`, {
            email: 'admin@immigration.ca',
            mot_de_passe: 'admin123'
        });
        
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin connecté');
        
        // 2. Récupérer toutes les conseillères
        const conseillers = await axios.get(`${BASE_URL}/users/conseillers`);
        const conseilleres = conseillers.data.data.filter(c => c.role === 'conseillere');
        
        console.log(`📋 ${conseilleres.length} conseillères trouvées:`, conseilleres.map(c => c.email));
        
        // 3. Corriger le mot de passe pour chaque conseillère
        for (const conseillere of conseilleres) {
            try {
                console.log(`🔧 Correction du mot de passe pour ${conseillere.email}...`);
                
                // Utiliser l'endpoint de modification des utilisateurs
                const updateResponse = await axios.put(`${BASE_URL}/users/${conseillere.id}`, {
                    mot_de_passe: 'conseillere123' // Mot de passe standard pour toutes
                }, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
                
                if (updateResponse.data.success) {
                    console.log(`✅ Mot de passe corrigé pour ${conseillere.email}`);
                    
                    // Tester la connexion
                    const testLogin = await axios.post(`${BASE_URL}/users/login`, {
                        email: conseillere.email,
                        mot_de_passe: 'conseillere123'
                    });
                    
                    if (testLogin.data.success) {
                        console.log(`✅ Connexion testée avec succès pour ${conseillere.email}`);
                    }
                } else {
                    console.log(`❌ Erreur lors de la correction pour ${conseillere.email}`);
                }
                
            } catch (error) {
                console.log(`❌ Erreur pour ${conseillere.email}:`, error.response?.data?.message || error.message);
            }
        }
        
        console.log('🎉 Correction terminée ! Mot de passe pour toutes les conseillères: conseillere123');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

fixConseilleresPasswords();
