const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Configuration pour les tests
let adminToken = '';
let adminUser = null;

async function testReassignationLeads() {
  console.log('🧪 TEST DE RÉASSIGNATION AVEC NOTIFICATIONS');
  console.log('='.repeat(50));

  try {
    // 1. Connexion administrateur
    console.log('1. Connexion administrateur...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@immigration.ca', // Ajustez selon votre configuration
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Échec de la connexion admin');
      console.log('Réponse:', loginResponse.data);
      return;
    }

    adminToken = loginResponse.data.token;
    adminUser = loginResponse.data.user;
    console.log(`✅ Connecté en tant qu'admin: ${adminUser.prenom} ${adminUser.nom}`);

    const headers = { Authorization: `Bearer ${adminToken}` };

    // 2. Récupérer les conseillers
    console.log('\n2. Récupération des conseillers...');
    const conseillersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    
    if (!conseillersResponse.data.success) {
      console.log('❌ Erreur lors de la récupération des conseillers');
      return;
    }

    const conseillers = conseillersResponse.data.data.filter(u => u.role === 'conseillere');
    console.log(`✅ ${conseillers.length} conseillers trouvés:`);
    conseillers.forEach(c => {
      console.log(`   - ${c.prenom} ${c.nom} (ID: ${c.id})`);
    });

    if (conseillers.length < 2) {
      console.log('❌ Il faut au moins 2 conseillers pour tester la réassignation');
      return;
    }

    // 3. Récupérer les leads
    console.log('\n3. Récupération des leads...');
    const leadsResponse = await axios.get(`${BASE_URL}/leads`, { headers });
    
    if (!leadsResponse.data.success) {
      console.log('❌ Erreur lors de la récupération des leads');
      return;
    }

    const leads = leadsResponse.data.data.leads || leadsResponse.data.data;
    const assignedLeads = leads.filter(lead => lead.conseiller_id);
    
    console.log(`✅ ${leads.length} leads totaux, ${assignedLeads.length} assignés`);

    if (assignedLeads.length === 0) {
      console.log('⚠️ Aucun lead assigné trouvé. Création d\'un lead de test...');
      
      // Créer un lead de test et l'assigner
      const testLeadResponse = await axios.post(`${BASE_URL}/leads`, {
        nom: 'Test',
        prenom: 'Réassignation',
        email: 'test.reassignation@example.com',
        telephone: '+1234567890',
        source: 'Test',
        interet: 'Permis d\'études'
      }, { headers });

      if (testLeadResponse.data.success) {
        const testLead = testLeadResponse.data.data;
        console.log(`✅ Lead de test créé: ${testLead.id}`);
        
        // Assigner le lead au premier conseiller
        await axios.post(`${BASE_URL}/leads/${testLead.id}/assign`, {
          conseiller_id: conseillers[0].id
        }, { headers });
        
        console.log(`✅ Lead assigné à ${conseillers[0].prenom} ${conseillers[0].nom}`);
        assignedLeads.push({ ...testLead, conseiller_id: conseillers[0].id });
      }
    }

    // 4. Test de réassignation
    const leadToReassign = assignedLeads[0];
    const currentConseillerId = leadToReassign.conseiller_id;
    const newConseiller = conseillers.find(c => c.id !== currentConseillerId);

    if (!newConseiller) {
      console.log('❌ Impossible de trouver un conseiller différent pour la réassignation');
      return;
    }

    console.log(`\n4. Test de réassignation...`);
    console.log(`   Lead: ${leadToReassign.prenom} ${leadToReassign.nom} (ID: ${leadToReassign.id})`);
    console.log(`   De: Conseiller ID ${currentConseillerId}`);
    console.log(`   Vers: ${newConseiller.prenom} ${newConseiller.nom} (ID: ${newConseiller.id})`);

    // Réassigner le lead
    const reassignResponse = await axios.post(`${BASE_URL}/leads/${leadToReassign.id}/assign`, {
      conseiller_id: newConseiller.id
    }, { headers });

    if (reassignResponse.data.success) {
      console.log('✅ Réassignation réussie !');
      console.log('📊 Réponse:', reassignResponse.data);
      
      // 5. Vérifier les notifications créées
      console.log('\n5. Vérification des notifications...');
      
      setTimeout(async () => {
        try {
          const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
            headers
          });

          if (notificationsResponse.data.success) {
            const notifications = notificationsResponse.data.data.notifications;
            const recentNotifications = notifications.filter(n => 
              n.type === 'lead_assigned' && 
              n.utilisateur_id === newConseiller.id &&
              new Date(n.date_creation) > new Date(Date.now() - 60000) // Dernière minute
            );

            console.log(`📱 ${recentNotifications.length} notifications récentes trouvées:`);
            recentNotifications.forEach(notif => {
              console.log(`   - ${notif.titre}: ${notif.message}`);
              console.log(`     Pour: ${newConseiller.prenom} ${newConseiller.nom}`);
              console.log(`     Créée: ${notif.date_creation}`);
              console.log(`     Lue: ${notif.lue ? 'Oui' : 'Non'}`);
            });

            if (recentNotifications.length > 0) {
              console.log('\n🎉 TEST RÉUSSI !');
              console.log('✅ Lead réassigné avec succès');
              console.log('✅ Notification créée et sauvegardée en base');
              console.log('✅ Notification envoyée à la nouvelle conseillère');
            } else {
              console.log('\n❌ ÉCHEC: Aucune notification trouvée pour la nouvelle conseillère');
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la vérification des notifications:', error.message);
        }
      }, 2000); // Attendre 2 secondes pour laisser le temps à la notification d'être créée

    } else {
      console.log('❌ Échec de la réassignation');
      console.log('Réponse:', reassignResponse.data);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Données:', error.response.data);
    }
  }
}

// Instructions
console.log('📋 Ce script va tester la réassignation de leads avec notifications');
console.log('🔧 Assurez-vous que:');
console.log('   - Le backend est démarré (npm run dev dans /backend)');
console.log('   - Il y a au moins 2 conseillers en base');
console.log('   - L\'email/mot de passe admin est correct');
console.log('');

// Exécuter le test
testReassignationLeads();
