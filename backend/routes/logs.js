const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');

// Import du middleware d'authentification
let authenticate;
try {
  const authMiddleware = require('../middleware/auth');
  authenticate = authMiddleware.authenticate;
  
  if (!authenticate || typeof authenticate !== 'function') {
    console.error('❌ Erreur: middleware authenticate non trouvé ou invalide');
    throw new Error('Middleware authenticate invalide');
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'import du middleware auth:', error);
  throw error;
}

// GET /api/logs - Récupérer tous les logs d'activité
router.get('/', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { ActivityLog, User } = sequelize.models;

    // Vérifier que l'utilisateur est administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Seuls les administrateurs peuvent accéder aux journaux d\'activité' 
      });
    }

    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Filtres optionnels
    const filters = {};
    if (req.query.action) {
      filters.action = req.query.action;
    }
    if (req.query.entite) {
      filters.entite = req.query.entite;
    }
    if (req.query.utilisateur_id) {
      filters.utilisateur_id = req.query.utilisateur_id;
    }
    if (req.query.date_debut && req.query.date_fin) {
      filters.date_action = {
        [sequelize.Sequelize.Op.between]: [req.query.date_debut, req.query.date_fin]
      };
    }

    // Récupérer les logs avec les informations utilisateur
    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where: {
        ...filters,
        // Exclure les logs système inutiles
        action: {
          [sequelize.Sequelize.Op.notIn]: ['ping', 'heartbeat', 'system_check']
        }
      },
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'role']
        }
      ],
      order: [['date_action', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Formater les données pour le frontend
    const formattedLogs = logs.map(log => {
      const logData = log.toJSON();
      
      // Parser les JSON des anciennes et nouvelles valeurs
      let anciennesValeurs = null;
      let nouvellesValeurs = null;
      
      try {
        if (logData.anciennes_valeurs) {
          anciennesValeurs = JSON.parse(logData.anciennes_valeurs);
        }
      } catch (e) {
        console.warn('Erreur parsing anciennes_valeurs:', e);
      }
      
      try {
        if (logData.nouvelles_valeurs) {
          nouvellesValeurs = JSON.parse(logData.nouvelles_valeurs);
        }
      } catch (e) {
        console.warn('Erreur parsing nouvelles_valeurs:', e);
      }

      return {
        id: logData.id,
        action: logData.action,
        entite: logData.entite,
        entite_id: logData.entite_id,
        date_action: logData.date_action,
        adresse_ip: logData.adresse_ip,
        utilisateur: {
          id: logData.utilisateur.id,
          nom: logData.utilisateur.nom,
          prenom: logData.utilisateur.prenom,
          email: logData.utilisateur.email,
          role: logData.utilisateur.role
        },
        anciennes_valeurs: anciennesValeurs,
        nouvelles_valeurs: nouvellesValeurs
      };
    });

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page: page,
        limit: limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      message: error.message 
    });
  }
});

// GET /api/logs/actions - Récupérer la liste des actions disponibles
router.get('/actions', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { ActivityLog } = sequelize.models;

    // Vérifier que l'utilisateur est administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Seuls les administrateurs peuvent accéder aux journaux d\'activité' 
      });
    }

    // Récupérer les actions distinctes
    const actions = await ActivityLog.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('action')), 'action']
      ],
      where: {
        action: {
          [sequelize.Sequelize.Op.notIn]: ['ping', 'heartbeat', 'system_check']
        }
      },
      order: [['action', 'ASC']]
    });

    const actionsList = actions.map(a => a.action);

    res.json({
      success: true,
      data: actionsList
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      message: error.message 
    });
  }
});

// GET /api/logs/entites - Récupérer la liste des entités disponibles
router.get('/entites', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { ActivityLog } = sequelize.models;

    // Vérifier que l'utilisateur est administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Seuls les administrateurs peuvent accéder aux journaux d\'activité' 
      });
    }

    // Récupérer les entités distinctes
    const entites = await ActivityLog.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('entite')), 'entite']
      ],
      order: [['entite', 'ASC']]
    });

    const entitesList = entites.map(e => e.entite);

    res.json({
      success: true,
      data: entitesList
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des entités:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      message: error.message 
    });
  }
});

// GET /api/logs/export - Exporter les logs en CSV
router.get('/export', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { ActivityLog, User } = sequelize.models;

    // Vérifier que l'utilisateur est administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé', 
        message: 'Seuls les administrateurs peuvent accéder aux journaux d\'activité' 
      });
    }

    // Récupérer tous les logs (avec limite raisonnable)
    const logs = await ActivityLog.findAll({
      where: {
        action: {
          [sequelize.Sequelize.Op.notIn]: ['ping', 'heartbeat', 'system_check']
        }
      },
      include: [
        {
          model: User,
          as: 'utilisateur',
          attributes: ['nom', 'prenom', 'email', 'role']
        }
      ],
      order: [['date_action', 'DESC']],
      limit: 10000 // Limite pour éviter les problèmes de mémoire
    });

    // Générer le CSV
    const csvHeader = 'Date,Utilisateur,Action,Entité,ID Entité,Anciennes Valeurs,Nouvelles Valeurs,IP\n';
    const csvData = logs.map(log => {
      const utilisateur = `${log.utilisateur.prenom} ${log.utilisateur.nom}`;
      const date = new Date(log.date_action).toLocaleString('fr-FR');
      const anciennesValeurs = log.anciennes_valeurs ? JSON.stringify(log.anciennes_valeurs).replace(/"/g, '""') : '';
      const nouvellesValeurs = log.nouvelles_valeurs ? JSON.stringify(log.nouvelles_valeurs).replace(/"/g, '""') : '';
      
      return `"${date}","${utilisateur}","${log.action}","${log.entite}","${log.entite_id}","${anciennesValeurs}","${nouvellesValeurs}","${log.adresse_ip || ''}"`;
    }).join('\n');

    const csv = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="logs_activite_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Erreur lors de l\'export des logs:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur', 
      message: error.message 
    });
  }
});

module.exports = router;
