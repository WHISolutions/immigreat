# Résumé des Modifications - Système de Monnaie pour les Factures

## Fonctionnalités Ajoutées

### 1. **Choix de la Monnaie**
- **MAD (Dirham Marocain)** : Monnaie par défaut
- **CAD (Dollar Canadien)** : Option alternative
- Sélecteur dans le formulaire de création et d'édition des factures

### 2. **Calculs de TVA Adaptés**
- **MAD** : TVA de 20%
- **CAD** : TVA de 14,975%
- Calculs automatiques selon la monnaie sélectionnée

### 3. **Affichage Adapté**
- Symboles de monnaie : DH pour MAD, $ pour CAD
- Formatage automatique selon la locale
- Affichage du taux de TVA correct dans les détails

## Modifications Techniques

### Backend
- **Modèle Facture** : Ajout du champ `monnaie` avec valeur par défaut MAD
- **Routes API** : Support du champ monnaie dans création/mise à jour
- **Migration** : Ajout de la colonne monnaie à la base de données
- **Validation** : Vérification que la monnaie est CAD ou MAD

### Frontend
- **Facturation.js** : 
  - Sélecteur de monnaie dans le formulaire
  - Calculs de TVA adaptés selon la monnaie
  - Affichage formaté avec le bon symbole
- **FactureForm.js** : 
  - Support de la monnaie dans l'édition
  - Calculs en temps réel selon la monnaie
  - Affichage des totaux avec le bon taux de TVA
- **Services API** : Formatage des montants selon la monnaie

### Migration de Données
- Toutes les factures existantes ont été mises à jour avec MAD par défaut
- 87 factures ont été converties vers la nouvelle structure

## Tests Effectués

### Calculs de TVA
- **MAD (20%)** : 1000 DH TTC = 833.33 DH HT + 166.67 DH TVA
- **CAD (14.975%)** : 1000 $ TTC = 869.75 $ HT + 130.25 $ TVA

### Validation
- ✅ Création de factures avec choix de monnaie
- ✅ Édition de factures existantes
- ✅ Calculs automatiques corrects
- ✅ Affichage formaté selon la monnaie
- ✅ Migration des données existantes

## Utilisation

### Création d'une Nouvelle Facture
1. Sélectionner la monnaie (MAD par défaut)
2. Saisir le montant TTC
3. Le système calcule automatiquement HT et TVA selon la monnaie

### Édition d'une Facture
1. Possibilité de changer la monnaie
2. Recalcul automatique des montants
3. Mise à jour en temps réel de l'affichage

## Fichiers Modifiés

### Backend
- `models/facture.js`
- `routes/factures.js`
- `migrations/20250712000000-add-monnaie-to-factures.js`
- `run-migration-monnaie.js`
- `update-factures-mad.js`

### Frontend
- `components/Facturation.js`
- `components/FactureForm.js`
- `services/facturesAPI.js`

### Tests
- `test-calculs-tva.js`

## Configuration par Défaut

- **Monnaie par défaut** : MAD (Dirham Marocain)
- **TVA MAD** : 20%
- **TVA CAD** : 14,975%
- **Toutes les factures existantes** : Converties vers MAD

Le système est maintenant opérationnel avec le support complet des deux monnaies et calculs de TVA adaptés.
