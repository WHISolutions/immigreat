import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Service pour récupérer tous les conseillers (admin et conseillere)
export const getConseillers = async () => {
  try {
    console.log('🔄 Chargement des conseillers depuis l\'API...');
    
    const response = await axios.get(`${BASE_URL}/users/conseillers`);
    
    if (response.data.success) {
      console.log('✅ Conseillers récupérés:', response.data.data);
      return {
        success: true,
        data: response.data.data
      };
    } else {
      throw new Error(response.data.message || 'Erreur lors de la récupération des conseillers');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des conseillers:', error);
    
    // Retourner une liste par défaut en cas d'erreur
    return {
      success: false,
      error: error.message,
      data: [
        { id: 1, nomComplet: 'wafaa chaouby' },
        { id: 2, nomComplet: 'hame amni' },
        { id: 3, nomComplet: 'sanaa sami' }
      ]
    };
  }
};

// Fonction utilitaire pour formater les conseillers en options de select
export const formatConseillerOptions = (conseillers) => {
  const options = [
    { value: '', label: 'Aucune conseillère assignée' }
  ];
  
  conseillers.forEach(conseiller => {
    options.push({
      value: conseiller.nomComplet,
      label: conseiller.nomComplet
    });
  });
  
  return options;
};

// Fonction utilitaire pour obtenir juste les noms des conseillers
export const getConseillerNames = (conseillers) => {
  return conseillers.map(conseiller => conseiller.nomComplet);
};

export default {
  getConseillers,
  formatConseillerOptions,
  getConseillerNames
}; 