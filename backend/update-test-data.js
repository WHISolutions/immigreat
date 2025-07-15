const { getSequelize } = require('./config/db.config');

async function updateTestData() {
  try {
    console.log('🔄 Mise à jour des données de test');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    const Facture = require('./models/facture')(sequelize);
    
    // Mettre toutes les factures en "payable" pour les tests
    await Facture.update(
      { statut: 'payable' }, 
      { where: { statut: 'brouillon' } }
    );
    
    console.log('✅ Toutes les factures sont maintenant payables');
    
    // Afficher le résultat
    const factures = await Facture.findAll({
      attributes: ['numero', 'montant', 'validePar', 'statut']
    });
    
    console.log('\n📊 État des factures:');
    factures.forEach(f => {
      console.log(`   ${f.numero}: ${f.montant}$ par ${f.validePar} (${f.statut})`);
    });
    
    console.log('\n✅ Données de test mises à jour !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

updateTestData(); 