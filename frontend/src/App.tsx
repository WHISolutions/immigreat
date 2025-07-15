import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './styles/variables.css';
import './styles/Dashboard.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import ClientDetail from './components/ClientDetail';
import AddClient from './components/AddClient';
import JournalActivite from './components/JournalActivite';
import LeadManagementPage from './components/LeadManagementPage';
import AutoLogoutWarning from './components/AutoLogoutWarning';
import AutoLogoutDemo from './components/AutoLogoutDemo';
import AutoLogoutTest from './components/AutoLogoutTest';
import MiniAutoLogoutTest from './components/MiniAutoLogoutTest';
import { NotificationProvider } from './contexts/NotificationContext';
import { setupAxiosInterceptors, validateToken, forceLogout } from './services/authInterceptor';
import useAutoLogout from './hooks/useAutoLogout';

// Configuration globale d'axios pour l'authentification
const configureAxiosAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem('role') || null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  // 🔐 Gestion de la déconnexion automatique après 10 minutes d'inactivité
  const handleAutoLogout = () => {
    console.log('🔒 Déconnexion automatique déclenchée - Inactivité de 10 minutes détectée');
    
    // Utiliser la fonction centralisée de déconnexion
    forceLogout();
  };
  
  // Initialiser le hook de déconnexion automatique (9 minutes + 1 minute d'avertissement)
  const { setAuthenticationStatus, showWarning, continueSession, forceLogout: forceAutoLogout } = useAutoLogout(
    9 * 60 * 1000, // 9 minutes avant d'afficher l'avertissement
    handleAutoLogout,
    60 // 60 secondes d'avertissement
  );
  
  // Initialiser l'application et valider le token
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Configurer les intercepteurs axios
        setupAxiosInterceptors();
        
        const token = localStorage.getItem('token');
        if (token) {
          // Valider le token au démarrage
          const isTokenValid = await validateToken();
          
          if (isTokenValid) {
            const savedRole = localStorage.getItem('role');
            if (savedRole) setUserRole(savedRole);
            setIsAuthenticated(true);
            setAuthenticationStatus(true); // Marquer comme authentifié pour le timer
            configureAxiosAuth();
          } else {
            // Token invalide, forcer la déconnexion
            setIsAuthenticated(false);
            setUserRole(null);
            setAuthenticationStatus(false); // Marquer comme non authentifié
          }
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
          setAuthenticationStatus(false); // Marquer comme non authentifié
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setIsAuthenticated(false);
        setUserRole(null);
        setAuthenticationStatus(false); // Marquer comme non authentifié
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);
  
  const handleLogin = async (email: string, password: string) => {
    // Tentative d'appel au backend réel
    try {
      const { loginUser } = await import('./services/usersAPI');
      const response: any = await loginUser(email, password);
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('sessionStartTime', Date.now().toString()); // Enregistrer le début de session
        const backendRole = response.user.role;
        const uiRole = backendRole === 'admin' ? 'administrateur' : backendRole;
        const userName = response.user.nom_complet || response.user.nom || response.user.name || 'Utilisateur';
        const userId = response.user.id || response.user.userId || response.userId;
        
        setUserRole(uiRole);
        localStorage.setItem('role', uiRole);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', userId ? userId.toString() : '');
        
        // Configurer axios avec le nouveau token
        configureAxiosAuth();
        
        setIsAuthenticated(true);
        setAuthenticationStatus(true); // Démarrer le timer de déconnexion automatique
        return true;
      }
    } catch (e) {
      console.warn('Backend login failed, fallback to mock.', e);
    }

    // ----- Fallback mock avec noms spécifiques -----
    if (email === 'admin@immigration.ca' && password === 'admin123') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString()); // Enregistrer le début de session
      localStorage.setItem('role', 'administrateur');
      localStorage.setItem('userName', 'Administrateur');
      localStorage.setItem('userId', '1');
      setUserRole('administrateur');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'marie.tremblay@immigration.ca' && password === 'conseillere123') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', 'Marie T.');
      localStorage.setItem('userId', '2');
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'admin@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'administrateur');
      localStorage.setItem('userName', 'Administrateur');
      localStorage.setItem('userId', '3');
      setUserRole('administrateur');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'directeur@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'directeur');
      localStorage.setItem('userName', 'Directeur');
      localStorage.setItem('userId', '4');
      setUserRole('directeur');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    // Comptes conseillères avec vrais noms
    if (email === 'marie@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', 'Marie T.');
      localStorage.setItem('userId', '5');
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'sophie@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', 'Sophie M.');
      localStorage.setItem('userId', '6');
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'julie@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', 'Julie L.');
      localStorage.setItem('userId', '7');
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'conseillere@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', 'Marie T.'); // Par défaut Marie T.
      localStorage.setItem('userId', '8');
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    // 🔴 NOUVEAU : Comptes conseillères génériques
    const conseilleres = [
      { email: 'marie.dupont@example.com', nom: 'Marie Dupont', userId: '9' },
      { email: 'sophie.martin@example.com', nom: 'Sophie Martin', userId: '10' },
      { email: 'julie.bernard@example.com', nom: 'Julie Bernard', userId: '11' },
      { email: 'kaoutar.chaouby@example.com', nom: 'Kaoutar Chaouby', userId: '12' },
      { email: 'kaoutar@example.com', nom: 'kaoutar', userId: '13' }, // Ancien compte pour compatibilité
    ];
    
    const conseillere = conseilleres.find(c => c.email === email);
    if (conseillere && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'conseillere');
      localStorage.setItem('userName', conseillere.nom);
      localStorage.setItem('userId', conseillere.userId);
      setUserRole('conseillere');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'comptable@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'comptable');
      localStorage.setItem('userName', 'Comptable');
      localStorage.setItem('userId', '14');
      setUserRole('comptable');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    if (email === 'secretaire@example.com' && password === 'password') {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('sessionStartTime', Date.now().toString());
      localStorage.setItem('role', 'secretaire');
      localStorage.setItem('userName', 'Secrétaire');
      localStorage.setItem('userId', '15');
      setUserRole('secretaire');
      setIsAuthenticated(true);
      setAuthenticationStatus(true); // Démarrer le timer
      return true;
    }
    return false;
  };
  
  const handleLogout = () => {
    console.log('🔓 Déconnexion manuelle déclenchée');
    
    // Nettoyer le localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionStartTime'); // Nettoyer aussi le temps de début de session
    
    // Nettoyer les headers axios
    delete axios.defaults.headers.common['Authorization'];
    
    // Réinitialiser l'état
    setIsAuthenticated(false);
    setUserRole(null);
    
    // Arrêter le timer de déconnexion automatique
    setAuthenticationStatus(false);
  };
  
  // Affichage de chargement pendant l'initialisation
  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Vérification de la session...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <>
      <BrowserRouter>
        <NotificationProvider> { /* Envelopper les Routes avec NotificationProvider */ }
          <Routes>
            <Route path="/" element={<Dashboard userRole={userRole || 'visiteur'} userName={localStorage.getItem('userName') || 'Utilisateur'} onLogout={handleLogout} />} />
            <Route path="/leads" element={<LeadManagementPage />} />
            <Route path="/clients" element={<Clients userRole={userRole || 'visiteur'} onEditClient={(id: any) => console.log('Edit client:', id)} />} />
            <Route path="/client/:id" element={<ClientDetail />} />
            <Route
              path="/client/nouveau"
              element={
                userRole === 'secretaire'
                  ? <Navigate to="/" replace />
                  : <AddClient />
              }
            />
            <Route
              path="/client/modifier/:id"
              element={
                userRole === 'secretaire'
                  ? <Navigate to="/" replace />
                  : <AddClient />
              }
            />
            <Route
              path="/journaux"
              element={
                userRole === 'administrateur'
                  ? <JournalActivite />
                  : <Navigate to="/" replace />
              }
            />
            {/* Routes de démo pour le développement */}
            <Route path="/demo-logout" element={<AutoLogoutDemo />} />
            <Route path="/test-logout" element={<AutoLogoutTest />} />
            <Route path="/mini-test" element={<MiniAutoLogoutTest />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </BrowserRouter>
      
      {/* 🔐 Composant d'avertissement de déconnexion automatique */}
      <AutoLogoutWarning
        isVisible={showWarning}
        onContinue={continueSession}
        onLogout={forceAutoLogout}
        warningTime={60}
      />
    </>
  );
}

export default App;
