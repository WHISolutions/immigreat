const express = require('express');
const cors = require('cors');
const { Lead, sequelize } = require('../models/LeadSimple');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API Leads fonctionnelle' });
});

// POST /api/leads - Créer un lead
app.post('/api/leads', async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Lead créé avec succès',
      data: lead
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du lead',
      error: error.message
    });
  }
});

// GET /api/leads - Récupérer tous les leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await Lead.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      message: 'Leads récupérés avec succès',
      data: {
        leads,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: leads.length,
          itemsPerPage: leads.length
        }
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des leads',
      error: error.message
    });
  }
});

// Démarrage du serveur
const startServer = async () => {
  try {
    await sequelize.sync();
    console.log('✅ Base de données synchronisée');
    
    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 API accessible à http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

startServer();
