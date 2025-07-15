import axios from 'axios';

// Fonction pour forcer la déconnexion et rediriger vers la page de connexion
const forceLogout = () => {
  // Nettoyer le localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
  
  // Nettoyer les headers axios
  delete axios.defaults.headers.common['Authorization'];
  
  // Recharger la page pour revenir à l'écran de connexion
  window.location.href = '/';
};

// Intercepteur pour les réponses
const setupAxiosInterceptors = () => {
  // Intercepteur de requête pour ajouter automatiquement le token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && token !== 'mock-token') {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs d'authentification
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        
        // Gérer les erreurs d'authentification (401)
        if (status === 401) {
          const message = data?.message || '';
          
          if (message.includes('Token expiré') || 
              message.includes('Token expired') || 
              message.includes('Token invalide') ||
              message.includes('Token invalid')) {
            
            console.log('🔒 Token expiré détecté, déconnexion automatique...');
            
            // Afficher une notification à l'utilisateur
            if (window.confirm('Votre session a expiré. Vous allez être redirigé vers la page de connexion.')) {
              forceLogout();
            } else {
              forceLogout(); // Forcer la déconnexion même si l'utilisateur refuse
            }
          }
        }
        
        // Gérer les erreurs de serveur (500+)
        if (status >= 500) {
          console.error('🚨 Erreur serveur:', data?.message || 'Erreur interne du serveur');
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Fonction pour vérifier la validité du token au démarrage
const validateToken = async () => {
  const token = localStorage.getItem('token');
  
  // Si c'est un token mock, pas besoin de validation
  if (!token || token === 'mock-token') {
    return true;
  }
  
  try {
    // Faire une requête simple pour tester le token
    const response = await axios.get('http://localhost:5000/api/users/me');
    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('🔒 Token invalide au démarrage, déconnexion...');
      forceLogout();
      return false;
    }
    // Autres erreurs (réseau, etc.) on considère que le token est encore valide
    return true;
  }
};

export { setupAxiosInterceptors, validateToken, forceLogout }; 