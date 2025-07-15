// Test simple de mise à jour de lead via curl ou fetch API
console.log('🧪 TEST SIMPLE DE MISE À JOUR DE LEAD');

// Test avec fetch API (peut être exécuté dans la console du navigateur)
const testUpdate = async () => {
  try {
    // D'abord, obtenir le token en se connectant
    console.log('1. Test de récupération des leads...');
    
    // Supposons que vous êtes déjà connecté et avez un token
    const token = localStorage.getItem('token'); // Dans le navigateur
    
    if (!token) {
      console.log('❌ Aucun token trouvé. Connectez-vous d\'abord dans l\'application.');
      return;
    }
    
    // Récupérer la liste des leads
    const leadsResponse = await fetch('http://localhost:5000/api/leads', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!leadsResponse.ok) {
      console.log('❌ Erreur lors de la récupération des leads:', leadsResponse.status);
      return;
    }
    
    const leadsData = await leadsResponse.json();
    console.log('✅ Leads récupérés:', leadsData.data.count);
    
    if (leadsData.data.leads.length === 0) {
      console.log('❌ Aucun lead trouvé pour tester');
      return;
    }
    
    // Tester la mise à jour du premier lead
    const testLead = leadsData.data.leads[0];
    console.log(`2. Test de mise à jour du lead: ${testLead.prenom} ${testLead.nom} (ID: ${testLead.id})`);
    
    const updateData = {
      notes: `Test de mise à jour - ${new Date().toISOString()}`
    };
    
    const updateResponse = await fetch(`http://localhost:5000/api/leads/${testLead.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResponse.ok && updateResult.success) {
      console.log('✅ Mise à jour réussie !');
      console.log('📊 Résultat:', updateResult.message);
    } else {
      console.log('❌ Échec de la mise à jour');
      console.log('📊 Erreur:', updateResult);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Instructions pour l'utilisateur
console.log('📋 INSTRUCTIONS:');
console.log('1. Ouvrez votre navigateur');
console.log('2. Allez sur http://localhost:3000 (frontend)');
console.log('3. Connectez-vous à l\'application');
console.log('4. Ouvrez la console du navigateur (F12)');
console.log('5. Copiez et collez le code de la fonction testUpdate() dans la console');
console.log('6. Exécutez: testUpdate()');
console.log('');
console.log('Ou testez directement dans l\'interface en:');
console.log('- Ouvrant un lead');
console.log('- Modifiant un champ (ex: notes)');
console.log('- Sauvegardant');
console.log('');
console.log('Si l\'erreur "Cannot read properties of undefined (reading \'or\')" n\'apparaît plus,');
console.log('alors la correction est réussie ! 🎉');

// Export pour Node.js si nécessaire
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testUpdate };
}
