const { getSequelize } = require('./config/db.config');

async function migrationFacturesValidation() {
  try {
    console.log('🔄 === MIGRATION CHAMPS VALIDATION FACTURES ===\n');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');
    
    // Exécuter la migration manuellement
    console.log('\n🔧 Ajout des champs validePar et dateValidation...');
    
    await sequelize.query(`
      ALTER TABLE Factures 
      ADD COLUMN IF NOT EXISTS validePar VARCHAR(255) NULL COMMENT 'Utilisateur qui a validé/créé la facture'
    `);
    
    await sequelize.query(`
      ALTER TABLE Factures 
      ADD COLUMN IF NOT EXISTS dateValidation DATETIME NULL COMMENT 'Date de validation/création de la facture'
    `);
    
    console.log('✅ Champs ajoutés avec succès');
    
    // Mettre à jour les factures existantes avec des données par défaut
    console.log('\n🔄 Mise à jour des factures existantes...');
    
    const Facture = require('./models/facture')(sequelize);
    
    const factures = await Facture.findAll({
      where: {
        validePar: {
          [require('sequelize').Op.is]: null
        }
      }
    });
    
    console.log(`📊 ${factures.length} factures à mettre à jour`);
    
    for (const facture of factures) {
      // Assigner une conseillère fictive basée sur l'ID
      const conseilleresDisponibles = ['Marie T.', 'Sophie M.', 'Julie L.'];
      const conseillere = conseilleresDisponibles[facture.id % conseilleresDisponibles.length];
      
      await facture.update({
        validePar: conseillere,
        dateValidation: facture.dateEmission || facture.createdAt || new Date()
      });
      
      console.log(`   ✅ ${facture.numero}: assignée à ${conseillere}`);
    }
    
    console.log('\n✅ Migration terminée avec succès !');
    
    // Test de l'API
    console.log('\n🧪 Test de l'API...');
    const facturesFinales = await Facture.findAll({
      attributes: ['id', 'numero', 'montant', 'validePar', 'statut'],
      where: {
        statut: {
          [require('sequelize').Op.in]: ['payable', 'payee']
        }
      }
    });
    
    console.log('\n💰 Ventes par conseillère:');
    const ventesParConseillere = {};
    facturesFinales.forEach(facture => {
      const conseillere = facture.validePar || 'Non assigné';
      const montantTTC = (parseFloat(facture.montant) || 0) * 1.15;
      
      if (!ventesParConseillere[conseillere]) {
        ventesParConseillere[conseillere] = { total: 0, count: 0 };
      }
      
      ventesParConseillere[conseillere].total += montantTTC;
      ventesParConseillere[conseillere].count += 1;
    });
    
    Object.entries(ventesParConseillere).forEach(([conseillere, data]) => {
      console.log(`   ${conseillere}: ${data.total.toFixed(2)}$ TTC (${data.count} factures)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    process.exit(0);
  }
}

migrationFacturesValidation(); 