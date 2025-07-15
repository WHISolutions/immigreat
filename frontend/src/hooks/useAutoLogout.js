import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook personnalisé pour gérer la déconnexion automatique après inactivité
 * @param {number} timeout - Délai d'inactivité en millisecondes (par défaut 10 minutes)
 * @param {function} onLogout - Fonction à appeler lors de la déconnexion automatique
 * @param {number} warningTime - Temps d'avertissement avant déconnexion en secondes (par défaut 60s)
 */
const useAutoLogout = (timeout = 10 * 60 * 1000, onLogout, warningTime = 60) => {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const isAuthenticatedRef = useRef(false); // ❌ PROBLÈME: Était true par défaut
  const [showWarning, setShowWarning] = useState(false);

  // Fonction pour forcer la déconnexion
  const forceLogout = useCallback(async () => {
    console.log('🔒 Déconnexion automatique forcée');
    
    try {
      // Enregistrer la déconnexion automatique dans les journaux d'activité
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const sessionStart = localStorage.getItem('sessionStartTime');
          const sessionDuration = sessionStart ? 
            Math.floor((Date.now() - parseInt(sessionStart)) / 1000) : 'unknown';

          await fetch('/api/users/auto-logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              sessionDuration: `${sessionDuration} secondes`
            })
          });
          
          console.log('📋 Déconnexion automatique enregistrée dans les journaux d\'activité');
        } catch (logError) {
          console.warn('⚠️ Erreur lors de l\'enregistrement de la déconnexion automatique:', logError);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement:', error);
    }
    
    setShowWarning(false);
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  // Fonction pour réinitialiser le timer
  const resetTimer = useCallback(() => {
    console.log('🔄 Réinitialisation du timer de déconnexion automatique');
    
    // Nettoyer les timers précédents
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Masquer l'avertissement si affiché
    setShowWarning(false);

    // Créer les nouveaux timers seulement si l'utilisateur est authentifié
    if (isAuthenticatedRef.current && onLogout) {
      // Timer pour l'avertissement (timeout - warningTime)
      const warningDelay = Math.max(timeout - (warningTime * 1000), 0);
      
      console.log(`⏰ Timer configuré: avertissement dans ${warningDelay/1000}s, déconnexion dans ${timeout/1000}s`);
      
      if (warningDelay > 0) {
        warningTimeoutRef.current = setTimeout(() => {
          console.log('⚠️ Affichage de l\'avertissement de déconnexion');
          if (isAuthenticatedRef.current) {
            setShowWarning(true);
          }
        }, warningDelay);
      }

      // Timer pour la déconnexion automatique
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Déconnexion automatique - Inactivité détectée');
        if (isAuthenticatedRef.current) {
          forceLogout();
        }
      }, timeout);
    }
  }, [timeout, warningTime, onLogout, forceLogout]);

  // Fonction pour continuer la session (réinitialiser les timers)
  const continueSession = useCallback(() => {
    console.log('✅ Session prolongée par l\'utilisateur');
    resetTimer();
  }, [resetTimer]);

  // Fonction pour marquer l'utilisateur comme déconnecté
  const setAuthenticationStatus = useCallback((isAuth) => {
    console.log(`🔐 Changement d'état d'authentification: ${isAuth}`);
    isAuthenticatedRef.current = isAuth;
    
    if (!isAuth) {
      // Si l'utilisateur se déconnecte, nettoyer tous les timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowWarning(false);
      console.log('🔒 Timers arrêtés - utilisateur déconnecté');
    } else {
      // Si l'utilisateur se connecte, démarrer les timers
      console.log('🔓 Démarrage des timers - utilisateur connecté');
      resetTimer();
    }
  }, [resetTimer]);

  // Liste des événements qui indiquent une activité utilisateur
  const events = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown',
    'focus',
    'blur'
  ];

  // Gestionnaire d'événements avec throttling pour éviter trop d'appels
  const handleActivity = useCallback(() => {
    if (isAuthenticatedRef.current) {
      resetTimer();
    }
  }, [resetTimer]);

  // Throttling pour limiter les appels à resetTimer
  const throttledHandleActivity = useCallback(
    (() => {
      let lastCall = 0;
      return () => {
        const now = Date.now();
        if (now - lastCall >= 1000) { // Throttle à 1 seconde
          lastCall = now;
          handleActivity();
        }
      };
    })(),
    [handleActivity]
  );

  useEffect(() => {
    console.log('🎯 Initialisation du hook useAutoLogout');
    
    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      document.addEventListener(event, throttledHandleActivity, true);
    });

    // ❌ NE PAS démarrer le timer automatiquement ici
    // Le timer sera démarré uniquement quand setAuthenticationStatus(true) sera appelé

    // Nettoyage lors du démontage
    return () => {
      console.log('🧹 Nettoyage du hook useAutoLogout');
      events.forEach(event => {
        document.removeEventListener(event, throttledHandleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [throttledHandleActivity]); // ❌ Retirer resetTimer des dépendances

  return {
    resetTimer,
    setAuthenticationStatus,
    showWarning,
    continueSession,
    forceLogout
  };
};

export default useAutoLogout;
