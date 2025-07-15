const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const { logActivity } = require('../middleware/activity-logger');

// Route GET pour récupérer tous les clients (avec filtrage par utilisateur)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const Document = sequelize.models.Document;
    const user = req.user;
    const { search } = req.query; // 🔴 NOUVEAU : Récupérer le paramètre de recherche
    
    console.log('👤 Utilisateur connecté (clients):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    if (search) {
      console.log('🔍 Recherche client:', search);
    }

    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    
    if (user && user.role === 'conseillere') {
      // Les conseillers ne voient que leurs propres clients
      const fullName1 = `${user.prenom} ${user.nom}`; // Format prénom nom
      const fullName2 = `${user.nom} ${user.prenom}`; // Format nom prénom
      whereConditions = {
        [Op.or]: [
          { conseillere: fullName1 },
          { conseillere: fullName1.toLowerCase() },
          { conseillere: fullName2 },
          { conseillere: fullName2.toLowerCase() },
          { conseillere: user.nom },
          { conseillere: user.prenom },
          { conseillere: { [Op.is]: null } }, // Clients sans conseillère assignée
          { conseillere: '' } // Clients avec conseillère vide
        ]
      };
      console.log('🔒 Filtrage clients pour conseillère:', fullName1, 'ou', fullName2);
    }
    // Les admins, secrétaires et comptables voient tout (pas de filtre)
    
    // 🔴 NOUVEAU : Ajouter la logique de recherche
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchConditions = {
        [Op.or]: [
          { nom: { [Op.like]: `%${searchTerm}%` } },
          { prenom: { [Op.like]: `%${searchTerm}%` } },
          { telephone: { [Op.like]: `%${searchTerm}%` } },
          { email: { [Op.like]: `%${searchTerm}%` } },
          sequelize.where(
            sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
            { [Op.like]: `%${searchTerm}%` }
          ),
          sequelize.where(
            sequelize.fn('CONCAT', sequelize.col('nom'), ' ', sequelize.col('prenom')),
            { [Op.like]: `%${searchTerm}%` }
          )
        ]
      };
      
      // Combiner les conditions de rôle avec les conditions de recherche
      if (Object.keys(whereConditions).length > 0) {
        whereConditions = {
          [Op.and]: [whereConditions, searchConditions]
        };
      } else {
        whereConditions = searchConditions;
      }
    }
    
    const clients = await Client.findAll({
      where: whereConditions,
      include: [{ model: Document, as: 'documents' }],
      order: [['date_creation', 'DESC']]
    });

    console.log(`✅ ${clients.length} clients récupérés depuis MySQL`);

    res.json({
      success: true,
      message: `${clients.length} clients récupérés`,
      data: {
        clients,
        count: clients.length,
        filteredBy: user && user.role === 'conseillere' ? `${user.nom} ${user.prenom}` : 'Tous'
      }
    });
  } catch (error) {
    console.error('❌ Erreur clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Route POST pour créer un nouveau client
router.post('/', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const user = req.user;
    
    console.log(`🔄 Création d'un nouveau client par ${user.prenom} ${user.nom}`);
    
    // Extraire les données du body
    const {
      prenom,
      nom,
      email,
      telephone,
      adresse,
      pays_origine,
      programme_immigration,
      statut,
      notes,
      conseiller_id,
      conseillere,
      numero_dossier,
      // Champs supplémentaires pour clients complets
      type_procedure,
      informations_specifiques,
      date_naissance,
      nationalite,
      contact_nom,
      contact_prenom,
      contact_relation,
      contact_telephone,
      contact_email,
      login_client,
      mot_de_passe_client,
      urgence
    } = req.body;
    
    // Validation des champs requis
    if (!prenom || !nom || !email) {
      return res.status(400).json({
        success: false,
        message: 'Les champs prenom, nom et email sont requis'
      });
    }
    
    // Vérifier si le client existe déjà
    const existingClient = await Client.findOne({ where: { email } });
    if (existingClient) {
      return res.status(409).json({
        success: false,
        message: 'Un client avec cet email existe déjà'
      });
    }
    
    // Créer le nouveau client
    const newClient = await Client.create({
      prenom,
      nom,
      email,
      telephone,
      adresse,
      pays_origine,
      programme_immigration: programme_immigration || 'Non spécifié',
      statut: statut || 'nouveau',
      notes,
      conseiller_id,
      conseillere,
      numero_dossier,
      // Champs supplémentaires
      type_procedure: type_procedure || null,
      informations_specifiques: informations_specifiques ? 
        (typeof informations_specifiques === 'string' ? JSON.parse(informations_specifiques) : informations_specifiques) 
        : null,
      date_naissance,
      nationalite,
      contact_nom,
      contact_prenom,
      contact_relation,
      contact_telephone,
      contact_email,
      login_client,
      mot_de_passe_client,
      urgence: urgence || false,
      date_creation: new Date(),
      date_modification: new Date()
    });
    
    console.log(`✅ Client créé avec succès - ID: ${newClient.id}`);
    
    // Enregistrer l'activité
    try {
      await logActivity('create_client', 'Client', newClient.id, null, {
        nom: newClient.nom,
        prenom: newClient.prenom,
        email: newClient.email,
        telephone: newClient.telephone,
        statut: newClient.statut,
        type_procedure: newClient.type_procedure
      }, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log:', logError.message);
    }
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('clientCreated', { clientId: newClient.id, client: newClient });
      console.log('✅ Événement Socket.IO émis pour la création');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: {
        client: newClient
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création client:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du client',
      error: error.message
    });
  }
});

// Route GET pour récupérer un client par ID
router.get('/:id', async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const Document = sequelize.models.Document;
    const { id } = req.params;
    
    const client = await Client.findByPk(id, {
      include: [{ model: Document, as: 'documents' }]
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Client récupéré avec succès',
      data: client
    });
  } catch (error) {
    console.error('❌ Erreur récupération client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération client',
      error: error.message
    });
  }
});

// Route PUT pour mettre à jour un client
router.put('/:id', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const { id } = req.params;
    const user = req.user;
    
    console.log(`🔄 Mise à jour du client ${id} par ${user.prenom} ${user.nom}`);
    
    // Récupérer le client
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // Vérifier l'accès pour les conseillers (logique améliorée)
    if (user.role === 'conseillere') {
      const fullName = `${user.prenom} ${user.nom}`;
      const isAssigned = client.conseillere === fullName || 
                        client.conseillere === fullName.toLowerCase() ||
                        client.conseiller_id === user.id ||
                        !client.conseillere || // Client non assigné
                        client.conseillere === '' || // Client avec conseillère vide
                        client.conseillere === null; // Client avec conseillère null
      
      // Log pour déboguer les permissions
      console.log(`🔍 Vérification permissions conseillère:`, {
        userId: user.id,
        userFullName: fullName,
        clientConseillere: client.conseillere,
        clientConseillerId: client.conseiller_id,
        isAssigned: isAssigned
      });
      
      if (!isAssigned) {
        console.log(`🚫 Accès refusé pour ${fullName} au client ${id}`);
        return res.status(403).json({
          success: false,
          message: 'Accès refusé: vous ne pouvez modifier que vos propres clients'
        });
      }
    }

    // Note: Vérification de permission clients_update temporairement désactivée 
    // car hasPermission() ne fonctionne pas correctement avec le stockage JSON
    // Les conseillères peuvent modifier leurs propres clients (vérification ci-dessus)
    
    // Extraire les données du body
    const {
      prenom,
      nom,
      email,
      telephone,
      adresse,
      pays_origine,
      programme_immigration,
      statut,
      notes,
      conseiller_id,
      conseillere,
      numero_dossier,
      // Nouveaux champs ajoutés pour corriger le problème de procédure
      type_procedure,
      informations_specifiques,
      date_naissance,
      nationalite,
      contact_nom,
      contact_prenom,
      contact_relation,
      contact_telephone,
      contact_email,
      login_client,
      mot_de_passe_client,
      urgence
    } = req.body;
    
    console.log('📝 Données reçues pour mise à jour:', {
      type_procedure,
      informations_specifiques: informations_specifiques ? 'Present' : 'Missing',
      // Autres champs pour debug
      prenom, nom, email
    });
    
    // Capturer les anciennes valeurs pour le log
    const oldValues = {
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      statut: client.statut,
      type_procedure: client.type_procedure,
      conseillere: client.conseillere
    };
    
    // Détecter les changements d'assignation pour les notifications
    const ancienConseillerId = client.conseiller_id;
    const ancienneConseillere = client.conseillere;
    let assignationChanged = false;
    let nouveauConseillerId = null;

    // Vérifier si l'assignation a changé
    if (conseiller_id && conseiller_id !== ancienConseillerId) {
      // Changement direct par conseiller_id
      assignationChanged = true;
      nouveauConseillerId = conseiller_id;
    } else if (conseillere && conseillere !== ancienneConseillere) {
      // Changement par nom de conseillère - recherche simple
      assignationChanged = true;
      
      // Trouver l'ID du nouveau conseiller par son nom (recherche simplifiée)
      const User = sequelize.models.User;
      const nouveauConseiller = await User.findOne({
        where: {
          [Op.or]: [
            // Recherche "Prénom Nom"
            sequelize.literal(`CONCAT(prenom, ' ', nom) = '${conseillere.replace(/'/g, "''")}'`),
            // Recherche "Nom Prénom" 
            sequelize.literal(`CONCAT(nom, ' ', prenom) = '${conseillere.replace(/'/g, "''")}'`)
          ]
        }
      });
      
      if (nouveauConseiller) {
        nouveauConseillerId = nouveauConseiller.id;
      }
    }
    
    // Mettre à jour le client
    await client.update({
      ...(prenom && { prenom }),
      ...(nom && { nom }),
      ...(email && { email }),
      ...(telephone && { telephone }),
      ...(adresse && { adresse }),
      ...(pays_origine && { pays_origine }),
      ...(programme_immigration && { programme_immigration }),
      ...(statut && { statut }),
      ...(notes && { notes }),
      ...(conseiller_id && { conseiller_id }),
      ...(conseillere && { conseillere }),
      ...(numero_dossier && { numero_dossier }),
      // Nouveaux champs pour corriger le problème
      ...(type_procedure && { type_procedure }),
      ...(informations_specifiques !== undefined && { 
        informations_specifiques: typeof informations_specifiques === 'string' 
          ? JSON.parse(informations_specifiques) 
          : informations_specifiques 
      }),
      ...(date_naissance && { date_naissance }),
      ...(nationalite && { nationalite }),
      ...(contact_nom && { contact_nom }),
      ...(contact_prenom && { contact_prenom }),
      ...(contact_relation && { contact_relation }),
      ...(contact_telephone && { contact_telephone }),
      ...(contact_email && { contact_email }),
      ...(login_client && { login_client }),
      ...(mot_de_passe_client && { mot_de_passe_client }),
      ...(urgence !== undefined && { urgence }),
      date_modification: new Date()
    });
    
    console.log(`✅ Client ${id} mis à jour avec succès`);
    
    // Gérer les notifications pour les changements d'assignation
    if (assignationChanged && nouveauConseillerId && nouveauConseillerId !== ancienConseillerId) {
      try {
        const { NotificationService } = require('../services/notificationService');
        const isReassignation = ancienConseillerId && ancienConseillerId !== nouveauConseillerId;
        const messageType = isReassignation ? 'réassigné' : 'assigné';
        
        console.log(`🔔 ${isReassignation ? 'Réassignation' : 'Assignation'} détectée: client ${id} ${messageType} au conseiller ${nouveauConseillerId}`);
        
        await NotificationService.notifyClientAssigned(id, nouveauConseillerId, user.id, messageType);
        console.log(`✅ Notification envoyée pour le client ${messageType}`);
      } catch (notificationError) {
        console.warn('⚠️ Erreur notification assignation:', notificationError.message);
      }
    }
    
    // Enregistrer l'activité
    try {
      const newValues = {
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        statut: client.statut,
        type_procedure: client.type_procedure,
        conseillere: client.conseillere
      };
      
      await logActivity('update_client', 'Client', client.id, oldValues, newValues, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log:', logError.message);
    }
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('clientUpdated', { clientId: id, action: 'updated', client: client });
      console.log('✅ Événement Socket.IO émis pour la mise à jour');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: {
        client: client
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour client:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du client',
      error: error.message
    });
  }
});

// Route DELETE pour supprimer un client
router.delete('/:id', async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const { id } = req.params;
    
    // Vérifier si le client existe
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Capturer les données avant suppression pour le log
    const deletedClientData = {
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      statut: client.statut,
      type_procedure: client.type_procedure
    };

    await client.destroy();

    console.log(`✅ Client ${id} supprimé avec succès`);

    // Enregistrer l'activité
    try {
      await logActivity('delete_client', 'Client', id, deletedClientData, null, req);
    } catch (logError) {
      console.warn('⚠️ Erreur lors de l\'enregistrement du log:', logError.message);
    }

    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('clientDeleted', { clientId: id });
      console.log('✅ Événement Socket.IO émis pour la suppression');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur suppression client',
      error: error.message
    });
  }
});

// Route POST pour assigner un conseiller à un client (admin seulement)
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Seuls les administrateurs peuvent assigner des clients
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: seuls les administrateurs peuvent assigner des clients'
      });
    }

    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const User = sequelize.models.User;
    const { NotificationService } = require('../services/notificationService');
    const { id } = req.params;
    const { conseiller_id } = req.body;

    if (!conseiller_id) {
      return res.status(400).json({ success: false, message: 'conseiller_id requis' });
    }

    // Vérifier l'existence du client
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    // Vérifier l'existence du conseiller
    const conseiller = await User.findByPk(conseiller_id);
    if (!conseiller) {
      return res.status(404).json({ success: false, message: 'Conseiller non trouvé' });
    }

    // Récupérer l'ancienne assignation pour détecter les réassignations
    const ancienConseillerId = client.conseiller_id;
    const isReassignation = ancienConseillerId && ancienConseillerId !== parseInt(conseiller_id);

    // Mettre à jour le client
    await client.update({
      conseiller_id: conseiller.id,
      conseillere: `${conseiller.prenom} ${conseiller.nom}`
    });

    if (isReassignation) {
      console.log(`🔄 Client ${id} réassigné de ${ancienConseillerId} vers ${conseiller.prenom} ${conseiller.nom} par ${user.prenom} ${user.nom}`);
    } else {
      console.log(`✅ Client ${id} assigné à ${conseiller.prenom} ${conseiller.nom} par ${user.prenom} ${user.nom}`);
    }

    // Envoyer notification à la nouvelle conseillère
    try {
      const messageType = isReassignation ? 'réassigné' : 'assigné';
      await NotificationService.notifyClientAssigned(id, conseiller.id, user.id, messageType);
      console.log(`✅ Notification envoyée pour l'${messageType}ation du client`);
    } catch (notificationError) {
      console.warn('⚠️ Erreur notification assignation:', notificationError.message);
    }

    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('clientUpdated', { clientId: id, action: 'assigned', conseillerId: conseiller.id });
      console.log('✅ Événement Socket.IO émis pour l\'assignation');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }

    // Recharger le client depuis la base pour garantir les valeurs à jour
    const updatedClient = await Client.findByPk(id);
    res.json({ success: true, message: 'Client assigné avec succès', data: updatedClient });
  } catch (error) {
    console.error('❌ Erreur assignation client:', error);
    res.status(500).json({ success: false, message: 'Erreur assignation client', error: error.message });
  }
});

module.exports = router;
