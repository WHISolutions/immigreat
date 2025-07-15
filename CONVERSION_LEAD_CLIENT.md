# 🔄 Fonctionnalité de Conversion Lead en Client

## Vue d'ensemble

Cette fonctionnalité permet de convertir automatiquement un lead en client avec génération d'un numéro de dossier unique et enregistrement dans un journal des conversions.

## ✨ Fonctionnalités

### 1. Conversion automatique
- **Bouton "Convertir en client"** dans le menu d'actions (⋮) de chaque lead
- **Génération automatique** du numéro de dossier au format `CL-AAAA-NNN`
- **Transfert des données** du lead vers le nouveau client
- **Mise à jour du statut** du lead vers "Client"

### 2. Journal des conversions
- **Enregistrement automatique** de chaque conversion
- **Traçabilité complète** : date, utilisateur, numéro de dossier
- **Notes optionnelles** pour documenter la conversion
- **Historique consultable** via l'interface

### 3. Interface utilisateur
- **Modal de confirmation** avec aperçu des données
- **Sélection de l'utilisateur** effectuant la conversion
- **Onglet dédié** pour l'historique des conversions
- **Statistiques** des conversions

## 🚀 Utilisation

### Convertir un lead en client

1. **Accédez à la gestion des leads**
   - Naviguez vers "Gestion des Leads"
   - Localisez le lead à convertir

2. **Ouvrez le menu d'actions**
   - Cliquez sur le bouton menu (⋮) du lead
   - Sélectionnez "Convertir en client"

3. **Remplissez le formulaire de conversion**
   - Sélectionnez l'utilisateur effectuant la conversion
   - Ajoutez des notes optionnelles
   - Cliquez sur "Convertir en client"

4. **Vérification**
   - Le lead passe au statut "Client"
   - Un nouveau client est créé avec un numéro de dossier
   - La conversion est enregistrée dans l'historique

### Consulter l'historique

1. **Accédez à l'onglet historique**
   - Dans "Gestion des Leads"
   - Cliquez sur "Historique des Conversions"

2. **Consultez les conversions**
   - Voir toutes les conversions effectuées
   - Détails : date, utilisateur, numéros de dossier
   - Statistiques : total et conversions du mois

## 🔧 Implémentation technique

### Backend

#### Modèles
- **ConversionLog** : Enregistrement des conversions
- **Lead** : Statut mis à jour vers "Client"
- **Client** : Nouveau client créé avec numéro de dossier

#### Services
- **ConversionService** : Logique métier de conversion
- **Génération de numéro** : Format `CL-AAAA-NNN` avec incrémentation

#### API Endpoints
```
POST /api/leads/:id/convert-to-client
GET  /api/leads/conversion-history
```

### Frontend

#### Composants
- **ConvertLeadModal** : Modal de conversion
- **ConversionHistory** : Historique des conversions
- **LeadsList** : Liste avec menu d'actions

#### Services
- **leadsAPI** : Fonctions d'appel API
- **convertLeadToClient** : Conversion
- **getConversionHistory** : Récupération historique

## 📊 Base de données

### Table conversion_logs
```sql
CREATE TABLE conversion_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  client_id INT NOT NULL,
  numero_dossier VARCHAR(50) NOT NULL,
  utilisateur VARCHAR(100) NOT NULL,
  date_conversion DATETIME NOT NULL,
  notes TEXT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

## 🎯 Génération des numéros de dossier

### Format
- **Préfixe** : `CL` (Client)
- **Année** : `AAAA` (année courante)
- **Numéro** : `NNN` (incrémental, 3 chiffres avec zéros de tête)

### Exemples
- `CL-2025-001` : Premier client de 2025
- `CL-2025-142` : 142ème client de 2025

### Unicité
- Recherche du dernier numéro de l'année
- Incrémentation automatique
- Gestion des collisions

## 🔒 Sécurité et validation

### Validation backend
- Vérification de l'existence du lead
- Contrôle du statut (pas déjà converti)
- Validation des données utilisateur
- Transactions pour l'intégrité

### Gestion d'erreurs
- Messages d'erreur explicites
- Rollback en cas d'échec
- Logs détaillés pour le debugging

## 📈 Monitoring

### Logs applicatifs
```
🔄 Conversion du lead 123 en client par Marie Tremblay
✅ Lead 123 converti en client avec succès - Dossier: CL-2025-087
```

### Métriques disponibles
- Nombre total de conversions
- Conversions par mois
- Conversions par utilisateur
- Temps de conversion moyen

## 🚨 Limitations actuelles

1. **Pas de conversion inverse** (client vers lead)
2. **Pas d'édition** des conversions enregistrées
3. **Pas de suppression** des conversions
4. **Numérotation simple** (pas de préfixes personnalisés)

## 🔮 Améliorations futures

1. **Notifications** lors des conversions
2. **Rapports** de conversion détaillés
3. **Automatisation** basée sur des critères
4. **Intégration** avec système de facturation
5. **Workflow** de validation pour les conversions

## 🆘 Dépannage

### Erreurs courantes

#### "Lead non trouvé"
- Vérifier l'ID du lead
- Actualiser la liste des leads

#### "Lead déjà converti"
- Le lead a déjà le statut "Client"
- Consulter l'historique des conversions

#### "Erreur de génération du numéro"
- Problème de base de données
- Vérifier les logs du serveur

#### "Erreur de transaction"
- Problème de cohérence des données
- Réessayer la conversion
- Contacter l'administrateur si persistant

## 📞 Support

Pour tout problème ou question :
1. Consulter les logs du serveur backend
2. Vérifier la connectivité base de données
3. Redémarrer l'application si nécessaire
4. Contacter l'équipe de développement 