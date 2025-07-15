import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour récupérer les statistiques dynamiques
class StatisticsService {
  // Récupérer les leads par source pour une période donnée
  async getLeadsParSource(periode = 'mois') {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/leads-par-source/${periode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des leads par source:', error);
      throw error;
    }
  }

  // Récupérer les revenus par période
  async getRevenusParPeriode(periode = 'mois') {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/revenus-par-periode/${periode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des revenus:', error);
      throw error;
    }
  }

  // Récupérer les dossiers par type pour une période donnée
  async getDossiersParType(periode = 'mois') {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/dossiers-par-type/${periode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers par type:', error);
      throw error;
    }
  }

  // Récupérer toutes les statistiques en une seule requête (optimisé)
  async getAllStatistics(periode = 'mois') {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/all/${periode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les statistiques:', error);
      throw error;
    }
  }

  // Récupérer toutes les statistiques globales (tous utilisateurs) en une seule requête
  async getAllGlobalStatistics(periode = 'mois') {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/global/${periode}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques globales:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour récupérer les statistiques avec fallback vers des données statiques
  async getStatisticsWithFallback(periode = 'mois') {
    try {
      const response = await this.getAllStatistics(periode);
      if (response.success) {
        return response.data;
      } else {
        console.warn('API retournée avec success=false, utilisation des données de fallback');
        return this.getFallbackData(periode);
      }
    } catch (error) {
      console.warn('API non disponible, utilisation des données de fallback:', error.message);
      return this.getFallbackData(periode);
    }
  }

  // Méthode pour récupérer les statistiques avec priorité sur les données globales
  async getGlobalStatisticsWithFallback(periode = 'mois') {
    try {
      console.log(`🌍 [StatisticsService] Récupération des statistiques GLOBALES pour: ${periode}`);
      
      const response = await this.getAllGlobalStatistics(periode);
      if (response.success && response.global) {
        console.log(`✅ [StatisticsService] Statistiques globales reçues pour ${periode}:`, response.data);
        return response.data;
      } else {
        console.warn('API globale retournée avec success=false, tentative avec API standard');
        return await this.getStatisticsWithFallback(periode);
      }
    } catch (error) {
      console.warn('API globale non disponible, utilisation de l\'API standard:', error.message);
      return await this.getStatisticsWithFallback(periode);
    }
  }

  // Données de fallback en cas d'erreur API
  getFallbackData(periode) {
    const fallbackData = {
      jour: {
        leadsParSource: [
          { source: 'Site Web', valeur: 3 },
          { source: 'Référence', valeur: 1 },
          { source: 'Réseaux Sociaux', valeur: 2 },
          { source: 'Autre', valeur: 0 }
        ],
        revenusParMois: [
          { mois: '08:00', valeur: 1200 },
          { mois: '12:00', valeur: 1500 },
          { mois: '16:00', valeur: 1100 },
          { mois: '18:00', valeur: 1800 }
        ],
        dossiersParType: [
          { type: 'Permis d\'études', valeur: 2 },
          { type: 'Résidence permanente', valeur: 1 },
          { type: 'Visa visiteur', valeur: 1 },
          { type: 'Permis de travail', valeur: 0 }
        ]
      },
      semaine: {
        leadsParSource: [
          { source: 'Site Web', valeur: 8 },
          { source: 'Référence', valeur: 3 },
          { source: 'Réseaux Sociaux', valeur: 3 },
          { source: 'Autre', valeur: 2 }
        ],
        revenusParMois: [
          { mois: 'Lun', valeur: 5500 },
          { mois: 'Mar', valeur: 6200 },
          { mois: 'Mer', valeur: 5800 },
          { mois: 'Jeu', valeur: 7500 },
          { mois: 'Ven', valeur: 8000 }
        ],
        dossiersParType: [
          { type: 'Permis d\'études', valeur: 5 },
          { type: 'Résidence permanente', valeur: 3 },
          { type: 'Visa visiteur', valeur: 2 },
          { type: 'Permis de travail', valeur: 2 }
        ]
      },
      mois: {
        leadsParSource: [
          { source: 'Site Web', valeur: 12 },
          { source: 'Référence', valeur: 5 },
          { source: 'Réseaux Sociaux', valeur: 4 },
          { source: 'Autre', valeur: 3 }
        ],
        revenusParMois: [
          { mois: 'Sem 1', valeur: 15000 },
          { mois: 'Sem 2', valeur: 18000 },
          { mois: 'Sem 3', valeur: 16500 },
          { mois: 'Sem 4', valeur: 21000 }
        ],
        dossiersParType: [
          { type: 'Permis d\'études', valeur: 8 },
          { type: 'Résidence permanente', valeur: 6 },
          { type: 'Visa visiteur', valeur: 4 },
          { type: 'Permis de travail', valeur: 3 }
        ]
      },
      annee: {
        leadsParSource: [
          { source: 'Site Web', valeur: 120 },
          { source: 'Référence', valeur: 45 },
          { source: 'Réseaux Sociaux', valeur: 38 },
          { source: 'Autre', valeur: 27 }
        ],
        revenusParMois: [
          { mois: 'Jan', valeur: 180000 },
          { mois: 'Fév', valeur: 234000 },
          { mois: 'Mar', valeur: 198000 },
          { mois: 'Avr', valeur: 267000 }
        ],
        dossiersParType: [
          { type: 'Permis d\'études', valeur: 45 },
          { type: 'Résidence permanente', valeur: 32 },
          { type: 'Visa visiteur', valeur: 28 },
          { type: 'Permis de travail', valeur: 25 }
        ]
      }
    };

    return fallbackData[periode] || fallbackData.mois;
  }
}

// Créer une instance unique du service
const statisticsService = new StatisticsService();

export default statisticsService;
