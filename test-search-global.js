// Script de test pour la fonctionnalité de recherche globale
const API_BASE_URL = 'http://localhost:5000/api';

// Test de la recherche globale
async function testGlobalSearch() {
  console.log('🧪 Test de la recherche globale...');
  
  try {
    // Test sans authentification (devrait être limité mais fonctionner)
    const response = await fetch(`${API_BASE_URL}/search/global?query=marie`);
    const data = await response.json();
    
    console.log('✅ Réponse API:', data);
    
    if (data.success) {
      console.log(`📊 Total des résultats: ${data.total}`);
      console.log(`🎯 Leads: ${data.data.leads?.length || 0}`);
      console.log(`👤 Clients: ${data.data.clients?.length || 0}`);
      console.log(`📁 Dossiers: ${data.data.dossiers?.length || 0}`);
      console.log(`💰 Factures: ${data.data.factures?.length || 0}`);
      console.log(`👩‍💼 Conseillers: ${data.data.conseillers?.length || 0}`);
    } else {
      console.error('❌ Erreur:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
}

// Test de l'auto-complétion
async function testAutocomplete() {
  console.log('🧪 Test de l\'auto-complétion...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/autocomplete?query=ma`);
    const data = await response.json();
    
    console.log('✅ Réponse autocomplete:', data);
    
    if (data.success) {
      console.log(`💡 Suggestions: ${data.suggestions.length}`);
      data.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion.text} (${suggestion.type})`);
      });
    } else {
      console.error('❌ Erreur:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
}

// Test avec authentification
async function testWithAuth(token) {
  console.log('🧪 Test avec authentification...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/search/global?query=test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    console.log('✅ Réponse avec auth:', data);
  } catch (error) {
    console.error('❌ Erreur avec auth:', error);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de recherche globale\n');
  
  await testGlobalSearch();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testAutocomplete();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test avec token si disponible
  const token = prompt('Token d\'authentification (optionnel):');
  if (token && token.trim()) {
    await testWithAuth(token.trim());
  }
  
  console.log('\n✅ Tests terminés');
}

// Fonction pour tester depuis la console du navigateur
window.testGlobalSearch = {
  runAll: runTests,
  searchOnly: testGlobalSearch,
  autocompleteOnly: testAutocomplete,
  withAuth: testWithAuth
};

console.log('🔧 Tests de recherche globale chargés');
console.log('Utilisez: testGlobalSearch.runAll() pour tous les tests');
console.log('Ou: testGlobalSearch.searchOnly() pour la recherche uniquement');

// Auto-exécution si ce script est chargé directement
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  runTests();
}
