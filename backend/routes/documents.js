const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSequelize } = require('../config/db.config');
const sequelize = getSequelize();
const Document = require('../models/document.model')(sequelize);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientId = req.body.clientId;
    const dir = path.join(__dirname, '..', 'uploads', 'clients', String(clientId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { clientId, typeDocument } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Aucun fichier envoyé.' });

    // Enregistrement en base
    const doc = await Document.create({
      client_id: clientId,
      type_document: typeDocument,
      nom_fichier: file.originalname,
      chemin_fichier: file.path,
      date_televersement: new Date()
    });

    res.json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Supprimer un document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });

    // Supprimer le fichier physique
    if (fs.existsSync(doc.chemin_fichier)) fs.unlinkSync(doc.chemin_fichier);

    await doc.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Télécharger / prévisualiser un document
router.get('/file/:id', async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document non trouvé.' });

    if (!fs.existsSync(doc.chemin_fichier)) {
      return res.status(404).json({ message: 'Fichier introuvable sur le serveur.' });
    }
    return res.sendFile(path.resolve(doc.chemin_fichier));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 