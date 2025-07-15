const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');

// Obtenir toutes les consultations
router.get('/', consultationController.getAllConsultations);

// Créer une nouvelle consultation
router.post('/', consultationController.createConsultation);

// Invalider une consultation (annulation avec raison)
router.patch('/:id/invalidate', consultationController.invalidateConsultation);

// Obtenir les consultations d'un lead
router.get('/lead/:leadId', consultationController.getConsultationsByLead);

// Obtenir les consultations d'un conseiller
router.get('/conseiller/:conseillerId', consultationController.getConsultationsByConseiller);

module.exports = router;
