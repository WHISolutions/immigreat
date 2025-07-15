# Tests d'intégration des informations spécifiques

Ce document explique comment tester que toutes les données saisies dans les formulaires de procédures sont correctement intégrées à la base de données.

## 📋 Procédures testées

Les tests vérifient l'intégration des informations spécifiques pour toutes les procédures suivantes :

1. **Visa visiteur** - Fonds, situation familiale, emploi, invitations, voyages
2. **Permis de travail** - Informations professionnelles, diplômes, employeur, EIMT
3. **Permis d'études** - Informations académiques, garants, établissements
4. **Investisseur** - Informations d'affaires, patrimoine, investissements
5. **Regroupement familial** - Informations sur le sponsor, relations
6. **Résidence permanente** - Expériences, tests de langue, programmes

## 🚀 Comment exécuter les tests

### Option 1 : Exécution automatique (Windows)
```bash
# Depuis le dossier backend
test-database.bat
```

### Option 2 : Exécution manuelle
```bash
# Test des informations spécifiques pour Permis de travail
node test-informations-specifiques.js

# Test de toutes les procédures
node test-all-procedures.js
```

## 📊 Ce que testent les scripts

### test-informations-specifiques.js
- Création d'un client avec informations spécifiques pour Permis de travail
- Vérification du stockage des données JSON
- Test de mise à jour des informations
- Nettoyage automatique

### test-all-procedures.js
- Création d'un client de test pour chaque procédure
- Vérification du stockage de toutes les informations spécifiques
- Test de structures de données complexes (tableaux, objets)
- Nettoyage automatique de tous les clients de test

## 🔍 Vérification des résultats

Les tests affichent :
- ✅ Succès de création de chaque client
- 📋 Nombre de champs stockés dans informations_specifiques
- 🔑 Clés principales des données
- 🧹 Confirmation du nettoyage

## 🛠️ Structure des données testées

### Exemples de données complexes testées :

#### Arrays (Tableaux)
```javascript
positionsOccupees: [
  { titre: 'Développeur', entreprise: 'TechCorp', duree: '2 ans' }
]
```

#### Objects (Objets)
```javascript
testsLangueRP: [
  {
    langue: 'Français',
    typeTest: 'TEF',
    scoreExpression: '8.0',
    dateExpiration: '2025-10-15'
  }
]
```

#### Conditional fields (Champs conditionnels)
```javascript
// Champs qui apparaissent selon les sélections
representantFamillePermis: 'Époux',  // Si nombrePersonnes > 1
autreEmploiPrecision: 'Freelance',  // Si emploiTypes contient 'Autre'
```

## 📝 Logging et débogage

Les contrôleurs backend incluent des logs détaillés :
- 📋 Données reçues lors de la création
- 📋 Données reçues lors de la mise à jour
- ✅ Confirmation de sauvegarde
- ❌ Erreurs éventuelles

## 🎯 Objectifs des tests

1. **Vérifier l'intégration complète** : Toutes les données saisies sont stockées
2. **Tester la cohérence** : Les formats de données sont respectés
3. **Valider la récupération** : Les données peuvent être relues correctement
4. **Confirmer les mises à jour** : Les modifications sont bien prises en compte

## 🔧 Configuration requise

- Node.js installé
- Base de données configurée (SQLite par défaut)
- Serveur backend arrêté (pour éviter les conflits de port)

## 📞 Support

En cas de problème :
1. Vérifiez que la base de données est accessible
2. Consultez les logs dans la console
3. Vérifiez les erreurs Sequelize
4. Confirmez que les modèles sont bien définis

Les tests nettoient automatiquement les données créées, donc ils peuvent être exécutés plusieurs fois sans impact sur les données existantes. 