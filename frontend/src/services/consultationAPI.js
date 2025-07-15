const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour les consultations
export const consultationService = {
  // Créer une nouvelle consultation
  async createConsultation(leadId, conseillerId, reason = 'Consultation effectuée') {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          conseillerId,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la consultation:', error);
      throw error;
    }
  },

  // Annuler une consultation
  async invalidateConsultation(consultationId, reason) {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations/${consultationId}/invalidate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la consultation:', error);
      throw error;
    }
  },

  // Récupérer les consultations d'un lead
  async getConsultationsByLead(leadId, includeInvalid = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations/lead/${leadId}?includeInvalid=${includeInvalid}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des consultations du lead:', error);
      throw error;
    }
  },

  // Récupérer les consultations d'un conseiller
  async getConsultationsByConseiller(conseillerId, includeInvalid = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations/conseiller/${conseillerId}?includeInvalid=${includeInvalid}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des consultations du conseiller:', error);
      throw error;
    }
  }
};

// Service pour les statistiques
export const statsService = {
  // Récupérer les statistiques de consultations
  async getConsultationStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.conseillere) {
        queryParams.append('conseillere', filters.conseillere);
      }
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/stats/consultations?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Récupérer les statistiques détaillées d'un conseiller
  async getConseillerStats(conseillerId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/stats/consultations/conseiller/${conseillerId}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du conseiller:', error);
      throw error;
    }
  }
};
