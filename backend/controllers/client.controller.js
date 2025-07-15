const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');

// Fonction helper pour obtenir le modèle Client
const getClient = () => {
  const sequelize = getSequelize();
  return sequelize.models.Client;
};

// Fonction helper pour obtenir le modèle Facture
const getFacture = () => {
  const sequelize = getSequelize();
  const Facture = sequelize.models.Facture;
  if (!Facture) {
    throw new Error('Modèle Facture non disponible');
  }
  return Facture;
};

// Fonction pour générer le numéro de facture automatiquement
const generateFactureNumber = async () => {
  try {
    const sequelize = getSequelize();
    if (!sequelize.models.Facture) {
      throw new Error('Modèle Facture non disponible');
    }
    
    const Facture = getFacture();
    const today = new Date();
    const year = today.getFullYear();

    // Trouver le dernier numéro existant de l'année
    const lastInvoice = await Facture.findOne({
      where: { 
        numero_facture: { 
          [Op.like]: `F${year}-%` 
        } 
      },
      order: [['createdAt', 'DESC']],
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.numero_facture.split('-')[1]);
      nextNumber = lastNum + 1;
    }

    return `F${year}-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du numéro de facture:', error);
    // Fallback en cas d'erreur
    const today = new Date();
    const year = today.getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `F${year}-${timestamp}`;
  }
};

// Créer un nouveau client
const createClient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      email,
      telephone,
      adresse,
      nationalite,
      contact_nom,
      contact_prenom,
      contact_relation,
      contact_telephone,
      contact_email,
      type_procedure,
      conseillere,
      urgence,
      login_client,
      mot_de_passe_client,
      informations_specifiques,
      notes
    } = req.body;

    // Log pour déboguer les données reçues
    console.log('📋 Données reçues pour création de client:', {
      nom, prenom, email, telephone, type_procedure, 
      informations_specifiques: informations_specifiques
    });

    // Validation des champs requis
    if (!nom || !prenom || !email || !telephone || !type_procedure) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être renseignés',
        errors: {
          nom: !nom ? 'Le nom est requis' : null,
          prenom: !prenom ? 'Le prénom est requis' : null,
          email: !email ? 'L\'email est requis' : null,
          telephone: !telephone ? 'Le téléphone est requis' : null,
          type_procedure: !type_procedure ? 'Le type de procédure est requis' : null
        }
      });
    }

    // Créer le client dans la base de données
    const Client = getClient();
    const newClient = await Client.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      date_naissance,
      email: email.trim().toLowerCase(),
      telephone: telephone.trim(),
      adresse: adresse ? adresse.trim() : null,
      nationalite: nationalite ? nationalite.trim() : null,
      contact_nom: contact_nom ? contact_nom.trim() : null,
      contact_prenom: contact_prenom ? contact_prenom.trim() : null,
      contact_relation,
      contact_telephone: contact_telephone ? contact_telephone.trim() : null,
      contact_email: contact_email ? contact_email.trim().toLowerCase() : null,
      type_procedure,
      conseillere: conseillere || null,
      urgence: urgence || false,
      login_client: login_client ? login_client.trim() : null,
      mot_de_passe_client: mot_de_passe_client || null,
      informations_specifiques: informations_specifiques || null,
      notes: notes || null,
      date_creation: new Date()
    });

    console.log('✅ Client créé:', newClient.toJSON());

    // 💡 NOUVEAU : Créer automatiquement une facture pour le nouveau client
    try {
      const sequelize = getSequelize();
      if (!sequelize.models.Facture) {
        console.warn('⚠️ Modèle Facture non disponible - facture non créée');
        return res.status(201).json({
          success: true,
          message: 'Client créé avec succès (facturation non disponible)',
          data: newClient
        });
      }
      
      const Facture = getFacture();
      const numero_facture = await generateFactureNumber();
      const today = new Date();
      
      // Déterminer qui crée la facture (utilisateur connecté ou conseillère assignée)
      const user = req.user;
      let createdBy = 'Système';
      
      if (user) {
        // Utiliser le nom de l'utilisateur connecté
        createdBy = `${user.prenom} ${user.nom}`;
      } else if (newClient.conseillere) {
        // Utiliser la conseillère assignée au client
        createdBy = newClient.conseillere;
      }
      
      console.log('👤 Facture automatique créée par:', createdBy);

      const newFacture = await Facture.create({
        // Nouveau système amélioré
        numero_facture: numero_facture,
        client_id: newClient.id, // Vraie relation avec le client
        date_creation: today,
        montant: 0, // Montant par défaut
        statut: 'brouillon', // Statut modifiable
        validePar: createdBy, // 🔑 CORRECTION : Assigner la facture à la bonne personne
        dateValidation: today,
        
        // Ancien système (gardé pour compatibilité)
        numero: numero_facture,
        client: `${newClient.nom} ${newClient.prenom}`, // Nom complet du client
        dateEmission: today,
        dateEcheance: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 jours plus tard
        datePaiement: null,
        methodePaiement: null,
        description: `Facture automatique pour le client ${newClient.nom} ${newClient.prenom} - ${newClient.type_procedure}`
      });

      console.log('🧾 Facture créée automatiquement:', {
        numero_facture: newFacture.numero_facture,
        client_id: newFacture.client_id,
        client: newFacture.client,
        statut: newFacture.statut,
        montant: newFacture.montant
      });

      res.status(201).json({
        success: true,
        message: 'Client créé avec succès et facture générée automatiquement',
        data: {
          client: newClient,
          facture: newFacture
        }
      });

    } catch (factureError) {
      console.error('⚠️ Erreur lors de la création de la facture automatique:', factureError);
      
      // Le client est créé mais pas la facture - on continue quand même
      res.status(201).json({
        success: true,
        message: 'Client créé avec succès (facture non générée)',
        data: newClient,
        warning: 'La facture automatique n\'a pas pu être créée'
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création du client:', error);

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

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Récupérer tous les clients
const getAllClients = async (req, res) => {
  try {
    const Client = getClient();
    const clients = await Client.findAll({
      order: [['date_creation', 'DESC']]
    });

    console.log(`✅ ${clients.length} clients récupérés depuis la base de données`);

    res.json({
      success: true,
      message: `${clients.length} clients récupérés depuis la base de données`,
      data: {
        clients: clients,
        count: clients.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des clients:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Récupérer un client par ID
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const Document = sequelize.models.Document;
    
    const client = await Client.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          required: false, // LEFT JOIN pour inclure le client même s'il n'a pas de documents
          attributes: ['id', 'type_document', 'nom_fichier', 'chemin_fichier', 'date_televersement']
        }
      ]
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    console.log(`✅ Client ${id} récupéré:`, client.nom, client.prenom);
    console.log(`📁 Documents trouvés:`, client.documents ? client.documents.length : 0);

    res.json({
      success: true,
      message: 'Client récupéré avec succès',
      data: client
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du client:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

// Mettre à jour un client
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    // Retirer la clé documents si envoyée (collision avec association)
    delete updateData.documents;

    // Log pour déboguer les données reçues
    console.log('📋 Données reçues pour mise à jour de client:', {
      id, 
      informations_specifiques: updateData.informations_specifiques
    });

    // Vérifier si le client existe
    const Client = getClient();
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Mettre à jour le client
    await client.update({
      ...updateData,
      date_modification: new Date()
    });

    console.log(`✅ Client ${id} mis à jour:`, updateData);

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: client
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du client:', error);

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

// Supprimer un client
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le client existe
    const Client = getClient();
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    await client.destroy();

    console.log(`✅ Client ${id} supprimé avec succès`);

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du client:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
};
