const { getSequelize } = require('./config/db.config');

async function promoteUserToAdmin(email) {
  try {
    console.log('👑 PROMOTION D\'UN UTILISATEUR AU RÔLE ADMINISTRATEUR\n');
    
    const sequelize = getSequelize();
    
    // Vérifier que l'utilisateur existe
    const [users] = await sequelize.query(
      "SELECT * FROM users WHERE email = ?",
      { replacements: [email] }
    );
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé avec cet email');
      return;
    }
    
    const user = users[0];
    console.log(`📋 Utilisateur trouvé: ${user.prenom} ${user.nom} (${user.email})`);
    console.log(`📊 Rôle actuel: ${user.role}`);
    
    if (user.role === 'admin') {
      console.log('✅ Cet utilisateur est déjà administrateur');
      return;
    }
    
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
    
    // Mettre à jour le rôle et les permissions
    const updateQuery = `
      UPDATE users 
      SET role = 'admin', 
          permissions = ?, 
          date_modification = NOW()
      WHERE email = ?
    `;
    
    await sequelize.query(updateQuery, {
      replacements: [JSON.stringify(adminPermissions), email]
    });
    
    console.log('\n✅ Utilisateur promu administrateur avec succès !');
    console.log(`👑 ${user.prenom} ${user.nom} est maintenant administrateur`);
    console.log('🔧 Toutes les permissions administrateur ont été accordées');
    
    // Vérifier la mise à jour
    const [updatedUsers] = await sequelize.query(
      "SELECT role, permissions FROM users WHERE email = ?",
      { replacements: [email] }
    );
    
    if (updatedUsers.length > 0 && updatedUsers[0].role === 'admin') {
      console.log('\n🎉 Promotion confirmée ! L\'utilisateur peut maintenant accéder à toutes les fonctionnalités d\'administration.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error);
    throw error;
  }
}

async function listUsersForPromotion() {
  try {
    console.log('👥 UTILISATEURS DISPONIBLES POUR PROMOTION\n');
    
    const sequelize = getSequelize();
    
    const [users] = await sequelize.query(`
      SELECT id, nom, prenom, email, role, actif, derniere_connexion
      FROM users
      WHERE role != 'admin' AND actif = 1
      ORDER BY derniere_connexion DESC
    `);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur non-admin trouvé');
      return;
    }
    
    console.log('Utilisateurs éligibles pour promotion:');
    console.log('=====================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Rôle actuel: ${user.role}`);
      console.log(`   🕐 Dernière connexion: ${user.derniere_connexion || 'Jamais'}`);
      console.log('');
    });
    
    return users;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

async function interactivePromotion() {
  try {
    const users = await listUsersForPromotion();
    
    if (!users || users.length === 0) {
      return;
    }
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('📧 Entrez l\'email de l\'utilisateur à promouvoir administrateur: ', resolve);
    });
    
    rl.close();
    
    const selectedUser = users.find(user => user.email.toLowerCase() === answer.toLowerCase());
    
    if (!selectedUser) {
      console.log('❌ Email non trouvé dans la liste des utilisateurs éligibles');
      return;
    }
    
    await promoteUserToAdmin(selectedUser.email);
    
  } catch (error) {
    console.error('❌ Erreur durant la promotion interactive:', error);
  }
}

// Permettre d'exécuter des actions spécifiques
const action = process.argv[2];
const email = process.argv[3];

if (action === 'list') {
  listUsersForPromotion().then(() => process.exit(0));
} else if (action === 'promote' && email) {
  promoteUserToAdmin(email).then(() => process.exit(0));
} else if (action === 'promote' && !email) {
  console.log('❌ Email requis pour la promotion');
  console.log('Usage: node promote-to-admin.js promote email@example.com');
  process.exit(1);
} else {
  console.log('🛠️  PROMOTION D\'UTILISATEUR AU RÔLE ADMINISTRATEUR\n');
  console.log('Usage:');
  console.log('  node promote-to-admin.js list                    - Lister les utilisateurs éligibles');
  console.log('  node promote-to-admin.js promote email@email.com - Promouvoir un utilisateur spécifique');
  console.log('  node promote-to-admin.js                        - Mode interactif');
  console.log('');
  
  interactivePromotion().then(() => process.exit(0));
} 