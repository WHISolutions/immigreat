const express = require('express');
const router = express.Router();
const initializeModels = require('../models');
const { Op } = require('sequelize');

// Statistiques des consultations par conseiller
router.get('/consultations', async (req, res) => {
    try {
        const { conseillere, startDate, endDate } = req.query;
        
        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, User, Lead } = db;
        
        // Construire les conditions de filtrage
        let whereConsultation = { isValid: true };
        let whereUser = {};
        
        // Filtrer par période si spécifiée
        if (startDate && endDate) {
            whereConsultation.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        
        // Filtrer par nom de conseillère si spécifié
        if (conseillere) {
            whereUser[Op.or] = [
                { nom: { [Op.like]: `%${conseillere}%` } },
                { prenom: { [Op.like]: `%${conseillere}%` } }
            ];
        }

        // Récupérer les statistiques groupées par conseiller
        const stats = await Consultation.findAll({
            attributes: [
                'conseillerId',
                [db.sequelize.fn('COUNT', db.sequelize.col('Consultation.id')), 'totalConsultations']
            ],
            where: whereConsultation,
            include: [
                {
                    model: User,
                    as: 'conseiller',
                    attributes: ['id', 'nom', 'prenom', 'email'],
                    where: whereUser
                }
            ],
            group: ['conseillerId', 'conseiller.id', 'conseiller.nom', 'conseiller.prenom', 'conseiller.email'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('Consultation.id')), 'DESC']]
        });

        // Formater les résultats
        const formattedStats = stats.map(stat => ({
            conseillerId: stat.conseillerId,
            conseillerName: `${stat.conseiller.prenom} ${stat.conseiller.nom}`,
            conseillerEmail: stat.conseiller.email,
            totalConsultations: parseInt(stat.dataValues.totalConsultations)
        }));

        res.json({
            stats: formattedStats,
            total: formattedStats.reduce((sum, stat) => sum + stat.totalConsultations, 0)
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Statistiques détaillées d'un conseiller
router.get('/consultations/conseiller/:conseillerId', async (req, res) => {
    try {
        const { conseillerId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Initialiser les modèles
        const db = initializeModels();
        const { Consultation, User, Lead } = db;
        
        let whereConsultation = { 
            conseillerId,
            isValid: true 
        };
        
        // Filtrer par période si spécifiée
        if (startDate && endDate) {
            whereConsultation.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Compter les consultations valides
        const totalConsultations = await Consultation.count({
            where: whereConsultation
        });

        // Compter les consultations annulées
        const cancelledConsultations = await Consultation.count({
            where: {
                conseillerId,
                isValid: false,
                ...(startDate && endDate ? {
                    createdAt: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                } : {})
            }
        });

        // Récupérer les détails du conseiller
        const conseiller = await User.findByPk(conseillerId, {
            attributes: ['id', 'nom', 'prenom', 'email']
        });

        if (!conseiller) {
            return res.status(404).json({ error: 'Conseiller non trouvé' });
        }

        res.json({
            conseiller: {
                id: conseiller.id,
                name: `${conseiller.prenom} ${conseiller.nom}`,
                email: conseiller.email
            },
            totalConsultations,
            cancelledConsultations,
            totalAll: totalConsultations + cancelledConsultations
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du conseiller:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

module.exports = router;
