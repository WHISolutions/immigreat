/**
 * Script de diagnostic pour les consultations
 * Aide à identifier pourquoi le nombre de consultations reste à 0
 */

console.log('🔍 === DIAGNOSTIC CONSULTATIONS ===');

// 1. Vérifier les données localStorage
console.log('\n1️⃣ Données localStorage:');
console.log('  - token:', localStorage.getItem('token')?.substring(0, 20) + '...');
console.log('  - userId:', localStorage.getItem('userId'));
console.log('  - userName:', localStorage.getItem('userName'));
console.log('  - userRole:', localStorage.getItem('userRole'));

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
    console.log('📡 Réponse API:', data);
    
    if (data.success) {
      console.log('✅ Consultation créée avec succès');
      
      // Vérifier le nombre de consultations
      const consultationsResponse = await fetch(`http://localhost:5000/api/consultations/lead/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const consultationsData = await consultationsResponse.json();
      console.log('📊 Consultations du lead:', consultationsData);
    } else {
      console.log('❌ Erreur lors de la création:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
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

// 4. Exécuter les tests
async function runDiagnostic() {
  await checkConseillers();
  await testConsultationCreation();
  
  console.log('\n✅ Diagnostic terminé');
  console.log('💡 Si le userId est null, le problème vient de la connexion');
  console.log('💡 Si la création échoue, vérifier l\'API des consultations');
}

// Exposer les fonctions pour les tests manuels
window.diagnosticConsultations = {
  runDiagnostic,
  testConsultationCreation,
  checkConseillers
};

console.log('💡 Utilisez window.diagnosticConsultations.runDiagnostic() pour lancer le diagnostic complet');
