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

export const getDashboardStats = async (periode = 'mois') => {
  console.log('🔑 [API] Récupération stats avec token:', localStorage.getItem('token') ? 'Token présent' : 'Pas de token');
  const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
    params: { periode },
    headers: getAuthHeaders()
  });
  console.log('📊 [API] Réponse stats reçue:', response.data);
  return response.data;
};

// Récupérer les vraies ventes par conseillère
export const getVentesParConseillere = async (periode = 'mois') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/ventes-conseilleres`, {
      params: { periode },
      headers: getAuthHeaders()
    });
    return {
      success: true,
      data: response.data.data || [],
      summary: response.data.summary || {},
      periode: response.data.periode || periode
    };
  } catch (error) {
    console.error('❌ Erreur récupération ventes conseillères:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// Récupérer les ventes d'une conseillère spécifique (pour son tableau de bord personnel)
export const getMesVentes = async (conseillere = null, periode = 'mois') => {
  try {
    console.log('🔑 [API] Récupération mes ventes avec token:', localStorage.getItem('token') ? 'Token présent' : 'Pas de token');
    console.log('🔍 [API] Paramètres:', { conseillere, periode });
    
    const params = { periode };
    
    // Ajouter le paramètre conseillere seulement si fourni (pour les admins qui consultent les données d'une conseillère spécifique)
    if (conseillere) {
      params.conseillere = conseillere;
      console.log('🎯 [API] Filtrage explicite par conseillère:', conseillere);
    } else {
      console.log('🔐 [API] Utilisation de l\'authentification automatique');
    }
    
    const response = await axios.get(`${API_BASE_URL}/dashboard/mes-ventes`, {
      params,
      headers: getAuthHeaders()
    });
    
    console.log('📊 [API] Réponse mes ventes reçue:', response.data);
    
    return {
      success: true,
      data: response.data.data || {},
      periode: response.data.periode || periode
    };
  } catch (error) {
    console.error('❌ Erreur récupération mes ventes:', error);
    return {
      success: false,
      data: {
        mesFactures: [],
        monTotalTTC: 0,
        monNombreFactures: 0,
        facturesPayees: 0,
        facturesEnAttente: 0
      },
      error: error.message
    };
  }
}; 

// Récupérer les rendez-vous à venir pour le tableau de bord
export const getRendezVousAVenir = async (userRole = 'directeur', userName = null, limite = 10) => {
  try {
    console.log('🔄 [API] Récupération rendez-vous à venir pour:', { userRole, userName, limite });
    
    const params = { limite };
    
    // Pour les conseillères, récupérer seulement leurs propres rendez-vous
    if (userRole === 'conseillere' && userName) {
      params.conseillere = userName;
    }
    
    const response = await axios.get(`${API_BASE_URL}/dashboard/rendez-vous-a-venir`, {
      params,
      headers: getAuthHeaders()
    });
    
    console.log('📅 [API] Rendez-vous à venir reçus:', response.data);
    
    return {
      success: true,
      data: response.data.data || [],
      periode: response.data.periode || 'prochains_jours'
    };
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous à venir:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
}; 

// Fonction pour récupérer les activités récentes en temps réel
export const getActivitesRecentes = async (limit = 10) => {
  try {
    console.log('🔄 [DashboardAPI] Récupération des activités récentes...');
    
    const response = await fetch(`${API_BASE_URL}/dashboard/activites-recentes?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [DashboardAPI] ${data.data.activites.length} activités récentes récupérées`);
      return {
        success: true,
        data: data.data.activites,
        lastUpdate: data.data.lastUpdate,
        totalFound: data.data.totalFound
      };
    } else {
      console.error('❌ [DashboardAPI] Erreur API activités récentes:', data.message);
      return {
        success: false,
        message: data.message,
        data: []
      };
    }
  } catch (error) {
    console.error('❌ [DashboardAPI] Erreur réseau activités récentes:', error);
    return {
      success: false,
      message: 'Erreur de connexion au serveur',
      data: []
    };
  }
};

// Récupérer les consultations effectuées pour le tableau de bord
export const getConsultations = async (userRole = 'directeur', userId = null, periode = 'mois', userName = null) => {
  try {
    console.log('🔄 [API] Récupération consultations pour:', { userRole, userId, periode, userName });
    
    const params = { periode };
    
    // 🔧 CORRECTION: Utiliser userId en priorité, puis userName en fallback
    if (userRole === 'conseillere') {
      if (userId) {
        params.userId = userId;
        console.log('🔒 [API] Filtrage par userId:', userId);
      } else if (userName) {
        params.conseillere = userName;
        console.log('🔒 [API] Filtrage par conseillère (fallback):', userName);
      }
    }
    
    const response = await axios.get(`${API_BASE_URL}/dashboard/consultations`, {
      params,
      headers: getAuthHeaders()
    });
    
    console.log('📈 [API] Consultations reçues:', response.data);
    
    return {
      success: true,
      data: response.data.data || {
        totalConsultations: 0,
        consultationsRecentes: [],
        evolution: '+0%'
      },
      periode: response.data.periode || periode
    };
  } catch (error) {
    console.error('❌ Erreur récupération consultations:', error);
    return {
      success: false,
      data: {
        totalConsultations: 0,
        consultationsRecentes: [],
        evolution: '+0%'
      },
      error: error.message
    };
  }
};

// Récupérer les statistiques de consultations via la nouvelle API
export const getConsultationStats = async (filters = {}) => {
  try {
    console.log('🔄 [API] Récupération stats consultations:', filters);
    
    const params = new URLSearchParams();
    
    if (filters.conseillere) {
      params.append('conseillere', filters.conseillere);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    const response = await axios.get(`${API_BASE_URL}/stats/consultations?${params}`, {
      headers: getAuthHeaders()
    });
    
    console.log('📊 [API] Stats consultations reçues:', response.data);
    
    return {
      success: true,
      stats: response.data.stats || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.error('❌ Erreur récupération stats consultations:', error);
    return {
      success: false,
      stats: [],
      total: 0,
      error: error.message
    };
  }
};