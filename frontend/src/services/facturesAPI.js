// Service API pour la gestion des factures

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Fonction utilitaire pour les requêtes HTTP
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Récupérer toutes les factures
export const getAllFactures = async () => {
  try {
    const response = await makeRequest('/factures');
    return {
      success: true,
      data: response.data || [],
      message: response.message
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// Récupérer une facture par ID
export const getFactureById = async (id) => {
  try {
    const response = await makeRequest(`/factures/${id}`);
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération de la facture ${id}:`, error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

// Créer une nouvelle facture
export const createFacture = async (factureData) => {
  try {
    console.log('📝 Création d\'une nouvelle facture:', factureData);
    
    const response = await makeRequest('/factures', {
      method: 'POST',
      body: JSON.stringify(factureData)
    });
    
    console.log('✅ Facture créée avec succès:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la facture:', error);
    throw error;
  }
};

// Mettre à jour une facture
export const updateFacture = async (id, factureData) => {
  try {
    const response = await makeRequest(`/factures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(factureData)
    });
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la facture ${id}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Annuler une facture (admin seulement)
export const annulerFacture = async (id, raisonAnnulation) => {
  try {
    const response = await makeRequest(`/factures/${id}/annuler`, {
      method: 'POST',
      body: JSON.stringify({ raison_annulation: raisonAnnulation })
    });
    
    console.log('✅ Facture annulée avec succès:', response.data);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de l\'annulation de la facture:', error);
    throw error;
  }
};

// Récupérer les statistiques des factures
export const getFacturesStats = async () => {
  try {
    const response = await makeRequest('/factures/stats');
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      data: {
        totalFactures: 0,
        totalMontant: 0,
        facturesPayees: 0,
        facturesEnAttente: 0,
        facturesEnRetard: 0
      },
      error: error.message
    };
  }
};

// Formater le montant selon la monnaie
export const formatMontant = (montant, monnaie = 'MAD') => {
  if (monnaie === 'CAD') {
    return new Intl.NumberFormat('fr-CA', { 
      style: 'currency', 
      currency: 'CAD' 
    }).format(montant || 0);
  }
  
  // Par défaut MAD
  return new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD' 
  }).format(montant || 0);
};

// Obtenir le symbole de la monnaie
export const getSymboleMonnaie = (monnaie) => {
  return monnaie === 'MAD' ? 'DH' : '$';
};

// Obtenir la classe CSS pour le statut
export const getStatutClass = (statut) => {
  const classes = {
    'brouillon': 'statut-brouillon',
    'payable': 'statut-payable',
    'payee': 'statut-payee',
    'en_retard': 'statut-en-retard',
    'annulee': 'statut-annulee'
  };
  
  return classes[statut?.toLowerCase()] || 'statut-default';
};

// Mapper les statuts pour l'affichage
export const mapStatutForDisplay = (statut) => {
  const statutMap = {
    'brouillon': 'Brouillon',
    'payable': 'Payable',
    'payee': 'Payée',
    'en_retard': 'En retard',
    'annulee': 'Annulée'
  };
  
  return statutMap[statut?.toLowerCase()] || statut;
};

// Vérifier si une facture peut être modifiée
export const canEditFacture = (statut, userRole = 'conseillere') => {
  // Les administrateurs peuvent toujours modifier
  if (userRole === 'administrateur') return true;

  // Les conseillères ne peuvent modifier que les brouillons
  if (userRole === 'conseillere') {
    return statut?.toLowerCase() === 'brouillon';
  }

  // Directeurs ou autres rôles spéciaux : brouillon + payable
  return ['brouillon', 'payable'].includes(statut?.toLowerCase());
};

// Formater la date pour l'affichage
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return dateString;
  }
};

export default {
  getAllFactures,
  getFactureById,
  createFacture,
  updateFacture,
  annulerFacture,
  getFacturesStats,
  formatMontant,
  getSymboleMonnaie,
  getStatutClass,
  mapStatutForDisplay,
  canEditFacture,
  formatDate
};