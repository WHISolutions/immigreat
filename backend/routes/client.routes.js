const express = require('express');
const router = express.Router();
const {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
} = require('../controllers/client.controller');

// POST /api/clients - Créer un nouveau client
router.post('/', createClient);

// GET /api/clients - Récupérer tous les clients
router.get('/', getAllClients);

// GET /api/clients/:id - Récupérer un client par ID
router.get('/:id', getClientById);

// PUT /api/clients/:id - Mettre à jour un client
router.put('/:id', updateClient);

// DELETE /api/clients/:id - Supprimer un client
router.delete('/:id', deleteClient);

module.exports = router;
