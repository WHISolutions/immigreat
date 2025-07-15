import React, { useState } from 'react';
import '../styles/Dossiers.css';

function Dossiers() {
  const [dossiers, setDossiers] = useState([]);
  
  const [filtres, setFiltres] = useState({
    statut: '',
    type: '',
    conseillere: ''
  });
  
  const [nouveauDossier, setNouveauDossier] = useState({
    reference: '',
    client: '',
    type: '',
    statut: 'En cours',
    conseillere: '',
    progression: 0
  });
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dossierDetails, setDossierDetails] = useState(null);
  
  // Options pour les filtres et le formulaire
  const statutOptions = ['En cours', 'En attente', 'Complété', 'Refusé', 'Annulé'];
  const typeOptions = ['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Citoyenneté'];
  const conseilleresOptions = ['Marie Tremblay', 'Sophie Martin', 'Julie Lefebvre'];
  const clientsOptions = [];
  
  // Filtrer les dossiers
  const dossiersFiltres = dossiers.filter(dossier => {
    return (
      (filtres.statut === '' || dossier.statut === filtres.statut) &&
      (filtres.type === '' || dossier.type === filtres.type) &&
      (filtres.conseillere === '' || dossier.conseillere === filtres.conseillere)
    );
  });
  
  // Gérer les changements de filtres
  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    setFiltres({
      ...filtres,
      [name]: value
    });
  };
  
  // Réinitialiser les filtres
  const resetFiltres = () => {
    setFiltres({
      statut: '',
      type: '',
      conseillere: ''
    });
  };
  
  // Gérer les changements dans le formulaire de nouveau dossier
  const handleNouveauDossierChange = (e) => {
    const { name, value } = e.target;
    setNouveauDossier({
      ...nouveauDossier,
      [name]: value
    });
  };
  
  // Ajouter un nouveau dossier
  const ajouterDossier = (e) => {
    e.preventDefault();
    const newDossier = {
      id: dossiers.length + 1,
      ...nouveauDossier,
      dateCreation: new Date().toISOString().split('T')[0],
      dateMiseAJour: new Date().toISOString().split('T')[0]
    };
    
    setDossiers([...dossiers, newDossier]);
    setNouveauDossier({
      reference: '',
      client: '',
      type: '',
      statut: 'En cours',
      conseillere: '',
      progression: 0
    });
    setShowModal(false);
  };
  
  // Voir les détails d'un dossier
  const voirDetails = (dossier) => {
    setDossierDetails(dossier);
    setShowDetailsModal(true);
  };
  
  // Changer le statut d'un dossier
  const changerStatut = (id, nouveauStatut) => {
    const updatedDossiers = dossiers.map(dossier => {
      if (dossier.id === id) {
        return { 
          ...dossier, 
          statut: nouveauStatut,
          dateMiseAJour: new Date().toISOString().split('T')[0],
          progression: nouveauStatut === 'Complété' ? 100 : dossier.progression
        };
      }
      return dossier;
    });
    setDossiers(updatedDossiers);
  };
  
  // Mettre à jour la progression d'un dossier
  const updateProgression = (id, nouvelleProgression) => {
    const updatedDossiers = dossiers.map(dossier => {
      if (dossier.id === id) {
        return { 
          ...dossier, 
          progression: nouvelleProgression,
          dateMiseAJour: new Date().toISOString().split('T')[0],
          statut: nouvelleProgression === 100 ? 'Complété' : dossier.statut
        };
      }
      return dossier;
    });
    setDossiers(updatedDossiers);
  };
  
  // Générer une référence unique pour un nouveau dossier
  const genererReference = () => {
    const date = new Date();
    const annee = date.getFullYear();
    const nombreDossiers = dossiers.length + 1;
    const reference = `DOS-${annee}-${String(nombreDossiers).padStart(3, '0')}`;
    setNouveauDossier({
      ...nouveauDossier,
      reference: reference
    });
  };
  
  return (
    <div className="dossiers-container">
      <div className="dossiers-header">
        <h2>Gestion des Dossiers</h2>
        <button className="btn-primary" onClick={() => {
          genererReference();
          setShowModal(true);
        }}>
          <span>+</span> Nouveau Dossier
        </button>
      </div>
      
      <div className="filtres-container">
        <div className="filtre-group">
          <label>Statut:</label>
          <select 
            name="statut" 
            value={filtres.statut} 
            onChange={handleFiltreChange}
          >
            <option value="">Tous</option>
            {statutOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-group">
          <label>Type:</label>
          <select 
            name="type" 
            value={filtres.type} 
            onChange={handleFiltreChange}
          >
            <option value="">Tous</option>
            {typeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-group">
          <label>Conseillère:</label>
          <select 
            name="conseillere" 
            value={filtres.conseillere} 
            onChange={handleFiltreChange}
          >
            <option value="">Toutes</option>
            {conseilleresOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button className="btn-secondary" onClick={resetFiltres}>
          Réinitialiser
        </button>
      </div>
      
      <div className="dossiers-table-container">
        <table className="dossiers-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Date création</th>
              <th>Dernière MAJ</th>
              <th>Conseillère</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiersFiltres.map(dossier => (
              <tr key={dossier.id}>
                <td>{dossier.reference}</td>
                <td>{dossier.client}</td>
                <td>{dossier.type}</td>
                <td>
                  <span className={`statut-badge statut-${dossier.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                    {dossier.statut}
                  </span>
                </td>
                <td>
                  <div className="progression-bar-container">
                    <div 
                      className="progression-bar" 
                      style={{width: `${dossier.progression}%`}}
                    ></div>
                    <span className="progression-text">{dossier.progression}%</span>
                  </div>
                </td>
                <td>{dossier.dateCreation}</td>
                <td>{dossier.dateMiseAJour}</td>
                <td>{dossier.conseillere}</td>
                <td>
                  <div className="actions-dropdown">
                    <button className="btn-action">Actions</button>
                    <div className="dropdown-content">
                      <button onClick={() => voirDetails(dossier)}>Voir détails</button>
                      <button onClick={() => changerStatut(dossier.id, 'En cours')}>Marquer en cours</button>
                      <button onClick={() => changerStatut(dossier.id, 'En attente')}>Marquer en attente</button>
                      <button onClick={() => changerStatut(dossier.id, 'Complété')}>Marquer complété</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ajouter un nouveau dossier</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={ajouterDossier}>
              <div className="form-row">
                <div className="form-group">
                  <label>Référence:</label>
                  <input 
                    type="text" 
                    name="reference" 
                    value={nouveauDossier.reference} 
                    onChange={handleNouveauDossierChange} 
                    required 
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Client:</label>
                  <select 
                    name="client" 
                    value={nouveauDossier.client} 
                    onChange={handleNouveauDossierChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {clientsOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type:</label>
                  <select 
                    name="type" 
                    value={nouveauDossier.type} 
                    onChange={handleNouveauDossierChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {typeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    value={nouveauDossier.conseillere} 
                    onChange={handleNouveauDossierChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {conseilleresOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Statut initial:</label>
                  <select 
                    name="statut" 
                    value={nouveauDossier.statut} 
                    onChange={handleNouveauDossierChange}
                  >
                    {statutOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Progression initiale (%):</label>
                  <input 
                    type="number" 
                    name="progression" 
                    value={nouveauDossier.progression} 
                    onChange={handleNouveauDossierChange} 
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && dossierDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails du dossier</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="dossier-details">
              <div className="dossier-info">
                <h4>Informations générales</h4>
                <p><strong>Référence:</strong> {dossierDetails.reference}</p>
                <p><strong>Client:</strong> {dossierDetails.client}</p>
                <p><strong>Type:</strong> {dossierDetails.type}</p>
                <p><strong>Statut:</strong> 
                  <span className={`statut-badge statut-${dossierDetails.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                    {dossierDetails.statut}
                  </span>
                </p>
                <p><strong>Date de création:</strong> {dossierDetails.dateCreation}</p>
                <p><strong>Dernière mise à jour:</strong> {dossierDetails.dateMiseAJour}</p>
                <p><strong>Conseillère assignée:</strong> {dossierDetails.conseillere}</p>
                
                <h4>Progression</h4>
                <div className="progression-bar-container large">
                  <div 
                    className="progression-bar" 
                    style={{width: `${dossierDetails.progression}%`}}
                  ></div>
                  <span className="progression-text">{dossierDetails.progression}%</span>
                </div>
                
                <div className="progression-update">
                  <label>Mettre à jour la progression:</label>
                  <div className="progression-slider">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={dossierDetails.progression} 
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setDossierDetails({...dossierDetails, progression: newValue});
                      }}
                    />
                    <span>{dossierDetails.progression}%</span>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      updateProgression(dossierDetails.id, dossierDetails.progression);
                      setShowDetailsModal(false);
                    }}
                  >
                    Enregistrer la progression
                  </button>
                </div>
              </div>
              
              <div className="dossier-actions">
                <h4>Actions rapides</h4>
                <button className="btn-secondary" onClick={() => {
                  changerStatut(dossierDetails.id, 'En cours');
                  setDossierDetails({...dossierDetails, statut: 'En cours'});
                }}>
                  Marquer en cours
                </button>
                <button className="btn-secondary" onClick={() => {
                  changerStatut(dossierDetails.id, 'En attente');
                  setDossierDetails({...dossierDetails, statut: 'En attente'});
                }}>
                  Marquer en attente
                </button>
                <button className="btn-secondary" onClick={() => {
                  changerStatut(dossierDetails.id, 'Complété');
                  setDossierDetails({...dossierDetails, statut: 'Complété', progression: 100});
                }}>
                  Marquer complété
                </button>
                <button className="btn-secondary" onClick={() => {
                  changerStatut(dossierDetails.id, 'Refusé');
                  setDossierDetails({...dossierDetails, statut: 'Refusé'});
                }}>
                  Marquer refusé
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dossiers;
