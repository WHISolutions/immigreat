import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Fonction utilitaire pour obtenir les headers avec authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const rapportsAPI = {
  // Récupérer les données complètes d'un client pour générer un rapport
  getClientRapportData: async (clientId) => {
    try {
      console.log(`🔄 [RapportsAPI] Récupération des données de rapport pour le client ${clientId}`);
      
      const response = await axios.get(`${API_BASE_URL}/rapports/client/${clientId}/rapport-donnees`, {
        headers: getAuthHeaders()
      });
      
      console.log('✅ [RapportsAPI] Données de rapport récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [RapportsAPI] Erreur récupération données rapport:', error);
      throw error;
    }
  },

  // Générer un rapport PDF (simulation)
  generatePDFReport: async (clientId, typeRapport, options = {}) => {
    try {
      console.log(`📄 [RapportsAPI] Génération PDF pour client ${clientId}, type: ${typeRapport}`);
      
      // Simulation de la génération PDF
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        message: 'Rapport PDF généré avec succès',
        url: `/rapports/pdf/client-${clientId}-${typeRapport}-${Date.now()}.pdf`
      };
    } catch (error) {
      console.error('❌ [RapportsAPI] Erreur génération PDF:', error);
      throw error;
    }
  },

  // Envoyer un rapport par email (simulation)
  sendReportByEmail: async (clientId, email, typeRapport, options = {}) => {
    try {
      console.log(`📧 [RapportsAPI] Envoi email rapport client ${clientId} vers ${email}`);
      
      // Simulation de l'envoi email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: `Rapport envoyé à ${email} avec succès`
      };
    } catch (error) {
      console.error('❌ [RapportsAPI] Erreur envoi email:', error);
      throw error;
    }
  }
};

export default rapportsAPI;
