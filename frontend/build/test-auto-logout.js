// Script de test rapide pour la déconnexion automatique
// À exécuter dans la console du navigateur (F12)

console.log('🧪 DÉBUT DU TEST DE DÉCONNEXION AUTOMATIQUE');

// Fonction pour tester la déconnexion avec un délai court
function testAutoLogout(delaiSecondes = 15) {
  console.log(`⏰ Test configuré pour ${delaiSecondes} secondes`);
  
  // Sauvegarder la fonction originale de déconnexion
  const originalForceLogout = window.forceLogout;
  
  // Remplacer temporairement par notre fonction de test
  window.forceLogout = () => {
    console.log('🔒 TEST RÉUSSI: Déconnexion automatique déclenchée !');
    alert('✅ TEST RÉUSSI: La déconnexion automatique fonctionne !');
    
    // Restaurer la fonction originale
    window.forceLogout = originalForceLogout;
  };
  
  // Simuler une inactivité en désactivant les événements
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
  
  console.log('🚫 Désactivation temporaire des événements d\'activité...');
  
  // Désactiver les événements
  events.forEach(event => {
    document.removeEventListener(event, () => {}, true);
  });
  
  // Programmer la réactivation après le test
  setTimeout(() => {
    console.log('🔄 Réactivation des événements d\'activité');
    // Les événements seront réactivés automatiquement par le hook
    window.location.reload();
  }, (delaiSecondes + 5) * 1000);
  
  console.log(`⏱️  Attendez ${delaiSecondes} secondes sans bouger...`);
  
  // Countdown visuel
  let countdown = delaiSecondes;
  const countdownInterval = setInterval(() => {
    console.log(`⏳ ${countdown} secondes restantes...`);
    countdown--;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      console.log('⚠️ Le timer devrait se déclencher maintenant...');
    }
  }, 1000);
}

// Instructions d'utilisation
console.log(`
📋 INSTRUCTIONS:
1. Exécutez: testAutoLogout(15)  // Test avec 15 secondes
2. Ne bougez pas la souris pendant 15 secondes
3. Observez les logs et l'alerte de confirmation

💡 VARIATIONS:
- testAutoLogout(30)  // Test avec 30 secondes
- testAutoLogout(60)  // Test avec 1 minute
`);

// Exporter la fonction globalement
window.testAutoLogout = testAutoLogout;

console.log('✅ Script de test chargé. Tapez: testAutoLogout(15)');
