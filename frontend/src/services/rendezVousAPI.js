import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fonction utilitaire pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token trouvé dans localStorage:', token ? 'OUI' : 'NON');
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('✅ Header Authorization ajouté');
  } else {
    console.warn('⚠️ Aucun token trouvé - l\'utilisateur n\'est peut-être pas connecté');
  }
  
  return headers;
};

const rendezVousAPI = {
  // Récupérer tous les rendez-vous
  getAllRendezVous: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rendez-vous`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      throw error;
    }
  },

  // Récupérer les rendez-vous d'une conseillère
  getRendezVousByConseillere: async (conseillerEmail) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rendez-vous`, {
        headers: getAuthHeaders(),
        params: { conseiller: conseillerEmail }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des rendez-vous pour ${conseillerEmail}:`, error);
      throw error;
    }
  },

  // Récupérer un rendez-vous par ID
  getRendezVousById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rendez-vous/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du rendez-vous ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau rendez-vous
  createRendezVous: async (rendezVousData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rendez-vous`, rendezVousData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Erreur lors de la création du rendez-vous:', error.response.data);
      } else {
        console.error('Erreur lors de la création du rendez-vous:', error);
      }
      throw error;
    }
  },

  // Mettre à jour un rendez-vous
  updateRendezVous: async (id, rendezVousData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/rendez-vous/${id}`, rendezVousData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du rendez-vous ${id}:`, error);
      throw error;
    }
  },

  // Supprimer un rendez-vous
  deleteRendezVous: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/rendez-vous/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du rendez-vous ${id}:`, error);
      throw error;
    }
  },

  // Vérifier les conflits d'horaires
  checkConflicts: async (rendezVousData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rendez-vous/check-conflicts`, rendezVousData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification des conflits:', error);
      throw error;
    }
  }
};

export default rendezVousAPI;
