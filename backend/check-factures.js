const { getSequelize } = require('./config/db.config');

async function checkFactures() {
  try {
    console.log('🔍 EXAMEN DES FACTURES\n');
    
    const sequelize = getSequelize();
    
    // 1. Structure de la table
    console.log('📋 STRUCTURE DE LA TABLE FACTURES:');
    console.log('==================================');
    
    const [factCols] = await sequelize.query('DESCRIBE factures');
    factCols.forEach(col => {
      console.log(`  - ${col.Field} : ${col.Type}`);
    });
    
    // 2. Examiner quelques factures
    console.log('\n📊 EXEMPLES DE FACTURES:');
    console.log('========================');
    
    const [sampleFactures] = await sequelize.query('SELECT * FROM factures LIMIT 3');
    
    sampleFactures.forEach((facture, index) => {
      console.log(`\nFacture ${index + 1} (ID: ${facture.id}):`);
      
      // Afficher toutes les colonnes qui pourraient contenir des noms
      Object.keys(facture).forEach(key => {
        const value = facture[key];
        if (value && typeof value === 'string') {
          // Afficher les colonnes susceptibles de contenir des noms de conseillères
          if (key.toLowerCase().includes('conseiller') || 
              key.toLowerCase().includes('valide') || 
              key.toLowerCase().includes('cree') ||
              key.toLowerCase().includes('client') ||
              value.includes('Marie') || value.includes('Sophie') || value.includes('Julie') ||
              value.includes('T.') || value.includes('M.') || value.includes('L.')) {
            console.log(`  ${key}: ${value}`);
          }
        }
      });
    });
    
    // 3. Rechercher spécifiquement les factures avec des anciennes conseillères
    console.log('\n🔍 FACTURES AVEC ANCIENNES CONSEILLÈRES:');
    console.log('=======================================');
    
    // Chercher dans toutes les colonnes texte
    const [facturesProblematiques] = await sequelize.query(`
      SELECT * FROM factures 
      WHERE client LIKE '%Marie%' OR client LIKE '%Sophie%' OR client LIKE '%Julie%'
         OR numero LIKE '%Marie%' OR numero LIKE '%Sophie%' OR numero LIKE '%Julie%'
         OR description LIKE '%Marie%' OR description LIKE '%Sophie%' OR description LIKE '%Julie%'
         OR validePar LIKE '%Marie%' OR validePar LIKE '%Sophie%' OR validePar LIKE '%Julie%'
    `);
    
    if (facturesProblematiques.length > 0) {
      console.log(`❌ ${facturesProblematiques.length} facture(s) problématique(s) trouvée(s):`);
      
      facturesProblematiques.forEach(facture => {
        console.log(`\n  Facture ID ${facture.id}:`);
        Object.keys(facture).forEach(key => {
          const value = facture[key];
          if (value && typeof value === 'string' && 
              (value.includes('Marie') || value.includes('Sophie') || value.includes('Julie'))) {
            console.log(`    ${key}: ${value}`);
          }
        });
      });
    } else {
      console.log('✅ Aucune facture avec référence problématique dans les colonnes texte');
    }
    
    // 4. Vérifier les données des rapports de ventes (source du problème du tableau de bord)
    console.log('\n📈 DONNÉES DES VENTES PAR CONSEILLÈRE:');
    console.log('====================================');
    
    // Cette requête simule ce que fait probablement le tableau de bord
    const [ventesData] = await sequelize.query(`
      SELECT 
        validePar as conseillere,
        COUNT(*) as nombreFactures,
        SUM(montant) as totalMontant
      FROM factures 
      GROUP BY validePar
      ORDER BY totalMontant DESC
    `);
    
    console.log('Résultats groupés par validePar:');
    ventesData.forEach(vente => {
      console.log(`  ${vente.conseillere}: ${vente.nombreFactures} facture(s), Total: ${vente.totalMontant}€`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkFactures().then(() => process.exit(0)); 