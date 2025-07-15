/**
 * Script de diagnostic pour les activités récentes
 * Permet de vérifier directement dans la base de données
 */

const { getSequelize } = require('./backend/config/db.config');

async function diagnostiquerActivitesRecentes() {
  console.log('🔍 Diagnostic des activités récentes...\n');
  
  try {
    const sequelize = getSequelize();
    
    // Date de référence (7 derniers jours)
    const dateDepuis = new Date();
    dateDepuis.setDate(dateDepuis.getDate() - 7);
    const dateDepuisStr = dateDepuis.toISOString().split('T')[0];
    
    console.log(`📅 Recherche d'activités depuis: ${dateDepuisStr}`);
    console.log(`📅 Date/heure actuelle: ${new Date().toISOString()}\n`);
    
    // 1. Vérifier les leads récents
    console.log('🔍 1. Vérification des leads récents:');
    const [leadsRecents] = await sequelize.query(`
      SELECT 
        id,
        prenom,
        nom,
        conseillere,
        date_creation,
        statut
      FROM leads 
      WHERE date_creation >= :dateDepuis
      ORDER BY date_creation DESC
      LIMIT 20
    `, {
      replacements: { dateDepuis: dateDepuisStr }
    });
    
    if (leadsRecents.length > 0) {
      console.log(`   ✅ ${leadsRecents.length} leads trouvés:`);
      leadsRecents.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.prenom} ${lead.nom} - Conseillère: "${lead.conseillere || 'Non assigné'}" - Date: ${lead.date_creation} - Statut: ${lead.statut}`);
      });
    } else {
      console.log('   ❌ Aucun lead trouvé dans les 7 derniers jours');
    }
    
    // 2. Vérifier tous les leads (indépendamment de la date)
    console.log('\n🔍 2. Vérification de tous les leads récents (sans filtre de date):');
    const [tousLesLeads] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        MAX(date_creation) as derniere_creation
      FROM leads
    `);
    
    console.log(`   📊 Total leads en base: ${tousLesLeads[0].total}`);
    console.log(`   📅 Dernière création: ${tousLesLeads[0].derniere_creation}`);
    
    // 3. Vérifier les leads du jour
    const aujourdhui = new Date().toISOString().split('T')[0];
    const [leadsAujourdhui] = await sequelize.query(`
      SELECT 
        id,
        prenom,
        nom,
        conseillere,
        date_creation
      FROM leads 
      WHERE DATE(date_creation) = :aujourdhui
      ORDER BY date_creation DESC
    `, {
      replacements: { aujourdhui }
    });
    
    console.log(`\n🔍 3. Leads créés aujourd'hui (${aujourdhui}):`);
    if (leadsAujourdhui.length > 0) {
      console.log(`   ✅ ${leadsAujourdhui.length} leads créés aujourd'hui:`);
      leadsAujourdhui.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.prenom} ${lead.nom} - Conseillère: "${lead.conseillere || 'Non assigné'}" - Date: ${lead.date_creation}`);
      });
    } else {
      console.log('   ❌ Aucun lead créé aujourd\'hui');
    }
    
    // 4. Vérifier les clients récents
    console.log('\n🔍 4. Vérification des clients récents:');
    const [clientsRecents] = await sequelize.query(`
      SELECT 
        id,
        prenom,
        nom,
        conseillere,
        date_modification,
        statut
      FROM clients 
      WHERE date_modification >= :dateDepuis
      ORDER BY date_modification DESC
      LIMIT 10
    `, {
      replacements: { dateDepuis: dateDepuisStr }
    });
    
    if (clientsRecents.length > 0) {
      console.log(`   ✅ ${clientsRecents.length} clients modifiés:`);
      clientsRecents.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.prenom} ${client.nom} - Conseillère: "${client.conseillere || 'Non assigné'}" - Date: ${client.date_modification}`);
      });
    } else {
      console.log('   ❌ Aucun client modifié dans les 7 derniers jours');
    }
    
    // 5. Vérifier les factures récentes
    console.log('\n🔍 5. Vérification des factures récentes:');
    try {
      const [facturesRecentes] = await sequelize.query(`
        SELECT 
          id,
          numero,
          client,
          validePar,
          dateEmission,
          statut
        FROM factures 
        WHERE dateEmission >= :dateDepuis
        ORDER BY dateEmission DESC
        LIMIT 10
      `, {
        replacements: { dateDepuis: dateDepuisStr }
      });
      
      if (facturesRecentes.length > 0) {
        console.log(`   ✅ ${facturesRecentes.length} factures créées:`);
        facturesRecentes.forEach((facture, index) => {
          console.log(`   ${index + 1}. ${facture.numero} - Client: ${facture.client} - Validée par: "${facture.validePar || 'Non validé'}" - Date: ${facture.dateEmission}`);
        });
      } else {
        console.log('   ❌ Aucune facture créée dans les 7 derniers jours');
      }
    } catch (error) {
      console.log('   ⚠️ Table factures non accessible:', error.message);
    }
    
    // 6. Vérifier les rendez-vous récents
    console.log('\n🔍 6. Vérification des rendez-vous récents:');
    try {
      const [rdvRecents] = await sequelize.query(`
        SELECT 
          id,
          client_nom,
          conseillere_nom,
          date_rdv,
          type_rdv,
          createdAt
        FROM rendezvous 
        WHERE createdAt >= :dateDepuis
        ORDER BY createdAt DESC
        LIMIT 10
      `, {
        replacements: { dateDepuis: dateDepuisStr }
      });
      
      if (rdvRecents.length > 0) {
        console.log(`   ✅ ${rdvRecents.length} rendez-vous créés:`);
        rdvRecents.forEach((rdv, index) => {
          console.log(`   ${index + 1}. ${rdv.client_nom} - Conseillère: "${rdv.conseillere_nom || 'Non assigné'}" - Date RDV: ${rdv.date_rdv} - Créé: ${rdv.createdAt}`);
        });
      } else {
        console.log('   ❌ Aucun rendez-vous créé dans les 7 derniers jours');
      }
    } catch (error) {
      console.log('   ⚠️ Table rendezvous non accessible:', error.message);
    }
    
    console.log('\n✅ Diagnostic terminé!');
    console.log('\n💡 Recommandations:');
    console.log('   1. Vérifiez que le lead a bien été créé avec une date récente');
    console.log('   2. Vérifiez que le champ "conseillere" est correctement rempli');
    console.log('   3. Vérifiez que vous êtes connecté avec le bon compte utilisateur');
    console.log('   4. Actualisez la page des activités récentes');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    throw error;
  }
}

// Exécuter le diagnostic si le script est appelé directement
if (require.main === module) {
  diagnostiquerActivitesRecentes()
    .then(() => {
      console.log('\n🎉 Diagnostic terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { diagnostiquerActivitesRecentes };
