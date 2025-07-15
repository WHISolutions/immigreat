# 🔧 Guide de Diagnostic - Déconnexion Automatique

## ❌ Problème Signalé
La déconnexion automatique ne se déclenche pas après 10 minutes d'inactivité.

## 🔍 Corrections Apportées

### 1. **Hook useAutoLogout.js** - REFAIT COMPLÈTEMENT
- ✅ Suppression du code dupliqué
- ✅ Correction des références circulaires dans les callbacks
- ✅ Ajout de logs détaillés pour diagnostic
- ✅ Meilleure gestion des timers avec nettoyage approprié

### 2. **Logs de Diagnostic Ajoutés**
```javascript
console.log('🔄 Réinitialisation du timer de déconnexion automatique');
console.log('⏰ Timer configuré: avertissement dans Xs, déconnexion dans Ys');
console.log('⚠️ Affichage de l\'avertissement de déconnexion');
console.log('⏰ Déconnexion automatique - Inactivité détectée');
console.log('🔐 Changement d\'état d\'authentification: true/false');
```

## 🧪 Comment Tester la Correction

### Option 1: Test Rapide (Recommandé)
1. **Démarrer l'application**
2. **Aller sur** `http://localhost:3000/test-logout`
3. **Cliquer sur "Se connecter"**
4. **Attendre 7 secondes** (avertissement)
5. **Attendre 3 secondes de plus** (déconnexion auto)
6. **Observer les logs** dans la console et l'interface

### Option 2: Test Réel (10 minutes)
1. **Se connecter** normalement dans l'application
2. **Ouvrir la console** du navigateur (F12)
3. **Ne pas toucher** la souris/clavier pendant 9 minutes
4. **Vérifier l'avertissement** qui doit apparaître
5. **Attendre 1 minute de plus** pour la déconnexion

### Option 3: Test avec Démo
1. **Aller sur** `http://localhost:3000/demo-logout`
2. **Suivre les instructions** sur la page

## 🔧 Diagnostic si Ça Ne Marche Toujours Pas

### Étape 1: Vérifier les Logs Console
Ouvrez la console (F12) et cherchez ces messages :
```
🔄 Réinitialisation du timer de déconnexion automatique
⏰ Timer configuré: avertissement dans 540s, déconnexion dans 600s
```

**Si vous ne voyez pas ces logs :**
- Le hook n'est pas appelé
- Problème dans App.tsx

### Étape 2: Vérifier l'État d'Authentification
Cherchez ce log :
```
🔐 Changement d'état d'authentification: true
```

**Si `false` ou absent :**
- `setAuthenticationStatus(true)` n'est pas appelé
- Le timer ne démarre jamais

### Étape 3: Vérifier les Événements
Bougez la souris et cherchez :
```
🔄 Réinitialisation du timer de déconnexion automatique
```

**Si ce log apparaît à chaque mouvement :**
- ✅ Les événements fonctionnent
- Le timer se remet à zéro correctement

### Étape 4: Test d'Inactivité
Attendez sans bouger et cherchez :
```
⚠️ Affichage de l'avertissement de déconnexion
```

**Puis :**
```
⏰ Déconnexion automatique - Inactivité détectée
```

## 🐛 Problèmes Possibles Restants

### 1. **Timer pas initialisé**
**Symptôme:** Aucun log "Timer configuré"
**Solution:** Vérifier que `setAuthenticationStatus(true)` est appelé dans App.tsx

### 2. **Événements non détectés**
**Symptôme:** Timer ne se remet pas à zéro
**Solution:** Vérifier les event listeners dans useAutoLogout

### 3. **Fonction onLogout pas appelée**
**Symptôme:** Avertissement affiché mais pas de déconnexion
**Solution:** Vérifier handleAutoLogout dans App.tsx

### 4. **État React pas mis à jour**
**Symptôme:** Logs OK mais interface pas mise à jour
**Solution:** Vérifier les setters d'état

## 🚀 Test de Validation Final

Une fois l'application démarrée :

```javascript
// Dans la console du navigateur
console.log('Test manuel du timer...');

// Vérifier l'état
localStorage.getItem('token'); // Doit retourner un token

// Forcer le test (seulement pour diagnostic)
setTimeout(() => {
  console.log('Test de déconnexion manuelle...');
  window.location.reload();
}, 5000);
```

## 📞 Support

Si le problème persiste après ces corrections :

1. **Envoyez les logs console** complets
2. **Précisez la version du navigateur**
3. **Indiquez les étapes exactes** suivies
4. **Mentionnez si d'autres erreurs** apparaissent

Les corrections apportées devraient résoudre le problème principal de code dupliqué et de logique cassée dans le hook.
