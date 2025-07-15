# 🚨 PROBLÈME URGENT - Visibilité croisée des leads entre conseillers

## ⚠️ Problème identifié

Un conseiller voit les leads d'autres conseillers. Cela indique une faille de sécurité dans le filtrage.

## 🔧 Solution immédiate

### 1. Diagnostic du problème
```bash
cd backend
node diagnose-visibility.js
```

### 2. Correction automatique (si nécessaire)
```bash
cd backend
node diagnose-visibility.js --fix
```

### 3. Redémarrer le serveur
```bash
npm run dev
```

## 🎯 Corrections appliquées

Le code a été modifié pour être **STRICT** :

### Ancienne logique (problématique)
- Conseiller voit ses leads
- Conseiller voit les leads "non assignés" 
- ❌ **Bug**: Un lead avec `conseillere="autre nom"` et `conseiller_id=null` était considéré comme "non assigné"

### Nouvelle logique (sécurisée)
- Conseiller voit UNIQUEMENT ses leads où `conseiller_id = son_id`
- Conseiller voit ses leads où `conseillere = son_nom` ET `conseiller_id = null`
- Conseiller voit les leads vraiment non assignés (`conseiller_id = null` ET `conseillere = null/vide`)

## 🔍 Vérification rapide

### Test en tant que conseiller
1. Connectez-vous avec votre compte conseiller
2. Allez sur la page des leads
3. Vérifiez la console du serveur pour ces logs :
   ```
   🔒 Filtrage STRICT pour conseillère: VotreNom (ID: X)
   🔍 DEBUG COMPLET - Leads trouvés pour la conseillère:
   ```

### Vous devriez voir SEULEMENT :
- Vos propres leads (colonne "Conseillère" = votre nom)
- Les leads non assignés (colonne "Conseillère" vide)

### Vous NE devriez PAS voir :
- Des leads avec d'autres noms dans la colonne "Conseillère"

## 🚨 Si le problème persiste

### 1. Vérifiez les logs du serveur
Cherchez ces messages :
- `🚫 Accès REFUSÉ (strict)` - indique qu'un accès a été bloqué
- `🔍 DEBUG COMPLET` - montre tous les leads retournés

### 2. Vérifiez la base de données
```bash
node diagnose-visibility.js
```

Recherchez :
- **Conflits** : leads avec `conseiller_id` et `conseillere` incohérents
- **Assignations orphelines** : `conseillere` rempli mais aucun conseiller correspondant

### 3. Correction manuelle si nécessaire
Si le script de diagnostic révèle des problèmes, lancez :
```bash
node diagnose-visibility.js --fix
```

## 📊 Structure de données attendue

### Leads correctement assignés
```
Lead 1: conseiller_id=5, conseillere="Marie Dupont"    -> Visible par Marie Dupont uniquement
Lead 2: conseiller_id=null, conseillere=null           -> Visible par tous les conseillers  
Lead 3: conseiller_id=7, conseillere="Jean Martin"     -> Visible par Jean Martin uniquement
```

### Leads problématiques (corrigés)
```
AVANT: conseiller_id=null, conseillere="Marie Dupont"  -> Visible par TOUS (BUG!)
APRÈS: conseiller_id=5, conseillere="Marie Dupont"     -> Visible par Marie Dupont uniquement
```

## ✅ Confirmation de la correction

Après redémarrage du serveur, vous devriez voir dans les logs :

```
🔒 Filtrage STRICT pour conseillère: VotreNom (ID: X)
✅ 3 leads récupérés depuis la base de données
🔍 DEBUG COMPLET - Leads trouvés pour la conseillère:
   1. Lead 123: VotreClient1 (Motif: ID match)
   2. Lead 124: ClientNonAssigné (Motif: Non assigné)
```

**Aucun lead avec "Motif: ERREUR!" ne devrait apparaître.**

## 🆘 Support d'urgence

Si le problème persiste après ces étapes :

1. **Sauvegardez la base de données**
2. **Redémarrez complètement l'application** (backend + frontend)
3. **Vérifiez que vous êtes connecté avec le bon compte**
4. **Contactez l'administrateur système**

La sécurité des données client est prioritaire ! 🛡️
