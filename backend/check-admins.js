const { getSequelize } = require('./config/db.config');

async function checkAdmins() {
  try {
    console.log('🔍 VÉRIFICATION DES ADMINISTRATEURS EXISTANTS\n');
    
    const sequelize = getSequelize();
    
    const [admins] = await sequelize.query(`
      SELECT nom, prenom, email, role, actif, derniere_connexion
      FROM users 
      WHERE role = 'admin'
      ORDER BY derniere_connexion DESC
    `);
    
    console.log(`📊 Total administrateurs: ${admins.length}\n`);
    
    if (admins.length === 0) {
      console.log('❌ Aucun administrateur trouvé !');
      console.log('⚠️  ATTENTION: Il faut au moins un administrateur pour gérer l\'application.');
    } else {
      console.log('👑 ADMINISTRATEURS:');
      console.log('==================');
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.prenom} ${admin.nom}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🔵 Actif: ${admin.actif ? 'Oui' : 'Non'}`);
        console.log(`   🕐 Dernière connexion: ${admin.derniere_connexion || 'Jamais'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkAdmins().then(() => process.exit(0)); 