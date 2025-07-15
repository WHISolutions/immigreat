// Script de test pour vérifier les calculs de TVA selon la monnaie

// Fonctions de calcul
const getTauxTVA = (monnaie) => {
  return monnaie === 'CAD' ? 1.14975 : 1.2; // CAD: 14,975%, MAD: 20%
};

const getPourcentageTVA = (monnaie) => {
  return monnaie === 'CAD' ? '14,975%' : '20%';
};

const calculerMontantHT = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  const tauxTVA = getTauxTVA(monnaie);
  const ht = ttc / tauxTVA;
  return Math.round(ht * 100) / 100;
};

const calculerMontantTVA = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  const ht = calculerMontantHT(montantTTC, monnaie);
  const tva = ttc - ht;
  return Math.round(tva * 100) / 100;
};

// Tests
console.log('=== TESTS DE CALCUL TVA ===\n');

// Test CAD
const montantTestCAD = 1000;
const htCAD = calculerMontantHT(montantTestCAD, 'CAD');
const tvaCAD = calculerMontantTVA(montantTestCAD, 'CAD');

console.log('🇨🇦 CANADA (CAD) - 14,975%:');
console.log(`   TTC: ${montantTestCAD} $`);
console.log(`   HT:  ${htCAD} $`);
console.log(`   TVA: ${tvaCAD} $ (${getPourcentageTVA('CAD')})`);
console.log(`   Vérification: ${htCAD} + ${tvaCAD} = ${(htCAD + tvaCAD).toFixed(2)}`);
console.log(`   Taux effectif: ${((tvaCAD / htCAD) * 100).toFixed(3)}%\n`);

// Test MAD
const montantTestMAD = 1000;
const htMAD = calculerMontantHT(montantTestMAD, 'MAD');
const tvaMAD = calculerMontantTVA(montantTestMAD, 'MAD');

console.log('🇲🇦 MAROC (MAD) - 20%:');
console.log(`   TTC: ${montantTestMAD} DH`);
console.log(`   HT:  ${htMAD} DH`);
console.log(`   TVA: ${tvaMAD} DH (${getPourcentageTVA('MAD')})`);
console.log(`   Vérification: ${htMAD} + ${tvaMAD} = ${(htMAD + tvaMAD).toFixed(2)}`);
console.log(`   Taux effectif: ${((tvaMAD / htMAD) * 100).toFixed(3)}%\n`);

// Test avec différents montants
console.log('=== TESTS AVEC DIFFÉRENTS MONTANTS ===\n');

const montantsTest = [100, 500, 1500, 2000];

montantsTest.forEach(montant => {
  console.log(`Montant TTC: ${montant}`);
  
  // CAD
  const htCADTest = calculerMontantHT(montant, 'CAD');
  const tvaCADTest = calculerMontantTVA(montant, 'CAD');
  console.log(`  CAD: HT ${htCADTest}$ + TVA ${tvaCADTest}$ = ${(htCADTest + tvaCADTest).toFixed(2)}$`);
  
  // MAD
  const htMADTest = calculerMontantHT(montant, 'MAD');
  const tvaMADTest = calculerMontantTVA(montant, 'MAD');
  console.log(`  MAD: HT ${htMADTest}DH + TVA ${tvaMADTest}DH = ${(htMADTest + tvaMADTest).toFixed(2)}DH\n`);
});

console.log('=== CALCULS TERMINÉS ===');
