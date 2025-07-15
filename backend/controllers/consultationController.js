const initializeModels = require('../models');

// Créer une nouvelle consultation
const createConsultation = async (req, res) => {
    try {
        const { leadId, conseillerId, reason } = req.body;

        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, Lead, User } = db;

        // Vérifier que le lead existe
        const lead = await Lead.findByPk(leadId);
        if (!lead) {
            return res.status(404).json({ error: 'Lead non trouvé' });
        }

        // Vérifier que le conseiller existe
        const conseiller = await User.findByPk(conseillerId);
        if (!conseiller) {
            return res.status(404).json({ error: 'Conseiller non trouvé' });
        }

        // Créer la consultation
        const consultation = await Consultation.create({
            leadId,
            conseillerId,
            reason: reason || 'Consultation effectuée',
            isValid: true
        });

        // Récupérer la consultation avec les associations
        const consultationComplete = await Consultation.findByPk(consultation.id, {
            include: [
                { model: Lead, as: 'lead' },
                { model: User, as: 'conseiller' }
            ]
        });

        res.status(201).json({
            message: 'Consultation créée avec succès',
            consultation: consultationComplete
        });
    } catch (error) {
        console.error('Erreur lors de la création de la consultation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Invalider une consultation (annulation)
const invalidateConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, Lead, User } = db;

        if (!reason) {
            return res.status(400).json({ error: 'La raison d\'annulation est requise' });
        }

        // Trouver la consultation
        const consultation = await Consultation.findByPk(id);
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation non trouvée' });
        }

        if (!consultation.isValid) {
            return res.status(400).json({ error: 'Cette consultation est déjà annulée' });
        }

        // Invalider la consultation
        await consultation.update({
            isValid: false,
            reason: reason,
            updatedAt: new Date()
        });

        // Récupérer la consultation mise à jour avec les associations
        const consultationUpdated = await Consultation.findByPk(id, {
            include: [
                { model: Lead, as: 'lead' },
                { model: User, as: 'conseiller' }
            ]
        });

        res.json({
            message: 'Consultation annulée avec succès',
            consultation: consultationUpdated
        });
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la consultation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Obtenir les consultations d'un lead
const getConsultationsByLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { includeInvalid = false } = req.query;

        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, Lead, User } = db;

        const whereClause = { leadId };
        if (includeInvalid !== 'true') {
            whereClause.isValid = true;
        }

        const consultations = await Consultation.findAll({
            where: whereClause,
            include: [
                { model: Lead, as: 'lead' },
                { model: User, as: 'conseiller' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            leadId,
            consultations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Obtenir les consultations d'un conseiller
const getConsultationsByConseiller = async (req, res) => {
    try {
        const { conseillerId } = req.params;
        const { includeInvalid = false } = req.query;

        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, Lead, User } = db;

        const whereClause = { conseillerId };
        if (includeInvalid !== 'true') {
            whereClause.isValid = true;
        }

        const consultations = await Consultation.findAll({
            where: whereClause,
            include: [
                { model: Lead, as: 'lead' },
                { model: User, as: 'conseiller' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            conseillerId,
            consultations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Obtenir toutes les consultations
const getAllConsultations = async (req, res) => {
    try {
        const db = initializeModels();
        const { Consultation, Lead, User } = db;

        const consultations = await Consultation.findAll({
            include: [
                { model: Lead, as: 'lead' },
                { model: User, as: 'conseiller' }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: consultations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des consultations:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur interne du serveur' 
        });
    }
};

module.exports = {
    getAllConsultations,
    createConsultation,
    invalidateConsultation,
    getConsultationsByLead,
    getConsultationsByConseiller
};
