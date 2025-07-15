const { getIO } = require('../socket');

/**
 * Middleware pour émettre des événements temps réel pour les journaux d'activité
 */
const emitActivityLogEvent = async (action, entite, entiteId, utilisateur, details = {}) => {
  try {
    const io = getIO();
    
    // Créer l'événement avec les informations nécessaires
    const activityEvent = {
      action,
      entite,
      entite_id: entiteId,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role
      },
      date_action: new Date(),
      details
    };

    // Émettre l'événement à tous les clients connectés
    io.emit('newActivity', activityEvent);
    
    // Émettre spécifiquement pour les journaux d'activité
    io.emit('activityLogUpdate', activityEvent);
    
    console.log(`📡 Événement temps réel émis: ${action} sur ${entite} ${entiteId}`);
    
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'émission de l\'événement temps réel:', error.message);
  }
};

module.exports = {
  emitActivityLogEvent
};
