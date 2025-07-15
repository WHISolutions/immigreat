import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ClientDetail.css';
import clientsAPI from '../services/clientsAPI';
import DocumentUploader from './DocumentUploader';

console.log('AFFICHAGE : ClientDetail.js');

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [userRole, setUserRole] = useState('conseillere'); // À remplacer par le rôle réel de l'utilisateur connecté
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Charger les détails du client depuis l'API
  useEffect(() => {
    const loadClientDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 Chargement des détails du client ${id}...`);
        
        const response = await clientsAPI.getClientById(id);
        console.log('✅ Détails du client récupérés:', response);
        
        if (response.success && response.data) {
          setClient(response.data);
          console.log(`📊 Client ${response.data.nom} ${response.data.prenom} chargé avec succès`);
        } else {
          console.log('⚠️ Client non trouvé ou format de réponse inattendu');
          setError('Client non trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du client:', error);
        setError('Erreur lors du chargement des détails du client. Vérifiez que le serveur backend est démarré.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadClientDetails();
    }
  }, [id]);

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Fonction pour ouvrir la prévisualisation d'un document
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  // Fonction pour télécharger un document
  const handleDownloadDocument = (document) => {
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = document.url || document.path;
    link.download = document.nom || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour obtenir l'icône selon le type de document
  const getDocumentIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'fas fa-file-image';
      default:
        return 'fas fa-file';
    }
  };

  // Fonction pour obtenir la classe CSS selon le type de document
  const getDocumentTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'document-pdf';
      case 'doc':
      case 'docx':
        return 'document-word';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'document-image';
      default:
        return 'document-default';
    }
  };

  // Fonction pour obtenir la liste des documents requis selon le type de procédure
  const getRequiredDocuments = () => {
    const baseDocuments = [
      'Copie de CIN',
      'Copie du passeport',
      'Photo d\'identité'
    ];

    switch (client?.type_procedure) {
      case 'Visa visiteur':
      case 'Visa Visiteur':
        return [
          ...baseDocuments,
          'Invitation (si applicable)',
          'Dossier financier',
          'Dossier emploi'
        ];
      case 'Permis de travail':
        return [
          ...baseDocuments,
          'Offre d\'emploi',
          'EIMT',
          'Diplômes',
          'CV'
        ];
      case 'Permis d\'études':
        return [
          ...baseDocuments,
          'Lettre d\'admission',
          'Preuve financière'
        ];
      case 'Résidence permanente':
        return [
          ...baseDocuments,
          'Certificat de police',
          'Examen médical',
          'Preuves d\'expérience',
          'Tests de langue'
        ];
      default:
        return baseDocuments;
    }
  };

  // Fonction pour gérer l'upload d'un fichier
  const handleFileUpload = async (documentName, file) => {
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

    // Simuler l'upload du document
    const newDocument = {
      id: Date.now(),
      nom: documentName,
      fichier: file.name,
      type: file.type,
      statut: 'fourni',
      dateUpload: new Date().toISOString(),
      taille: file.size
    };

    // Mettre à jour la liste des documents
    const updatedDocuments = [...(client.documents || []), newDocument];
    setClient({ ...client, documents: updatedDocuments });

    console.log('Document téléversé:', newDocument);
    alert(`Document "${documentName}" téléversé avec succès !`);
  };

  // Fonction pour supprimer un document
  const handleRemoveDocument = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      const updatedDocuments = client.documents.filter(doc => doc.id !== documentId);
      setClient({ ...client, documents: updatedDocuments });
      console.log('Document supprimé:', documentId);
    }
  };

  if (loading) {
    return (
      <div className="client-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des détails du client...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-detail-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/clients')} className="btn btn-secondary">
            Retour aux clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-detail-container">
        <div className="error-container">
          <p className="error-message">Client non trouvé</p>
          <button onClick={() => navigate('/clients')} className="btn btn-secondary">
            Retour aux clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-container">
      {/* En-tête du client */}
      <div className="client-header">
        <div className="client-info">
          <h1>{client.prenom} {client.nom}</h1>
          <div className="client-meta">
            <span className="badge badge-procedure">{client.type_procedure}</span>
            <span className={`badge badge-statut statut-${client.statut.toLowerCase().replace(/\s+/g, '-')}`}>
              {client.statut}
            </span>
            {client.urgence && <span className="badge badge-urgent">Urgent</span>}
          </div>
        </div>
        <div className="client-actions">
          <button onClick={() => navigate('/clients')} className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> Retour
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-edit"></i> Modifier
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'informations' ? 'active' : ''}`}
          onClick={() => setActiveTab('informations')}
        >
          <i className="fas fa-user"></i> Informations personnelles
        </button>
        <button 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <i className="fas fa-phone"></i> Contact
        </button>
        <button 
          className={`tab-button ${activeTab === 'procedure' ? 'active' : ''}`}
          onClick={() => setActiveTab('procedure')}
        >
          <i className="fas fa-file-alt"></i> Procédure
        </button>
        <button 
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <i className="fas fa-folder"></i> Documents
        </button>
        <button 
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <i className="fas fa-sticky-note"></i> Notes
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">        {activeTab === 'informations' && (
          <div className="tab-pane">
            <h3>Informations personnelles</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nom complet:</label>
                <span>{client.prenom} {client.nom}</span>
              </div>
              <div className="info-item">
                <label>Date de naissance:</label>
                <span>{formatDate(client.date_naissance)}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{client.email}</span>
              </div>
              <div className="info-item">
                <label>Téléphone:</label>
                <span>{client.telephone}</span>
              </div>
              <div className="info-item">
                <label>Adresse complète:</label>
                <span className="address-text">{client.adresse || 'Non renseignée'}</span>
              </div>
              <div className="info-item">
                <label>Nationalité:</label>
                <span>{client.nationalite || 'Non renseignée'}</span>
              </div>
              <div className="info-item">
                <label>Numéro de dossier:</label>
                <span className="dossier-number">{client.numero_dossier}</span>
              </div>
              <div className="info-item">
                <label>Type de procédure:</label>
                <span className="procedure-type">{client.type_procedure}</span>
              </div>
              <div className="info-item">
                <label>Statut actuel:</label>
                <span className={`statut-badge statut-${client.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                  {client.statut}
                </span>
              </div>
              <div className="info-item">
                <label>Conseillère assignée:</label>
                <span>{client.conseillere || 'Non assignée'}</span>
              </div>
              <div className="info-item">
                <label>Priorité:</label>
                <span className={client.urgence ? 'urgent' : 'normal'}>
                  {client.urgence ? '🔴 Urgent' : '🟢 Normal'}
                </span>
              </div>
              <div className="info-item">
                <label>Login client:</label>
                <span>{client.login_client || 'Non créé'}</span>
              </div>
              <div className="info-item">
                <label>Date de création:</label>
                <span>{formatDate(client.date_creation)}</span>
              </div>
              <div className="info-item">
                <label>Dernière modification:</label>
                <span>{formatDate(client.date_modification)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="tab-pane">
            <h3>Informations de contact</h3>
            <div className="contact-sections">
              <div className="contact-section">
                <h4>Contact principal</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{client.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Téléphone:</label>
                    <span>{client.telephone}</span>
                  </div>
                  <div className="info-item">
                    <label>Adresse:</label>
                    <span>{client.adresse || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              <div className="contact-section">
                <h4>Contact alternatif</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom:</label>
                    <span>{client.contact_nom || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Prénom:</label>
                    <span>{client.contact_prenom || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Relation:</label>
                    <span>{client.contact_relation || 'Non renseignée'}</span>
                  </div>
                  <div className="info-item">
                    <label>Téléphone:</label>
                    <span>{client.contact_telephone || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{client.contact_email || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'procedure' && (
          <div className="tab-pane">
            <h3>Informations sur la procédure</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Type de procédure:</label>
                <span>{client.type_procedure}</span>
              </div>
              <div className="info-item">
                <label>Statut:</label>
                <span className={`statut-badge statut-${client.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                  {client.statut}
                </span>
              </div>
              <div className="info-item">
                <label>Conseillère assignée:</label>
                <span>{client.conseillere}</span>
              </div>
              <div className="info-item">
                <label>Urgence:</label>
                <span className={client.urgence ? 'urgent' : 'normal'}>
                  {client.urgence ? 'Urgent' : 'Normal'}
                </span>
              </div>
              <div className="info-item">
                <label>Login client:</label>
                <span>{client.login_client || 'Non créé'}</span>
              </div>
              <div className="info-item">
                <label>Date de création:</label>
                <span>{formatDate(client.date_creation)}</span>
              </div>
              <div className="info-item">
                <label>Dernière modification:</label>
                <span>{formatDate(client.date_modification)}</span>
              </div>
            </div>
              {client.informations_specifiques && (
              <div className="specific-info">
                <h4>Informations spécifiques</h4>
                {(() => {
                  try {
                    const infos = typeof client.informations_specifiques === 'string' 
                      ? JSON.parse(client.informations_specifiques) 
                      : client.informations_specifiques;
                    
                    return (
                      <div className="info-grid">
                        {Object.entries(infos).map(([key, value]) => {
                          // Formatage des clés pour un affichage plus lisible
                          const formatKey = (key) => {
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
                              'documentsSoutien': 'Documents de soutien',
                              'categorieRP': 'Catégorie de résidence permanente',
                              'scoreEEE': 'Score Entrée Express',
                              'experienceCanadienne': 'Expérience canadienne',
                              'certificationProfessionnelle': 'Certification professionnelle'
                            };
                            return keyMappings[key] || key.charAt(0).toUpperCase() + key.slice(1);
                          };

                          // Formatage des valeurs
                          const formatValue = (value) => {
                            if (value === 'oui' || value === 'yes') return '✅ Oui';
                            if (value === 'non' || value === 'no') return '❌ Non';
                            if (key === 'dateVoyage' && value) {
                              return formatDate(value);
                            }
                            if (key === 'fondsDisponibles' && value) {
                              return `${value} $`;
                            }
                            return value || 'Non renseigné';
                          };

                          return (
                            <div key={key} className="info-item">
                              <label>{formatKey(key)}:</label>
                              <span>{formatValue(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } catch (error) {
                    console.error('Erreur parsing informations spécifiques:', error);
                    return (
                      <div className="info-text">
                        <pre>{client.informations_specifiques}</pre>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-pane">
            <h3>Documents</h3>
            <div className="documents-section">
              <div className="documents-table-container">
                <table className="documents-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>État</th>
                      <th>Fichier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getRequiredDocuments().map((documentName, index) => {
                      const existingDoc = client.documents?.find(doc => doc.nom === documentName);
                      const isProvided = existingDoc && existingDoc.statut === 'fourni';
                      
                      return (
                        <tr key={index} className={isProvided ? 'document-provided' : 'document-pending'}>
                          <td className="document-name-cell">
                            <span className="document-name">{documentName}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${isProvided ? 'status-fourni' : 'status-a-fournir'}`}>
                              {isProvided ? 'FOURNI' : 'À FOURNIR'}
                            </span>
                          </td>
                          <td className="file-upload-cell">
                            {isProvided ? (
                              <div className="file-info">
                                <i className="fas fa-file-pdf text-success"></i>
                                <span className="file-name">{existingDoc.fichier || 'Document.pdf'}</span>
                                {existingDoc.dateUpload && (
                                  <small className="upload-date">
                                    ({formatDate(existingDoc.dateUpload)})
                                  </small>
                                )}
                              </div>
                            ) : (
                              <div className="file-upload-wrapper">
                                <input
                                  type="file"
                                  id={`file-${index}`}
                                  className="file-upload-input"
                                  onChange={(e) => handleFileUpload(documentName, e.target.files[0])}
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                                <label htmlFor={`file-${index}`} className="file-upload-label">
                                  <i className="fas fa-upload"></i> Choisir un fichier
                                </label>
                              </div>
                            )}
                          </td>
                          <td className="actions-cell">
                            {isProvided ? (
                              <>
                                <button 
                                  className="btn-icon"
                                  onClick={() => handleViewDocument(existingDoc)}
                                  title="Voir"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn-icon"
                                  onClick={() => handleDownloadDocument(existingDoc)}
                                  title="Télécharger"
                                >
                                  <i className="fas fa-download"></i>
                                </button>
                                <button 
                                  className="btn-icon btn-danger"
                                  onClick={() => handleRemoveDocument(existingDoc.id)}
                                  title="Supprimer"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </>
                            ) : (
                              <span className="no-actions">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="tab-pane">
            <h3>Notes</h3>
            <div className="notes-section">
              <div className="section-header">
                <button className="btn btn-primary">
                  <i className="fas fa-plus"></i> Ajouter une note
                </button>
              </div>
              <div className="notes-placeholder">
                <i className="fas fa-sticky-note"></i>
                <p>Aucune note pour le moment</p>
                <p className="text-muted">
                  La gestion des notes sera intégrée prochainement via l'API.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modale de prévisualisation de document */}
      {showDocumentModal && (
        <div className="document-modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowDocumentModal(false)}>&times;</span>
            {selectedDocument && (
              <div className="document-preview">
                <h3>Prévisualisation du document</h3>
                <div className="document-details">
                  <i className={getDocumentIcon(selectedDocument.type)}></i>
                  <div className="document-info">
                    <span className="document-name">{selectedDocument.nom}</span>
                    <span className="document-type">{selectedDocument.type}</span>
                  </div>
                </div>
                <div className="document-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleDownloadDocument(selectedDocument)}
                  >
                    <i className="fas fa-download"></i> Télécharger
                  </button>
                </div>
                <div className="document-viewer">
                  {/* Intégrer un visualiseur de document ici, par exemple un iframe pour les PDF */}
                  {selectedDocument.type.toLowerCase() === 'pdf' ? (
                    <iframe 
                      src={selectedDocument.url || selectedDocument.path} 
                      title="Document PDF"
                      className="pdf-viewer"
                    ></iframe>
                  ) : (
                    <p>Impossible de prévisualiser ce type de document.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetail;
