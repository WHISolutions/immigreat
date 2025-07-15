// Service API pour la recherche globale
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fonction utilitaire pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Fonction utilitaire pour gérer les erreurs de réponse
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Effectue une recherche globale dans toutes les entités
 * @param {string} query - Terme de recherche
 * @returns {Promise<Object>} Résultats de recherche groupés par type
 */
export const performGlobalSearch = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: {
          leads: [],
          clients: [],
          dossiers: [],
          factures: [],
          conseillers: []
        },
        total: 0
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/search/global?query=${encodeURIComponent(query.trim())}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Erreur lors de la recherche globale:', error);
    throw error;
  }
};

/**
 * Obtient des suggestions d'auto-complétion
 * @param {string} query - Terme de recherche
 * @returns {Promise<Object>} Suggestions d'auto-complétion
 */
export const getAutocompleteSuggestions = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        suggestions: []
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/search/autocomplete?query=${encodeURIComponent(query.trim())}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Erreur lors de l\'autocomplete:', error);
    throw error;
  }
};

/**
 * Recherche spécifique dans les leads
 * @param {string} query - Terme de recherche
 * @param {Object} filters - Filtres additionnels
 * @returns {Promise<Object>} Résultats des leads
 */
export const searchLeads = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      search: query,
      ...filters
    });

    const response = await fetch(
      `${API_BASE_URL}/leads?${params}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Erreur lors de la recherche de leads:', error);
    throw error;
  }
};

/**
 * Recherche spécifique dans les clients
 * @param {string} query - Terme de recherche
 * @param {Object} filters - Filtres additionnels
 * @returns {Promise<Object>} Résultats des clients
 */
export const searchClients = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      search: query,
      ...filters
    });

    const response = await fetch(
      `${API_BASE_URL}/clients?${params}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Erreur lors de la recherche de clients:', error);
    throw error;
  }
};

/**
 * Recherche spécifique dans les factures
 * @param {string} query - Terme de recherche
 * @param {Object} filters - Filtres additionnels
 * @returns {Promise<Object>} Résultats des factures
 */
export const searchFactures = async (query, filters = {}) => {
  try {
    const params = new URLSearchParams({
      search: query,
      ...filters
    });

    const response = await fetch(
      `${API_BASE_URL}/factures?${params}`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    );

    return await handleApiResponse(response);
  } catch (error) {
    console.error('Erreur lors de la recherche de factures:', error);
    throw error;
  }
};

/**
 * Fonction utilitaire pour formater les résultats de recherche
 * @param {Object} results - Résultats bruts de l'API
 * @returns {Object} Résultats formatés
 */
export const formatSearchResults = (results) => {
  if (!results || !results.data) {
    return {
      leads: [],
      clients: [],
      dossiers: [],
      factures: [],
      conseillers: [],
      total: 0
    };
  }

  const { data } = results;
  const total = (data.leads?.length || 0) +
                (data.clients?.length || 0) +
                (data.dossiers?.length || 0) +
                (data.factures?.length || 0) +
                (data.conseillers?.length || 0);

  return {
    ...data,
    total
  };
};

/**
 * Fonction utilitaire pour mettre en surbrillance les termes de recherche
 * @param {string} text - Texte à traiter
 * @param {string} searchTerm - Terme à mettre en surbrillance
 * @returns {string} Texte avec surbrillance HTML
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
};

/**
 * Fonction utilitaire pour obtenir l'icône d'un type d'entité
 * @param {string} type - Type d'entité
 * @returns {string} Icône Unicode
 */
export const getEntityIcon = (type) => {
  const icons = {
    lead: '🎯',
    client: '👤',
    dossier: '📁',
    facture: '💰',
    conseiller: '👩‍💼',
    document: '📄',
    rendez_vous: '📅'
  };
  return icons[type] || '📄';
};

/**
 * Fonction utilitaire pour obtenir la couleur d'un type d'entité
 * @param {string} type - Type d'entité
 * @returns {string} Couleur hexadécimale
 */
export const getEntityColor = (type) => {
  const colors = {
    lead: '#2196F3',
    client: '#4CAF50',
    dossier: '#FF9800',
    facture: '#9C27B0',
    conseiller: '#607D8B',
    document: '#795548',
    rendez_vous: '#F44336'
  };
  return colors[type] || '#666666';
};

export default {
  performGlobalSearch,
  getAutocompleteSuggestions,
  searchLeads,
  searchClients,
  searchFactures,
  formatSearchResults,
  highlightSearchTerm,
  getEntityIcon,
  getEntityColor
};
