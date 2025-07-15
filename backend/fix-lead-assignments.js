const { getSequelize } = require('./config/db.config');
const { Op } = require('sequelize');

async function fixLeadAssignments() {
  try {
    console.log('🔧 CORRECTION DES ASSIGNATIONS DE LEADS\n');

    // Initialiser la connexion à la base de données
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Initialiser les modèles
    const initializeModels = require('./models');
    const db = initializeModels();
    
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;

    if (!Lead || !User) {
      console.log('❌ Modèles Lead ou User non disponibles');
      return;
    }

    // 1. Récupérer tous les conseillers
    console.log('\n1. Récupération des conseillers...');
    const conseillers = await User.findAll({
      where: { 
        role: ['admin', 'conseillere'],
        actif: true 
      },
      attributes: ['id', 'nom', 'prenom', 'email', 'role'],
      order: [['nom', 'ASC']]
    });

    console.log(`✅ ${conseillers.length} conseillers trouvés:`);
    conseillers.forEach(c => {
      console.log(`   - ${c.prenom} ${c.nom} (ID: ${c.id}, Role: ${c.role})`);
    });

    // 2. Récupérer tous les leads avec conseiller_id mais sans conseillere correct
    console.log('\n2. Recherche des leads à corriger...');
    const leadsToFix = await Lead.findAll({
      where: {
        conseiller_id: { [Op.not]: null }
      },
      attributes: ['id', 'nom', 'prenom', 'conseiller_id', 'conseillere'],
      order: [['id', 'ASC']]
    });

    console.log(`📝 ${leadsToFix.length} leads avec conseiller_id trouvés`);

    // 3. Corriger chaque lead
    let fixedCount = 0;
    let errorCount = 0;

    for (const lead of leadsToFix) {
      const conseiller = conseillers.find(c => c.id === lead.conseiller_id);
      
      if (conseiller) {
        const correctName = `${conseiller.prenom} ${conseiller.nom}`;
        
        // Vérifier si le nom est déjà correct
        if (lead.conseillere !== correctName) {
          try {
            await lead.update({
              conseillere: correctName
            });
            
            console.log(`✅ Lead ${lead.id} (${lead.prenom} ${lead.nom}) corrigé:`);
            console.log(`   Ancien: "${lead.conseillere}" → Nouveau: "${correctName}"`);
            fixedCount++;
          } catch (error) {
            console.log(`❌ Erreur lead ${lead.id}: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✓ Lead ${lead.id} déjà correct (${correctName})`);
        }
      } else {
        console.log(`⚠️ Lead ${lead.id}: conseiller ID ${lead.conseiller_id} non trouvé`);
        errorCount++;
      }
    }

    // 4. Résumé
    console.log(`\n📊 RÉSUMÉ DE LA CORRECTION:`);
    console.log(`   ✅ Leads corrigés: ${fixedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📝 Total traité: ${leadsToFix.length}`);

    if (fixedCount > 0) {
      console.log('\n🎉 Correction terminée ! Les conseillères devraient maintenant voir leurs leads.');
      console.log('💡 Conseil: Rechargez la page côté frontend pour voir les changements.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter la correction
fixLeadAssignments(); 