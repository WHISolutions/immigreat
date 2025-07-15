const { getSequelize } = require('./config/db.config');

async function fixAllFactures() {
  try {
    console.log('🔧 Correction de toutes les factures...');
    
    const initializeModels = require('./models');
    const models = initializeModels();
    const sequelize = getSequelize();
    const Facture = sequelize.models.Facture;
    
    if (!Facture) {
      console.error('❌ Modèle Facture non trouvé');
      return;
    }
    
    // Récupérer toutes les factures
    const factures = await Facture.findAll();
    console.log(`📊 ${factures.length} factures trouvées`);
    
    let corrections = 0;
    
    for (const facture of factures) {
      console.log(`\n🔍 Vérification facture ${facture.numero_facture || facture.numero}:`);
      console.log(`   Montant principal: ${facture.montant}`);
      
      let needsUpdate = false;
      const updates = {};
      
      // Créer des prestations cohérentes avec le montant principal
      const prestationsCorrigees = [
        {
          description: `Service de consultation - ${facture.montant} CAD`,
          montant: facture.montant
        }
      ];
      
      // Vérifier si les prestations_details sont cohérentes
      if (facture.prestations_details) {
        try {
          const prestationsActuelles = JSON.parse(facture.prestations_details);
          const sommePrestations = prestationsActuelles.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
          
          console.log(`   Somme prestations: ${sommePrestations}`);
          
          if (Math.abs(sommePrestations - facture.montant) > 0.01) {
            console.log(`   ⚠️ Incohérence détectée!`);
            updates.prestations_details = JSON.stringify(prestationsCorrigees);
            needsUpdate = true;
          }
        } catch (error) {
          console.log(`   ❌ Erreur parsing prestations_details`);
          updates.prestations_details = JSON.stringify(prestationsCorrigees);
          needsUpdate = true;
        }
      } else {
        console.log(`   📝 Aucune prestations_details`);
        updates.prestations_details = JSON.stringify(prestationsCorrigees);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await facture.update(updates);
        console.log(`   ✅ Facture corrigée`);
        corrections++;
      } else {
        console.log(`   ✅ Facture déjà cohérente`);
      }
    }
    
    console.log(`\n🎉 Correction terminée: ${corrections} factures corrigées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixAllFactures()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = fixAllFactures; 