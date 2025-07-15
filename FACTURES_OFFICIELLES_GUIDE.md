# 📄 Guide des Factures Officielles

## ✅ Améliorations Apportées

### 🎯 **Format Professionnel**
Les factures générées ont maintenant un **format officiel** conforme aux standards canadiens avec :

- **En-tête d'entreprise** avec logo intégré
- **Informations fiscales** complètes (TPS/TVQ)
- **Calculs détaillés** (HT, TVA 15%, TTC)
- **Conditions de paiement** légales
- **Numérotation** professionnelle
- **Pied de page** avec date de génération

### 🏢 **Informations d'Entreprise**

**Actuellement configuré :**
```
SERVICES D'IMMIGRATION EXPERT
123 Rue Principale, Montréal, QC H1A 1A1
Tél: (514) 123-4567 | Email: info@immigration-expert.ca
Numéro TPS: 123456789RT0001 | Numéro TVQ: 1234567890TQ0001
```

**⚠️ IMPORTANT :** Ces informations sont **des exemples** et doivent être personnalisées selon votre entreprise réelle.

### 🖼️ **Logo Intégré**

- **Chargement automatique** du logo depuis `/frontend/public/assets/logo.png`
- **Redimensionnement automatique** à 100x50 pixels
- **Fallback** : Rectangle gris avec texte "LOGO" si l'image n'est pas disponible
- **Position** : Coin supérieur gauche de la facture

### 💰 **Calculs Détaillés**

Les factures affichent maintenant :
- **Sous-total (HT)** : Montant hors taxes
- **TVA (15%)** : Taxe calculée automatiquement
- **TOTAL À PAYER** : Montant TTC encadré
- **Devise** : CAD (Dollars canadiens)

### 📋 **Informations Incluses**

- **Numéro de facture** unique
- **Dates** : Émission, échéance, paiement (si applicable)
- **Client** : Nom du client facturé
- **Description** : Détail du service
- **Méthode de paiement** (si renseignée)
- **Statut de paiement** : Brouillon, Payable, Payée, etc.

### ⚖️ **Conditions Légales**

Chaque facture inclut automatiquement :
- Paiement exigible dans les 30 jours
- Frais de retard de 1,5% par mois
- Tribunaux de Montréal compétents

## 🔧 Personnalisation

### 📝 **Modifier les Informations d'Entreprise**

Dans le fichier `frontend/src/components/Facturation.js`, modifiez les lignes suivantes :

```javascript
// Informations de l'entreprise
doc.text('VOTRE NOM D\'ENTREPRISE', margin + 50, 20);
doc.text('Votre adresse complète', margin + 50, 28);
doc.text('Tél: Votre téléphone | Email: votre@email.com', margin + 50, 34);
doc.text('Numéro TPS: VOTRE_TPS | Numéro TVQ: VOTRE_TVQ', margin + 50, 40);
```

### 🖼️ **Remplacer le Logo**

1. **Remplacez** le fichier `/frontend/public/assets/logo.png` par votre logo
2. **Format recommandé** : PNG avec fond transparent
3. **Dimensions** : Le logo sera automatiquement redimensionné à 100x50 pixels
4. **Qualité** : Utilisez une image de bonne résolution pour un rendu optimal

### 🎨 **Personnaliser les Couleurs**

Dans les fonctions `telechargerFacture` et `imprimerFacture`, modifiez :

```javascript
// Couleur du titre "FACTURE"
doc.setTextColor(41, 128, 185); // Bleu professionnel

// Couleur de l'en-tête du tableau
doc.setFillColor(41, 128, 185); // Bleu professionnel
```

## 📥 Utilisation

### ⬇️ **Télécharger une Facture**
1. Dans le tableau des factures
2. Cliquez sur **"Actions"** > **"Télécharger"**
3. Le fichier sera sauvegardé sous : `Facture-Officielle-[NUMERO].pdf`

### 🖨️ **Imprimer une Facture**
1. Dans le tableau des factures
2. Cliquez sur **"Actions"** > **"Imprimer"**
3. Le PDF s'ouvrira dans un nouvel onglet pour impression

## ✨ Caractéristiques Techniques

- **Format** : PDF A4 (210 x 297 mm)
- **Marges** : 20mm sur tous les côtés
- **Police** : Helvetica (standard)
- **Encoding** : UTF-8 (support des accents français)
- **Taille** : Optimisée (généralement < 100KB)

## 🎯 Conformité

Les factures générées respectent :
- **Standards canadiens** de facturation
- **Exigences fiscales** TPS/TVQ
- **Format professionnel** pour la comptabilité
- **Traçabilité** avec numéros uniques

---

**📞 Support** : En cas de problème, vérifiez que le logo existe dans `/frontend/public/assets/logo.png` et que les informations d'entreprise sont correctement configurées. 