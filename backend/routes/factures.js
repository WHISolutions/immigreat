const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');
const { logActivity } = require('../middleware/activity-logger');

// Fonction helper pour obtenir les modèles
const getModels = () => {
  const sequelize = getSequelize();
  return {
    Facture: sequelize.models.Facture,
    Client: sequelize.models.Client
  };
};

// 🔴 FONCTION POUR DÉTECTER LES FACTURES EN RETARD
const estFactureEnRetard = (facture) => {
  // Une facture est en retard si :
  // 1. Elle n'est pas payée (statut différent de 'payee')
  // 2. Sa date d'échéance est dépassée de plus de 30 jours
  if (facture.statut?.toLowerCase() === 'payee' || facture.statut?.toLowerCase() === 'annulee') {
    return false;
  }
  
  if (!facture.dateEcheance) {
    return false;
  }
  
  const dateEcheance = new Date(facture.dateEcheance);
  const maintenant = new Date();
  const diffEnJours = Math.floor((maintenant - dateEcheance) / (1000 * 60 * 60 * 24));
  
  return diffEnJours > 30;
};

// GET /api/factures - Récupérer toutes les factures (avec filtrage par utilisateur)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { Facture, Client } = getModels();
    const user = req.user;
    
    if (!Facture) {
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    console.log('👤 Utilisateur connecté (factures):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    console.log('📊 Récupération des factures...');
    
    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    
    if (user && user.role === 'conseillere') {
      // Les conseillères ne voient que leurs propres factures
      const fullName1 = `${user.prenom} ${user.nom}`; // Format prénom nom
      const fullName2 = `${user.nom} ${user.prenom}`; // Format nom prénom
      const nickName = `${user.prenom} ${user.nom.charAt(0)}.`; // Format Marie T.
      
      whereConditions = {
        [Op.or]: [
          { validePar: fullName1 },
          { validePar: fullName1.toLowerCase() },
          { validePar: fullName2 },
          { validePar: fullName2.toLowerCase() },
          { validePar: nickName },
          { validePar: nickName.toLowerCase() },
          { validePar: user.prenom }, // Juste le prénom
          { validePar: user.nom }     // Juste le nom
        ]
      };
      console.log('🔒 Filtrage factures pour conseillère:', fullName1, 'ou', fullName2, 'ou', nickName);
    }
    // Les admins, directeurs, secrétaires et comptables voient toutes les factures (pas de filtre)
    
    // Récupérer les factures avec filtrage
    const factures = await Facture.findAll({
      where: whereConditions,
      include: [
        {
          model: Client,
          as: 'clientInfo',
          attributes: ['id', 'nom', 'prenom', 'email', 'type_procedure'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Transformer les données pour le frontend
    const facturesFormatted = factures.map(facture => {
      const factureFormatted = {
        id: facture.id,
        numero: facture.numero_facture || facture.numero,
        client: facture.client,
        client_id: facture.client_id,
        montant: facture.montant || 0,
        monnaie: facture.monnaie || 'MAD',
        statut: facture.statut,
        dateEmission: facture.date_creation ? facture.date_creation.toISOString().split('T')[0] : facture.dateEmission,
        dateEcheance: facture.dateEcheance ? facture.dateEcheance.toISOString().split('T')[0] : null,
        datePaiement: facture.datePaiement ? facture.datePaiement.toISOString().split('T')[0] : null,
        methodePaiement: facture.methodePaiement,
        description: facture.description || `Facture automatique - ${facture.clientInfo?.type_procedure || 'Service'}`,
        prestations_details: facture.prestations_details
      };
      
      // 🔴 AJOUTER LA PROPRIÉTÉ EN_RETARD CALCULÉE
      factureFormatted.en_retard = estFactureEnRetard(factureFormatted);
      
      return factureFormatted;
    });
    
    console.log(`✅ ${factures.length} factures récupérées`);
    
    res.json({
      success: true,
      message: `${factures.length} factures récupérées`,
      data: facturesFormatted,
      filteredBy: user && user.role === 'conseillere' ? `${user.nom} ${user.prenom}` : 'Toutes'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des factures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

// GET /api/factures/:id - Récupérer une facture par ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { Facture, Client } = getModels();
    
    if (!Facture) {
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    // Construire les conditions de recherche selon le rôle
    let whereConditions = { id: id };
    const user = req.user;
    
    if (user && user.role === 'conseillere') {
      // Les conseillères ne peuvent voir que leurs propres factures
      const fullName1 = `${user.prenom} ${user.nom}`;
      const fullName2 = `${user.nom} ${user.prenom}`;
      const nickName = `${user.prenom} ${user.nom.charAt(0)}.`;
      
      whereConditions = {
        id: id,
        [Op.or]: [
          { validePar: fullName1 },
          { validePar: fullName1.toLowerCase() },
          { validePar: fullName2 },
          { validePar: fullName2.toLowerCase() },
          { validePar: nickName },
          { validePar: nickName.toLowerCase() },
          { validePar: user.prenom },
          { validePar: user.nom }
        ]
      };
    }
    
    const facture = await Facture.findOne({
      where: whereConditions,
      include: [
        {
          model: Client,
          as: 'clientInfo',
          attributes: ['id', 'nom', 'prenom', 'email', 'type_procedure'],
          required: false
        }
      ]
    });
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée ou accès non autorisé'
      });
    }
    
    // Transformer les données pour le frontend
    const factureFormatted = {
      id: facture.id,
      numero: facture.numero_facture || facture.numero,
      client: facture.client,
      client_id: facture.client_id,
      montant: facture.montant || 0,
      statut: facture.statut,
      dateEmission: facture.date_creation ? facture.date_creation.toISOString().split('T')[0] : facture.dateEmission,
      dateEcheance: facture.dateEcheance ? facture.dateEcheance.toISOString().split('T')[0] : null,
      datePaiement: facture.datePaiement ? facture.datePaiement.toISOString().split('T')[0] : null,
      methodePaiement: facture.methodePaiement,
      description: facture.description || `Facture automatique - ${facture.clientInfo?.type_procedure || 'Service'}`,
      prestations_details: facture.prestations_details
    };
    
    res.json({
      success: true,
      message: 'Facture récupérée avec succès',
      data: factureFormatted
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

// PUT /api/factures/:id - Mettre à jour une facture
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`📝 Mise à jour facture ${id} avec données:`, updateData);
    
    const { Facture } = getModels();
    
    if (!Facture) {
      console.error('❌ Modèle Facture non disponible');
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    // Construire les conditions de recherche selon le rôle
    let whereConditions = { id: id };
    const user = req.user;
    
    if (user && user.role === 'conseillere') {
      // Les conseillères ne peuvent modifier que leurs propres factures
      const fullName1 = `${user.prenom} ${user.nom}`;
      const fullName2 = `${user.nom} ${user.prenom}`;
      const nickName = `${user.prenom} ${user.nom.charAt(0)}.`;
      
      whereConditions = {
        id: id,
        [Op.or]: [
          { validePar: fullName1 },
          { validePar: fullName1.toLowerCase() },
          { validePar: fullName2 },
          { validePar: fullName2.toLowerCase() },
          { validePar: nickName },
          { validePar: nickName.toLowerCase() },
          { validePar: user.prenom },
          { validePar: user.nom }
        ]
      };
    }
    
    const facture = await Facture.findOne({ where: whereConditions });
    console.log(`🔍 Facture trouvée:`, facture ? `ID ${facture.id}, statut: ${facture.statut}` : 'Non trouvée');
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée ou accès non autorisé'
      });
    }
    
    // Vérifier si la facture peut être modifiée
    if (facture.statut === 'payee' && updateData.statut !== 'payee') {
      // Seuls les administrateurs peuvent annuler une facture payée
      if (updateData.statut === 'annulee' && user && user.role === 'admin') {
        console.log(`🔒 Administrateur ${user.prenom} ${user.nom} annule la facture payée ${facture.numero_facture}`);
        // Ajouter des métadonnées sur l'annulation
        updateData.annule_par = `${user.prenom} ${user.nom}`;
        updateData.date_annulation = new Date();
        updateData.raison_annulation = updateData.raison_annulation || 'Annulation administrative';
      } else {
        console.warn(`⚠️ Tentative de modification d'une facture payée par ${user ? user.role : 'utilisateur non authentifié'}`);
        return res.status(403).json({
          success: false,
          message: 'Seul un administrateur peut annuler une facture payée'
        });
      }
    }
    
    // Sauvegarder les anciennes valeurs pour le log
    const anciennesValeurs = {
      statut: facture.statut,
      montant: facture.montant,
      dateEcheance: facture.dateEcheance,
      datePaiement: facture.datePaiement,
      methodePaiement: facture.methodePaiement,
      numero: facture.numero_facture,
      client: facture.client
    };
    
    // Mettre à jour la facture
    console.log(`🔄 Mise à jour en cours...`);
    await facture.update(updateData);
    
    // Enregistrer l'activité de mise à jour
    if (user && user.id) {
      await logActivity(
        'update_facture',
        'Facture',
        facture.id,
        anciennesValeurs,
        {
          statut: facture.statut,
          montant: facture.montant,
          dateEcheance: facture.dateEcheance,
          datePaiement: facture.datePaiement,
          methodePaiement: facture.methodePaiement,
          ...updateData
        },
        req
      );
      
      console.log(`📋 Log d'activité créé pour la mise à jour de la facture ${facture.id}`);
    }
    
    console.log(`✅ Facture ${id} mise à jour`);
    
    // 🔴 NOUVEAU : Émettre un événement socket.io pour rafraîchir le dashboard en temps réel
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('factureUpdated', {
        facture: facture,
        conseillere: facture.validePar,
        action: 'update',
        changes: updateData
      });
      console.log('📡 Événement socket.io émis : factureUpdated');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission socket.io:', socketError.message);
      // Ne pas faire échouer la mise à jour si socket.io échoue
    }
    
    res.json({
      success: true,
      message: 'Facture mise à jour avec succès',
      data: facture
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la facture:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

// GET /api/factures/stats - Obtenir les statistiques des factures
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const { Facture } = getModels();
    
    if (!Facture) {
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    const user = req.user;
    
    if (user && user.role === 'conseillere') {
      // Les conseillères ne voient que leurs statistiques
      const fullName1 = `${user.prenom} ${user.nom}`;
      const fullName2 = `${user.nom} ${user.prenom}`;
      const nickName = `${user.prenom} ${user.nom.charAt(0)}.`;
      
      whereConditions = {
        [Op.or]: [
          { validePar: fullName1 },
          { validePar: fullName1.toLowerCase() },
          { validePar: fullName2 },
          { validePar: fullName2.toLowerCase() },
          { validePar: nickName },
          { validePar: nickName.toLowerCase() },
          { validePar: user.prenom },
          { validePar: user.nom }
        ]
      };
    }
    
    const factures = await Facture.findAll({ where: whereConditions });
    
    const stats = {
      totalFactures: factures.length,
      totalMontant: factures.reduce((sum, f) => sum + (f.montant || 0), 0),
      facturesPayees: factures.filter(f => f.statut === 'payee').length,
      facturesEnAttente: factures.filter(f => f.statut === 'brouillon' || f.statut === 'payable').length,
      facturesEnRetard: factures.filter(f => f.statut === 'en_retard').length
    };
    
    res.json({
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

// POST /api/factures - Créer une nouvelle facture
router.post('/', authenticate, async (req, res) => {
  try {
    const { Facture, Client } = getModels();
    const user = req.user;
    
    if (!Facture) {
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    console.log('👤 Utilisateur connecté (création facture):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    console.log('📝 Données de création de facture:', req.body);
    
    const { 
      client_id, 
      montant, 
      monnaie = 'MAD', // Valeur par défaut MAD
      description, 
      dateEmission, 
      dateEcheance,
      statut = 'brouillon'
    } = req.body;
    
    // Validation des données requises
    if (!client_id || !montant || !description) {
      return res.status(400).json({
        success: false,
        message: 'Les champs client_id, montant et description sont obligatoires'
      });
    }
    
    // Validation de la monnaie
    if (monnaie && !['CAD', 'MAD'].includes(monnaie)) {
      return res.status(400).json({
        success: false,
        message: 'La monnaie doit être CAD ou MAD'
      });
    }
    
    // Vérifier que le client existe
    const client = await Client.findByPk(client_id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // Déterminer quelle conseillere associer à la facture
    let conseillereFacture = `${user.prenom} ${user.nom}`.trim();
    
    // Si le client n'a pas de conseillère assignée, l'assigner à l'utilisateur actuel
    if (!client.conseillere && user.role === 'conseillere') {
      console.log(`🔄 Attribution du client ${client.prenom} ${client.nom} à ${conseillereFacture}`);
      await client.update({ conseillere: conseillereFacture });
    }
    
    // Générer un numéro de facture unique
    const currentYear = new Date().getFullYear();
    const facturesCount = await Facture.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, 0, 1),
          [Op.lt]: new Date(currentYear + 1, 0, 1)
        }
      }
    });
    
    const numeroFacture = `F${currentYear}-${String(facturesCount + 1).padStart(3, '0')}`;
    
    // Créer la facture avec l'association à la conseillère
    const nouvelleFacture = await Facture.create({
      numero_facture: numeroFacture,
      client_id: client_id,
      montant: parseFloat(montant),
      monnaie: monnaie,
      description: description,
      dateEmission: dateEmission || new Date(),
      dateEcheance: dateEcheance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
      statut: statut,
      created_by: user.id,
      // 🔴 NOUVEAU : Associer la facture à la conseillère qui la crée
      validePar: conseillereFacture,
      dateValidation: new Date(),
      // Ancien système (pour compatibilité)
      numero: numeroFacture,
      client: `${client.nom} ${client.prenom}`.trim()
    });
    
    // Récupérer la facture créée avec les informations du client
    const factureComplete = await Facture.findByPk(nouvelleFacture.id, {
      include: [{
        model: Client,
        as: 'clientInfo',
        attributes: ['id', 'nom', 'prenom', 'email', 'telephone']
      }]
    });
    
    // Enregistrer l'activité de création
    await logActivity(
      'create_facture',
      'Facture',
      nouvelleFacture.id,
      null,
      {
        numero_facture: nouvelleFacture.numero_facture,
        client: `${client.nom} ${client.prenom}`.trim(),
        client_id: client_id,
        montant: parseFloat(montant),
        description: description,
        statut: statut,
        conseillere: conseillereFacture
      },
      req
    );
    
    console.log('✅ Facture créée avec succès:', factureComplete.numero_facture);
    console.log(`📋 Log d'activité créé pour la création de la facture ${nouvelleFacture.id}`);
    
    // 🔴 NOUVEAU : Émettre un événement socket.io pour rafraîchir le dashboard en temps réel
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('factureCreated', {
        facture: factureComplete,
        conseillere: conseillereFacture,
        action: 'create'
      });
      console.log('📡 Événement socket.io émis : factureCreated');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission socket.io:', socketError.message);
      // Ne pas faire échouer la création de facture si socket.io échoue
    }
    
    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      data: factureComplete
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

// POST /api/factures/:id/annuler - Annuler une facture (admin seulement)
router.post('/:id/annuler', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { raison_annulation } = req.body;
    const user = req.user;
    
    // Vérifier que l'utilisateur est administrateur
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un administrateur peut annuler une facture'
      });
    }
    
    console.log(`🔒 Tentative d'annulation de la facture ${id} par ${user.prenom} ${user.nom} (admin)`);
    
    const { Facture } = getModels();
    
    if (!Facture) {
      return res.status(503).json({
        success: false,
        message: 'Service de facturation non disponible'
      });
    }
    
    // Récupérer la facture
    const facture = await Facture.findByPk(id);
    
    if (!facture) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    // Vérifier si la facture peut être annulée
    if (facture.statut === 'annulee') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà annulée'
      });
    }
    
    // Sauvegarder l'ancien statut pour le log
    const ancienStatut = facture.statut;
    
    // Annuler la facture
    await facture.update({
      statut: 'annulee',
      annule_par: `${user.prenom} ${user.nom}`,
      date_annulation: new Date(),
      raison_annulation: raison_annulation || 'Annulation administrative'
    });
    
    // Enregistrer l'activité d'annulation
    await logActivity(
      'cancel_facture',
      'Facture',
      facture.id,
      { 
        statut: ancienStatut,
        numero: facture.numero_facture,
        client: facture.client,
        montant: facture.montant
      },
      { 
        statut: 'annulee',
        annule_par: `${user.prenom} ${user.nom}`,
        date_annulation: new Date(),
        raison_annulation: raison_annulation || 'Annulation administrative'
      },
      req
    );
    
    console.log(`✅ Facture ${facture.numero_facture} annulée par ${user.prenom} ${user.nom}`);
    console.log(`📋 Log d'activité créé pour l'annulation de la facture ${facture.id}`);
    
    res.json({
      success: true,
      message: 'Facture annulée avec succès',
      data: facture
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'annulation de la facture:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la facture',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
});

module.exports = router;