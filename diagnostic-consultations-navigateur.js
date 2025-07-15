// 🧪 SCRIPT DIAGNOSTIC CONSULTATIONS - Pour Console Navigateur
// Copier-coller ce code dans la console du navigateur (F12)

console.log('🔍 === DIAGNOSTIC CONSULTATIONS - VERSION NAVIGATEUR ===');

// 1. Vérifier localStorage
console.log('\n1️⃣ Données localStorage:');
console.log('  - token:', localStorage.getItem('token')?.substring(0, 20) + '...');
console.log('  - userName:', localStorage.getItem('userName'));
console.log('  - userId:', localStorage.getItem('userId'));
console.log('  - role:', localStorage.getItem('role'));

// 2. Fonction pour tester la création de consultation
async function testConsultationCreation() {
  try {
    const leadId = 1; // Remplacer par un ID de lead existant
    const conseillerId = parseInt(localStorage.getItem('userId'));
    
    if (!conseillerId) {
      console.log('❌ Aucun userId trouvé dans localStorage');
      return;
    }
    
    console.log(`\n2️⃣ Test création consultation - Lead: ${leadId}, Conseiller: ${conseillerId}`);
    
    const response = await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        lead_id: leadId,
        conseiller_id: conseillerId,
        notes: 'Test de création automatique'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Consultation créée avec succès:', data);
    } else {
      console.log('❌ Erreur lors de la création:', data);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de création:', error);
  }
}

// 3. Fonction pour vérifier les conseillers
async function checkConseillers() {
  try {
    console.log('\n3️⃣ Vérification des conseillers...');
    
    const response = await fetch('http://localhost:5000/api/users/conseillers', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    console.log('👥 Conseillers disponibles:', data);
    
    const currentUserId = parseInt(localStorage.getItem('userId'));
    const currentUser = data.data?.find(c => c.id === currentUserId);
    console.log('👤 Utilisateur connecté trouvé:', currentUser);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des conseillers:', error);
  }
}

// 4. Fonction pour vérifier les consultations d'un lead
async function checkLeadConsultations(leadId = 1) {
  try {
    console.log(`\n4️⃣ Vérification des consultations du lead ${leadId}...`);
    
    const response = await fetch(`http://localhost:5000/api/consultations/lead/${leadId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    console.log('📋 Consultations du lead:', data);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des consultations:', error);
  }
}

// 5. Exécution automatique des tests
async function runAllTests() {
  try {
    await checkConseillers();
    await testConsultationCreation();
    await checkLeadConsultations();
    
    console.log('\n🎯 Tests terminés ! Si des erreurs persistent :');
    console.log('1. Vérifiez que vous êtes connecté');
    console.log('2. Vérifiez que le backend fonctionne');
    console.log('3. Changez le statut d\'un lead vers "Consultation effectuée"');
    console.log('4. Vérifiez les logs dans la console lors de la sauvegarde');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Instructions
console.log('\n💡 INSTRUCTIONS :');
console.log('1. Pour lancer tous les tests : runAllTests()');
console.log('2. Pour tester une création de consultation : testConsultationCreation()');
console.log('3. Pour voir les conseillers : checkConseillers()');
console.log('4. Pour voir les consultations d\'un lead : checkLeadConsultations(ID_DU_LEAD)');

console.log('\n🚀 Lancement automatique dans 3 secondes...');
setTimeout(runAllTests, 3000);
