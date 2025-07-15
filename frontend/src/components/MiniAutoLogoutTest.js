import React, { useState, useEffect } from 'react';
import useAutoLogout from '../hooks/useAutoLogout';

// Test minimal pour diagnostiquer le problème
const MiniAutoLogoutTest = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleLogout = () => {
    console.log('🎯 DÉCONNEXION AUTO DÉCLENCHÉE !');
    alert('✅ SUCCÈS: Déconnexion automatique fonctionne !');
    setIsAuthenticated(false);
  };

  // Hook avec 8 secondes total (5s pour avertissement + 3s warning)
  const { setAuthenticationStatus, showWarning, continueSession } = useAutoLogout(
    8000, // 8 secondes total
    handleLogout,
    3 // 3 secondes d'avertissement
  );

  const startTest = () => {
    console.log('🚀 DÉMARRAGE TEST: 5 secondes avant avertissement, 8 secondes avant déconnexion');
    setIsAuthenticated(true);
    setAuthenticationStatus(true);
    
    // Countdown visuel
    setCountdown(8);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTest = () => {
    console.log('⏹️ ARRÊT TEST');
    setIsAuthenticated(false);
    setAuthenticationStatus(false);
    setCountdown(0);
  };

  useEffect(() => {
    if (showWarning) {
      console.log('⚠️ AVERTISSEMENT AFFICHÉ !');
    }
  }, [showWarning]);

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ color: '#2c3e50' }}>🔥 TEST ULTRA-RAPIDE DÉCONNEXION AUTO</h1>
      
      <div style={{ 
        backgroundColor: isAuthenticated ? '#d4edda' : '#f8d7da',
        border: `1px solid ${isAuthenticated ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0'
      }}>
        <h2>État: {isAuthenticated ? '🟢 Connecté' : '🔴 Déconnecté'}</h2>
        <h2>Avertissement: {showWarning ? '⚠️ AFFICHÉ' : '✅ Masqué'}</h2>
        {countdown > 0 && (
          <h2 style={{ color: '#e74c3c' }}>⏱️ {countdown} secondes restantes</h2>
        )}
      </div>

      <div style={{ margin: '30px 0' }}>
        {!isAuthenticated ? (
          <button 
            onClick={startTest}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '18px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🚀 DÉMARRER TEST (8 secondes)
          </button>
        ) : (
          <div>
            <button 
              onClick={stopTest}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                fontSize: '18px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              ⏹️ ARRÊTER TEST
            </button>
            
            {showWarning && (
              <button 
                onClick={() => {
                  continueSession();
                  console.log('✅ Session prolongée');
                }}
                style={{
                  backgroundColor: '#ffc107',
                  color: 'black',
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ✅ PROLONGER SESSION
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'left'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>📋 Instructions</h3>
        <ol style={{ color: '#856404' }}>
          <li>Cliquez "DÉMARRER TEST"</li>
          <li><strong>NE BOUGEZ PAS la souris</strong></li>
          <li><strong>NE TAPEZ RIEN au clavier</strong></li>
          <li>Après 5 secondes → Avertissement doit s'afficher</li>
          <li>Après 8 secondes → Déconnexion automatique</li>
        </ol>
        <p style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', margin: '10px 0' }}>
          <strong>⚠️ IMPORTANT:</strong> Si vous bougez la souris ou tapez, le timer se remet à zéro !
        </p>
      </div>
    </div>
  );
};

export default MiniAutoLogoutTest;
