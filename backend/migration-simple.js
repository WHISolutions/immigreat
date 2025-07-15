const { getSequelize } = require('./config/db.config');
const { Op } = require('sequelize');

async function migrationSimple() {
  try {
    console.log('🔄 MIGRATION SIMPLE FACTURES');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');
    
    // Ajouter les champs
    try {
      await sequelize.query('ALTER TABLE Factures ADD COLUMN validePar VARCHAR(255) NULL');
      console.log('✅ Champ validePar ajouté');
    } catch (e) {
      console.log('⚠️ validePar existe déjà');
    }
    
    try {
      await sequelize.query('ALTER TABLE Factures ADD COLUMN dateValidation DATETIME NULL');
      console.log('✅ Champ dateValidation ajouté');
    } catch (e) {
      console.log('⚠️ dateValidation existe déjà');
    }
    
    // Mettre à jour les factures
    const Facture = require('./models/facture')(sequelize);
    
    const factures = await Facture.findAll();
    console.log(`📊 ${factures.length} factures trouvées`);
    
    const conseilleresDisponibles = ['Marie T.', 'Sophie M.', 'Julie L.'];
    let updated = 0;
    
    for (const facture of factures) {
      if (!facture.validePar) {
        const conseillere = conseilleresDisponibles[facture.id % conseilleresDisponibles.length];
        await facture.update({
          validePar: conseillere,
          dateValidation: facture.dateEmission || new Date()
        });
        console.log(`   ✅ ${facture.numero}: ${conseillere}`);
        updated++;
      }
    }
    
    console.log(`✅ ${updated} factures mises à jour`);
    
    // Test final
    const facturesAvecConseillere = await Facture.findAll({
      attributes: ['numero', 'montant', 'validePar', 'statut'],
      where: {
        statut: {
          [Op.in]: ['payable', 'payee']
        }
      }
    });
    
    console.log('\n💰 Ventes par conseillère:');
    const ventes = {};
    facturesAvecConseillere.forEach(f => {
      const c = f.validePar || 'Non assigné';
      if (!ventes[c]) ventes[c] = { total: 0, count: 0 };
      ventes[c].total += parseFloat(f.montant) * 1.15;
      ventes[c].count += 1;
    });
    
    Object.entries(ventes).forEach(([c, d]) => {
      console.log(`   ${c}: ${d.total.toFixed(2)}$ TTC (${d.count} factures)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    process.exit(0);
  }
}

migrationSimple(); 