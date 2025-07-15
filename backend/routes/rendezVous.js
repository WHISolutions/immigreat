const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getIO } = require('../socket');

// Route GET pour récupérer tous les rendez-vous (avec filtrage par utilisateur)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const RendezVous = sequelize.models.RendezVous;
    const Client = sequelize.models.Client;
    const User = sequelize.models.User;
    const user = req.user;
    
    console.log('👤 Utilisateur connecté (rendez-vous):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');

    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    
    if (user && user.role === 'conseillere') {
      // Les conseillères ne voient que leurs propres rendez-vous
      const fullName1 = `${user.prenom} ${user.nom}`; // Format prénom nom
      const fullName2 = `${user.nom} ${user.prenom}`; // Format nom prénom
      whereConditions = {
        [Op.or]: [
          { conseiller_id: user.id },
          { conseillere_nom: fullName1 },
          { conseillere_nom: fullName1.toLowerCase() },
          { conseillere_nom: fullName2 },
          { conseillere_nom: fullName2.toLowerCase() }
        ]
      };
      console.log('🔒 Filtrage rendez-vous pour conseillère:', fullName1, 'ou', fullName2);
    }
    // Les admins, secrétaires et comptables voient tout (pas de filtre)
    
    const rendezVous = await RendezVous.findAll({
      where: whereConditions,
      include: [
        { 
          model: Client, 
          as: 'client',
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone'],
          required: false
        },
        { 
          model: User, 
          as: 'conseillere',
          attributes: ['id', 'nom', 'prenom', 'email'],
          required: false
        }
      ],
      order: [['date_rdv', 'ASC'], ['heure_debut', 'ASC']]
    });

    console.log(`✅ ${rendezVous.length} rendez-vous récupérés depuis la base de données`);

    res.json({
      success: true,
      message: `${rendezVous.length} rendez-vous récupérés`,
      data: {
        rendezVous,
        count: rendezVous.length,
        filteredBy: user && user.role === 'conseillere' ? `${user.nom} ${user.prenom}` : 'Tous'
      }
    });
  } catch (error) {
    console.error('❌ Erreur rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Route POST pour créer un nouveau rendez-vous
router.post('/', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const RendezVous = sequelize.models.RendezVous;
    const Client = sequelize.models.Client;
    const User = sequelize.models.User;
    const user = req.user;
    
    console.log(`🔄 Création d'un nouveau rendez-vous par ${user.prenom} ${user.nom}`);
    
    // Extraire les données du body
    const {
      client_nom,
      client_id,
      client_type,
      conseillere_nom,
      conseiller_id,
      date_rdv,
      heure_debut,
      heure_fin,
      type_rdv,
      statut,
      notes
    } = req.body;
    
    // Validation des champs requis
    if (!client_nom || !conseillere_nom || !date_rdv || !heure_debut || !heure_fin || !type_rdv) {
      return res.status(400).json({
        success: false,
        message: 'Les champs client, conseillère, date, heures et type sont requis'
      });
    }

    // Vérifier qu'il n'y a pas de conflit d'horaire pour la conseillère
    const conflictRdv = await RendezVous.findOne({
      where: {
        [Op.and]: [
          { date_rdv: date_rdv },
          { conseillere_nom: conseillere_nom }, // Vérifier seulement par nom
          {
            [Op.or]: [
              // Nouveau RDV commence pendant un RDV existant
              {
                [Op.and]: [
                  { heure_debut: { [Op.lte]: heure_debut } },
                  { heure_fin: { [Op.gt]: heure_debut } }
                ]
              },
              // Nouveau RDV finit pendant un RDV existant
              {
                [Op.and]: [
                  { heure_debut: { [Op.lt]: heure_fin } },
                  { heure_fin: { [Op.gte]: heure_fin } }
                ]
              },
              // Nouveau RDV englobe un RDV existant
              {
                [Op.and]: [
                  { heure_debut: { [Op.gte]: heure_debut } },
                  { heure_fin: { [Op.lte]: heure_fin } }
                ]
              }
            ]
          },
          { statut: { [Op.ne]: 'Annulé' } } // Ignorer les RDV annulés
        ]
      }
    });

    if (conflictRdv) {
      return res.status(409).json({
        success: false,
        message: `Conflit d'horaire: la conseillère a déjà un rendez-vous de ${conflictRdv.heure_debut} à ${conflictRdv.heure_fin} le ${conflictRdv.date_rdv}`
      });
    }
    
    // SOLUTION TEMPORAIRE : Gérer les leads sans colonne client_type
    let finalClientId = null;
    
    if (client_type === 'lead') {
      // Pour les leads : client_id = NULL (pas d'ID de client réel)
      finalClientId = null;
      console.log(`📝 Création RDV pour lead: ${client_nom}`);
    } else {
      // Pour les clients : utiliser l'ID fourni
      finalClientId = client_id || null;
      console.log(`📝 Création RDV pour client: ${client_nom} (ID: ${finalClientId})`);
    }
    
    // Créer le nouveau rendez-vous SANS client_type pour l'instant
    const newRendezVous = await RendezVous.create({
      client_nom,
      client_id: finalClientId,
      // client_type: finalClientType, // TEMPORAIREMENT DÉSACTIVÉ
      conseillere_nom,
      conseiller_id: conseiller_id || null,
      date_rdv,
      heure_debut,
      heure_fin,
      type_rdv,
      notes: notes || null,
      statut: statut || 'En attente', // Utiliser le statut envoyé ou par défaut 'En attente'
      cree_par_id: user ? user.id : null
    });
    
    console.log(`✅ Rendez-vous ${newRendezVous.id} créé avec succès`);
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('rendezVousCreated', { rdvId: newRendezVous.id, rendezVous: newRendezVous });
      console.log('✅ Événement Socket.IO émis pour la création');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: {
        rendezVous: newRendezVous
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du rendez-vous',
      error: error.message
    });
  }
});

// Route GET pour récupérer un rendez-vous par ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const RendezVous = sequelize.models.RendezVous;
    const Client = sequelize.models.Client;
    const User = sequelize.models.User;
    const { id } = req.params;
    
    const rendezVous = await RendezVous.findByPk(id, {
      include: [
        { 
          model: Client, 
          as: 'client',
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone'],
          required: false
        },
        { 
          model: User, 
          as: 'conseillere',
          attributes: ['id', 'nom', 'prenom', 'email'],
          required: false
        }
      ]
    });
    
    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Rendez-vous récupéré avec succès',
      data: rendezVous
    });
  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération rendez-vous',
      error: error.message
    });
  }
});

// Route PUT pour mettre à jour un rendez-vous
router.put('/:id', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const RendezVous = sequelize.models.RendezVous;
    const { id } = req.params;
    const user = req.user;
    
    console.log(`🔄 Mise à jour du rendez-vous ${id} par ${user.prenom} ${user.nom}`);
    
    // Récupérer le rendez-vous
    const rendezVous = await RendezVous.findByPk(id);
    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }
    
    // Vérifier l'accès pour les conseillers
    if (user.role === 'conseillere') {
      const fullName = `${user.prenom} ${user.nom}`;
      const isAssigned = rendezVous.conseiller_id === user.id ||
                        rendezVous.conseillere_nom === fullName ||
                        rendezVous.conseillere_nom === fullName.toLowerCase();
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas les permissions pour modifier ce rendez-vous'
        });
      }
    }
    
    // Extraire les données du body
    const {
      client_nom,
      client_id,
      conseillere_nom,
      conseiller_id,
      date_rdv,
      heure_debut,
      heure_fin,
      type_rdv,
      statut,
      notes
    } = req.body;
    
    // Si on modifie la date/heure, vérifier les conflits
    if (date_rdv || heure_debut || heure_fin || conseiller_id || conseillere_nom) {
      const newDate = date_rdv || rendezVous.date_rdv;
      const newHeureDebut = heure_debut || rendezVous.heure_debut;
      const newHeureFin = heure_fin || rendezVous.heure_fin;
      const newConseillerId = conseiller_id !== undefined ? conseiller_id : rendezVous.conseiller_id;
      const newConseillerNom = conseillere_nom || rendezVous.conseillere_nom;
      
      const conflictRdv = await RendezVous.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } }, // Exclure le RDV actuel
            { date_rdv: newDate },
            { conseillere_nom: newConseillerNom }, // Vérifier seulement par nom
            {
              [Op.or]: [
                {
                  [Op.and]: [
                    { heure_debut: { [Op.lte]: newHeureDebut } },
                    { heure_fin: { [Op.gt]: newHeureDebut } }
                  ]
                },
                {
                  [Op.and]: [
                    { heure_debut: { [Op.lt]: newHeureFin } },
                    { heure_fin: { [Op.gte]: newHeureFin } }
                  ]
                },
                {
                  [Op.and]: [
                    { heure_debut: { [Op.gte]: newHeureDebut } },
                    { heure_fin: { [Op.lte]: newHeureFin } }
                  ]
                }
              ]
            },
            { statut: { [Op.ne]: 'Annulé' } }
          ]
        }
      });

      if (conflictRdv) {
        return res.status(409).json({
          success: false,
          message: `Conflit d'horaire: la conseillère a déjà un rendez-vous de ${conflictRdv.heure_debut} à ${conflictRdv.heure_fin} le ${conflictRdv.date_rdv}`
        });
      }
    }
    
    // Mettre à jour le rendez-vous
    await rendezVous.update({
      ...(client_nom && { client_nom }),
      ...(client_id !== undefined && { client_id }),
      ...(conseillere_nom && { conseillere_nom }),
      ...(conseiller_id !== undefined && { conseiller_id }),
      ...(date_rdv && { date_rdv }),
      ...(heure_debut && { heure_debut }),
      ...(heure_fin && { heure_fin }),
      ...(type_rdv && { type_rdv }),
      ...(statut && { statut }),
      ...(notes !== undefined && { notes }),
      modifie_par: user.id,
      derniere_modification: new Date()
    });
    
    console.log(`✅ Rendez-vous ${id} mis à jour avec succès`);
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('rendezVousUpdated', { rdvId: id, action: 'updated', rendezVous: rendezVous });
      console.log('✅ Événement Socket.IO émis pour la mise à jour');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.json({
      success: true,
      message: 'Rendez-vous mis à jour avec succès',
      data: {
        rendezVous: rendezVous
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du rendez-vous',
      error: error.message
    });
  }
});

// Route DELETE pour supprimer un rendez-vous
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const RendezVous = sequelize.models.RendezVous;
    const { id } = req.params;
    const user = req.user;
    
    // Vérifier si le rendez-vous existe
    const rendezVous = await RendezVous.findByPk(id);
    if (!rendezVous) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier l'accès pour les conseillers
    if (user.role === 'conseillere') {
      const fullName = `${user.prenom} ${user.nom}`;
      const isAssigned = rendezVous.conseiller_id === user.id ||
                        rendezVous.conseillere_nom === fullName ||
                        rendezVous.conseillere_nom === fullName.toLowerCase();
      
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas les permissions pour supprimer ce rendez-vous'
        });
      }
    }

    await rendezVous.destroy();

    console.log(`✅ Rendez-vous ${id} supprimé avec succès`);

    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('rendezVousDeleted', { rdvId: id });
      console.log('✅ Événement Socket.IO émis pour la suppression');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }

    res.json({
      success: true,
      message: 'Rendez-vous supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du rendez-vous',
      error: error.message
    });
  }
});

module.exports = router;
