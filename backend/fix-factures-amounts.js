const { getSequelize } = require('./config/db.config');

async function fixFacturesAmounts() {
  try {
    console.log('🔧 Correction des montants des factures...');
    
    const sequelize = getSequelize();
    
    // Initialiser les modèles
    const initializeModels = require('./models');
    const models = initializeModels();
    
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
      let needsUpdate = false;
      const updates = {};
      
             // Vérifier si prestations_details contient des montants incorrects
       if (facture.prestations_details) {
         try {
           const prestations = JSON.parse(facture.prestations_details);
           const correctedPrestations = prestations.map(p => {
             const originalMontant = p.montant;
             let correctedMontant = parseFloat(originalMontant);
             
             // Si le montant est une string comme "01500", on le convertit en nombre
             if (typeof originalMontant === 'string' && originalMontant.match(/^\d+$/)) {
               correctedMontant = parseInt(originalMontant) / 100; // Diviser par 100 pour avoir le bon montant
             }
             
             return {
               ...p,
               montant: correctedMontant
             };
           });
           
           // Calculer le nouveau montant total
           const nouveauMontantTotal = correctedPrestations.reduce((sum, p) => sum + p.montant, 0);
           
           if (JSON.stringify(prestations) !== JSON.stringify(correctedPrestations)) {
             updates.prestations_details = JSON.stringify(correctedPrestations);
             updates.montant = nouveauMontantTotal;
             needsUpdate = true;
           }
           
         } catch (error) {
           console.error(`❌ Erreur parsing prestations_details pour facture ${facture.id}:`, error);
         }
       } else if (facture.montant === 0) {
         // Si pas de prestations_details et montant = 0, créer des prestations par défaut
         const defaultPrestations = [{
           description: facture.description || 'Service de consultation',
           montant: 1500 // Montant par défaut de 1500 CAD
         }];
         
         updates.prestations_details = JSON.stringify(defaultPrestations);
         updates.montant = 1500;
         needsUpdate = true;
       }
      
      if (needsUpdate) {
        await facture.update(updates);
        console.log(`✅ Facture ${facture.numero_facture || facture.numero} corrigée - nouveau montant: ${updates.montant}`);
        corrections++;
      }
    }
    
    console.log(`🎉 Correction terminée: ${corrections} factures corrigées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixFacturesAmounts()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = fixFacturesAmounts; 