// 🔍 SCRIPT DEBUG FINAL - Consultations
// Coller dans la console F12 du navigateur pour debug final

async function debugConsultationsFinal() {
  console.log('🔍 === DEBUG CONSULTATIONS FINAL ===');
  
  // 1. Vérifier localStorage
  console.log('\n1️⃣ État localStorage:');
  console.log('  - userId:', localStorage.getItem('userId'));
  console.log('  - userName:', localStorage.getItem('userName'));
  console.log('  - role:', localStorage.getItem('role'));
  
  // 2. Vérifier si l'utilisateur est dans la liste des conseillers
  console.log('\n2️⃣ Vérification dans la liste des conseillers:');
  try {
    const response = await fetch('http://localhost:5000/api/users/conseillers', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const conseillers = await response.json();
    console.log('Conseillers disponibles:', conseillers);
    
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId) {
      const conseiller = conseillers.data?.find(c => c.id === parseInt(userId));
      console.log('Conseiller trouvé par ID:', conseiller);
    }
    
    if (userName) {
      const conseillerByName = conseillers.data?.find(c => 
        c.nomComplet?.toLowerCase().includes(userName.toLowerCase()) ||
        userName.toLowerCase().includes(c.nomComplet?.toLowerCase())
      );
      console.log('Conseiller trouvé par nom:', conseillerByName);
    }
  } catch (error) {
    console.error('Erreur vérification conseillers:', error);
  }
  
  // 3. Tester création d'une consultation
  console.log('\n3️⃣ Test création consultation:');
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn('❌ Pas de userId - impossible de créer une consultation');
      return;
    }
    
    const testResponse = await fetch('http://localhost:5000/api/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        lead_id: 1, // ID de test - ajuster selon vos données
        conseiller_id: parseInt(userId),
        notes: 'Test de création de consultation'
      })
    });
    
    const consultationResult = await testResponse.json();
    console.log('Résultat création consultation:', consultationResult);
    
    if (consultationResult.success) {
      console.log('✅ Consultation créée avec succès');
      
      // 4. Vérifier les stats après création
      console.log('\n4️⃣ Vérification stats après création:');
      const statsResponse = await fetch(`http://localhost:5000/api/stats/consultations/conseiller/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const stats = await statsResponse.json();
      console.log('Stats du conseiller:', stats);
    }
  } catch (error) {
    console.error('Erreur test consultation:', error);
  }
  
  // 5. Vérifier l'API du dashboard
  console.log('\n5️⃣ Test API dashboard consultations:');
  try {
    const dashResponse = await fetch('http://localhost:5000/api/dashboard/consultations?periode=mois', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const dashData = await dashResponse.json();
    console.log('Données dashboard consultations:', dashData);
  } catch (error) {
    console.error('Erreur API dashboard:', error);
  }
  
  console.log('\n🎯 DEBUG TERMINÉ - Vérifiez les résultats ci-dessus');
}

// Exposer la fonction et l'exécuter
window.debugConsultationsFinal = debugConsultationsFinal;
debugConsultationsFinal();
