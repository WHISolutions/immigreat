const { getSequelize } = require('../config/db.config');
const { emitActivityLogEvent } = require('./activity-realtime');

/**
 * Fonction helper pour nettoyer les données avant sérialisation JSON
 */
const cleanDataForJson = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      } else if (typeof value === 'object' && value.constructor === Object) {
        cleaned[key] = cleanDataForJson(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => cleanDataForJson(item));
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

/**
 * Middleware pour enregistrer les logs d'activité
 * @param {string} action - Action effectuée (create_client, update_client, etc.)
 * @param {string} entite - Type d'entité (Client, Lead, User, etc.)
 * @param {number} entiteId - ID de l'entité
 * @param {object} anciennesValeurs - Anciennes valeurs (optionnel)
 * @param {object} nouvellesValeurs - Nouvelles valeurs (optionnel)
 * @param {object} req - Objet request Express
 */
const logActivity = async (action, entite, entiteId, anciennesValeurs = null, nouvellesValeurs = null, req) => {
  try {
    const sequelize = getSequelize();
    const { ActivityLog } = sequelize.models;

    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      console.warn('Tentative d\'enregistrement d\'activité sans utilisateur authentifié');
      return;
    }

    // Obtenir l'adresse IP avec gestion moderne
    const adresseIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] ||
                     req.ip ||
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
                     'unknown';

    // Debug: afficher l'IP récupérée
    console.log(`🌐 IP récupérée pour ${action}:`, adresseIp);
    console.log(`🌐 Headers IP:`, {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'req.ip': req.ip,
      'connection.remoteAddress': req.connection?.remoteAddress,
      'socket.remoteAddress': req.socket?.remoteAddress
    });

    // Obtenir le user agent
    const userAgent = req.headers['user-agent'] || null;

    // Nettoyer les données avant sérialisation
    const cleanedAnciennesValeurs = cleanDataForJson(anciennesValeurs);
    const cleanedNouvellesValeurs = cleanDataForJson(nouvellesValeurs);

    // Créer l'enregistrement du log
    const activityLog = await ActivityLog.create({
      utilisateur_id: req.user.id,
      action: action,
      entite: entite,
      entite_id: entiteId,
      anciennes_valeurs: cleanedAnciennesValeurs ? JSON.stringify(cleanedAnciennesValeurs) : null,
      nouvelles_valeurs: cleanedNouvellesValeurs ? JSON.stringify(cleanedNouvellesValeurs) : null,
      adresse_ip: adresseIp,
      user_agent: userAgent,
      date_action: new Date()
    });

    // Émettre l'événement temps réel pour les journaux d'activité
    await emitActivityLogEvent(action, entite, entiteId, req.user, {
      anciennes_valeurs: anciennesValeurs,
      nouvelles_valeurs: nouvellesValeurs,
      adresse_ip: adresseIp
    });

    console.log(`Log d'activité enregistré: ${action} sur ${entite} ${entiteId} par utilisateur ${req.user.id}`);

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log d\'activité:', error);
    // Ne pas faire échouer la requête principale à cause d'un problème de log
  }
};

/**
 * Middleware Express pour enregistrer automatiquement les logs
 * Usage: app.use('/api/clients', logMiddleware('Client'), clientRoutes);
 */
const logMiddleware = (entite) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode send originale
    const originalSend = res.send;
    
    // Intercepter la réponse
    res.send = function(data) {
      // Appeler la méthode originale
      originalSend.call(this, data);
      
      // Enregistrer le log après le succès de l'opération
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action = '';
        let entiteId = null;
        
        // Déterminer l'action selon la méthode HTTP
        switch (req.method) {
          case 'POST':
            action = `create_${entite.toLowerCase()}`;
            // Essayer d'extraire l'ID de la réponse
            try {
              const responseData = JSON.parse(data);
              if (responseData.data && responseData.data.id) {
                entiteId = responseData.data.id;
              }
            } catch (e) {
              // Si on ne peut pas parser la réponse, utiliser l'ID des params
              entiteId = req.params.id || 0;
            }
            break;
          case 'PUT':
          case 'PATCH':
            action = `update_${entite.toLowerCase()}`;
            entiteId = req.params.id || 0;
            break;
          case 'DELETE':
            action = `delete_${entite.toLowerCase()}`;
            entiteId = req.params.id || 0;
            break;
          default:
            // Ne pas logger les GET et autres méthodes
            return;
        }
        
        if (action && entiteId) {
          // Enregistrer le log de façon asynchrone
          setImmediate(() => {
            logActivity(action, entite, entiteId, null, req.body, req);
          });
        }
      }
    };
    
    next();
  };
};

/**
 * Fonction utilitaire pour enregistrer des logs personnalisés
 */
const logCustomActivity = (action, entite, entiteId, anciennesValeurs, nouvellesValeurs, req) => {
  return logActivity(action, entite, entiteId, anciennesValeurs, nouvellesValeurs, req);
};

module.exports = {
  logActivity,
  logMiddleware,
  logCustomActivity
};
