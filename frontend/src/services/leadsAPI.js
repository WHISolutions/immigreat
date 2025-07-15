const API_BASE_URL = 'http://localhost:5000/api';

// Fonction utilitaire pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Fonction pour récupérer tous les leads
export const getAllLeads = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des leads');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur API getAllLeads:', error);
    throw error;
  }
};

// Fonction pour créer un nouveau lead
export const createLead = async (leadData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Gestion spécifique des erreurs d'authentification
      if (response.status === 401) {
        const message = errorData.message || '';
        if (message.includes('Token expiré') || message.includes('Token expired')) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
      }
      
      throw new Error(errorData.message || 'Erreur lors de la création du lead');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur API createLead:', error);
    throw error;
  }
};

// Fonction pour convertir un lead en client
export const convertLeadToClient = async (leadId, utilisateur, notes) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/convert-to-client`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        utilisateur,
        notes
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la conversion');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur API convertLeadToClient:', error);
    throw error;
  }
};

// Fonction pour récupérer l'historique des conversions
export const getConversionHistory = async (limit = 50) => {
  try {
    const response = await fetch(`${API_BASE_URL}/leads/conversion-history?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'historique');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur API getConversionHistory:', error);
    throw error;
  }
};
