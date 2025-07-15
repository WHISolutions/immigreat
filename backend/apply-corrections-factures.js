const { getSequelize } = require('./config/db.config');

async function applyCorrectionFactures() {
  try {
    console.log('🔧 === APPLICATION DES CORRECTIONS FACTURES ===\n');
    
    // Obtenir la connexion sequelize initialisée
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');
    
    // Initialiser le modèle Facture
    const Facture = require('./models/facture')(sequelize);
    
    // Récupérer toutes les factures
    const factures = await Facture.findAll();
    
    console.log(`📊 ${factures.length} facture(s) à analyser\n`);
    
    let facturesCorrigees = 0;
    let erreurs = [];
    
    for (const facture of factures) {
      console.log(`\n🔍 === FACTURE ${facture.numero} ===`);
      
      // Analyser les prestations_details
      let prestations = [];
      if (facture.prestations_details) {
        try {
          prestations = JSON.parse(facture.prestations_details);
          console.log(`📋 Prestations trouvées: ${prestations.length}`);
        } catch (error) {
          console.log(`❌ Erreur parsing prestations_details: ${error.message}`);
          prestations = [];
        }
      }
      
      // Calculer la somme des prestations et montant principal
      const sommePrestations = prestations.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
      const montantPrincipal = parseFloat(facture.montant) || 0;
      
      console.log(`💰 Montant principal: ${montantPrincipal} $`);
      console.log(`💰 Somme prestations: ${sommePrestations} $`);
      
      // Vérifier si une correction est nécessaire (tolérance de 0.01$ pour les erreurs d'arrondi)
      const estCoherent = Math.abs(sommePrestations - montantPrincipal) < 0.01;
      
      if (estCoherent) {
        console.log(`✅ Déjà cohérent, aucune correction nécessaire`);
        continue;
      }
      
      console.log(`⚠️ Incohérence détectée, correction en cours...`);
      
      try {
        let montantCorrige;
        let prestationsCorrigees;
        
        // Stratégie de correction : 
        // 1. Si les prestations existent et ont un montant total > 0, utiliser ce montant
        // 2. Sinon, créer une prestation correspondant au montant principal
        
        if (prestations.length > 0 && sommePrestations > 0) {
          // Cas 1: Utiliser le montant des prestations comme référence
          montantCorrige = Math.round(sommePrestations * 100) / 100;
          prestationsCorrigees = prestations.map(p => ({
            description: p.description || 'Service de consultation',
            montant: parseFloat(p.montant) || 0
          }));
          
          console.log(`🔧 Correction: Utilisation du montant des prestations (${montantCorrige} $)`);
          
        } else {
          // Cas 2: Créer une prestation correspondant au montant principal
          montantCorrige = Math.round(montantPrincipal * 100) / 100;
          prestationsCorrigees = [{
            description: `Service de consultation - ${montantCorrige} CAD`,
            montant: montantCorrige
          }];
          
          console.log(`🔧 Correction: Création d'une prestation pour ${montantCorrige} $`);
        }
        
        // Mettre à jour la facture
        await facture.update({
          montant: montantCorrige,
          prestations_details: JSON.stringify(prestationsCorrigees)
        });
        
        console.log(`✅ Facture ${facture.numero} corrigée avec succès`);
        console.log(`   Nouveau montant: ${montantCorrige} $`);
        console.log(`   Prestations mises à jour: ${prestationsCorrigees.length} ligne(s)`);
        
        facturesCorrigees++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de la correction de ${facture.numero}:`, error.message);
        erreurs.push({
          numero: facture.numero,
          erreur: error.message
        });
      }
      
      console.log(`${'='.repeat(50)}`);
    }
    
    // Rapport final
    console.log(`\n\n📊 === RAPPORT DE CORRECTION ===`);
    console.log(`✅ Factures corrigées: ${facturesCorrigees}`);
    console.log(`❌ Erreurs: ${erreurs.length}`);
    console.log(`📊 Total factures: ${factures.length}`);
    
    if (erreurs.length > 0) {
      console.log(`\n❌ === ERREURS RENCONTREES ===`);
      erreurs.forEach((erreur, index) => {
        console.log(`${index + 1}. ${erreur.numero}: ${erreur.erreur}`);
      });
    }
    
    console.log(`\n💡 Pour vérifier les corrections, exécutez:`);
    console.log(`   node test-coherence-factures.js`);
    
    return {
      corrigees: facturesCorrigees,
      erreurs: erreurs.length,
      total: factures.length
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des corrections:', error);
    throw error;
  } finally {
    const sequelize = getSequelize();
    await sequelize.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  console.log('⚠️  ATTENTION: Ce script va modifier vos données de factures!');
  console.log('⚠️  Assurez-vous d\'avoir une sauvegarde avant de continuer.\n');
  
  // Petit délai pour permettre à l'utilisateur de lire l'avertissement
  setTimeout(() => {
    applyCorrectionFactures()
      .then(result => {
        console.log(`\n✅ Corrections appliquées avec succès`);
        console.log(`📊 ${result.corrigees} factures corrigées sur ${result.total}`);
        process.exit(result.erreurs > 0 ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        process.exit(1);
      });
  }, 1000);
}

module.exports = applyCorrectionFactures; 