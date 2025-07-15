import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fonction utilitaire pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

const clientsAPI = {
  // Récupérer tous les clients
  getAllClients: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Récupérer un client par ID
  getClientById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  },

  // Créer un nouveau client
  createClient: async (clientData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/clients`, clientData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Erreur lors de la création du client:', error.response.data);
      } else {
        console.error('Erreur lors de la création du client:', error);
      }
      throw error;
    }
  },

  // Mettre à jour un client
  updateClient: async (id, clientData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/clients/${id}`, clientData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  },

  // Rechercher des clients par nom ou téléphone
  searchClients: async (searchTerm) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients`, {
        headers: getAuthHeaders(),
        params: { search: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de clients:', error);
      throw error;
    }
  },

  // Supprimer un client
  deleteClient: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/clients/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  }
};

export default clientsAPI;
