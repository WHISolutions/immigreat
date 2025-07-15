import React, { useState } from 'react';
import useAutoLogout from '../hooks/useAutoLogout';
import AutoLogoutWarning from './AutoLogoutWarning';

const AutoLogoutDemo = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date().toLocaleTimeString());

  // Hook de déconnexion automatique avec 30 secondes pour la démo
  const { setAuthenticationStatus, showWarning, continueSession, forceLogout } = useAutoLogout(
    20 * 1000, // 20 secondes au lieu de 10 minutes pour la démo
    () => {
      console.log('🔒 Déconnexion automatique déclenchée');
      handleLogout();
    },
    10 // 10 secondes d'avertissement
  );

  const handleLogin = () => {
    setIsConnected(true);
    setAuthenticationStatus(true);
    setLastActivity(new Date().toLocaleTimeString());
    console.log('✅ Connexion simulée');
  };

  const handleLogout = () => {
    setIsConnected(false);
    setAuthenticationStatus(false);
    console.log('🔓 Déconnexion effectuée');
  };

  const simulateActivity = () => {
    setLastActivity(new Date().toLocaleTimeString());
    console.log('🎯 Activité simulée');
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '30px' }}>
        🔐 Démo Déconnexion Automatique
      </h2>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '6px', 
        marginBottom: '20px',
        border: `2px solid ${isConnected ? '#27ae60' : '#e74c3c'}`
      }}>
        <h3>État de la session</h3>
        <p>
          <strong>Statut:</strong> 
          <span style={{ 
            color: isConnected ? '#27ae60' : '#e74c3c',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}>
            {isConnected ? '✅ Connecté' : '❌ Déconnecté'}
          </span>
        </p>
        <p><strong>Dernière activité:</strong> {lastActivity}</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
        <h3>Configuration de la démo</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>Timeout total:</strong> 20 secondes (au lieu de 10 minutes)</li>
          <li><strong>Avertissement:</strong> Après 10 secondes d'inactivité</li>
          <li><strong>Délai d'avertissement:</strong> 10 secondes pour réagir</li>
        </ul>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '6px', marginBottom: '20px' }}>
        <h3>Actions de test</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isConnected ? (
            <button 
              onClick={handleLogin}
              style={{
                background: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔓 Se connecter
            </button>
          ) : (
            <>
              <button 
                onClick={simulateActivity}
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🎯 Simuler activité
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔐 Se déconnecter
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 Instructions de test</h4>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Cliquez sur "Se connecter"</li>
          <li>Attendez 10 secondes sans bouger la souris ni cliquer</li>
          <li>Un avertissement devrait apparaître</li>
          <li>Testez les boutons "Continuer" ou "Se déconnecter"</li>
          <li>Ou attendez 10 secondes de plus pour la déconnexion auto</li>
        </ol>
      </div>

      {/* Composant d'avertissement */}
      <AutoLogoutWarning
        isVisible={showWarning}
        onContinue={() => {
          continueSession();
          setLastActivity(new Date().toLocaleTimeString());
        }}
        onLogout={forceLogout}
        warningTime={10}
      />
    </div>
  );
};

export default AutoLogoutDemo;
