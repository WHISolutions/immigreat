import React, { useState, useEffect } from 'react';
import '../styles/ClientDetailModal.css';
import clientsAPI from '../services/clientsAPI';
import { getConseillers } from '../services/usersAPI';
console.log('AFFICHAGE : ClientDetailModal.js');

function ClientDetailModal({ client, lead, modalType = 'client', isOpen = true, onClose, readOnly = false, onEdit, showAll = false }) {
  const [activeTab, setActiveTab] = useState('general');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [advisors, setAdvisors] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [loading, setLoading] = useState(false);

  // Déterminer les données à afficher selon le type
  const data = modalType === 'lead' ? lead : client;
  const titre = modalType === 'lead' ? 'Détails du Lead' : 'Détails du Client';
  const iconeType = modalType === 'lead' ? '🎯' : '👤';

  // Charger la liste des conseillers
  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const response = await fetch('/api/conseillers');
        if (response.ok) {
          const data = await response.json();
          setAdvisors(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conseillers:', error);
      }
    };

    if (isOpen) {
      loadAdvisors();
    }
  }, [isOpen]);

  // Fonction d'assignation
  const handleAssignClient = async () => {
    if (!selectedAdvisor) {
      alert('Veuillez sélectionner une conseillère');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${data.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conseillereId: selectedAdvisor
        })
      });

      if (response.ok) {
        alert('Client assigné avec succès');
        setShowAssignModal(false);
        setSelectedAdvisor('');
        // Recharger la page ou mettre à jour les données
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation du client');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  };

  if (!isOpen || !data) return null;

  // Formatter la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Formater les informations spécifiques
  const formatInformationsSpecifiques = (informations) => {
    if (!informations) return null;
    
    try {
      const info = typeof informations === 'string' ? JSON.parse(informations) : informations;
      if (Object.keys(info).length === 0) return null;
      
      // Mapping des clés pour un affichage plus lisible
      const keyMappings = {
        'fondsDisponibles': 'Fonds disponibles',
        'situationFamiliale': 'Situation familiale',
        'dateVoyage': 'Date de voyage prévue',
        'emploi': 'Situation d\'emploi',
        'invitation': 'Lettre d\'invitation',
        'lienParenteInvitant': 'Lien de parenté avec l\'invitant',
        'niveauEtudes': 'Niveau d\'études',
        'institutionProposee': 'Institution proposée',
        'programmeEtudes': 'Programme d\'études',
        'dureeEtudes': 'Durée des études',
        'coutEtudes': 'Coût des études',
        'preuvesFinancieres': 'Preuves financières',
        'offreEmploi': 'Offre d\'emploi',
        'employeur': 'Employeur',
        'posteOffert': 'Poste offert',
        'salaireOffert': 'Salaire offert',
        'lieuTravail': 'Lieu de travail',
        'experienceProfessionnelle': 'Expérience professionnelle',
        'competencesLinguistiques': 'Compétences linguistiques',
        'familleCanada': 'Famille au Canada',
        'parentsCanada': 'Parents au Canada',
        'relationFamiliale': 'Relation familiale',
        'documentsSoutien': 'Documents de soutien'
      };

      // Formatage des valeurs
      const formatValue = (key, value) => {
        // Gérer les valeurs null ou undefined
        if (value === null || value === undefined) return 'Non renseigné';
        
        // Gérer les objets JavaScript
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            return value.join(', ') || 'Non renseigné';
          } else {
            // Convertir l'objet en chaîne lisible
            return Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ') || 'Non renseigné';
          }
        }
        
        // Gérer les valeurs booléennes
        if (value === true || value === 'oui' || value === 'yes') return '✅ Oui';
        if (value === false || value === 'non' || value === 'no') return '❌ Non';
        
        // Formatage spécial par clé
        if (key === 'dateVoyage' && value) {
          return formatDate(value);
        }
        if (key === 'fondsDisponibles' && value) {
          return `${value} CAD`;
        }
        
        // Convertir en chaîne de caractères pour éviter les erreurs de rendu
        return String(value) || 'Non renseigné';
      };
      
      return (
        <div className="info-specifiques">
          <h4>📋 Informations spécifiques à la procédure</h4>
          <div className="info-grid">
            {Object.entries(info).map(([key, value]) => {
              // Ignorer les clés numériques (artéfacts du parsing)
              if (!isNaN(key)) return null;
              
              return (
                <div key={key} className="info-item">
                  <span className="info-label">{keyMappings[key] || key}:</span>
                  <span className="info-value">{formatValue(key, value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Erreur lors du parsing des informations spécifiques:', error);
      return (
        <div className="info-specifiques">
          <h4>📋 Informations spécifiques</h4>
          <div className="info-raw">
            <pre>{informations}</pre>
          </div>
        </div>
      );
    }
  };

  // Documents simulés pour l'exemple
  const documentsSimules = [
    {
      nom: 'Passeport',
      statut: 'Validé',
      dateUpload: '2024-01-15'
    },
    {
      nom: 'Certificat de naissance',
      statut: 'En attente',
      dateUpload: '2024-01-16'
    },
    {
      nom: 'Relevé bancaire',
      statut: 'En révision',
      dateUpload: '2024-01-17'
    }
  ];

  // Fonction pour obtenir la liste des documents requis selon le type de procédure
  function getRequiredDocuments() {
    const baseDocuments = [
      'Copie de CIN',
      'Copie du passeport',
      "Photo d'identité"
    ];
    // Ajoute d'autres documents selon le type de procédure si besoin
    // Ici, on retourne juste la base pour l'exemple
    return baseDocuments;
  }

  // Fonction pour gérer l'upload d'un fichier
  function handleFileUpload(documentName, file) {
    if (readOnly) return;
    if (!file) return;
    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximum: 10MB');
      return;
    }
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, DOC, DOCX');
      return;
    }
    // Simuler l'upload du document (à remplacer par un appel API réel)
    alert(`Document "${documentName}" téléversé avec succès ! (simulation)`);
  }

  // Fonction pour supprimer un document
  function handleRemoveDocument(documentId) {
    if (readOnly) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      alert('Document supprimé (simulation)');
    }
  }

  function handleViewDocument(doc) {
    // Créer une nouvelle fenêtre pour visualiser le document
    const newWindow = window.open('', '_blank', 'width=900,height=700');
    
    // Déterminer le type de fichier
    const fileName = doc.nom_fichier.toLowerCase();
    const isImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif');
    const isPDF = fileName.endsWith('.pdf');
    
    // Construire l'URL du fichier - extraire la partie relative depuis 'uploads'
    let fileUrl = doc.chemin_fichier;
    
    // Extraire la partie relative du chemin (après 'uploads')
    if (fileUrl.includes('uploads')) {
      // Trouver la position de 'uploads' dans le chemin
      const uploadsIndex = fileUrl.indexOf('uploads');
      const relativePath = fileUrl.substring(uploadsIndex);
      // Normaliser les slashes pour l'URL
      const normalizedPath = relativePath.replace(/\\/g, '/');
      fileUrl = `http://localhost:5000/${normalizedPath}`;
    } else {
      // Si pas de 'uploads' dans le chemin, essayer avec le nom du fichier
      fileUrl = `http://localhost:5000/uploads/clients/${client.id || 'undefined'}/${doc.nom_fichier}`;
    }
    
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aperçu - ${doc.nom_fichier}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .document-preview {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .document-header {
              border-bottom: 2px solid #3498db;
              padding-bottom: 15px;
              margin-bottom: 20px;
              text-align: center;
            }
            .document-title {
              font-size: 24px;
              color: #2c3e50;
              margin: 0 0 10px 0;
            }
            .document-info {
              color: #666;
              font-size: 14px;
            }
            .document-content {
              text-align: center;
              margin: 20px 0;
              max-height: 500px;
              overflow: auto;
            }
            .document-image {
              max-width: 100%;
              max-height: 500px;
              border: 2px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .pdf-frame {
              width: 100%;
              height: 500px;
              border: 2px solid #ddd;
              border-radius: 8px;
            }
            .document-actions {
              margin-top: 20px;
              text-align: center;
            }
            .btn {
              background: #3498db;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 0 10px;
              text-decoration: none;
              display: inline-block;
              font-size: 14px;
            }
            .btn:hover {
              background: #2980b9;
            }
            .error-message {
              color: #e74c3c;
              background: #fdf2f2;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #e74c3c;
              margin: 20px 0;
            }

          </style>
        </head>
        <body>
          <div class="document-preview">
            <div class="document-header">
              <h1 class="document-title">📄 ${doc.nom_fichier}</h1>
              <div class="document-info">
                <strong>Type :</strong> ${doc.type_document} | 
                <strong>Date :</strong> ${new Date(doc.date_televersement).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            <div class="document-content">
              ${isImage ? `
                <img src="${fileUrl}" alt="${doc.nom_fichier}" class="document-image" 
                     onerror="this.style.display='none'; document.getElementById('error-msg').style.display='block';" />
                <div id="error-msg" class="error-message" style="display:none;">
                  <strong>Impossible d'afficher l'image</strong><br>
                  Le fichier pourrait ne pas être accessible ou le chemin est incorrect.<br>
                  <strong>URL testée :</strong> ${fileUrl}<br>
                  <strong>Chemin original :</strong> ${doc.chemin_fichier}
                </div>
              ` : isPDF ? `
                <iframe src="${fileUrl}" class="pdf-frame" 
                        onerror="document.getElementById('pdf-error').style.display='block';">
                </iframe>
                <div id="pdf-error" class="error-message" style="display:none;">
                  <strong>Impossible d'afficher le PDF</strong><br>
                  <a href="${fileUrl}" target="_blank">Cliquer ici pour ouvrir le PDF dans un nouvel onglet</a>
                </div>
              ` : `
                <div class="error-message">
                  <strong>Aperçu non disponible pour ce type de fichier</strong><br>
                  Type : ${doc.nom_fichier.split('.').pop().toUpperCase()}<br>
                  Utilisez le bouton "Télécharger" pour accéder au fichier.
                </div>
              `}
            </div>
            
            <div class="document-actions">
              <button class="btn" onclick="window.close()">Fermer</button>
              <a href="${fileUrl}" class="btn" download="${doc.nom_fichier}" target="_blank">Télécharger</a>
              <a href="${fileUrl}" class="btn" target="_blank">Ouvrir dans un nouvel onglet</a>
            </div>
          </div>
        </body>
      </html>
    `);
    
    newWindow.document.close();
  }

  function handleDownloadDocument(doc) {
    // Créer un lien de téléchargement temporaire
    const link = document.createElement('a');
    link.href = doc.chemin_fichier;
    link.download = doc.nom_fichier;
    link.target = '_blank';
    
    // Ajouter le lien au DOM temporairement
    document.body.appendChild(link);
    
    // Simuler un clic pour télécharger
    link.click();
    
    // Nettoyer
    document.body.removeChild(link);
    
    // Message de confirmation
    console.log(`📥 Téléchargement initié : ${doc.nom_fichier}`);
  }

  // Fonction d'impression personnalisée
  const handlePrint = () => {
    // Créer le contenu HTML à imprimer
    const printContent = generatePrintableContent();
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Détails Client - ${client.prenom} ${client.nom}</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };

  // Générer le contenu HTML pour l'impression
  const generatePrintableContent = () => {
    // Gérer les notes
    let notes = [];
    if (client.notes) {
      if (Array.isArray(client.notes)) {
        notes = client.notes.filter(note => note && (note.contenu || note.texte));
      } else if (typeof client.notes === 'string') {
        try {
          const parsedNotes = JSON.parse(client.notes);
          notes = Array.isArray(parsedNotes) ? parsedNotes.filter(note => note && (note.contenu || note.texte)) : [];
        } catch (e) {
          notes = [{
            id: 1,
            date: client.date_creation || new Date().toISOString(),
            type: 'Général',
            auteur: client.conseillere || 'Système',
            contenu: client.notes
          }];
        }
      }
    }

    return `
      <div class="print-container">
        <!-- En-tête -->
        <div class="print-header">
          <h1>DOSSIER CLIENT</h1>
          <div class="client-title">
            ${client.prenom} ${client.nom}
            ${client.urgence ? '<span class="urgent-badge">URGENT</span>' : ''}
          </div>
          <div class="meta-info">
            <span class="procedure">${client.type_procedure}</span>
            <span class="statut">${client.statut}</span>
            <span class="dossier">Dossier: ${client.numero_dossier}</span>
          </div>
          <div class="print-date">Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
        </div>

        <!-- Informations personnelles -->
        <div class="print-section">
          <h2>📋 INFORMATIONS PERSONNELLES</h2>
          <div class="info-grid">
            <div class="info-group">
              <h3>Identité</h3>
              <div class="info-item"><strong>Nom complet:</strong> ${client.prenom} ${client.nom}</div>
              <div class="info-item"><strong>Date de naissance:</strong> ${formatDate(client.date_naissance)}</div>
              <div class="info-item"><strong>Nationalité:</strong> ${client.nationalite || 'Non renseignée'}</div>
            </div>
            <div class="info-group">
              <h3>Contact principal</h3>
              <div class="info-item"><strong>Email:</strong> ${client.email}</div>
              <div class="info-item"><strong>Téléphone:</strong> ${client.telephone}</div>
              <div class="info-item"><strong>Adresse:</strong> ${client.adresse || 'Non renseignée'}</div>
            </div>
          </div>
        </div>

        <!-- Contact alternatif -->
        <div class="print-section">
          <h2>📞 CONTACT ALTERNATIF</h2>
          <div class="info-grid">
            <div class="info-item"><strong>Nom:</strong> ${client.contact_nom || 'Non renseigné'}</div>
            <div class="info-item"><strong>Prénom:</strong> ${client.contact_prenom || 'Non renseigné'}</div>
            <div class="info-item"><strong>Relation:</strong> ${client.contact_relation || 'Non renseignée'}</div>
            <div class="info-item"><strong>Téléphone:</strong> ${client.contact_telephone || 'Non renseigné'}</div>
            <div class="info-item"><strong>Email:</strong> ${client.contact_email || 'Non renseigné'}</div>
          </div>
        </div>

        <!-- Informations sur la procédure -->
        <div class="print-section">
          <h2>⚖️ INFORMATIONS SUR LA PROCÉDURE</h2>
          <div class="info-grid">
            <div class="info-item"><strong>Type de procédure:</strong> ${client.type_procedure}</div>
            <div class="info-item"><strong>Statut actuel:</strong> ${client.statut}</div>
            <div class="info-item"><strong>Priorité:</strong> ${client.urgence ? 'URGENT' : 'Normal'}</div>
            <div class="info-item"><strong>Conseillère assignée:</strong> ${client.conseillere || 'Non assignée'}</div>
            <div class="info-item"><strong>Numéro de dossier:</strong> ${client.numero_dossier}</div>
            <div class="info-item"><strong>Date de création:</strong> ${formatDate(client.date_creation)}</div>
            <div class="info-item"><strong>Dernière modification:</strong> ${formatDate(client.date_modification)}</div>
          </div>
        </div>

        <!-- Informations spécifiques -->
        ${client.informations_specifiques ? `
          <div class="print-section">
            <h2>📝 INFORMATIONS SPÉCIFIQUES</h2>
            <div class="specific-info">
              ${formatInformationsSpecifiquesPrint(client.informations_specifiques)}
            </div>
          </div>
        ` : ''}

        <!-- Documents -->
        <div class="print-section">
          <h2>📁 Documents du dossier</h2>
          ${client.documents && client.documents.length > 0 ? `
            <table class="documents-table">
              <thead>
                <tr>
                  <th>Type de document</th>
                  <th>Nom du fichier</th>
                  <th>Date de téléversement</th>
                </tr>
              </thead>
              <tbody>
                ${client.documents.map(document => `
                  <tr>
                    <td>${document.type_document}</td>
                    <td>${document.nom_fichier}</td>
                    <td>${formatDate(document.date_televersement)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <p style="text-align: center; color: #666; font-style: italic; padding: 20px;">
              Aucun document téléversé pour ce client
            </p>
          `}
        </div>

        <!-- Notes -->
        ${notes.length > 0 ? `
          <div class="print-section">
            <h2>📝 NOTES DU DOSSIER</h2>
            <div class="notes-list">
              ${notes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(note => `
                <div class="note-item">
                  <div class="note-header">
                    <span class="note-date">${formatDate(note.date)}</span>
                    <span class="note-author">${note.auteur || 'Système'}</span>
                    <span class="note-type">${note.type || 'Général'}</span>
                  </div>
                  <div class="note-content">${note.contenu || note.texte || 'Aucun contenu'}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Pied de page -->
        <div class="print-footer">
          <p>Document confidentiel - Usage interne uniquement</p>
          <p>Généré automatiquement depuis le système de gestion des clients</p>
        </div>
      </div>
    `;
  };

  // Formater les informations spécifiques pour l'impression
  const formatInformationsSpecifiquesPrint = (informations) => {
    if (!informations) return '';
    
    try {
      const info = typeof informations === 'string' ? JSON.parse(informations) : informations;
      if (Object.keys(info).length === 0) return '';
      
      const keyMappings = {
        'fondsDisponibles': 'Fonds disponibles',
        'situationFamiliale': 'Situation familiale',
        'dateVoyage': 'Date de voyage prévue',
        'emploi': 'Situation d\'emploi',
        'invitation': 'Lettre d\'invitation',
        'lienParenteInvitant': 'Lien de parenté avec l\'invitant',
        'niveauEtudes': 'Niveau d\'études',
        'institutionProposee': 'Institution proposée',
        'programmeEtudes': 'Programme d\'études',
        'dureeEtudes': 'Durée des études',
        'coutEtudes': 'Coût des études',
        'preuvesFinancieres': 'Preuves financières',
        'offreEmploi': 'Offre d\'emploi',
        'employeur': 'Employeur',
        'posteOffert': 'Poste offert',
        'salaireOffert': 'Salaire offert',
        'lieuTravail': 'Lieu de travail',
        'experienceProfessionnelle': 'Expérience professionnelle',
        'competencesLinguistiques': 'Compétences linguistiques',
        'familleCanada': 'Famille au Canada',
        'parentsCanada': 'Parents au Canada',
        'relationFamiliale': 'Relation familiale',
        'documentsSoutien': 'Documents de soutien'
      };

      const formatValue = (key, value) => {
        // Gérer les valeurs null ou undefined
        if (value === null || value === undefined) return 'Non renseigné';
        
        // Gérer les objets JavaScript
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            return value.join(', ') || 'Non renseigné';
          } else {
            // Convertir l'objet en chaîne lisible
            return Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ') || 'Non renseigné';
          }
        }
        
        // Gérer les valeurs booléennes
        if (value === true || value === 'oui' || value === 'yes') return 'Oui';
        if (value === false || value === 'non' || value === 'no') return 'Non';
        
        // Formatage spécial par clé
        if (key === 'dateVoyage' && value) return formatDate(value);
        if (key === 'fondsDisponibles' && value) return `${value} CAD`;
        
        // Convertir en chaîne de caractères pour éviter les erreurs de rendu
        return String(value) || 'Non renseigné';
      };
      
      return Object.entries(info)
        .filter(([key]) => !isNaN(key) === false) // Ignorer les clés numériques
        .map(([key, value]) => `
          <div class="info-item">
            <strong>${keyMappings[key] || key}:</strong> ${formatValue(key, value)}
          </div>
        `).join('');
    } catch (error) {
      return `<div class="info-item">${String(informations)}</div>`;
    }
  };

  // Styles CSS pour l'impression
  const getPrintStyles = () => {
    return `
      @page {
        margin: 2cm;
        size: A4;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0;
      }
      
      .print-container {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      
      .print-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #000;
        padding-bottom: 15px;
      }
      
      .print-header h1 {
        margin: 0 0 10px 0;
        font-size: 24px;
        font-weight: bold;
      }
      
      .client-title {
        font-size: 18px;
        font-weight: bold;
        margin: 10px 0;
      }
      
      .urgent-badge {
        background: #dc3545;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-left: 10px;
      }
      
      .meta-info {
        margin: 10px 0;
        font-size: 14px;
      }
      
      .meta-info span {
        margin: 0 10px;
        padding: 4px 8px;
        background: #f8f9fa;
        border-radius: 4px;
      }
      
      .print-date {
        font-size: 10px;
        color: #666;
        margin-top: 10px;
      }
      
      .print-section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }
      
      .print-section h2 {
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 15px 0;
        padding: 8px 0;
        border-bottom: 1px solid #ccc;
      }
      
      .print-section h3 {
        font-size: 14px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: #333;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 15px;
      }
      
      .info-group {
        margin-bottom: 15px;
      }
      
      .info-item {
        margin-bottom: 5px;
        padding: 3px 0;
      }
      
      .info-item strong {
        font-weight: bold;
        color: #000;
      }
      
      .documents-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      
      .documents-table th,
      .documents-table td {
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
      }
      
      .documents-table th {
        background-color: #f8f9fa;
        font-weight: bold;
      }
      
      .status-fourni {
        background-color: #d4edda;
        color: #155724;
        font-weight: bold;
      }
      
      .status-manquant {
        background-color: #f8d7da;
        color: #721c24;
        font-weight: bold;
      }
      
      .notes-list {
        margin-top: 10px;
      }
      
      .note-item {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        page-break-inside: avoid;
      }
      
      .note-header {
        margin-bottom: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
        font-size: 11px;
      }
      
      .note-date,
      .note-author,
      .note-type {
        margin-right: 15px;
        font-weight: bold;
      }
      
      .note-content {
        font-size: 12px;
        line-height: 1.5;
      }
      
      .print-footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #ccc;
        text-align: center;
        font-size: 10px;
        color: #666;
      }
      
      .specific-info .info-item {
        display: block;
        margin-bottom: 5px;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .print-section {
          page-break-inside: avoid;
        }
        
        .note-item {
          page-break-inside: avoid;
        }
      }
    `;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content client-detail-modal-large" style={{ width: '95vw' }} onClick={(e) => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div className="modal-header">
          <div className="client-identity">
            <h2>
              {iconeType} {data.prenom} {data.nom}
              {data.urgence && <span className="urgent-badge">🔴 URGENT</span>}
            </h2>
            <div className="client-meta">
              <span className="badge type-badge">{modalType === 'lead' ? 'Lead' : 'Client'}</span>
              {data.type_procedure && <span className="badge procedure-badge">{data.type_procedure}</span>}
              {data.statut && (
                <span className={`badge statut-badge statut-${data.statut?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {data.statut}
                </span>
              )}
              {data.numero_dossier && <span className="dossier-number">📂 {data.numero_dossier}</span>}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation par onglets (cachée si showAll) */}
        {!showAll && (
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-user"></i> Informations générales
          </button>
          <button 
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <i className="fas fa-address-book"></i> Contact
          </button>
          <button 
            className={`tab-btn ${activeTab === 'procedure' ? 'active' : ''}`}
            onClick={() => setActiveTab('procedure')}
          >
            <i className="fas fa-file-alt"></i> Procédure
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifiques' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifiques')}
          >
            <i className="fas fa-list-ul"></i> Détails spécifiques
          </button>
          <button 
            className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <i className="fas fa-folder"></i> Documents
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <i className="fas fa-sticky-note"></i> Notes
          </button>
        </div>) }

        {/* Contenu des onglets */}
        <div className="modal-body">
          {(showAll || activeTab === 'general') && (
            <div className="tab-content">
              <h3>📋 Informations personnelles</h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-id-card"></i>
                    <span>Identité</span>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Nom complet:</span>
                      <span className="info-value">{data.prenom} {data.nom}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Date de naissance:</span>
                      <span className="info-value">{formatDate(data.date_naissance)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Nationalité:</span>
                      <span className="info-value">{data.nationalite || 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-envelope"></i>
                    <span>Contact principal</span>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{data.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{data.telephone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Adresse:</span>
                      <span className="info-value address-text">{data.adresse || 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-cog"></i>
                    <span>Gestion du dossier</span>
                  </div>
                  <div className="info-items">
                    {data.numero_dossier && (
                      <div className="info-item">
                        <span className="info-label">Numéro de dossier:</span>
                        <span className="info-value dossier-highlight">{data.numero_dossier}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Conseillère assignée:</span>
                      <span className="info-value">{data.conseillere || 'Non assignée'}</span>
                      {isAdmin() && modalType === 'client' && (
                        <button
                          className="btn-assign"
                          onClick={() => setShowAssignModal(true)}
                          title="Assigner le client à une conseillère"
                          style={{
                            marginLeft: '10px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <i className="fas fa-user-plus"></i> Assigner
                        </button>
                      )}
                    </div>
                    {modalType === 'client' && (
                      <div className="info-item">
                        <span className="info-label">Login client:</span>
                        <span className="info-value">{data.login_client || 'Non créé'}</span>
                      </div>
                    )}
                    {modalType === 'lead' && data.source && (
                      <div className="info-item">
                        <span className="info-label">Source du lead:</span>
                        <span className="info-value">{data.source}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Date de création:</span>
                      <span className="info-value">{formatDate(data.date_creation || data.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dernière modification:</span>
                      <span className="info-value">{formatDate(data.date_modification || data.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(showAll || activeTab === 'contact') && (
            <div className="tab-content">
              <h3>📞 Informations de contact</h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-user"></i>
                    <span>Contact principal</span>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Nom complet:</span>
                      <span className="info-value">{data.prenom} {data.nom}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{data.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{data.telephone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Adresse complète:</span>
                      <span className="info-value address-text">{data.adresse || 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-users"></i>
                    <span>Contact alternatif / Référence</span>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Nom:</span>
                      <span className="info-value">{data.contact_nom || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Prénom:</span>
                      <span className="info-value">{data.contact_prenom || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Relation:</span>
                      <span className="info-value">{data.contact_relation || 'Non renseignée'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{data.contact_telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{data.contact_email || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(showAll || activeTab === 'procedure') && (
            <div className="tab-content">
              <h3>⚖️ Informations sur la procédure</h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-file-contract"></i>
                    <span>Type et statut</span>
                  </div>
                  <div className="info-items">
                    {data.type_procedure && (
                      <div className="info-item">
                        <span className="info-label">Type de procédure:</span>
                        <span className="info-value procedure-highlight">{data.type_procedure}</span>
                      </div>
                    )}
                    {data.statut && (
                      <div className="info-item">
                        <span className="info-label">Statut actuel:</span>
                        <span className={`info-value statut-highlight statut-${data.statut?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {data.statut}
                        </span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Priorité:</span>
                      <span className={`info-value ${data.urgence ? 'urgent' : 'normal'}`}>
                        {data.urgence ? '🔴 URGENT' : '🟢 Normal'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-header">
                    <i className="fas fa-user-tie"></i>
                    <span>Gestion</span>
                  </div>
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Conseillère assignée:</span>
                      <span className="info-value">{data.conseillere || 'Non assignée'}</span>
                    </div>
                    {data.numero_dossier && (
                      <div className="info-item">
                        <span className="info-label">Numéro de dossier:</span>
                        <span className="info-value dossier-highlight">{data.numero_dossier}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Date de création:</span>
                      <span className="info-value">{formatDate(data.date_creation || data.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dernière modification:</span>
                      <span className="info-value">{formatDate(data.date_modification || data.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(showAll || activeTab === 'specifiques') && (
            <div className="tab-content">
              <h3>📝 Informations spécifiques à la procédure</h3>
              {formatInformationsSpecifiques(data.informations_specifiques)}
            </div>
          )}

          {(showAll || activeTab === 'documents') && (
            <div className="tab-content">
              <h3>📁 Documents du dossier</h3>
              <div className="documents-table-container">
                {data.documents && data.documents.length > 0 ? (
                  <table className="documents-table">
                    <thead>
                      <tr>
                        <th>Type de document</th>
                        <th>Nom du fichier</th>
                        <th>Date de téléversement</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.documents.map((document) => (
                        <tr key={document.id} className="document-provided">
                          <td className="document-name-cell">
                            <span className="document-name">{document.type_document}</span>
                          </td>
                          <td>
                            <div className="file-info">
                              <i className="fas fa-file-pdf text-success"></i>
                              <span className="file-name">{document.nom_fichier}</span>
                            </div>
                          </td>
                          <td>
                            <span className="upload-date">
                              {formatDate(document.date_televersement)}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button 
                              className="btn-icon"
                              onClick={() => handleViewDocument(document)}
                              title="Voir"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="btn-icon"
                              onClick={() => handleDownloadDocument(document)}
                              title="Télécharger"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            {!readOnly && (
                              <button 
                                className="btn-icon btn-danger"
                                onClick={() => handleRemoveDocument(document.id)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="documents-placeholder">
                    <i className="fas fa-folder-open"></i>
                    <p>Aucun document téléversé pour ce {modalType === 'lead' ? 'lead' : 'client'}</p>
                    <p className="text-muted">
                      Les documents apparaîtront ici une fois qu'ils seront téléversés via le système.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(showAll || activeTab === 'notes') && (
            <div className="tab-content">
              <h3>📝 Notes du dossier</h3>
              <div className="notes-section">
                {(() => {
                  // Fonction helper pour formater le contenu de note en toute sécurité
                  const formatNoteContent = (content) => {
                    if (!content) return 'Aucun contenu';
                    if (typeof content === 'object') {
                      return JSON.stringify(content, null, 2);
                    }
                    return String(content);
                  };

                  // Gérer différents formats de notes possibles
                  let notes = [];
                  if (data.notes) {
                    if (Array.isArray(data.notes)) {
                      notes = data.notes.filter(note => note && (note.contenu || note.texte));
                    } else if (typeof data.notes === 'string') {
                      try {
                        const parsedNotes = JSON.parse(data.notes);
                        notes = Array.isArray(parsedNotes) ? parsedNotes.filter(note => note && (note.contenu || note.texte)) : [];
                      } catch (e) {
                        // Si ce n'est pas du JSON valide, traiter comme une note simple
                        notes = [{
                          id: 1,
                          date: data.date_creation || data.createdAt || new Date().toISOString(),
                          type: 'Général',
                          auteur: data.conseillere || 'Système',
                          contenu: String(data.notes)
                        }];
                      }
                    } else {
                      // Si data.notes est un objet, le convertir en string
                      notes = [{
                        id: 1,
                        date: data.date_creation || data.createdAt || new Date().toISOString(),
                        type: 'Général',
                        auteur: data.conseillere || 'Système',
                        contenu: JSON.stringify(data.notes, null, 2)
                      }];
                    }
                  }

                  return notes.length > 0 ? (
                    <div className="notes-list">
                      {notes.sort((a, b) => new Date(b.date) - new Date(a.date)).map((note, index) => (
                        <div key={note.id || index} className="note-item">
                          <div className="note-header">
                            <div className="note-meta">
                              <i className="fas fa-sticky-note"></i>
                              <span className="note-date">{formatDate(note.date)}</span>
                              <span className="note-author">{String(note.auteur || 'Système')}</span>
                            </div>
                            <span className={`note-type ${String(note.type || 'general').toLowerCase()}`}>
                              {String(note.type || 'Général')}
                            </span>
                          </div>
                          <div className="note-content">
                            <p>{formatNoteContent(note.contenu || note.texte)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="notes-placeholder">
                      <i className="fas fa-sticky-note"></i>
                      <p>Aucune note pour ce {modalType === 'lead' ? 'lead' : 'client'}</p>
                      <p className="text-muted">
                        Les notes apparaîtront ici au fur et à mesure de l'évolution du dossier.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Pied de la modale */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <i className="fas fa-times"></i> Fermer
          </button>
          {!readOnly && (
            <button className="btn-primary" onClick={() => onEdit && onEdit(data)}>
              <i className="fas fa-edit"></i> Modifier {modalType === 'lead' ? 'le lead' : 'le client'}
            </button>
          )}
          <button className="btn-primary" onClick={handlePrint}>
            <i className="fas fa-print"></i> Imprimer
          </button>
        </div>
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assigner le client à une conseillère</h3>
              <button className="close-button" onClick={() => setShowAssignModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client: <strong>{data.nom} {data.prenom}</strong></label>
              </div>
              <div className="form-group">
                <label>Conseillère actuelle: <strong>{data.conseillere || 'Non assignée'}</strong></label>
              </div>
              <div className="form-group">
                <label htmlFor="advisor-select">Nouvelle conseillère:</label>
                <select
                  id="advisor-select"
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="form-control"
                >
                  <option value="">Sélectionner une conseillère</option>
                  {advisors.map(advisor => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.nom} {advisor.prenom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignClient}
                disabled={loading || !selectedAdvisor}
              >
                {loading ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetailModal;
