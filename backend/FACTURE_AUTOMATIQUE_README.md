# 🧾 Système de Facturation Automatique

## 📋 Vue d'ensemble

Ce système créé automatiquement une facture pour chaque nouveau client enregistré dans l'application. La facture est générée avec un numéro unique et peut être modifiée tant qu'elle reste en statut "brouillon".

## 🎯 Fonctionnalités

### ✅ Génération automatique
- **Déclencheur** : Création d'un nouveau client
- **Timing** : Immédiatement après la création du client
- **Statut initial** : "brouillon" (modifiable)
- **Montant initial** : 0 (modifiable)

### 📝 Numérotation intelligente
- **Format** : `F{ANNÉE}-{NUMÉRO}`
- **Exemple** : `F2025-001`, `F2025-002`, etc.
- **Auto-incrémentation** : Par année
- **Unicité** : Garantie par contrainte de base de données

### 🔗 Relations
- **Client ↔ Facture** : Relation One-to-Many
- **Clé étrangère** : `client_id` dans la table `Factures`
- **Cascade** : Suppression du client = `SET NULL` sur les factures

## 🏗️ Structure de données

### Table `Factures` (améliorée)

```sql
-- Nouveau système (recommandé)
numero_facture    VARCHAR(50)  UNIQUE  -- Format F2025-001
client_id         INTEGER      REFERENCES Clients(id)
date_creation     DATE         DEFAULT NOW()
montant           FLOAT        DEFAULT 0
statut            VARCHAR(20)  DEFAULT 'brouillon'

-- Ancien système (compatibilité)
numero           VARCHAR(50)   -- Copie du numero_facture
client           VARCHAR(255)  -- Nom complet du client
dateEmission     DATE         -- Copie de date_creation
dateEcheance     DATE         -- date_creation + 30 jours
```

### États de facture

| Statut | Description | Modifiable |
|--------|-------------|------------|
| `brouillon` | Facture créée automatiquement | ✅ Oui |
| `envoyee` | Facture envoyée au client | ⚠️ Limitée |
| `payee` | Facture payée | ❌ Non |
| `annulee` | Facture annulée | ❌ Non |

## 🔧 Utilisation

### 1. Création automatique

```javascript
// Lors de la création d'un client via l'API
POST /api/clients
{
  "nom": "Dupont",
  "prenom": "Marie",
  "email": "marie@example.com",
  // ... autres champs
}

// Réponse inclut client ET facture
{
  "success": true,
  "message": "Client créé avec succès et facture générée automatiquement",
  "data": {
    "client": { /* données client */ },
    "facture": {
      "numero_facture": "F2025-001",
      "client_id": 123,
      "statut": "brouillon",
      "montant": 0
    }
  }
}
```

### 2. Récupération des factures

```javascript
// Récupérer un client avec ses factures
GET /api/clients/123
{
  "data": {
    "id": 123,
    "nom": "Dupont",
    "factures": [
      {
        "numero_facture": "F2025-001",
        "statut": "brouillon",
        "montant": 0
      }
    ]
  }
}
```

## 🧪 Tests

### Script de test
```bash
# Tester la création automatique
node backend/test-facture-auto.js
```

### Vérifications automatiques
- ✅ Format du numéro de facture
- ✅ Relation client-facture
- ✅ Statut par défaut
- ✅ Montant initial
- ✅ Unicité du numéro

## 📊 Migration

### Commandes
```bash
# Exécuter la migration pour améliorer la structure
npx sequelize-cli db:migrate

# Rollback si nécessaire
npx sequelize-cli db:migrate:undo
```

### Changements
- ➕ Ajout `client_id` (clé étrangère)
- ➕ Ajout `numero_facture` (format standardisé)
- ➕ Ajout `date_creation`
- 🔧 Amélioration index et contraintes
- 🔧 Valeurs par défaut

## 🚨 Gestion d'erreurs

### Scénarios gérés
1. **Échec création facture** : Client créé, warning dans la réponse
2. **Numéro en double** : Génération fallback avec timestamp
3. **Erreur base de données** : Rollback automatique

### Logs
```javascript
// Succès
console.log('🧾 Facture créée automatiquement:', {
  numero_facture: 'F2025-001',
  client_id: 123,
  statut: 'brouillon'
});

// Erreur
console.error('⚠️ Erreur lors de la création de la facture automatique:', error);
```

## 🔒 Sécurité

### Contraintes
- **Unicité** : `numero_facture` est unique
- **Validation** : Format regex `/^F\d{4}-\d{3}$/`
- **Intégrité** : Clé étrangère `client_id`
- **Statut** : Enum limité aux valeurs valides

### Permissions
- **Brouillon** : Modification libre
- **Envoyée** : Modification restreinte
- **Payée/Annulée** : Lecture seule

## 📈 Performance

### Optimisations
- **Index** : `numero_facture`, `client_id`, `statut`
- **Cache** : Séquence des numéros par année
- **Pagination** : Limite les requêtes lourdes

### Monitoring
- Nombre de factures créées par jour
- Temps de génération moyen
- Taux d'erreur de création

## 🔄 Évolutions futures

### Prévues
- 📧 **Email automatique** : Envoi de la facture au client
- 💰 **Tarification dynamique** : Montant selon le type de procédure
- 📅 **Échéances personnalisées** : Selon le type de client
- 🎨 **Templates PDF** : Génération automatique de PDF

### Configurations
- **Numérotation** : Personnalisable par organisation
- **Workflow** : États de facture configurables
- **Notifications** : Rappels automatiques

## 🆘 Support

### Problèmes courants
1. **Facture non créée** : Vérifier les logs d'erreur
2. **Numéro en double** : Migration incomplète
3. **Client sans facture** : Exécuter le script de correction

### Logs utiles
```bash
# Voir les logs de création
grep "Facture créée" logs/app.log

# Voir les erreurs de facture
grep "Erreur.*facture" logs/app.log
```

---

**Développé avec ❤️ pour l'automatisation de la facturation** 