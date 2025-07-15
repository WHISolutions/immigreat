/**
 * Script de test pour les activités récentes avec authentification
 */

const http = require('http');

// Fonction pour faire une requête HTTP avec token
function testActivitesRecentes(token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/activites-recentes?limit=5',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Ajouter le token si fourni
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testerActivitesAvecAuth() {
  console.log('🧪 Test des activités récentes avec authentification\n');

  try {
    // 1. Test sans token
    console.log('1. Test sans authentification:');
    const sansAuth = await testActivitesRecentes();
    console.log(`   Status: ${sansAuth.status}`);
    console.log(`   Message: ${sansAuth.data.message || sansAuth.data}`);
    
    if (sansAuth.status === 401) {
      console.log('   ✅ Authentification correctement requise\n');
    } else {
      console.log('   ❌ Problème: authentification non requise\n');
    }

    // 2. Simuler une connexion pour obtenir un token
    console.log('2. Tentative de connexion pour obtenir un token:');
    console.log('   📝 Pour tester avec un vrai token, vous devez:');
    console.log('   1. Vous connecter via l\'interface web');
    console.log('   2. Ouvrir les outils de développeur (F12)');
    console.log('   3. Aller dans Application > Local Storage > token');
    console.log('   4. Copier la valeur du token');
    console.log('   5. Modifier ce script pour inclure le token\n');

    // Exemple avec un token fictif (pour montrer le format)
    console.log('3. Format de test avec token (exemple):');
    const avecTokenFictif = await testActivitesRecentes('token_fictif_exemple');
    console.log(`   Status: ${avecTokenFictif.status}`);
    console.log(`   Message: ${avecTokenFictif.data.message || 'Token invalide (normal)'}}`);
    
    if (avecTokenFictif.status === 401 || avecTokenFictif.status === 403) {
      console.log('   ✅ Validation du token fonctionne\n');
    }

    console.log('✅ Tests terminés!');
    console.log('\n💡 Instructions pour tester avec votre compte:');
    console.log('   1. Ouvrez http://localhost:3001 (ou le port affiché par le frontend)');
    console.log('   2. Connectez-vous avec votre compte admin ou conseillère');
    console.log('   3. Allez dans le dashboard');
    console.log('   4. Vérifiez la section "Mes Activités Récentes"');
    console.log('   5. Vous devriez voir les leads créés récemment apparaître');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  testerActivitesAvecAuth();
}

module.exports = { testActivitesRecentes };
