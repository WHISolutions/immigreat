# Guide de débogage - Correction de l'enregistrement des données de procédure

## Problème identifié
La section "Procédure" du formulaire "Modifier le client" ne sauvegardait pas les données dans la base MySQL.

## Causes identifiées

### 1. Frontend - Champs sans attribut `name`
**Problème**: Les champs générés par `renderField()` n'avaient pas d'attribut `name`, donc les données n'étaient pas incluses dans le formulaire.

**Correction**: Ajout de `name={`informationsSpecifiques.${key}`}` à tous les champs.

### 2. Frontend - Mapping des noms de champs
**Problème**: Le frontend utilisait `typeProcedure` mais la base de données attend `type_procedure`.

**Correction**: Mapping correct dans `handleSubmit()`:
```javascript
type_procedure: clientData.typeProcedure,
informations_specifiques: JSON.stringify(clientData.informationsSpecifiques || {}),
```

### 3. Backend - Champs manquants dans la route PUT
**Problème**: La route `/api/clients/:id` (PUT) n'acceptait pas `type_procedure` et `informations_specifiques`.

**Correction**: Ajout des champs manquants dans l'extraction et la mise à jour.

## Comment vérifier que les corrections fonctionnent

### 1. Vérifier les logs de débogage
Ouvrir la console du navigateur et rechercher ces logs lors de la sauvegarde:
```
Données du client à envoyer: {...}
Informations spécifiques: {...}
Type de procédure: Visa visiteur
```

### 2. Vérifier la requête HTTP
Dans l'onglet Réseau (Network) du navigateur, vérifier que la requête PUT contient:
- `type_procedure`: "Visa visiteur"
- `informations_specifiques`: "{...}" (chaîne JSON)

### 3. Vérifier les logs du backend
Dans la console du serveur, rechercher:
```
📝 Données reçues pour mise à jour: {
  type_procedure: 'Visa visiteur',
  informations_specifiques: 'Present',
  ...
}
```

### 4. Vérifier la base de données
```sql
SELECT id, nom, prenom, type_procedure, informations_specifiques 
FROM clients 
WHERE id = [ID_DU_CLIENT];
```

Le champ `informations_specifiques` doit contenir du JSON valide:
```json
{
  "fondsDisponibles": 15000,
  "situationFamiliale": "Marié(e)",
  "nombrePersonnes": 2,
  ...
}
```

## Test manuel

1. Aller sur "Modifier le client"
2. Cliquer sur l'onglet "Procédure"
3. Sélectionner "Visa visiteur"
4. Remplir les champs (fonds, situation familiale, etc.)
5. Cliquer sur "Enregistrer les modifications"
6. Vérifier dans la base de données que `informations_specifiques` contient les données

## Fichiers modifiés

### Frontend
- `ClientEdit.js`: 
  - Ajout attributs `name` dans `renderField()`
  - Mapping correct des champs dans `handleSubmit()`
  - Champ caché pour `informationsSpecifiques`
  - Logs de debug

### Backend
- `clients-temp.js`:
  - Ajout des champs manquants dans les routes POST et PUT
  - Gestion JSON pour `informations_specifiques`
  - Logs de debug

### Modèle
- `client.model.js`: Déjà correct (champ `informations_specifiques` type JSON)
