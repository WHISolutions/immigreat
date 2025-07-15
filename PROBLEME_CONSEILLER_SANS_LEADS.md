# 🚨 PROBLÈME: Conseiller ne voit pas ses leads

## 🎯 Actions immédiates

### 1. Identifier l'ID du conseiller
Dans les logs du serveur, cherchez cette ligne :
```
👤 Utilisateur connecté: NomConseiller PrenomConseiller (conseillere)
👤 ID utilisateur: X
```

### 2. Diagnostic complet
```bash
cd backend
node diagnose-conseiller.js X
```
(Remplacez X par l'ID du conseiller)

### 3. Si des corrections sont suggérées
```bash
cd backend
node diagnose-conseiller.js X --fix
```

### 4. Redémarrer le serveur
```bash
npm run dev
```

## 🔍 Causes possibles

### 1. **Problème de format de nom**
- Base de données: `"Dupont Marie"` 
- Utilisateur connecté: `"Marie Dupont"`
- ❌ **Pas de correspondance**

### 2. **conseiller_id manquant**
- Lead assigné avec seulement le nom dans `conseillere`
- Mais pas de `conseiller_id` correspondant

### 3. **Variations de casse**
- Base de données: `"marie dupont"`
- Recherche: `"Marie Dupont"`

### 4. **Caractères spéciaux**
- Espaces supplémentaires, accents, etc.

## 📊 Que fait le diagnostic

Le script `diagnose-conseiller.js` vérifie :

1. ✅ **Leads avec conseiller_id** = ID du conseiller
2. ✅ **Leads avec nom exact** = "Prénom Nom"
3. ✅ **Leads avec nom lowercase** = "prénom nom"
4. 🔍 **Variations de nom** (nom/prénom inversés)
5. ⚪ **Leads non assignés** (disponibles)
6. 🧪 **Simulation de la requête** de filtrage

## 🔧 Corrections automatiques

Le script peut corriger automatiquement :
- Leads avec nom similaire mais sans `conseiller_id`
- Variations de format nom/prénom
- Problèmes de casse

## 📋 Exemple de diagnostic

```
🔍 Diagnostic pour le conseiller ID 5

👤 Conseiller: Marie Dupont (conseillere)
📧 Email: marie.dupont@cabinet.com
📝 Nom complet formaté: "Marie Dupont"

📊 Total des leads dans la base: 25
🎯 Leads avec conseiller_id=5: 0
📝 Leads avec conseillere="Marie Dupont": 0
📝 Leads avec conseillere="marie dupont": 0

🔍 Recherche de variations de nom...
   ✅ "Dupont Marie": 3 leads
      → Lead 123: Jean Client
      → Lead 124: Paul Prospect

💡 Suggestions de correction:
   🔍 Leads potentiellement liés (à corriger):
     Lead 123: conseillere="Dupont Marie"
     → Corriger en: conseiller_id=5, conseillere="Marie Dupont"
```

## ⚡ Correction rapide

Si le diagnostic montre des leads avec des variations de nom :

```bash
# Corriger automatiquement
node diagnose-conseiller.js 5 --fix

# Vérifier le résultat
node diagnose-conseiller.js 5
```

## 🚨 Si le problème persiste

1. **Vérifiez les logs détaillés** du serveur après redémarrage
2. **Recherchez** ces messages :
   ```
   🚨 AUCUN LEAD TROUVÉ - DIAGNOSTIC APPROFONDI
   🔍 ÉCHANTILLON de leads dans la base (avant filtrage)
   ```

3. **Vérifiez la base de données** manuellement :
   ```sql
   SELECT id, nom, prenom, conseiller_id, conseillere 
   FROM leads 
   WHERE conseillere LIKE '%Marie%' OR conseiller_id = 5;
   ```

## ✅ Résolution confirmée

Après correction, vous devriez voir :
```
🎯 Résultat de la requête filtrée: X leads
📋 Détail des leads trouvés:
   1. Lead 123: Jean Client (Motif: ID match)
   2. Lead 124: Paul Prospect (Motif: ID match)
```

**Le conseiller devrait maintenant voir ses leads !** 🎉
