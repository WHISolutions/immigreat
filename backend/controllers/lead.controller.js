const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');

// Fonction helper pour obtenir le modèle Lead
const getLead = () => {
  const sequelize = getSequelize();
  return sequelize.models.Lead;
};

// Fonction helper pour vérifier l'accès d'un conseiller à un lead
const checkConseillerAccess = (lead, user) => {
  if (user.role !== 'conseillere') {
    return true; // Admins, secrétaires, comptables ont accès à tout
  }
  
  // Pour les conseillers, vérification stricte
  const fullName = `${user.prenom} ${user.nom}`;
  
  // Conditions strictes d'appartenance
  const isDirectlyAssigned = lead.conseiller_id === user.id;
  const isAssignedByName = !lead.conseiller_id && (
    lead.conseillere === fullName || 
    lead.conseillere === fullName.toLowerCase()
  );
  const isTrulyUnassigned = (!lead.conseiller_id || lead.conseiller_id === '') && 
                           (!lead.conseillere || lead.conseillere === '');
  
  return isDirectlyAssigned || isAssignedByName || isTrulyUnassigned;
};

// Créer un nouveau lead
const createLead = async (req, res) => {
  try {
    const Lead = getLead();
    const {
      nom,
      prenom,
      email,
      telephone,
      source,
      interet,
      conseillere,
      notes
    } = req.body;

    // Validation des champs requis
    if (!nom || !prenom || !email || !telephone || !source || !interet) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être renseignés',
        errors: {
          nom: !nom ? 'Le nom est requis' : null,
          prenom: !prenom ? 'Le prénom est requis' : null,
          email: !email ? 'L\'email est requis' : null,
          telephone: !telephone ? 'Le téléphone est requis' : null,
          source: !source ? 'La source est requise' : null,
          interet: !interet ? 'L\'intérêt est requis' : null
        }
      });
    }

    // Créer le lead dans la base de données MySQL
    const newLead = await Lead.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim(),
      source,
      interet,
      conseillere: conseillere || null,
      notes: notes ? notes.trim() : null,
      statut: 'Nouveau', // Valeur par défaut
      date_creation: new Date() // Date actuelle
    });

    console.log('✅ Lead créé dans MySQL:', newLead.toJSON());

    res.status(201).json({
      success: true,
      message: 'Lead créé avec succès dans la base de données',
      data: newLead
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création du lead:', error);

    // Gérer les erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });

      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    }

    // Gérer les erreurs d'unicité (email déjà existant)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée',
        errors: { email: 'Cette adresse email est déjà utilisée' }
      });
    }

    // Gérer les erreurs de connexion à la base de données
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        success: false,
        message: 'Erreur de connexion à la base de données',
        error: 'Service temporairement indisponible'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Récupérer tous les leads depuis la base de données
const getAllLeads = async (req, res) => {
  try {
    const Lead = getLead();
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {};
    
    if (user.role === 'conseillere') {
      // Les conseillers voient UNIQUEMENT leurs propres leads ET les leads vraiment non assignés
      const fullName = `${user.prenom} ${user.nom}`;
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
    }
    // Les autres rôles voient tous les leads (pas de filtre)

    // Récupérer les leads selon les conditions
    const leads = await Lead.findAll({
      where: whereConditions,
      order: [['date_creation', 'DESC']] // Trier par date de création décroissante
    });

    console.log(`✅ ${leads.length} leads récupérés depuis MySQL pour ${user.prenom} ${user.nom} (${user.role})`);

    res.status(200).json({
      success: true,
      message: `${leads.length} leads récupérés depuis la base de données`,
      data: {
        leads,
        count: leads.length,
        filteredBy: user.role === 'conseillere' ? `${user.prenom} ${user.nom}` : 'Tous'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des leads:', error);

    // Gérer les erreurs de connexion à la base de données
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        success: false,
        message: 'Erreur de connexion à la base de données',
        error: 'Service temporairement indisponible'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Récupérer un lead par ID
const getLeadById = async (req, res) => {
  try {
    const Lead = getLead();
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }

    // Vérifier l'accès pour les conseillers
    if (!checkConseillerAccess(lead, user)) {
      const assignedTo = lead.conseiller_id ? `conseiller ID ${lead.conseiller_id}` : 
                        (lead.conseillere || 'non assigné');
      console.log(`🚫 Accès refusé: ${user.prenom} ${user.nom} (ID: ${user.id}) tente d'accéder au lead ${id} assigné à ${assignedTo}`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez accéder qu\'à vos propres leads'
      });
    }

    console.log(`✅ Lead trouvé et accès autorisé: ${user.prenom} ${user.nom} accède au lead ${id}`);

    res.status(200).json({
      success: true,
      message: 'Lead récupéré avec succès',
      data: lead
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du lead:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Mettre à jour un lead
const updateLead = async (req, res) => {
  try {
    const Lead = getLead();
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier si le lead existe
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }

    // Vérifier l'accès pour les conseillers
    if (!checkConseillerAccess(lead, user)) {
      const assignedTo = lead.conseiller_id ? `conseiller ID ${lead.conseiller_id}` : 
                        (lead.conseillere || 'non assigné');
      console.log(`🚫 Accès refusé: ${user.prenom} ${user.nom} (ID: ${user.id}) tente de modifier le lead ${id} assigné à ${assignedTo}`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez modifier que vos propres leads'
      });
    }

    // Mettre à jour le lead
    await lead.update({
      ...updateData,
      date_modification: new Date()
    });

    console.log(`✅ Lead ${id} mis à jour par ${user.prenom} ${user.nom}:`, updateData);

    res.json({
      success: true,
      message: 'Lead mis à jour avec succès',
      data: lead
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du lead:', error);

    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });

      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Supprimer un lead
const deleteLead = async (req, res) => {
  try {
    const Lead = getLead();
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier si le lead existe
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead non trouvé'
      });
    }

    // Vérifier l'accès pour les conseillers
    if (!checkConseillerAccess(lead, user)) {
      const assignedTo = lead.conseiller_id ? `conseiller ID ${lead.conseiller_id}` : 
                        (lead.conseillere || 'non assigné');
      console.log(`🚫 Accès refusé: ${user.prenom} ${user.nom} (ID: ${user.id}) tente de supprimer le lead ${id} assigné à ${assignedTo}`);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé: vous ne pouvez supprimer que vos propres leads'
      });
    }

    await lead.destroy();

    console.log(`✅ Lead ${id} supprimé avec succès par ${user.prenom} ${user.nom}`);

    res.json({
      success: true,
      message: 'Lead supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du lead:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead
};
