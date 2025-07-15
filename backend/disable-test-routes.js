const fs = require('fs');
const path = require('path');

function disableTestRoutes() {
  const serverPath = path.join(__dirname, 'server.js');
  
  try {
    // Lire le fichier server.js
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    console.log('🔧 Désactivation des routes de test dans server.js...\n');
    
    // Commentez les lignes liées aux routes de test
    const modifications = [
      {
        search: "const testUsersRoutes = require('./routes/test-users');",
        replace: "// const testUsersRoutes = require('./routes/test-users'); // Désactivé en production",
        description: "Import des routes de test"
      },
      {
        search: "app.use('/api/test-users', testUsersRoutes);",
        replace: "// app.use('/api/test-users', testUsersRoutes); // Désactivé en production",
        description: "Utilisation des routes de test"
      }
    ];
    
    let changesCount = 0;
    
    modifications.forEach(mod => {
      if (serverContent.includes(mod.search)) {
        serverContent = serverContent.replace(mod.search, mod.replace);
        console.log(`✅ ${mod.description} - désactivé`);
        changesCount++;
      } else if (serverContent.includes(mod.replace)) {
        console.log(`ℹ️  ${mod.description} - déjà désactivé`);
      } else {
        console.log(`⚠️  ${mod.description} - non trouvé`);
      }
    });
    
    if (changesCount > 0) {
      // Créer une sauvegarde
      const backupPath = serverPath + '.backup';
      fs.copyFileSync(serverPath, backupPath);
      console.log(`💾 Sauvegarde créée: ${backupPath}`);
      
      // Écrire le fichier modifié
      fs.writeFileSync(serverPath, serverContent);
      console.log(`\n✅ ${changesCount} modification(s) appliquée(s) à server.js`);
    } else {
      console.log('\n📋 Aucune modification nécessaire');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la modification de server.js:', error);
    throw error;
  }
}

function enableTestRoutes() {
  const serverPath = path.join(__dirname, 'server.js');
  
  try {
    // Lire le fichier server.js
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    console.log('🔧 Réactivation des routes de test dans server.js...\n');
    
    // Décommenter les lignes liées aux routes de test
    const modifications = [
      {
        search: "// const testUsersRoutes = require('./routes/test-users'); // Désactivé en production",
        replace: "const testUsersRoutes = require('./routes/test-users');",
        description: "Import des routes de test"
      },
      {
        search: "// app.use('/api/test-users', testUsersRoutes); // Désactivé en production",
        replace: "app.use('/api/test-users', testUsersRoutes);",
        description: "Utilisation des routes de test"
      }
    ];
    
    let changesCount = 0;
    
    modifications.forEach(mod => {
      if (serverContent.includes(mod.search)) {
        serverContent = serverContent.replace(mod.search, mod.replace);
        console.log(`✅ ${mod.description} - réactivé`);
        changesCount++;
      } else if (serverContent.includes(mod.replace)) {
        console.log(`ℹ️  ${mod.description} - déjà actif`);
      } else {
        console.log(`⚠️  ${mod.description} - non trouvé`);
      }
    });
    
    if (changesCount > 0) {
      // Écrire le fichier modifié
      fs.writeFileSync(serverPath, serverContent);
      console.log(`\n✅ ${changesCount} modification(s) appliquée(s) à server.js`);
    } else {
      console.log('\n📋 Aucune modification nécessaire');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la modification de server.js:', error);
    throw error;
  }
}

function showCurrentStatus() {
  const serverPath = path.join(__dirname, 'server.js');
  
  try {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    console.log('📋 État actuel des routes de test:\n');
    
    const checks = [
      {
        pattern: "const testUsersRoutes = require('./routes/test-users');",
        description: "Import des routes de test",
        type: "active"
      },
      {
        pattern: "// const testUsersRoutes = require('./routes/test-users'); // Désactivé en production",
        description: "Import des routes de test",
        type: "disabled"
      },
      {
        pattern: "app.use('/api/test-users', testUsersRoutes);",
        description: "Utilisation des routes de test",
        type: "active"
      },
      {
        pattern: "// app.use('/api/test-users', testUsersRoutes); // Désactivé en production",
        description: "Utilisation des routes de test", 
        type: "disabled"
      }
    ];
    
    checks.forEach(check => {
      if (serverContent.includes(check.pattern)) {
        const status = check.type === 'active' ? '🟢 ACTIF' : '🔴 DÉSACTIVÉ';
        console.log(`${status} - ${check.description}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de server.js:', error);
  }
}

// Permettre d'exécuter des actions spécifiques
const action = process.argv[2];

console.log('🛠️  GESTION DES ROUTES DE TEST\n');

if (action === 'disable') {
  disableTestRoutes();
  console.log('\n🎉 Routes de test désactivées pour la production !');
} else if (action === 'enable') {
  enableTestRoutes();
  console.log('\n🎉 Routes de test réactivées !');
} else if (action === 'status') {
  showCurrentStatus();
} else {
  console.log('Usage:');
  console.log('  node disable-test-routes.js disable  - Désactiver les routes de test');
  console.log('  node disable-test-routes.js enable   - Réactiver les routes de test');
  console.log('  node disable-test-routes.js status   - Voir l\'état actuel');
  console.log('');
  showCurrentStatus();
} 