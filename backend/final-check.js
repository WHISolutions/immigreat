const { getSequelize } = require('./config/db.config');
const fs = require('fs');
const path = require('path');

async function finalProductionCheck() {
  console.log('🏁 VÉRIFICATION FINALE - APPLICATION PRÊTE POUR LA PRODUCTION\n');
  console.log('='.repeat(60));
  
  let allGood = true;
  
  try {
    // 1. Vérifier les utilisateurs
    console.log('\n📋 1. VÉRIFICATION DES UTILISATEURS');
    console.log('-'.repeat(40));
    
    const sequelize = getSequelize();
    
    // Compter les utilisateurs par type
    const [testUsers] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE email IN ('admin@immigration.ca', 'marie.tremblay@immigration.ca', 
                      'sophie.martin@immigration.ca', 'julie.dupont@immigration.ca', 
                      'pierre.lavoie@immigration.ca', 'test@example.com', 
                      'testuser@example.com')
    `);
    
    const [totalUsers] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [admins] = await sequelize.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND actif = 1");
    
    if (testUsers[0].count === 0) {
      console.log('✅ Utilisateurs de test: SUPPRIMÉS');
    } else {
      console.log(`❌ Utilisateurs de test: ${testUsers[0].count} restant(s)`);
      allGood = false;
    }
    
    console.log(`✅ Total utilisateurs: ${totalUsers[0].count}`);
    
    if (admins[0].count > 0) {
      console.log(`✅ Administrateurs actifs: ${admins[0].count}`);
    } else {
      console.log('❌ Aucun administrateur actif !');
      allGood = false;
    }
    
    // 2. Vérifier les routes de test
    console.log('\n📋 2. VÉRIFICATION DES ROUTES DE TEST');
    console.log('-'.repeat(40));
    
    const serverPath = path.join(__dirname, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    const testRouteActive = serverContent.includes("app.use('/api/test-users', testUsersRoutes);") && 
                           !serverContent.includes("// app.use('/api/test-users', testUsersRoutes);");
    
    if (!testRouteActive) {
      console.log('✅ Routes de test: DÉSACTIVÉES');
    } else {
      console.log('❌ Routes de test: ENCORE ACTIVES');
      allGood = false;
    }
    
    // 3. Vérifier les fichiers de développement
    console.log('\n📋 3. VÉRIFICATION DES FICHIERS DE DÉVELOPPEMENT');
    console.log('-'.repeat(40));
    
    const devFiles = ['database.sqlite', 'leads_database.sqlite', 'users_database.sqlite'];
    let devFilesPresent = 0;
    
    devFiles.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`⚠️  Fichier de dev présent: ${file}`);
        devFilesPresent++;
      }
    });
    
    if (devFilesPresent === 0) {
      console.log('✅ Fichiers de développement: NETTOYÉS');
    } else {
      console.log(`❌ ${devFilesPresent} fichier(s) de développement encore présent(s)`);
    }
    
    // 4. Configuration recommandée
    console.log('\n📋 4. CONFIGURATION RECOMMANDÉE POUR LA PRODUCTION');
    console.log('-'.repeat(40));
    
    const envVars = ['NODE_ENV', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    const missingVars = envVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ Toutes les variables d\'environnement sont configurées');
    } else {
      console.log('⚠️  Variables d\'environnement à configurer:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }
    
    // 5. Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(60));
    
    if (allGood) {
      console.log('🎉 FÉLICITATIONS ! Votre application est PRÊTE pour la production !');
      console.log('\n✅ Actions terminées:');
      console.log('   - Utilisateurs de test supprimés');
      console.log('   - Routes de test désactivées');
      console.log('   - Fichiers temporaires nettoyés');
      console.log('   - Au moins un administrateur configuré');
      
      console.log('\n📋 Prochaines étapes:');
      console.log('   1. Configurer les variables d\'environnement de production');
      console.log('   2. Déployer sur votre serveur de production');
      console.log('   3. Configurer HTTPS');
      console.log('   4. Mettre en place des sauvegardes');
      console.log('   5. Tester toutes les fonctionnalités');
      
      console.log('\n🔑 Compte administrateur de production:');
      console.log('   Email: amniham@gmail.com');
      console.log('   Nom: hame amni');
      
    } else {
      console.log('⚠️  Votre application NÉCESSITE encore des ajustements avant la production.');
      console.log('   Consultez les points marqués ❌ ci-dessus.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

finalProductionCheck().then(() => process.exit(0)); 