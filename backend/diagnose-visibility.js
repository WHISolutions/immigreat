/**
 * Script pour diagnostiquer et corriger le problème de visibilité inter-conseillers
 */

const { getSequelize } = require('./config/db.config');
const { Op } = require('sequelize');

async function diagnoseLeadVisibility() {
  try {
    console.log('🔍 Diagnostic de la visibilité des leads entre conseillers\n');
    
    const sequelize = getSequelize();
    await sequelize.authenticate();
    
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;
    
    // 1. Lister tous les conseillers
    const conseillers = await User.findAll({
      where: { role: ['admin', 'conseillere'] },
      attributes: ['id', 'nom', 'prenom', 'role'],
      order: [['nom', 'ASC']]
    });
    
    console.log('👥 Conseillers dans le système:');
    conseillers.forEach(c => {
      console.log(`   ID: ${c.id} - ${c.prenom} ${c.nom} (${c.role})`);
    });
    
    // 2. Analyser tous les leads
    const allLeads = await Lead.findAll({
      attributes: ['id', 'nom', 'prenom', 'conseiller_id', 'conseillere'],
      order: [['id', 'ASC']]
    });
    
    console.log(`\n📊 Analyse de ${allLeads.length} leads:`);
    
    const leadsByAssignment = {
      withConseillerIdOnly: [],
      withConseillerNameOnly: [],
      withBoth: [],
      withNeither: [],
      conflicts: []
    };
    
    allLeads.forEach(lead => {
      const hasId = lead.conseiller_id !== null && lead.conseiller_id !== '';
      const hasName = lead.conseillere !== null && lead.conseillere !== '';
      
      if (hasId && hasName) {
        // Vérifier la cohérence
        const conseiller = conseillers.find(c => c.id === lead.conseiller_id);
        const expectedName = conseiller ? `${conseiller.prenom} ${conseiller.nom}` : 'INCONNU';
        
        if (lead.conseillere === expectedName || lead.conseillere === expectedName.toLowerCase()) {
          leadsByAssignment.withBoth.push(lead);
        } else {
          leadsByAssignment.conflicts.push({
            lead,
            expectedName,
            actualName: lead.conseillere
          });
        }
      } else if (hasId && !hasName) {
        leadsByAssignment.withConseillerIdOnly.push(lead);
      } else if (!hasId && hasName) {
        leadsByAssignment.withConseillerNameOnly.push(lead);
      } else {
        leadsByAssignment.withNeither.push(lead);
      }
    });
    
    console.log(`   ✅ Avec conseiller_id ET nom cohérent: ${leadsByAssignment.withBoth.length}`);
    console.log(`   🔶 Avec conseiller_id seulement: ${leadsByAssignment.withConseillerIdOnly.length}`);
    console.log(`   🔶 Avec nom conseiller seulement: ${leadsByAssignment.withConseillerNameOnly.length}`);
    console.log(`   ⚪ Non assignés: ${leadsByAssignment.withNeither.length}`);
    console.log(`   ❌ Conflits (ID et nom ne correspondent pas): ${leadsByAssignment.conflicts.length}`);
    
    // 3. Détailler les problèmes
    if (leadsByAssignment.conflicts.length > 0) {
      console.log('\n❌ Conflits détectés:');
      leadsByAssignment.conflicts.forEach(conflict => {
        console.log(`   Lead ${conflict.lead.id}: ${conflict.lead.prenom} ${conflict.lead.nom}`);
        console.log(`     conseiller_id: ${conflict.lead.conseiller_id} (attendu: "${conflict.expectedName}")`);
        console.log(`     conseillere: "${conflict.actualName}"`);
      });
    }
    
    if (leadsByAssignment.withConseillerNameOnly.length > 0) {
      console.log('\n🔶 Leads avec nom de conseiller seulement:');
      leadsByAssignment.withConseillerNameOnly.forEach(lead => {
        console.log(`   Lead ${lead.id}: ${lead.prenom} ${lead.nom} -> "${lead.conseillere}"`);
        
        // Chercher le conseiller correspondant
        const matchingConseiller = conseillers.find(c => {
          const fullName = `${c.prenom} ${c.nom}`;
          return fullName === lead.conseillere || 
                 fullName.toLowerCase() === lead.conseillere.toLowerCase();
        });
        
        if (matchingConseiller) {
          console.log(`     -> Peut être lié au conseiller ID ${matchingConseiller.id}`);
        } else {
          console.log(`     -> ⚠️  Aucun conseiller correspondant trouvé!`);
        }
      });
    }
    
    // 4. Simuler les filtres pour chaque conseiller
    console.log('\n🧪 Test de visibilité pour chaque conseiller:');
    
    for (const conseiller of conseillers.filter(c => c.role === 'conseillere')) {
      const fullName = `${conseiller.prenom} ${conseiller.nom}`;
      
      const visibleLeads = allLeads.filter(lead => {
        const isDirectlyAssigned = lead.conseiller_id === conseiller.id;
        const isAssignedByName = !lead.conseiller_id && (
          lead.conseillere === fullName || 
          lead.conseillere === fullName.toLowerCase()
        );
        const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                                 (!lead.conseillere || lead.conseillere === '');
        
        return isDirectlyAssigned || isAssignedByName || isTrulyUnassigned;
      });
      
      console.log(`\n   ${fullName} (ID: ${conseiller.id}) peut voir ${visibleLeads.length} leads:`);
      
      visibleLeads.forEach(lead => {
        const isDirectlyAssigned = lead.conseiller_id === conseiller.id;
        const isAssignedByName = !lead.conseiller_id && (
          lead.conseillere === fullName || 
          lead.conseillere === fullName.toLowerCase()
        );
        const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                                 (!lead.conseillere || lead.conseillere === '');
        
        const reason = isDirectlyAssigned ? 'ID match' : 
                      isAssignedByName ? 'Nom match' : 
                      isTrulyUnassigned ? 'Non assigné' : 'ERREUR';
        
        console.log(`     - Lead ${lead.id}: ${lead.prenom} ${lead.nom} (${reason})`);
        if (lead.conseillere && lead.conseillere !== fullName && lead.conseillere !== fullName.toLowerCase()) {
          console.log(`       ⚠️  PROBLÈME: assigné à "${lead.conseillere}" mais visible par ${fullName}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    process.exit(0);
  }
}

async function fixLeadAssignments() {
  try {
    console.log('🔧 Correction des assignations de leads...\n');
    
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;
    
    // Récupérer tous les conseillers
    const conseillers = await User.findAll({
      where: { role: ['admin', 'conseillere'] },
      attributes: ['id', 'nom', 'prenom'],
      order: [['nom', 'ASC']]
    });
    
    // Corriger les leads avec nom de conseiller mais sans ID
    const leadsToFix = await Lead.findAll({
      where: {
        conseiller_id: { [Op.is]: null },
        conseillere: { [Op.not]: null }
      }
    });
    
    console.log(`📝 ${leadsToFix.length} leads à corriger...`);
    
    let fixedCount = 0;
    
    for (const lead of leadsToFix) {
      const matchingConseiller = conseillers.find(c => {
        const fullName = `${c.prenom} ${c.nom}`;
        return fullName === lead.conseillere || 
               fullName.toLowerCase() === lead.conseillere.toLowerCase();
      });
      
      if (matchingConseiller) {
        await lead.update({
          conseiller_id: matchingConseiller.id,
          conseillere: `${matchingConseiller.prenom} ${matchingConseiller.nom}`
        });
        
        console.log(`✅ Lead ${lead.id} corrigé: assigné au conseiller ID ${matchingConseiller.id}`);
        fixedCount++;
      } else {
        console.log(`⚠️  Lead ${lead.id}: impossible de trouver le conseiller "${lead.conseillere}"`);
      }
    }
    
    console.log(`\n🎯 ${fixedCount} leads corrigés sur ${leadsToFix.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    await fixLeadAssignments();
  }
  
  await diagnoseLeadVisibility();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnoseLeadVisibility, fixLeadAssignments };
