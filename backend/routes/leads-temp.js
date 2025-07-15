const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');
const ConversionService = require('../services/conversion.service');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getIO } = require('../socket');
const { logActivity } = require('../middleware/activity-logger');
const { NotificationService } = require('../services/notificationService');
const multer = require('multer');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Middleware pour vérifier l'accès au lead pour les conseillers
const checkLeadAccess = async (req, res, next) => {
  try {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const { id } = req.params;
    const user = req.user;

    // Authentification obligatoire pour accéder aux leads
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Si l'utilisateur n'est pas conseiller, il a accès à tout (admin, secrétaire, comptable)
    if (user.role !== 'conseillere') {
      console.log(`✅ Accès autorisé (${user.role}): ${user.nom} ${user.prenom} accède au lead ${id}`);
      return next();
    }

    // Pour les conseillers, vérifier l'accès au lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }

    // Vérifier si le lead appartient vraiment au conseiller connecté
    const fullName = `${user.prenom} ${user.nom}`;
    
    // Conditions strictes d'appartenance
    const isDirectlyAssigned = lead.conseiller_id === user.id;
    const isAssignedByName = !lead.conseiller_id && (
      lead.conseillere === fullName || 
      lead.conseillere === fullName.toLowerCase()
    );
    const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                             (!lead.conseillere || lead.conseillere === '');
    
    const hasAccess = isDirectlyAssigned || isAssignedByName || isTrulyUnassigned;

    if (!hasAccess) {
      const assignedTo = lead.conseiller_id ? `conseiller ID ${lead.conseiller_id}` : 
                        (lead.conseillere || 'non assigné');
      console.log(`🚫 Accès REFUSÉ (strict): ${fullName} (ID: ${user.id}) tente d'accéder au lead ${id}`);
      console.log(`   Lead assigné à: ${assignedTo}`);
      console.log(`   conseiller_id: ${lead.conseiller_id}, conseillere: "${lead.conseillere}"`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: ce lead est assigné à un autre conseiller'
      });
    }

    console.log(`✅ Accès autorisé (conseillère): ${fullName} (ID: ${user.id}) accède au lead ${id}`);
    next();
  } catch (error) {
    console.error('❌ Erreur vérification accès lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur vérification accès',
      error: error.message
    });
  }
};

// Route de test simple pour leads (avec authentification obligatoire)
router.get('/', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    
    // Vérifier que le modèle Lead existe
    if (!sequelize.models.Lead) {
      console.error('❌ Modèle Lead non trouvé dans sequelize.models');
      return res.status(500).json({
        success: false,
        message: 'Modèle Lead non initialisé',
        error: 'Lead model not found'
      });
    }

    const Lead = sequelize.models.Lead;
    const user = req.user;
    
    // Debug: vérifier la connexion et la table
    console.log('🔍 Tentative de récupération des leads...');
    console.log('🔍 Base de données utilisée:', sequelize.config.database);
    console.log('👤 Utilisateur connecté:', `${user.nom} ${user.prenom} (${user.role})`);
    console.log('👤 ID utilisateur:', user.id);
    console.log('👤 Nom complet formaté:', `${user.prenom} ${user.nom}`);

    // Définir fullName pour usage global
    const fullName = `${user.prenom} ${user.nom}`;

    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    
    if (user.role === 'conseillere') {
      // Les conseillers voient UNIQUEMENT leurs propres leads ET les leads vraiment non assignés
      whereConditions = {
        [Op.or]: [
          // Leads assignés via conseiller_id (priorité absolue)
          { conseiller_id: user.id },
          // Leads assignés via le nom dans conseillere (exactement le même nom)
          { 
            [Op.and]: [
              { conseiller_id: { [Op.is]: null } },
              {
                [Op.or]: [
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() }
                ]
              }
            ]
          },
          // SEULEMENT les leads vraiment non assignés (ni conseiller_id ni conseillere)
          { 
            [Op.and]: [
              { 
                [Op.or]: [
                  { conseiller_id: { [Op.is]: null } },
                  { conseiller_id: '' }
                ]
              },
              {
                [Op.or]: [
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          }
        ]
      };
      console.log('🔒 Filtrage STRICT pour conseillère:', fullName, '(ID:', user.id, ')');
      console.log('🔍 Conditions de recherche:', JSON.stringify(whereConditions, null, 2));
    }
    // Les admins, secrétaires et comptables voient tout (pas de filtre)
    
    // DEBUG: Avant filtrage, regarder quelques leads pour comprendre le problème
    if (user.role === 'conseillere') {
      const allLeadsSample = await Lead.findAll({
        limit: 10,
        attributes: ['id', 'nom', 'prenom', 'conseiller_id', 'conseillere'],
        order: [['id', 'DESC']]
      });
      
      console.log('🔍 ÉCHANTILLON de leads dans la base (avant filtrage):');
      allLeadsSample.forEach(lead => {
        console.log(`   Lead ${lead.id}: ${lead.prenom} ${lead.nom}`);
        console.log(`     conseiller_id: ${lead.conseiller_id || 'NULL'}`);
        console.log(`     conseillere: "${lead.conseillere || 'NULL'}"`);
        console.log('');
      });
    }
    
    const leads = await Lead.findAll({
      where: whereConditions,
      order: [['date_creation', 'DESC']]
    });

    console.log(`✅ ${leads.length} leads récupérés depuis la base de données`);
    
    // DEBUG SPÉCIAL: Si pas de leads trouvés pour un conseiller, analyser pourquoi
    if (user.role === 'conseillere' && leads.length === 0) {
      console.log('🚨 AUCUN LEAD TROUVÉ - DIAGNOSTIC APPROFONDI:');
      
      // Vérifier leads avec le même conseiller_id
      const leadsByConseillerIdCount = await Lead.count({
        where: { conseiller_id: user.id }
      });
      console.log(`   Leads avec conseiller_id=${user.id}: ${leadsByConseillerIdCount}`);
      
      // Vérifier leads avec le même nom exact
      const leadsByNameCount = await Lead.count({
        where: { conseillere: fullName }
      });
      console.log(`   Leads avec conseillere="${fullName}": ${leadsByNameCount}`);
      
      // Vérifier leads avec le même nom en lowercase
      const leadsByNameLowerCount = await Lead.count({
        where: { conseillere: fullName.toLowerCase() }
      });
      console.log(`   Leads avec conseillere="${fullName.toLowerCase()}": ${leadsByNameLowerCount}`);
      
      // Vérifier leads non assignés
      const unassignedLeadsCount = await Lead.count({
        where: {
          [Op.and]: [
            { 
              [Op.or]: [
                { conseiller_id: { [Op.is]: null } },
                { conseiller_id: '' }
              ]
            },
            {
              [Op.or]: [
                { conseillere: { [Op.is]: null } },
                { conseillere: '' }
              ]
            }
          ]
        }
      });
      console.log(`   Leads vraiment non assignés: ${unassignedLeadsCount}`);
      
      // Chercher des variations de nom possibles
      const similarNameLeads = await Lead.findAll({
        where: {
          [Op.or]: [
            { conseillere: { [Op.like]: `%${user.prenom}%` } },
            { conseillere: { [Op.like]: `%${user.nom}%` } }
          ]
        },
        attributes: ['id', 'conseillere'],
        limit: 5
      });
      
      if (similarNameLeads.length > 0) {
        console.log('   🔍 Leads avec des noms similaires trouvés:');
        similarNameLeads.forEach(lead => {
          console.log(`     Lead ${lead.id}: "${lead.conseillere}"`);
        });
      }
    }
    
    // Debug pour les conseillers - montrer TOUS les leads trouvés
    if (user.role === 'conseillere') {
      console.log('🔍 DEBUG COMPLET - Leads trouvés pour la conseillère:');
      leads.forEach((lead, index) => {
        const isDirectlyAssigned = lead.conseiller_id === user.id;
        const isAssignedByName = !lead.conseiller_id && (
          lead.conseillere === fullName || 
          lead.conseillere === fullName.toLowerCase()
        );
        const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                                 (!lead.conseillere || lead.conseillere === '');
        
        console.log(`   ${index + 1}. Lead ${lead.id}: ${lead.prenom} ${lead.nom}`);
        console.log(`      conseiller_id: ${lead.conseiller_id || 'NULL'}`);
        console.log(`      conseillere: "${lead.conseillere || 'NULL'}"`);
        console.log(`      Appartient? Direct: ${isDirectlyAssigned}, Par nom: ${isAssignedByName}, Non assigné: ${isTrulyUnassigned}`);
        console.log(`      Motif: ${isDirectlyAssigned ? 'ID match' : isAssignedByName ? 'Nom match' : isTrulyUnassigned ? 'Non assigné' : 'ERREUR!'}`);
        console.log('');
      });
    }

    res.json({
      success: true,
      message: `${leads.length} leads récupérés`,
      data: {
        leads,
        count: leads.length,
        filteredBy: user.role === 'conseillere' ? `${user.prenom} ${user.nom} (ID: ${user.id})` : 'Tous'
      }
    });
  } catch (error) {
    console.error('❌ Erreur leads:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Route POST pour créer un lead
router.post('/', authenticate, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const user = req.user;
    
    console.log(`🔄 Création d'un nouveau lead par ${user.prenom} ${user.nom}`);
    
    // Extraire les données du body
    const {
      prenom,
      nom,
      email,
      telephone,
      source,
      interet,
      statut,
      notes,
      conseiller_id,
      conseillere
    } = req.body;
    
    // Validation des champs requis
    if (!prenom || !nom || !email || !telephone || !source || !interet) {
      return res.status(400).json({
        success: false,
        message: 'Les champs prenom, nom, email, telephone, source et interet sont requis'
      });
    }
    
    // Vérifier si le lead existe déjà
    const existingLead = await Lead.findOne({ where: { email } });
    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: 'Un lead avec cet email existe déjà'
      });
    }
    
    // Créer le nouveau lead
    const newLead = await Lead.create({
      prenom,
      nom,
      email,
      telephone,
      source,
      interet,
      statut: statut || 'Nouveau',
      notes,
      conseiller_id,
      conseillere
    });
    
    console.log(`✅ Lead créé avec succès - ID: ${newLead.id}`);
    
    // Enregistrer l'activité dans les logs
    await logActivity('create_lead', 'Lead', newLead.id, null, {
      nom: newLead.nom,
      prenom: newLead.prenom,
      email: newLead.email,
      telephone: newLead.telephone,
      source: newLead.source,
      interet: newLead.interet,
      statut: newLead.statut
    }, req);
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('leadCreated', { leadId: newLead.id, lead: newLead });
      console.log('✅ Événement Socket.IO émis pour la création');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Lead créé avec succès',
      data: {
        lead: newLead
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création lead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du lead',
      error: error.message
    });
  }
});

// Route GET pour récupérer un lead par ID
router.get('/:id', authenticate, checkLeadAccess, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const { id } = req.params;
    
    const lead = await Lead.findByPk(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Lead récupéré avec succès',
      data: lead
    });
  } catch (error) {
    console.error('❌ Erreur récupération lead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération lead',
      error: error.message
    });
  }
});

// Route PUT pour modifier un lead
router.put('/:id', authenticate, checkLeadAccess, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const { id } = req.params;
    const user = req.user;
    
    console.log(`🔄 Mise à jour du lead ${id} par ${user.prenom} ${user.nom}`);
    
    // Récupérer le lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }
    
    // Extraire les données du body
    const {
      prenom,
      nom,
      email,
      telephone,
      pays_origine,
      programme_immigration,
      statut,
      notes,
      conseiller_id,
      conseillere
    } = req.body;
    
    // Détecter les changements d'assignation pour les notifications
    const ancienConseillerId = lead.conseiller_id;
    const ancienneConseillere = lead.conseillere;
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
    
    // Mettre à jour le lead
    await lead.update({
      ...(prenom && { prenom }),
      ...(nom && { nom }),
      ...(email && { email }),
      ...(telephone && { telephone }),
      ...(pays_origine && { pays_origine }),
      ...(programme_immigration && { programme_immigration }),
      ...(statut && { statut }),
      ...(notes && { notes }),
      ...(conseiller_id && { conseiller_id }),
      ...(conseillere && { conseillere }),
      derniere_modification: new Date()
    });
    
    console.log(`✅ Lead ${id} mis à jour avec succès`);
    
    // Gérer les notifications pour les changements d'assignation
    if (assignationChanged && nouveauConseillerId && nouveauConseillerId !== ancienConseillerId) {
      try {
        const isReassignation = ancienConseillerId && ancienConseillerId !== nouveauConseillerId;
        const messageType = isReassignation ? 'réassigné' : 'assigné';
        
        console.log(`🔔 ${isReassignation ? 'Réassignation' : 'Assignation'} détectée: lead ${id} ${messageType} au conseiller ${nouveauConseillerId}`);
        
        await NotificationService.notifyLeadAssigned(id, nouveauConseillerId, user.id, messageType);
        console.log(`✅ Notification envoyée pour le lead ${messageType}`);
      } catch (notificationError) {
        console.warn('⚠️ Erreur notification assignation:', notificationError.message);
      }
    }
    
    // Enregistrer l'activité dans les logs
    await logActivity('update_lead', 'Lead', id, {
      prenom: lead.prenom,
      nom: lead.nom,
      email: lead.email,
      telephone: lead.telephone,
      statut: lead.statut
    }, req.body, req);
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('leadUpdated', { leadId: id, action: 'updated', lead: lead });
      console.log('✅ Événement Socket.IO émis pour la mise à jour');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.json({
      success: true,
      message: 'Lead mis à jour avec succès',
      data: {
        lead: lead
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour lead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du lead',
      error: error.message
    });
  }
});

// Route DELETE pour supprimer un lead
router.delete('/:id', authenticate, checkLeadAccess, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const { id } = req.params;
    const user = req.user;
    
    // Seuls les admins peuvent supprimer des leads
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: seuls les administrateurs peuvent supprimer des leads'
      });
    }
    
    console.log(`🔄 Suppression du lead ${id} par ${user.prenom} ${user.nom}`);
    
    // Récupérer le lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }
    
    // Supprimer le lead
    await lead.destroy();
    
    console.log(`✅ Lead ${id} supprimé avec succès`);
    
    // Enregistrer l'activité dans les logs
    await logActivity('delete_lead', 'Lead', id, {
      nom: lead.nom,
      prenom: lead.prenom,
      email: lead.email,
      telephone: lead.telephone,
      statut: lead.statut
    }, null, req);
    
    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('leadDeleted', { leadId: id });
      console.log('✅ Événement Socket.IO émis pour la suppression');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.json({
      success: true,
      message: 'Lead supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression lead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du lead',
      error: error.message
    });
  }
});

// Route POST pour convertir un lead en client
router.post('/:id/convert-to-client', authenticate, checkLeadAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { utilisateur, notes } = req.body;
    
    // Validation
    if (!utilisateur) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'utilisateur est requis'
      });
    }
    
    console.log(`🔄 Conversion du lead ${id} en client par ${utilisateur}`);
    
    // Effectuer la conversion
    const result = await ConversionService.convertLeadToClient(
      parseInt(id),
      utilisateur,
      notes
    );
    
    console.log(`✅ Lead ${id} converti en client avec succès - Dossier: ${result.numeroDossier}`);
    
    // Enregistrer l'activité dans les logs
    await logActivity('convert_lead_to_client', 'Lead', id, {
      statut: result.lead.statut
    }, {
      statut: 'Converti',
      client_id: result.client.id,
      numero_dossier: result.numeroDossier
    }, req);
    
    // Émettre les événements temps réel
    try {
      const io = getIO();
      io.emit('leadUpdated', { leadId: id, action: 'converted' });
      io.emit('clientCreated', { clientId: result.client.id, leadId: id });
      io.emit('dossierCreated', { numeroDossier: result.numeroDossier });
      console.log('✅ Événements Socket.IO émis pour la conversion');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }
    
    res.json({
      success: true,
      message: 'Lead converti en client avec succès',
      data: {
        client: result.client,
        lead: result.lead,
        numeroDossier: result.numeroDossier
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur conversion lead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la conversion',
      error: error.message
    });
  }
});

// Route GET pour récupérer l'historique des conversions
router.get('/conversion-history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const conversions = await ConversionService.getConversionHistory(parseInt(limit));
    
    res.json({
      success: true,
      message: `${conversions.length} conversions récupérées`,
      data: {
        conversions,
        count: conversions.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur récupération historique',
      error: error.message
    });
  }
});

// Route POST pour assigner un conseiller à un lead (admin seulement)
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Seuls les administrateurs peuvent assigner des leads
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: seuls les administrateurs peuvent assigner des leads'
      });
    }

    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const User = sequelize.models.User;
    const { id } = req.params;
    const { conseiller_id } = req.body;

    if (!conseiller_id) {
      return res.status(400).json({ success: false, message: 'conseiller_id requis' });
    }

    // Vérifier l'existence du lead
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead non trouvé' });
    }

    // Vérifier l'existence du conseiller
    const conseiller = await User.findByPk(conseiller_id);
    if (!conseiller) {
      return res.status(404).json({ success: false, message: 'Conseiller non trouvé' });
    }

    // Récupérer l'ancienne assignation pour détecter les réassignations
    const ancienConseillerId = lead.conseiller_id;
    const isReassignation = ancienConseillerId && ancienConseillerId !== parseInt(conseiller_id);

    // Mettre à jour le lead
    await lead.update({
      conseiller_id: conseiller.id,
      conseillere: `${conseiller.prenom} ${conseiller.nom}`
    });

    if (isReassignation) {
      console.log(`🔄 Lead ${id} réassigné de ${ancienConseillerId} vers ${conseiller.prenom} ${conseiller.nom} par ${user.prenom} ${user.nom}`);
    } else {
      console.log(`✅ Lead ${id} assigné à ${conseiller.prenom} ${conseiller.nom} par ${user.prenom} ${user.nom}`);
    }

    // Envoyer notification à la nouvelle conseillère
    try {
      const messageType = isReassignation ? 'réassigné' : 'assigné';
      await NotificationService.notifyLeadAssigned(id, conseiller.id, user.id, messageType);
      console.log(`✅ Notification envoyée pour l'${messageType}ation du lead`);
    } catch (notificationError) {
      console.warn('⚠️ Erreur notification assignation:', notificationError.message);
    }

    // Émettre l'événement temps réel
    try {
      const io = getIO();
      io.emit('leadUpdated', { leadId: id, action: 'assigned', conseillerId: conseiller.id });
      console.log('✅ Événement Socket.IO émis pour l\'assignation');
    } catch (socketError) {
      console.warn('⚠️ Erreur émission Socket.IO:', socketError.message);
    }

    // Recharger le lead depuis la base pour garantir les valeurs à jour
    const updatedLead = await Lead.findByPk(id);
    res.json({ success: true, message: 'Lead assigné avec succès', data: updatedLead });
  } catch (error) {
    console.error('❌ Erreur assignation lead:', error);
    res.status(500).json({ success: false, message: 'Erreur assignation lead', error: error.message });
  }
});

// Configuration de multer pour l'upload de fichiers Excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// POST /api/leads/import-excel - Importer des leads depuis Excel/CSV
router.post('/import-excel', authenticate, upload.single('file'), async (req, res) => {
  try {
    // Vérifier les permissions
    if (!['administrateur', 'directeur', 'secretaire', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour l\'importation de leads'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const { distribution } = req.body;
    let distributionData;

    try {
      distributionData = JSON.parse(distribution);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Format de distribution invalide'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let leadsData = [];

    // Lire le fichier selon son type
    if (fileExt === '.csv') {
      // Traitement CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            leadsData.push(row);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      // Traitement Excel (.xlsx, .xls)
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      leadsData = XLSX.utils.sheet_to_json(worksheet);
    }

    // Nettoyage du fichier temporaire
    fs.unlinkSync(filePath);

    // Validation des colonnes requises (selon le modèle Lead)
    const requiredColumns = ['nom', 'prenom', 'email', 'telephone'];
    const columnVariations = {
      'nom': ['nom', 'Nom', 'NOM', 'lastName', 'last_name'],
      'prenom': ['prenom', 'prénom', 'Prénom', 'PRENOM', 'firstName', 'first_name'],
      'email': ['email', 'Email', 'EMAIL', 'e-mail', 'mail'],
      'telephone': ['telephone', 'téléphone', 'Téléphone', 'TELEPHONE', 'phone', 'tel'],
      'ville': ['ville', 'Ville', 'VILLE', 'city'], // Optionnel, stocké dans notes
      'source': ['source', 'Source', 'SOURCE'],
      'interet': ['interet', 'intérêt', 'Intérêt', 'INTERET', 'interest']
    };

    // Normaliser les noms de colonnes
    const normalizedLeads = leadsData.map(row => {
      const normalizedRow = {};
      
      for (const [standardKey, variations] of Object.entries(columnVariations)) {
        for (const variation of variations) {
          if (row[variation] !== undefined) {
            normalizedRow[standardKey] = row[variation];
            break;
          }
        }
      }
      
      return normalizedRow;
    });

    // Vérifier que toutes les colonnes requises sont présentes
    const missingColumns = requiredColumns.filter(col => 
      !normalizedLeads.some(row => row[col] !== undefined && row[col] !== '')
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Colonnes manquantes: ${missingColumns.join(', ')}`,
        details: 'Assurez-vous que le fichier contient les colonnes: Nom, Prénom, Email, Téléphone'
      });
    }

    // Filtrer les lignes vides ou incomplètes
    const validLeads = normalizedLeads.filter(lead => {
      const nom = String(lead.nom || '').trim();
      const prenom = String(lead.prenom || '').trim();
      const email = String(lead.email || '').trim();
      const telephone = String(lead.telephone || '').trim();
      
      return nom && prenom && email && telephone;
    });

    if (validLeads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun lead valide trouvé dans le fichier'
      });
    }

    // Vérifier que le total de distribution correspond au nombre de leads
    const totalDistribution = Object.values(distributionData).reduce((sum, count) => sum + parseInt(count || 0), 0);
    
    if (totalDistribution !== validLeads.length) {
      return res.status(400).json({
        success: false,
        message: `Le total de la distribution (${totalDistribution}) ne correspond pas au nombre de leads (${validLeads.length})`
      });
    }

    // Répartir les leads selon la distribution
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    
    let leadIndex = 0;
    const createdLeads = [];
    const errors = [];

    for (const [conseillere, count] of Object.entries(distributionData)) {
      const leadsToAssign = parseInt(count || 0);
      
      for (let i = 0; i < leadsToAssign; i++) {
        if (leadIndex >= validLeads.length) break;
        
        const leadData = validLeads[leadIndex];
        
        try {
          // Valeurs par défaut valides selon le modèle Lead
          const validSources = ['Site web', 'LinkedIn', 'Facebook', 'Référence', 'Autre'];
          const validInterets = ['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Citoyenneté', 'Autre'];
          
          // Utiliser des valeurs par défaut si les champs n'existent pas ou sont invalides
          const sourceValue = leadData.source && validSources.includes(String(leadData.source).trim()) 
            ? String(leadData.source).trim() 
            : 'Autre';
            
          const interetValue = leadData.interet && validInterets.includes(String(leadData.interet).trim()) 
            ? String(leadData.interet).trim() 
            : 'Autre';
          
          // Validation et nettoyage de l'email
          const cleanEmail = String(leadData.email || '').trim().toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          
          // Si l'email n'est pas valide, créer un email temporaire
          const finalEmail = emailRegex.test(cleanEmail) 
            ? cleanEmail 
            : `${String(leadData.prenom || '').trim().toLowerCase()}.${String(leadData.nom || '').trim().toLowerCase()}@temp-import.ca`;
          
          // Ajouter la ville dans les notes si elle existe
          const villeInfo = leadData.ville ? `Ville: ${String(leadData.ville).trim()}` : '';
          const emailNote = !emailRegex.test(cleanEmail) ? `Email original invalide: "${cleanEmail}"` : '';
          const notesArray = [villeInfo, emailNote, 'Importé depuis Excel'].filter(Boolean);
          const notesBase = notesArray.join('\n');
          
          const newLead = await Lead.create({
            nom: String(leadData.nom || '').trim(),
            prenom: String(leadData.prenom || '').trim(),
            email: finalEmail,
            telephone: String(leadData.telephone || '').trim(),
            source: sourceValue,
            interet: interetValue,
            conseillere: conseillere,
            statut: 'Nouveau',
            notes: notesBase,
            date_creation: new Date()
          });
          
          createdLeads.push(newLead);
        } catch (error) {
          console.error('Erreur lors de la création du lead:', error);
          errors.push({
            lead: `${leadData.prenom} ${leadData.nom}`,
            error: error.message
          });
        }
        
        leadIndex++;
      }
    }

    res.json({
      success: true,
      message: `${createdLeads.length} leads importés avec succès`,
      data: {
        totalImported: createdLeads.length,
        totalExpected: validLeads.length,
        errors: errors,
        distribution: distributionData
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    
    // Nettoyage du fichier en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'importation des leads',
      error: error.message
    });
  }
});

module.exports = router;
