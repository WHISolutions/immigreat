const { getSequelize } = require('./config/db.config');
const Facture = require('./models/facture');

async function checkMonnaieFacures() {
  try {
    const factures = await Facture.findAll({
      attributes: ['id', 'numero', 'montant', 'monnaie', 'validePar'],
      limit: 10,
      order: [['dateEmission', 'DESC']]
    });
    
    console.log('=== MONNAIES DES FACTURES ===');
    let totalTTC_MAD = 0;
    let totalTTC_CAD = 0;
    let compteurMAD = 0;
    let compteurCAD = 0;
    
    factures.forEach(f => {
      const montant = parseFloat(f.montant) || 0;
      const monnaie = f.monnaie || 'Non définie';
      console.log(`${f.numero}: ${montant} ${monnaie} TTC (${f.validePar})`);
      
      if (monnaie === 'MAD') {
        totalTTC_MAD += montant;
        compteurMAD++;
      } else if (monnaie === 'CAD') {
        totalTTC_CAD += montant;
        compteurCAD++;
      }
    });
    
    console.log(`\n=== TOTAUX PAR MONNAIE ===`);
    console.log(`Total MAD: ${totalTTC_MAD.toFixed(2)} DH (${compteurMAD} factures)`);
    console.log(`Total CAD: ${totalTTC_CAD.toFixed(2)} $ (${compteurCAD} factures)`);
    
    // Vérifier spécifiquement pour driss dris
    const facturesDriss = await Facture.findAll({
      attributes: ['id', 'numero', 'montant', 'monnaie'],
      where: {
        validePar: 'driss dris'
      }
    });
    
    console.log(`\n=== FACTURES DE DRISS DRIS ===`);
    let totalDriss = 0;
    facturesDriss.forEach(f => {
      const montant = parseFloat(f.montant) || 0;
      const monnaie = f.monnaie || 'Non définie';
      console.log(`${f.numero}: ${montant} ${monnaie} TTC`);
      totalDriss += montant;
    });
    console.log(`Total Driss: ${totalDriss.toFixed(2)} (${facturesDriss[0]?.monnaie || 'Monnaie inconnue'})`);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
}

checkMonnaieFacures();
