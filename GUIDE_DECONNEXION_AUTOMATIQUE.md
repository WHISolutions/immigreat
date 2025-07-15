# 🔐 Système de Déconnexion Automatique

## Vue d'ensemble

Le système de déconnexion automatique a été implémenté pour sécuriser l'application en déconnectant automatiquement les utilisateurs après **10 minutes d'inactivité**.

## Fonctionnalités

### ⏰ Détection d'inactivité
- **Durée**: 10 minutes d'inactivité totale
- **Événements surveillés**:
  - Clics de souris (`click`, `mousedown`)
  - Mouvements de souris (`mousemove`)
  - Frappes de clavier (`keypress`, `keydown`)
  - Défilement (`scroll`)
  - Actions tactiles (`touchstart`)
  - Focus/défocus (`focus`, `blur`)

### 🚨 Avertissement avant déconnexion
- **Timing**: Après 9 minutes d'inactivité
- **Durée d'avertissement**: 60 secondes
- **Interface**: Modal avec countdown visuel
- **Options**:
  - ✅ **Continuer la session**: Réinitialise le timer
  - 🔐 **Se déconnecter**: Déconnexion immédiate

### 🔒 Déconnexion automatique
- **Déclenchement**: Après 10 minutes sans activité
- **Action**: Nettoyage complet de la session
  - Suppression du `localStorage` (token, rôle, nom)
  - Nettoyage des headers d'authentification
  - Redirection vers la page de connexion

## Architecture technique

### Fichiers principaux

#### 1. `hooks/useAutoLogout.js`
Hook personnalisé gérant la logique de déconnexion automatique:
```javascript
const { setAuthenticationStatus, showWarning, continueSession, forceLogout } = useAutoLogout(
  9 * 60 * 1000, // 9 minutes
  handleAutoLogout,
  60 // 60 secondes d'avertissement
);
```

#### 2. `components/AutoLogoutWarning.js`
Composant React pour l'interface d'avertissement avec:
- Countdown visuel
- Barre de progression
- Boutons d'action

#### 3. `styles/AutoLogout.css`
Styles pour l'interface d'avertissement:
- Modal centré avec overlay
- Animations fluides
- Design responsive

### Intégration dans App.tsx

```javascript
// Gestion de la déconnexion automatique
const handleAutoLogout = () => {
  forceLogout(); // Fonction centralisée
};

// Hook avec avertissement
const { setAuthenticationStatus, showWarning, continueSession } = useAutoLogout(
  9 * 60 * 1000, // Timer principal
  handleAutoLogout,
  60 // Avertissement
);

// Composant d'avertissement
<AutoLogoutWarning
  isVisible={showWarning}
  onContinue={continueSession}
  onLogout={forceAutoLogout}
  warningTime={60}
/>
```

## Sécurité

### 🛡️ Mesures de protection
1. **Événements throttlés**: Évite la surcharge avec limite d'1 appel/seconde
2. **Nettoyage automatique**: Timers nettoyés lors du démontage des composants
3. **État centralisé**: Gestion unique de l'état d'authentification
4. **Fonction centralisée**: `forceLogout()` dans `authInterceptor.js`

### 🔐 Cas d'usage couverts
- **Tous les rôles**: Administrateur, conseillère, comptable, secrétaire, directeur
- **Toutes les pages**: Dashboard, clients, leads, journaux, etc.
- **Authentification réelle et mock**: Compatible avec l'API backend et les comptes de test

## Configuration

### ⚙️ Paramètres modifiables

Dans `App.tsx`:
```javascript
const { setAuthenticationStatus, showWarning } = useAutoLogout(
  9 * 60 * 1000,  // ← Durée avant avertissement (millisecondes)
  handleAutoLogout,
  60              // ← Durée de l'avertissement (secondes)
);
```

### 🎛️ Personnalisation possible
- **Durée totale**: Modifier le premier paramètre
- **Durée d'avertissement**: Modifier le troisième paramètre
- **Événements surveillés**: Modifier la liste dans `useAutoLogout.js`
- **Style de l'avertissement**: Modifier `AutoLogout.css`

## Tests

### 🧪 Comment tester
1. Se connecter avec n'importe quel compte
2. Attendre 9 minutes sans interagir avec l'application
3. Vérifier l'apparition de l'avertissement
4. Tester les boutons "Continuer" et "Se déconnecter"
5. Ou attendre 1 minute de plus pour la déconnexion automatique

### 📊 Logs de débogage
Le système génère des logs dans la console:
- `🔒 Déconnexion automatique déclenchée`
- `⚠️ Affichage de l'avertissement de déconnexion`
- `✅ Session prolongée par l'utilisateur`
- `🔓 Déconnexion manuelle déclenchée`

## Maintenance

### 🔧 Points de surveillance
1. **Performance**: Vérifier que les événements throttlés n'impactent pas les performances
2. **Compatibilité**: Tester avec différents navigateurs
3. **UX**: S'assurer que l'avertissement n'interrompt pas les actions critiques

### 📝 Améliorations futures possibles
- Notification toast subtile avant l'avertissement modal
- Paramètres utilisateur pour personnaliser la durée
- Exclusion de certaines pages sensibles (formulaires longs)
- Sauvegarde automatique avant déconnexion
