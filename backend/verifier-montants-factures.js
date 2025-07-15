const { getSequelize } = require('./config/db.config');

async function verifierMontantsFactures() {
  try {
    const sequelize = getSequelize();
    const { Facture } = sequelize.models;

    if (!Facture) {
      console.log('⚠️ Modèle Facture non disponible');
      return;
    }

    console.log('🔍 === VÉRIFICATION DES MONTANTS FACTURES ===\n');

    // Récupérer toutes les factures
    const factures = await Facture.findAll({
      attributes: ['id', 'numero', 'montant', 'monnaie', 'validePar', 'description'],
      order: [['id', 'ASC']]
    });

    console.log(`📊 Total factures en base: ${factures.length}\n`);

    factures.forEach(facture => {
      const montant = parseFloat(facture.montant || 0);
      const monnaie = facture.monnaie || 'Non spécifié';
      
      // Calculer les variantes selon les taux
      let montantHT_MAD, montantTTC_MAD, montantHT_CAD, montantTTC_CAD;
      
      if (monnaie === 'MAD') {
        // Si c'est MAD et que le montant stocké est TTC
        montantTTC_MAD = montant;
        montantHT_MAD = montant / 1.2; // Retrouver le HT (20% TVA)
        
        // Hypothèse alternative: montant stocké est HT
        montantHT_MAD_alt = montant;
        montantTTC_MAD_alt = montant * 1.2;
      } else {
        // Si c'est CAD et que le montant stocké est TTC
        montantTTC_CAD = montant;
        montantHT_CAD = montant / 1.15; // Retrouver le HT (15% TVA)
        
        // Hypothèse alternative: montant stocké est HT
        montantHT_CAD_alt = montant;
        montantTTC_CAD_alt = montant * 1.15;
      }
      
      console.log(`Facture ${facture.numero} (${facture.validePar}):`);
      console.log(`  💰 Montant stocké: ${montant.toFixed(2)} ${monnaie}`);
      console.log(`  📄 Description: ${facture.description?.substring(0, 50)}...`);
      
      if (monnaie === 'MAD') {
        console.log(`  📊 Si montant stocké = TTC:`);
        console.log(`      TTC: ${montantTTC_MAD?.toFixed(2)} MAD`);
        console.log(`      HT:  ${montantHT_MAD?.toFixed(2)} MAD`);
        console.log(`  📊 Si montant stocké = HT:`);
        console.log(`      HT:  ${montantHT_MAD_alt?.toFixed(2)} MAD`);
        console.log(`      TTC: ${montantTTC_MAD_alt?.toFixed(2)} MAD`);
      } else {
        console.log(`  📊 Si montant stocké = TTC:`);
        console.log(`      TTC: ${montantTTC_CAD?.toFixed(2)} CAD`);
        console.log(`      HT:  ${montantHT_CAD?.toFixed(2)} CAD`);
        console.log(`  📊 Si montant stocké = HT:`);
        console.log(`      HT:  ${montantHT_CAD_alt?.toFixed(2)} CAD`);
        console.log(`      TTC: ${montantTTC_CAD_alt?.toFixed(2)} CAD`);
      }
      console.log('');
    });

    // Focus sur driss dris
    const facturesDriss = factures.filter(f => f.validePar === 'driss dris');
    if (facturesDriss.length > 0) {
      console.log('\n🎯 === FOCUS SUR DRISS DRIS ===');
      let totalTTC = 0;
      let totalHT = 0;
      
      facturesDriss.forEach(f => {
        const montant = parseFloat(f.montant || 0);
        const monnaie = f.monnaie || 'MAD';
        
        if (monnaie === 'MAD') {
          // Supposons que le montant est TTC
          totalTTC += montant;
          totalHT += montant / 1.2;
        } else {
          // Pour CAD
          totalTTC += montant;
          totalHT += montant / 1.15;
        }
        
        console.log(`  ${f.numero}: ${montant.toFixed(2)} ${monnaie}`);
      });
      
      console.log(`\n💰 Total pour driss dris (si montants = TTC):`);
      console.log(`   TTC: ${totalTTC.toFixed(2)}`);
      console.log(`   HT:  ${totalHT.toFixed(2)}`);
      
      // Tester aussi l'hypothèse inverse
      let totalTTC_alt = 0;
      facturesDriss.forEach(f => {
        const montant = parseFloat(f.montant || 0);
        const monnaie = f.monnaie || 'MAD';
        
        if (monnaie === 'MAD') {
          totalTTC_alt += montant * 1.2;
        } else {
          totalTTC_alt += montant * 1.15;
        }
      });
      
      console.log(`\n💰 Total pour driss dris (si montants = HT):`);
      console.log(`   TTC calculé: ${totalTTC_alt.toFixed(2)}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

verifierMontantsFactures();
