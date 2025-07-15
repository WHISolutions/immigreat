const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead
} = require('../controllers/lead.controller');

// Configuration de multer pour l'upload de fichiers
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

// POST /api/leads - Créer un nouveau lead
router.post('/', authenticate, createLead);

// GET /api/leads/statuts - Endpoint de debug pour voir les statuts acceptés
router.get('/statuts', authenticate, (req, res) => {
  const { Lead } = require('../models');
  const statuts = ['Nouveau', 'Contacté', 'À recontacter', 'Rendez-vous pris', 'Consultation effectuée', 'Consultation manquée', 'Qualifié', 'Non qualifié', 'Pas intéressé', 'Client'];
  res.json({
    success: true,
    data: { statuts }
  });
});

// GET /api/leads - Récupérer tous les leads (avec filtrage par conseiller)
router.get('/', authenticate, getAllLeads);

// GET /api/leads/:id - Récupérer un lead par ID (avec vérification d'accès)
router.get('/:id', authenticate, getLeadById);

// PUT /api/leads/:id - Mettre à jour un lead (avec vérification d'accès)
router.put('/:id', authenticate, updateLead);

// DELETE /api/leads/:id - Supprimer un lead (avec vérification d'accès)
router.delete('/:id', authenticate, deleteLead);

// POST /api/leads/import-excel - Importer des leads depuis Excel/CSV
router.post('/import-excel', authenticate, upload.single('file'), async (req, res) => {
  try {
    // Vérifier les permissions
    if (!['administrateur', 'directeur', 'secretaire'].includes(req.user.role)) {
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

    // Validation des colonnes requises
    const requiredColumns = ['nom', 'prenom', 'email', 'telephone', 'ville'];
    const columnVariations = {
      'nom': ['nom', 'Nom', 'NOM', 'lastName', 'last_name'],
      'prenom': ['prenom', 'prénom', 'Prénom', 'PRENOM', 'firstName', 'first_name'],
      'email': ['email', 'Email', 'EMAIL', 'e-mail', 'mail'],
      'telephone': ['telephone', 'téléphone', 'Téléphone', 'TELEPHONE', 'phone', 'tel'],
      'ville': ['ville', 'Ville', 'VILLE', 'city'],
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
        details: 'Assurez-vous que le fichier contient les colonnes: Nom, Prénom, Email, Téléphone, Ville'
      });
    }

    // Filtrer les lignes vides ou incomplètes
    const validLeads = normalizedLeads.filter(lead => 
      lead.nom && lead.prenom && lead.email && lead.telephone && lead.ville
    );

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
    const { getSequelize } = require('../config/db.config');
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
          const newLead = await Lead.create({
            nom: leadData.nom.trim(),
            prenom: leadData.prenom.trim(),
            email: leadData.email.trim().toLowerCase(),
            telephone: leadData.telephone.trim(),
            source: 'Import Excel',
            interet: leadData.interet || 'Non spécifié',
            conseillere: conseillere,
            statut: 'Nouveau',
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
