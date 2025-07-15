const { getSequelize } = require('./config/db.config');

async function setFactureAmount() {
  try {
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.log('Usage: node set-facture-amount.js <numero_facture> <nouveau_montant>');
      console.log('Exemple: node set-facture-amount.js F2025-003 300');
      return;
    }
    
    const numeroFacture = args[0];
    const nouveauMontant = parseFloat(args[1]);
    
    if (isNaN(nouveauMontant)) {
      console.error('❌ Le montant doit être un nombre valide');
      return;
    }
    
    console.log(`🔧 Modification de la facture ${numeroFacture} → ${nouveauMontant} CAD`);
    
    const initializeModels = require('./models');
    const models = initializeModels();
    const sequelize = getSequelize();
    const Facture = sequelize.models.Facture;
    
    if (!Facture) {
      console.error('❌ Modèle Facture non trouvé');
      return;
    }
    
    // Trouver la facture par numéro
    const facture = await Facture.findOne({
      where: {
        numero_facture: numeroFacture
      }
    });
    
    if (!facture) {
      console.error(`❌ Facture ${numeroFacture} non trouvée`);
      return;
    }
    
    console.log('📋 Facture avant modification:', {
      id: facture.id,
      numero: facture.numero_facture,
      montant: facture.montant,
      client: facture.client
    });
    
    // Créer les nouvelles prestations
    const newPrestations = [
      {
        description: `Service de consultation - ${nouveauMontant} CAD`,
        montant: nouveauMontant
      }
    ];
    
    // Mettre à jour la facture
    await facture.update({
      montant: nouveauMontant,
      prestations_details: JSON.stringify(newPrestations),
      description: `Facture modifiée - ${nouveauMontant} CAD`
    });
    
    console.log('✅ Facture mise à jour avec succès');
    
    // Vérifier la modification
    await facture.reload();
    console.log('📋 Facture après modification:', {
      id: facture.id,
      numero: facture.numero_facture,
      montant: facture.montant,
      prestations_details: facture.prestations_details
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setFactureAmount()
    .then(() => {
      console.log('✅ Modification terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = setFactureAmount; 