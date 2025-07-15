const initializeModels = require('./models');

async function verifierConseillers() {
  try {
    console.log('=== VÉRIFICATION DES CONSEILLERS ===');
    console.log('Initialisation des modèles...');
    
    const { User } = initializeModels();
    
    console.log('\n=== TOUS LES UTILISATEURS ===');
    const users = await User.findAll({
      attributes: ['id', 'nom', 'prenom', 'email', 'role'],
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });
    
    console.log('Nombre total d\'utilisateurs:', users.length);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n=== CONSEILLERS UNIQUEMENT ===');
    const conseillers = await User.findAll({
      where: {
        role: ['admin', 'conseillere']
      },
      attributes: ['id', 'nom', 'prenom', 'email', 'role'],
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });
    
    console.log('Nombre de conseillers:', conseillers.length);
    conseillers.forEach((conseiller, index) => {
      console.log(`${index + 1}. ${conseiller.prenom} ${conseiller.nom} (${conseiller.role})`);
    });
    
    console.log('\n=== RÉSUMÉ FRONTEND ===');
    console.log('Les conseillers suivants devraient maintenant apparaître dans les listes déroulantes :');
    conseillers.forEach((conseiller, index) => {
      const nomComplet = `${conseiller.prenom} ${conseiller.nom}`;
      console.log(`${index + 1}. "${nomComplet}"`);
    });
    
    console.log('\n✅ Vérification terminée !');
    console.log('🔄 Redémarrez le serveur si nécessaire et testez l\'interface.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  }
}

verifierConseillers(); 