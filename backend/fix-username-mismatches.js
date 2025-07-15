const { getSequelize } = require('./config/db.config');
const { Op } = require('sequelize');

async function fixUsernameMismatches() {
  try {
    console.log('🔧 CORRECTION DES INCOHÉRENCES DE NOMS UTILISATEURS\n');

    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    const initializeModels = require('./models');
    initializeModels();
    
    const User = sequelize.models.User;
    const Lead = sequelize.models.Lead;

    // 1. Récupérer tous les conseillers actifs
    const conseillers = await User.findAll({
      where: { role: 'conseillere', actif: true },
      attributes: ['id', 'nom', 'prenom', 'email'],
      order: [['nom', 'ASC']]
    });

    console.log(`✅ ${conseillers.length} conseillers actifs trouvés`);

    // 2. Corriger les espaces en trop dans les noms des utilisateurs
    console.log('\n2. Correction des espaces en trop dans les noms utilisateurs...');
    let usersCorrected = 0;
    
    for (const user of conseillers) {
      const nomTrimmed = user.nom.trim();
      const prenomTrimmed = user.prenom.trim();
      
      if (user.nom !== nomTrimmed || user.prenom !== prenomTrimmed) {
        await user.update({
          nom: nomTrimmed,
          prenom: prenomTrimmed
        });
        console.log(`   ✅ Utilisateur ${user.id}: "${user.prenom} ${user.nom}" → "${prenomTrimmed} ${nomTrimmed}"`);
        usersCorrected++;
      }
    }
    
    console.log(`📊 ${usersCorrected} utilisateurs corrigés`);

    // 3. Recharger les conseillers après correction
    const conseillersCorriges = await User.findAll({
      where: { role: 'conseillere', actif: true },
      attributes: ['id', 'nom', 'prenom', 'email'],
      order: [['nom', 'ASC']]
    });

    // 4. Corriger les leads avec des noms incohérents
    console.log('\n3. Correction des noms dans les leads...');
    
    const leadsToFix = await Lead.findAll({
      where: {
        conseillere: { [Op.not]: null }
      },
      attributes: ['id', 'nom', 'prenom', 'conseillere', 'conseiller_id'],
      order: [['id', 'ASC']]
    });

    let leadsCorrected = 0;
    let leadsReassigned = 0;

    for (const lead of leadsToFix) {
      const currentConseillere = lead.conseillere.trim();
      
      // Chercher le conseiller correspondant
      let matchingConseiller = null;
      
      // 1. Recherche exacte
      matchingConseiller = conseillersCorriges.find(c => 
        `${c.prenom} ${c.nom}` === currentConseillere
      );
      
      // 2. Recherche insensible à la casse
      if (!matchingConseiller) {
        matchingConseiller = conseillersCorriges.find(c => 
          `${c.prenom} ${c.nom}`.toLowerCase() === currentConseillere.toLowerCase()
        );
      }
      
      // 3. Recherche partielle (contient le nom)
      if (!matchingConseiller) {
        matchingConseiller = conseillersCorriges.find(c => {
          const fullName = `${c.prenom} ${c.nom}`.toLowerCase();
          const leadName = currentConseillere.toLowerCase();
          return fullName.includes(leadName) || leadName.includes(fullName);
        });
      }
      
      if (matchingConseiller) {
        const correctName = `${matchingConseiller.prenom} ${matchingConseiller.nom}`;
        
        // Mettre à jour le lead avec le nom et l'ID corrects
        if (lead.conseillere !== correctName || lead.conseiller_id !== matchingConseiller.id) {
          await lead.update({
            conseillere: correctName,
            conseiller_id: matchingConseiller.id
          });
          
          console.log(`   ✅ Lead ${lead.id}: "${lead.conseillere}" → "${correctName}" (ID: ${matchingConseiller.id})`);
          leadsCorrected++;
        }
      } else {
        // Aucun conseiller correspondant trouvé - lead orphelin
        console.log(`   ⚠️ Lead ${lead.id}: "${currentConseillere}" - aucun conseiller correspondant trouvé`);
        
        // Option: réassigner à un conseiller par défaut ou laisser non assigné
        // Pour l'instant, on laisse tel quel mais on peut les réassigner
        leadsReassigned++;
      }
    }

    console.log(`📊 ${leadsCorrected} leads corrigés`);
    console.log(`📊 ${leadsReassigned} leads orphelins détectés`);

    // 5. Vérification finale
    console.log('\n4. Vérification finale...');
    
    const finalLeads = await Lead.findAll({
      where: {
        conseillere: { [Op.not]: null }
      },
      attributes: ['conseillere'],
      group: ['conseillere'],
      order: [['conseillere', 'ASC']]
    });

    const finalConseillers = conseillersCorriges.map(c => `${c.prenom} ${c.nom}`);
    
    console.log('\n   📊 Noms finaux dans les leads:');
    finalLeads.forEach(lead => {
      const isValid = finalConseillers.includes(lead.conseillere);
      console.log(`      ${isValid ? '✅' : '❌'} "${lead.conseillere}"`);
    });

    console.log('\n🎉 CORRECTION TERMINÉE !');
    console.log(`   ✅ ${usersCorrected} utilisateurs corrigés`);
    console.log(`   ✅ ${leadsCorrected} leads corrigés`);
    console.log(`   ⚠️ ${leadsReassigned} leads orphelins à vérifier`);
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('   1. Rechargez la page frontend (F5)');
    console.log('   2. Connectez-vous en tant que conseillère');
    console.log('   3. Vérifiez que vous voyez vos leads assignés');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter la correction
fixUsernameMismatches(); 