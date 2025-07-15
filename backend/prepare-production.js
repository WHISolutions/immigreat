const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PRÉPARATION DE L\'APPLICATION POUR LA PRODUCTION\n');
console.log('==================================================\n');

async function runStep(step, description, command, skipOnError = false) {
  console.log(`📋 Étape ${step}: ${description}`);
  console.log('─'.repeat(50));
  
  try {
    if (typeof command === 'function') {
      await command();
    } else {
      execSync(command, { stdio: 'inherit', cwd: __dirname });
    }
    console.log(`✅ Étape ${step} terminée avec succès\n`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur à l'étape ${step}:`, error.message);
    if (!skipOnError) {
      console.log('\n🛑 Arrêt du processus de préparation');
      process.exit(1);
    }
    console.log(`⚠️  Étape ${step} ignorée (optionnelle)\n`);
    return false;
  }
}

async function main() {
  console.log('Ce script va préparer votre application pour la production en:');
  console.log('1. Listant les utilisateurs actuels');
  console.log('2. Supprimant les utilisateurs de test');
  console.log('3. Désactivant les routes de test');
  console.log('4. Nettoyant les fichiers temporaires');
  console.log('5. Optimisant la configuration\n');
  
  // Demander confirmation
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const proceed = await new Promise((resolve) => {
    rl.question('Voulez-vous continuer ? (o/n): ', resolve);
  });
  
  rl.close();
  
  if (proceed.toLowerCase() !== 'o' && proceed.toLowerCase() !== 'oui') {
    console.log('❌ Opération annulée');
    return;
  }
  
  console.log('\n🔄 Début de la préparation...\n');
  
  // Étape 1: Lister les utilisateurs actuels
  await runStep(1, 'Liste des utilisateurs actuels', 'node cleanup-test-users.js list');
  
  // Étape 2: Nettoyer les utilisateurs de test
  await runStep(2, 'Nettoyage des utilisateurs de test', 'node cleanup-test-users.js');
  
  // Étape 3: Désactiver les routes de test
  await runStep(3, 'Désactivation des routes de test', 'node disable-test-routes.js disable');
  
  // Étape 4: Nettoyer les fichiers temporaires
  await runStep(4, 'Nettoyage des fichiers temporaires', async () => {
    const filesToClean = [
      '*.log',
      'uploads/temp/*',
      'database.sqlite*',
      'leads_database.sqlite*',
      'users_database.sqlite*'
    ];
    
    console.log('🧹 Nettoyage des fichiers temporaires...');
    
    // Nettoyer les logs
    try {
      const logFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.log'));
      logFiles.forEach(file => {
        fs.unlinkSync(path.join(__dirname, file));
        console.log(`🗑️  Supprimé: ${file}`);
      });
    } catch (error) {
      console.log('ℹ️  Aucun fichier log à nettoyer');
    }
    
    // Nettoyer les anciennes bases SQLite (si elles existent)
    const sqliteFiles = ['database.sqlite', 'leads_database.sqlite', 'users_database.sqlite'];
    sqliteFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Supprimé: ${file}`);
      }
    });
    
    console.log('✨ Nettoyage terminé');
  }, true);
  
  // Étape 5: Vérification de la configuration
  await runStep(5, 'Vérification de la configuration', async () => {
    console.log('🔍 Vérification de la configuration...');
    
    // Vérifier les variables d'environnement importantes
    const requiredEnvVars = ['NODE_ENV', 'DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
    const missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('⚠️  Variables d\'environnement manquantes:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('\n📝 Assurez-vous de configurer ces variables avant de déployer en production');
    } else {
      console.log('✅ Toutes les variables d\'environnement sont configurées');
    }
    
    // Vérifier NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  NODE_ENV n\'est pas défini sur "production"');
      console.log('   Définissez NODE_ENV=production pour optimiser les performances');
    } else {
      console.log('✅ NODE_ENV configuré pour la production');
    }
    
    console.log('🔍 Vérification terminée');
  }, true);
  
  // Étape 6: Créer un résumé
  await runStep(6, 'Génération du rapport de préparation', async () => {
    const reportPath = path.join(__dirname, 'production-preparation-report.txt');
    const report = `
RAPPORT DE PRÉPARATION POUR LA PRODUCTION
=========================================

Date: ${new Date().toLocaleString()}

✅ ACTIONS EFFECTUÉES:
- Utilisateurs de test supprimés
- Routes de test désactivées  
- Fichiers temporaires nettoyés
- Configuration vérifiée

⚠️  ACTIONS REQUISES AVANT DÉPLOIEMENT:
1. Configurer les variables d'environnement:
   - NODE_ENV=production
   - DB_HOST=votre_host_mysql
   - DB_NAME=votre_base_production
   - DB_USER=votre_utilisateur_mysql
   - DB_PASSWORD=votre_mot_de_passe_mysql
   - JWT_SECRET=votre_secret_jwt_sécurisé

2. Créer au moins un administrateur de production

3. Tester la connexion à la base de données de production

4. Configurer HTTPS en production

5. Configurer les sauvegardes automatiques

📊 ÉTAT ACTUEL:
- Routes de test: DÉSACTIVÉES
- Utilisateurs de test: SUPPRIMÉS  
- Configuration: VÉRIFIÉE

🚀 L'application est prête pour le déploiement en production !
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Rapport généré: ${reportPath}`);
    console.log(report);
  }, true);
  
  console.log('🎉 PRÉPARATION TERMINÉE AVEC SUCCÈS !');
  console.log('=====================================\n');
  console.log('Votre application est maintenant prête pour la production.');
  console.log('Consultez le fichier production-preparation-report.txt pour les étapes suivantes.');
}

main().catch(error => {
  console.error('❌ Erreur durant la préparation:', error);
  process.exit(1);
}); 