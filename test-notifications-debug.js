// Script de diagnostic pour les notifications en temps réel
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Configuration pour les tests
const testConfig = {
  adminCredentials: {
    email: 'admin@immigration.ca', // ou votre email admin
    password: 'admin123' // ou votre mot de passe admin
  },
  conseillerCredentials: {
    email: '', // Email de la conseillère qui doit recevoir la notification
    password: '' // Mot de passe
  }
};

let adminToken = '';
let conseillerId = '';

async function runDiagnostic() {
  console.log('🔍 Début du diagnostic des notifications...\n');

  try {
    // 1. Connexion admin
    console.log('1️⃣ Connexion administrateur...');
    const adminLogin = await axios.post(`${API_BASE}/users/login`, testConfig.adminCredentials);
    
    if (adminLogin.data.success) {
      adminToken = adminLogin.data.token;
      console.log('✅ Admin connecté avec succès');
    } else {
      console.log('❌ Échec connexion admin:', adminLogin.data.message);
      return;
    }

    // 2. Récupérer la liste des conseillers
    console.log('\n2️⃣ Récupération des conseillers...');
    const conseillers = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const conseillersList = conseillers.data.data.filter(user => user.role === 'conseillere');
    console.log(`✅ ${conseillersList.length} conseiller(s) trouvé(s):`);
    
    conseillersList.forEach((c, index) => {
      console.log(`   ${index + 1}. ${c.prenom} ${c.nom} (ID: ${c.id})`);
    });

    if (conseillersList.length === 0) {
      console.log('❌ Aucun conseiller trouvé. Impossible de continuer le test.');
      return;
    }

    conseillerId = conseillersList[0].id;
    console.log(`\n🎯 Utilisation du conseiller: ${conseillersList[0].prenom} ${conseillersList[0].nom} (ID: ${conseillerId})`);

    // 3. Vérifier les leads existants
    console.log('\n3️⃣ Vérification des leads existants...');
    const leads = await axios.get(`${API_BASE}/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const availableLeads = leads.data.data.leads.filter(lead => !lead.conseiller_id);
    console.log(`✅ ${availableLeads.length} lead(s) non assigné(s) trouvé(s)`);

    if (availableLeads.length === 0) {
      console.log('⚠️ Création d\'un lead de test...');
      
      const newLead = await axios.post(`${API_BASE}/leads`, {
        nom: 'Test',
        prenom: 'Notification',
        email: `test-notif-${Date.now()}@example.com`,
        telephone: '+1234567890',
        source: 'Test',
        interet: 'Permis d\'étude',
        notes: 'Lead créé pour tester les notifications'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (newLead.data.success) {
        availableLeads.push(newLead.data.data);
        console.log('✅ Lead de test créé');
      } else {
        console.log('❌ Échec création du lead de test');
        return;
      }
    }

    const leadToAssign = availableLeads[0];
    console.log(`\n🎯 Lead à assigner: ${leadToAssign.prenom} ${leadToAssign.nom} (ID: ${leadToAssign.id})`);

    // 4. Test d'assignation avec notification
    console.log('\n4️⃣ Test d\'assignation avec notification...');
    
    console.log('   📡 Envoi de la requête d\'assignation...');
    const assignmentResult = await axios.post(`${API_BASE}/leads/${leadToAssign.id}/assign`, {
      conseiller_id: conseillerId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (assignmentResult.data.success) {
      console.log('✅ Lead assigné avec succès');
      console.log('   🔍 Vérification de la notification dans la base...');
      
      // 5. Vérifier si la notification a été créée
      setTimeout(async () => {
        try {
          const notifications = await axios.get(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });

          const recentNotifications = notifications.data.data.notifications.filter(n => 
            n.type === 'lead_assigned' && 
            n.utilisateur_id === conseillerId &&
            new Date(n.date_creation) > new Date(Date.now() - 60000) // Dernière minute
          );

          if (recentNotifications.length > 0) {
            console.log('✅ Notification créée en base de données:');
            recentNotifications.forEach(notif => {
              console.log(`   📱 ${notif.titre}: ${notif.message}`);
              console.log(`   📅 Créée: ${notif.date_creation}`);
              console.log(`   👤 Pour utilisateur: ${notif.utilisateur_id}`);
            });
          } else {
            console.log('❌ Aucune notification trouvée en base de données');
            console.log('   🔍 Toutes les notifications récentes:');
            
            const allRecent = notifications.data.data.notifications.filter(n => 
              new Date(n.date_creation) > new Date(Date.now() - 300000) // 5 dernières minutes
            );
            
            allRecent.forEach(notif => {
              console.log(`   📱 ${notif.titre} (${notif.type}) pour user ${notif.utilisateur_id}`);
            });
          }

          // 6. Test de récupération des notifications non lues
          console.log('\n5️⃣ Test de récupération des notifications non lues...');
          const unreadCount = await axios.get(`${API_BASE}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });

          console.log(`✅ Nombre de notifications non lues: ${unreadCount.data.data.unreadCount}`);

        } catch (error) {
          console.log('❌ Erreur lors de la vérification:', error.response?.data?.message || error.message);
        }
      }, 2000); // Attendre 2 secondes

    } else {
      console.log('❌ Échec de l\'assignation:', assignmentResult.data.message);
    }

  } catch (error) {
    console.log('❌ Erreur pendant le diagnostic:', error.response?.data?.message || error.message);
    console.log('   Stack:', error.stack);
  }
}

// Instructions
console.log('🧪 DIAGNOSTIC DES NOTIFICATIONS EN TEMPS RÉEL');
console.log('='.repeat(50));
console.log('Ce script va tester:');
console.log('1. Connexion administrateur');
console.log('2. Récupération des conseillers');
console.log('3. Assignation d\'un lead');
console.log('4. Vérification de la création de notification');
console.log('5. Test des API de notifications\n');

console.log('⚠️ IMPORTANT: Assurez-vous que le serveur backend est démarré sur http://localhost:5000\n');

// Démarrer le diagnostic
runDiagnostic().then(() => {
  console.log('\n🏁 Diagnostic terminé');
}).catch(error => {
  console.log('💥 Erreur fatale:', error.message);
});