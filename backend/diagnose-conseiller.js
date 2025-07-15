/**
 * Script de diagnostic spécifique pour conseiller qui ne voit pas ses leads
 */

const { getSequelize } = require('./config/db.config');
const { Op } = require('sequelize');

async function diagnoseConseillerLeads(conseillerId) {
  try {
    console.log(`🔍 Diagnostic pour le conseiller ID ${conseillerId}\n`);
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;
    
    // Récupérer les infos du conseiller
    const conseiller = await User.findByPk(conseillerId);
    if (!conseiller) {
      console.log('❌ Conseiller non trouvé');
      return;
    }
    
    console.log('👤 Conseiller:', conseiller.prenom, conseiller.nom, `(${conseiller.role})`);
    console.log('📧 Email:', conseiller.email);
    
    const fullName = `${conseiller.prenom} ${conseiller.nom}`;
    console.log('📝 Nom complet formaté:', `"${fullName}"`);
    console.log('');
    
    // 1. Compter tous les leads
    const totalLeads = await Lead.count();
    console.log(`📊 Total des leads dans la base: ${totalLeads}`);
    
    // 2. Leads assignés via conseiller_id
    const leadsByIdCount = await Lead.count({
      where: { conseiller_id: conseillerId }
    });
    console.log(`🎯 Leads avec conseiller_id=${conseillerId}: ${leadsByIdCount}`);
    
    if (leadsByIdCount > 0) {
      const leadsByIdSample = await Lead.findAll({
        where: { conseiller_id: conseillerId },
        attributes: ['id', 'nom', 'prenom', 'conseillere'],
        limit: 3
      });
      
      leadsByIdSample.forEach(lead => {
        console.log(`   - Lead ${lead.id}: ${lead.prenom} ${lead.nom} (conseillere: "${lead.conseillere}")`);
      });
    }
    
    // 3. Leads assignés via nom exact
    const leadsByNameCount = await Lead.count({
      where: { conseillere: fullName }
    });
    console.log(`📝 Leads avec conseillere="${fullName}": ${leadsByNameCount}`);
    
    // 4. Leads assignés via nom lowercase
    const leadsByNameLowerCount = await Lead.count({
      where: { conseillere: fullName.toLowerCase() }
    });
    console.log(`📝 Leads avec conseillere="${fullName.toLowerCase()}": ${leadsByNameLowerCount}`);
    
    // 5. Chercher toutes les variations de nom
    console.log('\n🔍 Recherche de variations de nom...');
    
    const nameVariations = [
      fullName,
      fullName.toLowerCase(),
      `${conseiller.nom} ${conseiller.prenom}`, // Nom Prénom au lieu de Prénom Nom
      `${conseiller.nom.toLowerCase()} ${conseiller.prenom.toLowerCase()}`,
      conseiller.prenom,
      conseiller.nom
    ];
    
    for (const variation of nameVariations) {
      const count = await Lead.count({
        where: { conseillere: variation }
      });
      if (count > 0) {
        console.log(`   ✅ "${variation}": ${count} leads`);
        
        // Montrer quelques exemples
        const examples = await Lead.findAll({
          where: { conseillere: variation },
          attributes: ['id', 'nom', 'prenom'],
          limit: 2
        });
        examples.forEach(ex => {
          console.log(`      → Lead ${ex.id}: ${ex.prenom} ${ex.nom}`);
        });
      }
    }
    
    // 6. Leads non assignés
    const unassignedCount = await Lead.count({
      where: {
        [Op.and]: [
          { 
            [Op.or]: [
              { conseiller_id: { [Op.is]: null } },
              { conseiller_id: '' }
            ]
          },
          {
            [Op.or]: [
              { conseillere: { [Op.is]: null } },
              { conseillere: '' }
            ]
          }
        ]
      }
    });
    console.log(`\n⚪ Leads non assignés (disponibles): ${unassignedCount}`);
    
    // 7. Simuler la requête de filtrage
    console.log('\n🧪 Simulation de la requête de filtrage...');
    
    const whereConditions = {
      [Op.or]: [
        // Leads assignés via conseiller_id (priorité absolue)
        { conseiller_id: conseillerId },
        // Leads assignés via le nom dans conseillere (exactement le même nom)
        { 
          [Op.and]: [
            { conseiller_id: { [Op.is]: null } },
            {
              [Op.or]: [
                { conseillere: fullName },
                { conseillere: fullName.toLowerCase() }
              ]
            }
          ]
        },
        // SEULEMENT les leads vraiment non assignés (ni conseiller_id ni conseillere)
        { 
          [Op.and]: [
            { 
              [Op.or]: [
                { conseiller_id: { [Op.is]: null } },
                { conseiller_id: '' }
              ]
            },
            {
              [Op.or]: [
                { conseillere: { [Op.is]: null } },
                { conseillere: '' }
              ]
            }
          ]
        }
      ]
    };
    
    const filteredLeads = await Lead.findAll({
      where: whereConditions,
      attributes: ['id', 'nom', 'prenom', 'conseiller_id', 'conseillere'],
      order: [['date_creation', 'DESC']]
    });
    
    console.log(`🎯 Résultat de la requête filtrée: ${filteredLeads.length} leads`);
    
    if (filteredLeads.length > 0) {
      console.log('\n📋 Détail des leads trouvés:');
      filteredLeads.forEach((lead, index) => {
        const isDirectlyAssigned = lead.conseiller_id === conseillerId;
        const isAssignedByName = !lead.conseiller_id && (
          lead.conseillere === fullName || 
          lead.conseillere === fullName.toLowerCase()
        );
        const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                                 (!lead.conseillere || lead.conseillere === '');
        
        const reason = isDirectlyAssigned ? 'ID match' : 
                      isAssignedByName ? 'Nom match' : 
                      isTrulyUnassigned ? 'Non assigné' : 'ERREUR';
        
        console.log(`   ${index + 1}. Lead ${lead.id}: ${lead.prenom} ${lead.nom}`);
        console.log(`      conseiller_id: ${lead.conseiller_id || 'NULL'}`);
        console.log(`      conseillere: "${lead.conseillere || 'NULL'}"`);
        console.log(`      Motif: ${reason}`);
        console.log('');
      });
    } else {
      console.log('❌ AUCUN LEAD TROUVÉ - Le conseiller ne devrait voir aucun lead avec la logique actuelle');
      
      // Suggestions de correction
      console.log('\n💡 Suggestions de correction:');
      
      // Chercher des leads qui pourraient appartenir au conseiller
      const potentialLeads = await Lead.findAll({
        where: {
          [Op.or]: [
            { conseillere: { [Op.like]: `%${conseiller.prenom}%` } },
            { conseillere: { [Op.like]: `%${conseiller.nom}%` } }
          ]
        },
        attributes: ['id', 'nom', 'prenom', 'conseiller_id', 'conseillere'],
        limit: 5
      });
      
      if (potentialLeads.length > 0) {
        console.log('   🔍 Leads potentiellement liés (à corriger):');
        potentialLeads.forEach(lead => {
          console.log(`     Lead ${lead.id}: conseillere="${lead.conseillere}"`);
          console.log(`     → Corriger en: conseiller_id=${conseillerId}, conseillere="${fullName}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    process.exit(0);
  }
}

// Fonction pour corriger automatiquement les assignations
async function fixConseillerAssignments(conseillerId) {
  try {
    console.log(`🔧 Correction des assignations pour le conseiller ID ${conseillerId}...\n`);
    
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;
    
    const conseiller = await User.findByPk(conseillerId);
    if (!conseiller) {
      console.log('❌ Conseiller non trouvé');
      return;
    }
    
    const fullName = `${conseiller.prenom} ${conseiller.nom}`;
    console.log(`👤 Conseiller: ${fullName}`);
    
    // Chercher des leads avec des variations de nom
    const leadsToFix = await Lead.findAll({
      where: {
        [Op.and]: [
          { conseiller_id: { [Op.is]: null } },
          {
            [Op.or]: [
              { conseillere: { [Op.like]: `%${conseiller.prenom}%` } },
              { conseillere: { [Op.like]: `%${conseiller.nom}%` } },
              { conseillere: `${conseiller.nom} ${conseiller.prenom}` } // Nom Prénom inversé
            ]
          }
        ]
      }
    });
    
    if (leadsToFix.length === 0) {
      console.log('✅ Aucune correction nécessaire');
      return;
    }
    
    console.log(`📝 ${leadsToFix.length} leads à corriger:`);
    
    for (const lead of leadsToFix) {
      console.log(`   Lead ${lead.id}: "${lead.conseillere}" → "${fullName}"`);
      
      await lead.update({
        conseiller_id: conseillerId,
        conseillere: fullName
      });
    }
    
    console.log(`\n✅ ${leadsToFix.length} leads corrigés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const conseillerId = args[0];
  
  if (!conseillerId) {
    console.log('❌ Usage: node diagnose-conseiller.js <CONSEILLER_ID> [--fix]');
    console.log('   Exemple: node diagnose-conseiller.js 5');
    console.log('   Avec correction: node diagnose-conseiller.js 5 --fix');
    process.exit(1);
  }
  
  if (args.includes('--fix')) {
    await fixConseillerAssignments(parseInt(conseillerId));
  }
  
  await diagnoseConseillerLeads(parseInt(conseillerId));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnoseConseillerLeads, fixConseillerAssignments };
