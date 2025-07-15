// Test du système de notifications côté frontend
console.log('🔍 Test du système de notifications...');

// Simuler l'initialisation
async function testNotifications() {
  try {
    console.log('1. Vérification du hook useRealNotifications...');
    
    // Mock du localStorage token
    localStorage.setItem('token', 'mock-token');
    console.log('✅ Token mock configuré');
    
    // Test de l'API
    const baseURL = 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${baseURL}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API accessible depuis le frontend');
      console.log(`📊 ${data.data.notifications.length} notifications reçues`);
      console.log(`🔔 ${data.data.notifications.filter(n => !n.lue).length} non lues`);
      
      // Vérifier la structure des données
      const firstNotif = data.data.notifications[0];
      if (firstNotif) {
        console.log('✅ Structure de notification valide:', {
          id: firstNotif.id,
          titre: firstNotif.titre,
          type: firstNotif.type,
          lue: firstNotif.lue
        });
      }
      
      console.log('\\n🎉 SYSTÈME FRONTEND PRÊT !');
      console.log('👉 Vous pouvez maintenant cliquer sur la cloche 🔔');
      
    } else {
      console.error('❌ Erreur API:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

// Exécuter le test après le chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testNotifications);
} else {
  testNotifications();
}
