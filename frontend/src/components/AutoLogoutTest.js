import React, { useState, useEffect } from 'react';
import useAutoLogout from '../hooks/useAutoLogout';

// Composant de test simple pour diagnostiquer le problème
const AutoLogoutTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [testDuration, setTestDuration] = useState(5); // ❌ 5 secondes pour test rapide au lieu de 10

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[AUTO-LOGOUT TEST] ${message}`);
  };

  const handleAutoLogout = () => {
    addLog('🔒 DÉCONNEXION AUTOMATIQUE DÉCLENCHÉE');
    setIsConnected(false);
  };

  // Hook avec durée courte pour test
  const { setAuthenticationStatus, showWarning, continueSession, forceLogout } = useAutoLogout(
    testDuration * 1000, // Durée totale en millisecondes
    handleAutoLogout,
    Math.floor(testDuration / 3) // 1/3 du temps pour l'avertissement
  );

  const handleLogin = () => {
    setIsConnected(true);
    setAuthenticationStatus(true);
    addLog(`✅ Connexion simulée - Timer configuré pour ${testDuration}s`);
  };

  const handleLogout = () => {
    setIsConnected(false);
    setAuthenticationStatus(false);
    addLog('🔓 Déconnexion manuelle');
  };

  const simulateActivity = () => {
    addLog('🎯 Activité simulée (reset timer)');
    // L'activité sera automatiquement détectée par les événements
  };

  useEffect(() => {
    if (showWarning) {
      addLog('⚠️ AVERTISSEMENT AFFICHÉ');
    }
  }, [showWarning]);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h2 style={{ color: '#2c3e50' }}>🔐 Test de Déconnexion Automatique</h2>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: `2px solid ${isConnected ? '#27ae60' : '#e74c3c'}`
      }}>
        <h3>État actuel</h3>
        <p><strong>Statut:</strong> <span style={{ color: isConnected ? '#27ae60' : '#e74c3c' }}>
          {isConnected ? '✅ Connecté' : '❌ Déconnecté'}
        </span></p>
        <p><strong>Avertissement:</strong> <span style={{ color: showWarning ? '#f39c12' : '#95a5a6' }}>
          {showWarning ? '⚠️ Affiché' : '✅ Masqué'}
        </span></p>
        <p><strong>Durée de test:</strong> {testDuration} secondes</p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Configuration</h3>
        <label>
          Durée de test (secondes):
          <input 
            type="number" 
            value={testDuration} 
            onChange={(e) => setTestDuration(parseInt(e.target.value) || 10)}
            min="5"
            max="300"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <p><small>Avertissement après {Math.floor(testDuration * 2/3)}s, déconnexion après {testDuration}s</small></p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isConnected ? (
            <button 
              onClick={handleLogin}
              style={{
                background: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
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
                  padding: '10px 15px',
                  borderRadius: '5px',
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
                  padding: '10px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🔐 Se déconnecter
              </button>
              {showWarning && (
                <button 
                  onClick={() => {
                    continueSession();
                    addLog('✅ Session prolongée manuellement');
                  }}
                  style={{
                    background: '#f39c12',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Prolonger session
                </button>
              )}
            </>
          )}
          <button 
            onClick={() => setLogs([])}
            style={{
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Effacer logs
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
        <h3>Journal d'activité (temps réel)</h3>
        <div style={{ 
          height: '300px', 
          overflow: 'auto', 
          background: '#2c3e50', 
          color: '#ecf0f1', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {logs.length === 0 ? (
            <p style={{ margin: 0, color: '#95a5a6' }}>Aucun log pour le moment...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '20px',
        border: '1px solid #ffeaa7'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💡 Instructions</h4>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Cliquez sur "Se connecter"</li>
          <li>Observez les logs dans la console</li>
          <li>Attendez sans bouger la souris ni cliquer</li>
          <li>Vérifiez que l'avertissement apparaît</li>
          <li>Testez "Prolonger session" ou attendez la déconnexion auto</li>
        </ol>
      </div>
    </div>
  );
};

export default AutoLogoutTest;
