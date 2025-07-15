const { getSequelize } = require('./config/db.config');

// Liste des utilisateurs de test/démonstration à supprimer
const TEST_USER_EMAILS = [
  'admin@immigration.ca',
  'marie.tremblay@immigration.ca',
  'sophie.martin@immigration.ca', 
  'julie.dupont@immigration.ca',
  'pierre.lavoie@immigration.ca',
  'test@example.com',
  'testuser@example.com'
];

async function listAllUsers() {
  try {
    console.log('📋 === LISTE DE TOUS LES UTILISATEURS ===\n');
    
    const sequelize = getSequelize();
    
    const [users] = await sequelize.query(`
      SELECT id, nom, prenom, email, role, actif, date_creation, derniere_connexion
      FROM users
      ORDER BY date_creation ASC
    `);
    
    console.log(`📊 Total utilisateurs: ${users.length}\n`);
    
    // Séparer les utilisateurs de test des utilisateurs réels
    const testUsers = [];
    const realUsers = [];
    
    users.forEach(user => {
      if (TEST_USER_EMAILS.includes(user.email)) {
        testUsers.push(user);
      } else {
        realUsers.push(user);
      }
    });
    
    console.log('🧪 UTILISATEURS DE TEST/DÉMONSTRATION:');
    console.log('=====================================');
    if (testUsers.length === 0) {
      console.log('✅ Aucun utilisateur de test trouvé');
    } else {
      testUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.prenom} ${user.nom}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Rôle: ${user.role}`);
        console.log(`   📅 Créé: ${user.date_creation}`);
        console.log(`   🔵 Actif: ${user.actif ? 'Oui' : 'Non'}`);
        console.log(`   🕐 Dernière connexion: ${user.derniere_connexion || 'Jamais'}`);
        console.log('');
      });
    }
    
    console.log('👥 UTILISATEURS RÉELS (À CONSERVER):');
    console.log('===================================');
    if (realUsers.length === 0) {
      console.log('⚠️  Aucun utilisateur réel trouvé - ATTENTION !');
      console.log('   Vous devriez créer au moins un admin réel avant de supprimer les utilisateurs de test.');
    } else {
      realUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.prenom} ${user.nom}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Rôle: ${user.role}`);
        console.log(`   📅 Créé: ${user.date_creation}`);
        console.log(`   🔵 Actif: ${user.actif ? 'Oui' : 'Non'}`);
        console.log(`   🕐 Dernière connexion: ${user.derniere_connexion || 'Jamais'}`);
        console.log('');
      });
    }
    
    return { testUsers, realUsers };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

async function deleteTestUsers() {
  try {
    console.log('\n🗑️  === SUPPRESSION DES UTILISATEURS DE TEST ===\n');
    
    const sequelize = getSequelize();
    
    // Vérifier d'abord quels utilisateurs de test existent
    const [existingTestUsers] = await sequelize.query(`
      SELECT id, nom, prenom, email, role
      FROM users
      WHERE email IN (${TEST_USER_EMAILS.map(() => '?').join(', ')})
    `, {
      replacements: TEST_USER_EMAILS
    });
    
    if (existingTestUsers.length === 0) {
      console.log('✅ Aucun utilisateur de test à supprimer');
      return;
    }
    
    console.log(`🔍 ${existingTestUsers.length} utilisateur(s) de test trouvé(s):`);
    existingTestUsers.forEach(user => {
      console.log(`   - ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    // Supprimer les utilisateurs de test
    const [result] = await sequelize.query(`
      DELETE FROM users
      WHERE email IN (${TEST_USER_EMAILS.map(() => '?').join(', ')})
    `, {
      replacements: TEST_USER_EMAILS
    });
    
    console.log(`\n✅ ${existingTestUsers.length} utilisateur(s) de test supprimé(s) avec succès !`);
    
    // Vérifier qu'il reste au moins un utilisateur admin
    const [remainingAdmins] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'admin' AND actif = 1
    `);
    
    if (remainingAdmins[0].count === 0) {
      console.log('\n⚠️  ATTENTION: Il n\'y a plus d\'administrateur actif !');
      console.log('   Vous devriez créer un nouvel administrateur immédiatement.');
    } else {
      console.log(`\n✅ ${remainingAdmins[0].count} administrateur(s) actif(s) restant(s)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des utilisateurs de test:', error);
    throw error;
  }
}

async function createProductionAdmin() {
  try {
    console.log('\n👑 === CRÉATION D\'UN ADMINISTRATEUR DE PRODUCTION ===\n');
    
    const readline = require('readline');
    const bcrypt = require('bcryptjs');
    const sequelize = getSequelize();
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    function question(prompt) {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    }
    
    console.log('Créons un nouvel administrateur pour la production:\n');
    
    const nom = await question('👤 Nom: ');
    const prenom = await question('👤 Prénom: ');
    const email = await question('📧 Email: ');
    const telephone = await question('📞 Téléphone (optionnel): ');
    const motDePasse = await question('🔒 Mot de passe: ');
    
    rl.close();
    
    // Vérifier si l'email existe déjà
    const [existingUsers] = await sequelize.query(
      "SELECT * FROM users WHERE email = ?",
      { replacements: [email] }
    );
    
    if (existingUsers.length > 0) {
      console.log('❌ Un utilisateur avec cet email existe déjà');
      return;
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    
    // Permissions admin complètes
    const adminPermissions = {
      users_create: true,
      users_read: true,
      users_update: true,
      users_delete: true,
      leads_create: true,
      leads_read: true,
      leads_update: true,
      leads_delete: true,
      clients_create: true,
      clients_read: true,
      clients_update: true,
      clients_delete: true,
      documents_create: true,
      documents_read: true,
      documents_update: true,
      documents_delete: true,
      factures_create: true,
      factures_read: true,
      factures_update: true,
      factures_delete: true,
      rapports_read: true,
      administration_access: true
    };
    
    // Créer l'utilisateur
    const query = `
      INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role, permissions, actif, date_creation, date_modification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await sequelize.query(query, {
      replacements: [
        nom,
        prenom,
        email,
        telephone || null,
        hashedPassword,
        'admin',
        JSON.stringify(adminPermissions),
        true
      ]
    });
    
    console.log('\n✅ Administrateur de production créé avec succès !');
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Mot de passe: ${motDePasse}`);
    console.log('\n⚠️  Notez bien ces informations de connexion !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 NETTOYAGE DES UTILISATEURS POUR LA PRODUCTION\n');
    console.log('Ce script va vous aider à préparer l\'application pour la production');
    console.log('en supprimant les utilisateurs de test/démonstration.\n');
    
    // 1. Lister tous les utilisateurs
    const { testUsers, realUsers } = await listAllUsers();
    
    if (testUsers.length === 0) {
      console.log('\n✅ Aucun utilisateur de test trouvé. L\'application est déjà prête pour la production !');
      return;
    }
    
    // 2. Vérifier qu'il y a au moins un admin réel
    const realAdmins = realUsers.filter(user => user.role === 'admin' && user.actif);
    
    if (realAdmins.length === 0) {
      console.log('\n⚠️  ATTENTION: Aucun administrateur réel trouvé !');
      console.log('Voulez-vous créer un administrateur de production avant de supprimer les utilisateurs de test ?');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Créer un admin de production ? (o/n): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
        await createProductionAdmin();
      } else {
        console.log('\n❌ Annulation. Créez d\'abord un administrateur réel avant de supprimer les utilisateurs de test.');
        return;
      }
    }
    
    // 3. Demander confirmation pour la suppression
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmation = await new Promise((resolve) => {
      rl.question(`\n❓ Voulez-vous supprimer les ${testUsers.length} utilisateur(s) de test ? (o/n): `, resolve);
    });
    
    rl.close();
    
    if (confirmation.toLowerCase() === 'o' || confirmation.toLowerCase() === 'oui') {
      await deleteTestUsers();
      console.log('\n🎉 Nettoyage terminé ! L\'application est prête pour la production.');
    } else {
      console.log('\n❌ Suppression annulée.');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    process.exit(1);
  }
}

// Permettre d'exécuter des actions spécifiques
const action = process.argv[2];

if (action === 'list') {
  listAllUsers().then(() => process.exit(0));
} else if (action === 'delete') {
  deleteTestUsers().then(() => process.exit(0));
} else if (action === 'create-admin') {
  createProductionAdmin().then(() => process.exit(0));
} else {
  main().then(() => process.exit(0));
} 