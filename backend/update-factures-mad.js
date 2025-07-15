// Script pour mettre à jour les factures existantes avec MAD par défaut
const { getSequelize } = require('./config/db.config');

async function updateFacturesMAD() {
  try {
    console.log('🚀 Mise à jour des factures existantes vers MAD...');
    
    const sequelize = getSequelize();
    
    // Mettre à jour toutes les factures pour utiliser MAD par défaut
    const [updateResult] = await sequelize.query(`
      UPDATE Factures SET monnaie = 'MAD' WHERE monnaie IS NULL OR monnaie = '' OR monnaie = 'CAD'
    `);
    
    console.log('✅ Factures mises à jour avec la monnaie MAD par défaut');
    
    // Vérifier le résultat
    const [facturesCount] = await sequelize.query(`
      SELECT COUNT(*) as total, monnaie FROM Factures GROUP BY monnaie
    `);
    
    console.log('📊 Répartition des monnaies dans les factures:');
    facturesCount.forEach(row => {
      console.log(`   ${row.monnaie || 'NULL'}: ${row.total} factures`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    throw error;
  }
}

// Exécuter la mise à jour si ce fichier est appelé directement
if (require.main === module) {
  updateFacturesMAD()
    .then(() => {
      console.log('🎉 Mise à jour terminée avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la mise à jour:', error);
      process.exit(1);
    });
}

module.exports = { updateFacturesMAD };
