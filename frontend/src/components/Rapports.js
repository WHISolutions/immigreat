import React, { useState, useEffect } from 'react';
import '../styles/Rapports.css';
import clientsAPI from '../services/clientsAPI';
import rapportsAPI from '../services/rapportsAPI';

function Rapports() {
  // États pour la gestion des rapports
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [typeRapport, setTypeRapport] = useState('statut');
  const [optionsPersonnalisation, setOptionsPersonnalisation] = useState({
    inclureCommentairesInternes: false,
    inclureLogo: true,
    inclureCoordonnees: true,
    niveauDetail: 'standard' // 'simplifie', 'standard', 'detaille'
  });
  const [sectionsSelectionnees, setSectionsSelectionnees] = useState({
    informationsClient: true,
    statutDossier: true,
    documents: true,
    calendrier: true,
    finances: true
  });
  const [modeDiffusion, setModeDiffusion] = useState('pdf');
  const [frequenceEnvoi, setFrequenceEnvoi] = useState('sur_demande');
  const [apercu, setApercu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rapportGenere, setRapportGenere] = useState(false);
  const [clients, setClients] = useState([]);
  const [filtreClient, setFiltreClient] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [erreurChargement, setErreurChargement] = useState(null);
  const [rapportData, setRapportData] = useState(null); // Nouvelles données réelles
  const [loadingRapportData, setLoadingRapportData] = useState(false);

  // Fonction pour calculer la progression basée sur le statut
  const calculerProgression = (statut) => {
    switch(statut) {
      case 'En attente': return 15;
      case 'En cours': return 60;
      case 'Terminé': return 100;
      case 'Suspendu': return 30;
      case 'Annulé': return 0;
      default: return 45;
    }
  };

  // Fonction pour formater les données client de l'API
  const formaterClientAPI = (clientAPI) => {
    return {
      id: clientAPI.id,
      nom: clientAPI.nom,
      prenom: clientAPI.prenom,
      email: clientAPI.email,
      telephone: clientAPI.telephone,
      dossier: clientAPI.numero_dossier || `D-${new Date().getFullYear()}-${String(clientAPI.id).padStart(3, '0')}`,
      statut: clientAPI.statut,
      progression: calculerProgression(clientAPI.statut),
      type_procedure: clientAPI.type_procedure,
      date_creation: clientAPI.date_creation
    };
  };

  // Récupérer uniquement les vrais clients de la base de données
  useEffect(() => {
    const chargerClients = async () => {
      try {
        setLoadingClients(true);
        setErreurChargement(null);
        const response = await clientsAPI.getAllClients();
        
        if (response.success && response.data && response.data.clients) {
          const clientsFormates = response.data.clients.map(formaterClientAPI);
          setClients(clientsFormates);
        } else {
          console.error('Erreur lors du chargement des clients:', response.message);
          setErreurChargement(response.message || 'Erreur lors du chargement des clients');
          setClients([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        setErreurChargement('Impossible de se connecter au serveur');
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    chargerClients();
  }, []);

  // Filtrer les clients selon la recherche
  const clientsFiltres = clients.filter(client => 
    `${client.nom} ${client.prenom} ${client.dossier}`.toLowerCase().includes(filtreClient.toLowerCase())
  );

  // Fonction pour générer le rapport avec des données réelles
  const genererRapport = async () => {
    if (!clientSelectionne) {
      alert('Veuillez sélectionner un client');
      return;
    }
    
    setLoading(true);
    setLoadingRapportData(true);
    
    try {
      console.log('🔄 Génération du rapport pour le client:', clientSelectionne.id);
      
      // Récupérer les données réelles du client
      const response = await rapportsAPI.getClientRapportData(clientSelectionne.id);
      
      if (response.success) {
        setRapportData(response.data);
        setRapportGenere(true);
        setApercu(true);
        console.log('✅ Données de rapport récupérées:', response.data);
      } else {
        console.error('❌ Erreur récupération données:', response.message);
        alert('Erreur lors de la récupération des données du client');
      }
    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
      setLoadingRapportData(false);
    }
  };

  // Fonction pour envoyer le rapport par email avec données réelles
  const envoyerRapportEmail = async () => {
    if (!rapportGenere || !rapportData) {
      alert('Veuillez d\'abord générer le rapport');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await rapportsAPI.sendReportByEmail(
        clientSelectionne.id, 
        rapportData.client.email, 
        typeRapport
      );
      
      if (response.success) {
        alert(`Rapport envoyé à ${rapportData.client.email} avec succès !`);
      }
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      alert('Erreur lors de l\'envoi du rapport par email');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour télécharger le rapport en PDF avec données réelles
  const telechargerRapportPDF = async () => {
    if (!rapportGenere || !rapportData) {
      alert('Veuillez d\'abord générer le rapport');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await rapportsAPI.generatePDFReport(
        clientSelectionne.id, 
        typeRapport, 
        optionsPersonnalisation
      );
      
      if (response.success) {
        alert('Rapport PDF téléchargé avec succès !');
        // Ici, on pourrait déclencher le téléchargement réel
        // window.open(response.url, '_blank');
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error);
      alert('Erreur lors du téléchargement du rapport PDF');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour imprimer le rapport
  const imprimerRapport = () => {
    if (!rapportGenere) {
      alert('Veuillez d\'abord générer le rapport');
      return;
    }
    
    window.print();
  };

  // Fonction pour sélectionner un client et réinitialiser les données
  const selectionnerClient = (client) => {
    setClientSelectionne(client);
    setRapportGenere(false);
    setApercu(false);
    setRapportData(null); // Réinitialiser les données de rapport
  };

  // Fonction pour obtenir le titre du rapport selon le type
  const getTitreRapport = () => {
    switch (typeRapport) {
      case 'statut':
        return 'Rapport de statut simplifié';
      case 'detaille':
        return 'Rapport détaillé d\'avancement';
      case 'documents':
        return 'Rapport de documents';
      case 'calendrier':
        return 'Rapport de calendrier';
      case 'financier':
        return 'Rapport financier';
      default:
        return 'Rapport';
    }
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatutColor = (statut) => {
    switch (statut) {
      case 'En cours':
        return '#1a73e8';
      case 'En attente':
        return '#f9a825';
      case 'Terminé':
        return '#43a047';
      case 'Complété': // Pour compatibilité avec les anciennes données
        return '#43a047';
      case 'Suspendu':
        return '#ff9800';
      case 'Annulé':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  // Rendu de l'aperçu du rapport avec données réelles
  const renderApercu = () => {
    if (!clientSelectionne || !rapportData) return null;
    
    const { client, progression, documents, rendez_vous, finances, actions_requises } = rapportData;
    
    return (
      <div className="rapport-apercu">
        <div className="rapport-header">
          {optionsPersonnalisation.inclureLogo && (
            <div className="rapport-logo">
              <img src="/assets/logo.png" alt="Logo ImmigExpert" />
            </div>
          )}
          <div className="rapport-titre">
            <h2>{getTitreRapport()}</h2>
            <p>Généré le {new Date().toLocaleDateString('fr-CA')}</p>
          </div>
          {optionsPersonnalisation.inclureCoordonnees && (
            <div className="rapport-coordonnees">
              <p>ImmigExpert Inc.</p>
              <p>123 Rue de l'Immigration</p>
              <p>Montréal, QC H2X 3Y7</p>
              <p>Tél: +1 514-555-0000</p>
            </div>
          )}
        </div>
        
        <div className="rapport-client-info">
          <h3>Informations du client</h3>
          <div className="rapport-info-grid">
            <div>
              <p><strong>Nom:</strong> {client.nom}</p>
              <p><strong>Prénom:</strong> {client.prenom}</p>
            </div>
            <div>
              <p><strong>Email:</strong> {client.email}</p>
              <p><strong>Téléphone:</strong> {client.telephone || 'Non spécifié'}</p>
            </div>
            <div>
              <p><strong>Numéro de dossier:</strong> {client.numero_dossier}</p>
              <p><strong>Type de procédure:</strong> {client.type_procedure || 'Non spécifié'}</p>
            </div>
            <div>
              <p><strong>Statut:</strong> <span style={{ color: getStatutColor(client.statut) }}>{client.statut}</span></p>
              <p><strong>Conseillère:</strong> {client.conseillere || 'Non assignée'}</p>
            </div>
          </div>
        </div>
        
        {sectionsSelectionnees.statutDossier && (
          <div className="rapport-section">
            <h3>Statut du dossier</h3>
            <div className="rapport-progression">
              <div className="progression-bar-container">
                <div 
                  className="progression-bar" 
                  style={{ width: `${progression.pourcentage}%`, backgroundColor: getStatutColor(client.statut) }}
                ></div>
              </div>
              <div className="progression-label">{progression.pourcentage}% complété</div>
            </div>
            
            {optionsPersonnalisation.niveauDetail !== 'simplifie' && progression.etapes && (
              <div className="rapport-etapes">
                {progression.etapes.map((etape, index) => (
                  <div key={index} className={`etape ${etape.statut === 'complete' ? 'complete' : etape.statut === 'en_cours' ? 'en-cours' : ''}`}>
                    <div className="etape-point"></div>
                    <div className="etape-label">{etape.nom}</div>
                    <div className="etape-date">{etape.date || 'En attente'}</div>
                    {etape.description && (
                      <div className="etape-description">{etape.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="prochaine-etape">
              <h4>Prochaine étape</h4>
              <p>{progression.prochaine_etape}</p>
            </div>
          </div>
        )}
        
        {sectionsSelectionnees.documents && (
          <div className="rapport-section">
            <h3>Documents ({documents.total} reçus)</h3>
            {documents.liste && documents.liste.length > 0 ? (
              <table className="rapport-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Nom du fichier</th>
                    <th>Date de réception</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.liste.map((doc, index) => (
                    <tr key={index}>
                      <td>{doc.type_document}</td>
                      <td>{doc.nom_fichier}</td>
                      <td>{new Date(doc.date_televersement).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-documents">
                <p>📂 Aucun document reçu pour ce dossier</p>
                <p>Les documents apparaîtront ici une fois téléversés</p>
              </div>
            )}
          </div>
        )}
        
        {sectionsSelectionnees.calendrier && (
          <div className="rapport-section">
            <h3>Calendrier ({rendez_vous.total} rendez-vous)</h3>
            {rendez_vous.liste && rendez_vous.liste.length > 0 ? (
              <table className="rapport-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Type</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rendez_vous.liste.slice(0, 10).map((rdv, index) => (
                    <tr key={index}>
                      <td>{new Date(rdv.date).toLocaleDateString('fr-FR')}</td>
                      <td>{rdv.heure || 'Non spécifié'}</td>
                      <td>{rdv.type || 'Consultation'}</td>
                      <td>
                        <span className={`statut-badge ${rdv.statut === 'Complété' ? 'statut-success' : 
                          rdv.statut === 'Confirmé' ? 'statut-info' : 'statut-warning'}`}>
                          {rdv.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>📅 Aucun rendez-vous enregistré</p>
              </div>
            )}
          </div>
        )}
        
        {sectionsSelectionnees.finances && (
          <div className="rapport-section">
            <h3>Finances</h3>
            {finances.liste_factures && finances.liste_factures.length > 0 ? (
              <>
                <table className="rapport-table">
                  <thead>
                    <tr>
                      <th>Numéro</th>
                      <th>Montant</th>
                      <th>Date d'émission</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finances.liste_factures.map((facture, index) => (
                      <tr key={index}>
                        <td>{facture.numero}</td>
                        <td>{parseFloat(facture.montant || 0).toFixed(2)} $</td>
                        <td>{facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('fr-FR') : 'N/A'}</td>
                        <td>
                          <span className={`statut-badge ${facture.statut === 'payee' || facture.statut === 'Payée' ? 'statut-success' : 'statut-warning'}`}>
                            {facture.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total payé</strong></td>
                      <td><strong>{finances.total_paye.toFixed(2)} $</strong></td>
                    </tr>
                    {finances.total_en_attente > 0 && (
                      <tr>
                        <td colSpan="3"><strong>Solde à payer</strong></td>
                        <td><strong>{finances.total_en_attente.toFixed(2)} $</strong></td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </>
            ) : (
              <div className="no-data">
                <p>💰 Aucune facture enregistrée</p>
              </div>
            )}
          </div>
        )}
        
        {actions_requises && actions_requises.length > 0 && (
          <div className="rapport-actions-requises">
            <h3>Actions requises</h3>
            {actions_requises.map((action, index) => (
              <div key={index} className="action-item">
                <div className="action-icon">
                  <i className={action.icone || "fas fa-exclamation-circle"}></i>
                </div>
                <div className="action-content">
                  <p className="action-titre">{action.titre}</p>
                  <p className="action-description">{action.description}</p>
                  {action.echeance && (
                    <p className="action-echeance">Échéance: {new Date(action.echeance).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="rapport-footer">
          <p>Ce rapport est généré automatiquement à partir des données réelles du dossier.</p>
          <p>Pour toute question, veuillez contacter votre conseiller(ère) en immigration.</p>
          <p><strong>Dernière mise à jour:</strong> {client.date_modification ? new Date(client.date_modification).toLocaleDateString('fr-FR') : 'N/A'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="rapports-container">
      <div className="rapports-header">
        <h2>Rapports d'avancement pour clients</h2>
        <p>Générez des rapports personnalisés pour informer vos clients de l'état de leur dossier.</p>
      </div>
      
      <div className="rapports-content">
        <div className="rapports-sidebar">
          <div className="section-title">
            <h3>Sélection du client</h3>
          </div>
          
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              value={filtreClient}
              onChange={(e) => setFiltreClient(e.target.value)}
            />
          </div>
          
          <div className="clients-list">
            {loadingClients ? (
              <div className="loading-clients">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Chargement des clients...</span>
              </div>
            ) : erreurChargement ? (
              <div className="error-clients">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{erreurChargement}</span>
                <button 
                  className="btn-retry" 
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </button>
              </div>
            ) : clientsFiltres.length > 0 ? (
              clientsFiltres.map(client => (
                <div 
                  key={client.id} 
                  className={`client-item ${clientSelectionne && clientSelectionne.id === client.id ? 'selected' : ''}`}
                  onClick={() => selectionnerClient(client)}
                >
                  <div className="client-avatar">
                    {client.prenom.charAt(0)}{client.nom.charAt(0)}
                  </div>
                  <div className="client-info">
                    <p className="client-name">{client.prenom} {client.nom}</p>
                    <p className="client-dossier">{client.dossier}</p>
                  </div>
                  <div className="client-status">
                    <span 
                      className="status-indicator" 
                      style={{ backgroundColor: getStatutColor(client.statut) }}
                    ></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                {filtreClient ? 'Aucun client ne correspond à votre recherche' : 'Aucun client dans la base de données'}
              </div>
            )}
          </div>
          
          {clientSelectionne && (
            <>
              <div className="section-title">
                <h3>Type de rapport</h3>
              </div>
              
              <div className="rapport-types">
                <div className="radio-group">
                  <label className={typeRapport === 'statut' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="typeRapport" 
                      value="statut" 
                      checked={typeRapport === 'statut'} 
                      onChange={() => setTypeRapport('statut')}
                    />
                    <span>Rapport de statut simplifié</span>
                  </label>
                  
                  <label className={typeRapport === 'detaille' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="typeRapport" 
                      value="detaille" 
                      checked={typeRapport === 'detaille'} 
                      onChange={() => setTypeRapport('detaille')}
                    />
                    <span>Rapport détaillé d'avancement</span>
                  </label>
                  
                  <label className={typeRapport === 'documents' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="typeRapport" 
                      value="documents" 
                      checked={typeRapport === 'documents'} 
                      onChange={() => setTypeRapport('documents')}
                    />
                    <span>Rapport de documents</span>
                  </label>
                  
                  <label className={typeRapport === 'calendrier' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="typeRapport" 
                      value="calendrier" 
                      checked={typeRapport === 'calendrier'} 
                      onChange={() => setTypeRapport('calendrier')}
                    />
                    <span>Rapport de calendrier</span>
                  </label>
                  
                  <label className={typeRapport === 'financier' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="typeRapport" 
                      value="financier" 
                      checked={typeRapport === 'financier'} 
                      onChange={() => setTypeRapport('financier')}
                    />
                    <span>Rapport financier</span>
                  </label>
                </div>
              </div>
              
              <div className="section-title">
                <h3>Personnalisation</h3>
              </div>
              
              <div className="personnalisation-options">
                <div className="option-group">
                  <h4>Sections à inclure</h4>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={sectionsSelectionnees.informationsClient} 
                      onChange={() => setSectionsSelectionnees({...sectionsSelectionnees, informationsClient: !sectionsSelectionnees.informationsClient})}
                    />
                    <span>Informations client</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={sectionsSelectionnees.statutDossier} 
                      onChange={() => setSectionsSelectionnees({...sectionsSelectionnees, statutDossier: !sectionsSelectionnees.statutDossier})}
                    />
                    <span>Statut du dossier</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={sectionsSelectionnees.documents} 
                      onChange={() => setSectionsSelectionnees({...sectionsSelectionnees, documents: !sectionsSelectionnees.documents})}
                    />
                    <span>Documents</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={sectionsSelectionnees.calendrier} 
                      onChange={() => setSectionsSelectionnees({...sectionsSelectionnees, calendrier: !sectionsSelectionnees.calendrier})}
                    />
                    <span>Calendrier</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={sectionsSelectionnees.finances} 
                      onChange={() => setSectionsSelectionnees({...sectionsSelectionnees, finances: !sectionsSelectionnees.finances})}
                    />
                    <span>Finances</span>
                  </label>
                </div>
                
                <div className="option-group">
                  <h4>Niveau de détail</h4>
                  
                  <div className="radio-group">
                    <label className={optionsPersonnalisation.niveauDetail === 'simplifie' ? 'selected' : ''}>
                      <input 
                        type="radio" 
                        name="niveauDetail" 
                        value="simplifie" 
                        checked={optionsPersonnalisation.niveauDetail === 'simplifie'} 
                        onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, niveauDetail: 'simplifie'})}
                      />
                      <span>Simplifié</span>
                    </label>
                    
                    <label className={optionsPersonnalisation.niveauDetail === 'standard' ? 'selected' : ''}>
                      <input 
                        type="radio" 
                        name="niveauDetail" 
                        value="standard" 
                        checked={optionsPersonnalisation.niveauDetail === 'standard'} 
                        onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, niveauDetail: 'standard'})}
                      />
                      <span>Standard</span>
                    </label>
                    
                    <label className={optionsPersonnalisation.niveauDetail === 'detaille' ? 'selected' : ''}>
                      <input 
                        type="radio" 
                        name="niveauDetail" 
                        value="detaille" 
                        checked={optionsPersonnalisation.niveauDetail === 'detaille'} 
                        onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, niveauDetail: 'detaille'})}
                      />
                      <span>Détaillé</span>
                    </label>
                  </div>
                </div>
                
                <div className="option-group">
                  <h4>Options</h4>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={optionsPersonnalisation.inclureCommentairesInternes} 
                      onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, inclureCommentairesInternes: !optionsPersonnalisation.inclureCommentairesInternes})}
                    />
                    <span>Inclure commentaires internes</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={optionsPersonnalisation.inclureLogo} 
                      onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, inclureLogo: !optionsPersonnalisation.inclureLogo})}
                    />
                    <span>Inclure logo</span>
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox" 
                      checked={optionsPersonnalisation.inclureCoordonnees} 
                      onChange={() => setOptionsPersonnalisation({...optionsPersonnalisation, inclureCoordonnees: !optionsPersonnalisation.inclureCoordonnees})}
                    />
                    <span>Inclure coordonnées du bureau</span>
                  </label>
                </div>
              </div>
              
              <div className="section-title">
                <h3>Mode de diffusion</h3>
              </div>
              
              <div className="diffusion-options">
                <div className="radio-group">
                  <label className={modeDiffusion === 'pdf' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="modeDiffusion" 
                      value="pdf" 
                      checked={modeDiffusion === 'pdf'} 
                      onChange={() => setModeDiffusion('pdf')}
                    />
                    <span>PDF sécurisé</span>
                  </label>
                  
                  <label className={modeDiffusion === 'email' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="modeDiffusion" 
                      value="email" 
                      checked={modeDiffusion === 'email'} 
                      onChange={() => setModeDiffusion('email')}
                    />
                    <span>Email</span>
                  </label>
                  
                  <label className={modeDiffusion === 'imprimer' ? 'selected' : ''}>
                    <input 
                      type="radio" 
                      name="modeDiffusion" 
                      value="imprimer" 
                      checked={modeDiffusion === 'imprimer'} 
                      onChange={() => setModeDiffusion('imprimer')}
                    />
                    <span>Version imprimable</span>
                  </label>
                </div>
                
                {modeDiffusion === 'email' && (
                  <div className="option-group">
                    <h4>Fréquence d'envoi</h4>
                    
                    <div className="radio-group">
                      <label className={frequenceEnvoi === 'sur_demande' ? 'selected' : ''}>
                        <input 
                          type="radio" 
                          name="frequenceEnvoi" 
                          value="sur_demande" 
                          checked={frequenceEnvoi === 'sur_demande'} 
                          onChange={() => setFrequenceEnvoi('sur_demande')}
                        />
                        <span>Sur demande</span>
                      </label>
                      
                      <label className={frequenceEnvoi === 'hebdomadaire' ? 'selected' : ''}>
                        <input 
                          type="radio" 
                          name="frequenceEnvoi" 
                          value="hebdomadaire" 
                          checked={frequenceEnvoi === 'hebdomadaire'} 
                          onChange={() => setFrequenceEnvoi('hebdomadaire')}
                        />
                        <span>Hebdomadaire</span>
                      </label>
                      
                      <label className={frequenceEnvoi === 'mensuel' ? 'selected' : ''}>
                        <input 
                          type="radio" 
                          name="frequenceEnvoi" 
                          value="mensuel" 
                          checked={frequenceEnvoi === 'mensuel'} 
                          onChange={() => setFrequenceEnvoi('mensuel')}
                        />
                        <span>Mensuel</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="rapport-actions">
                <button 
                  className="btn-primary" 
                  onClick={genererRapport}
                  disabled={loading}
                >
                  {loading ? 'Génération en cours...' : 'Générer le rapport'}
                </button>
                
                {rapportGenere && (
                  <>
                    {modeDiffusion === 'pdf' && (
                      <button 
                        className="btn-secondary" 
                        onClick={telechargerRapportPDF}
                        disabled={loading}
                      >
                        <i className="fas fa-download"></i> Télécharger PDF
                      </button>
                    )}
                    
                    {modeDiffusion === 'email' && (
                      <button 
                        className="btn-secondary" 
                        onClick={envoyerRapportEmail}
                        disabled={loading}
                      >
                        <i className="fas fa-envelope"></i> Envoyer par email
                      </button>
                    )}
                    
                    {modeDiffusion === 'imprimer' && (
                      <button 
                        className="btn-secondary" 
                        onClick={imprimerRapport}
                        disabled={loading}
                      >
                        <i className="fas fa-print"></i> Imprimer
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="rapports-preview">
          {!clientSelectionne ? (
            <div className="no-selection">
              <div className="no-selection-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>Aucun client sélectionné</h3>
              <p>Veuillez sélectionner un client dans la liste pour générer un rapport.</p>
            </div>
          ) : !apercu ? (
            <div className="no-preview">
              <div className="no-preview-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Aperçu non disponible</h3>
              <p>Cliquez sur "Générer le rapport" pour voir l'aperçu.</p>
            </div>
          ) : (
            renderApercu()
          )}
        </div>
      </div>
    </div>
  );
}

export default Rapports;
