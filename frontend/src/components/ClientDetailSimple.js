import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ClientDetail.css';
import clientsAPI from '../services/clientsAPI';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [userRole, setUserRole] = useState('conseillere'); // À remplacer par le rôle réel de l'utilisateur connecté

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
      <div className="tab-content">
        {activeTab === 'informations' && (
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
                <label>Adresse:</label>
                <span>{client.adresse || 'Non renseignée'}</span>
              </div>
              <div className="info-item">
                <label>Nationalité:</label>
                <span>{client.nationalite || 'Non renseignée'}</span>
              </div>
              <div className="info-item">
                <label>Numéro de dossier:</label>
                <span>{client.numero_dossier}</span>
              </div>
              <div className="info-item">
                <label>Date de création:</label>
                <span>{formatDate(client.date_creation)}</span>
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
                <div className="info-text">
                  {client.informations_specifiques}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-pane">
            <h3>Documents</h3>
            <div className="documents-section">
              <div className="section-header">
                <button className="btn btn-primary">
                  <i className="fas fa-upload"></i> Téléverser un document
                </button>
              </div>
              <div className="documents-placeholder">
                <i className="fas fa-folder-open"></i>
                <p>Aucun document téléversé pour le moment</p>
                <p className="text-muted">
                  La gestion des documents sera intégrée prochainement via l'API.
                </p>
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
    </div>
  );
}

export default ClientDetail;
