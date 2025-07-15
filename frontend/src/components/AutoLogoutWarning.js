import React, { useState, useEffect } from 'react';
import '../styles/AutoLogout.css';

const AutoLogoutWarning = ({ isVisible, onContinue, onLogout, warningTime = 60 }) => {
  const [countdown, setCountdown] = useState(warningTime);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(warningTime);
      return;
    }

    // Démarrer le countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Temps écoulé, forcer la déconnexion
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, warningTime, onLogout]);

  if (!isVisible) return null;

  return (
    <>
      <div className="auto-logout-overlay" />
      <div className="auto-logout-warning">
        <h3>⏰ Session sur le point d'expirer</h3>
        <p>
          Votre session va expirer dans{' '}
          <span className="auto-logout-countdown">{countdown}</span> secondes
          en raison d'inactivité.
        </p>
        <p>Souhaitez-vous continuer votre session ?</p>
        
        {/* Barre de progression */}
        <div className="countdown-progress">
          <div 
            className="countdown-progress-bar"
            style={{ 
              width: `${(countdown / warningTime) * 100}%`
            }}
          />
        </div>
        
        <div className="buttons">
          <button 
            className="btn-continue"
            onClick={onContinue}
          >
            ✅ Continuer la session
          </button>
          <button 
            className="btn-logout"
            onClick={onLogout}
          >
            🔐 Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
};

export default AutoLogoutWarning;
