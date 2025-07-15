import React, { useState, useEffect } from 'react';
import '../styles/LeadPermissions.css';

function LeadPermissions({ userRole = 'conseillere' }) {
  // État pour les leads
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  
  // État pour les filtres
  const [filters, setFilters] = useState({
    conseillere: '',
    statut: '',
    source: ''
  });
  
  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour les modales
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // État pour le lead sélectionné (vue détaillée)
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Données simulées pour les leads
  const mockLeads = [
    {
      id: 1,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@example.com',
      telephone: '+1 514-555-1234',
      source: 'Site web',
      statut: 'Nouveau',
      dateCreation: '2025-05-15',
      conseillere: 'Marie Tremblay',
      interet: 'Permis d\'études',
      notes: 'Intéressé par les universités de Montréal'
    },
    {
      id: 2,
      nom: 'Smith',
      prenom: 'John',
      email: 'john.smith@example.com',
      telephone: '+1 438-555-5678',
      source: 'LinkedIn',
      statut: 'Contacté',
      dateCreation: '2025-05-16',
      conseillere: 'Sophie Martin',
      interet: 'Résidence permanente',
      notes: 'A déjà un permis de travail'
    },
    {
      id: 3,
      nom: 'Garcia',
      prenom: 'Maria',
      email: 'maria.garcia@example.com',
      telephone: '+1 450-555-9012',
      source: 'Facebook',
      statut: 'Rendez-vous pris',
      dateCreation: '2025-05-17',
      conseillere: 'Marie Tremblay',
      interet: 'Visa visiteur',
      notes: 'Souhaite visiter sa famille'
    },
    {
      id: 4,
      nom: 'Wang',
      prenom: 'Li',
      email: 'li.wang@example.com',
      telephone: '+1 514-555-3456',
      source: 'Référence',
      statut: 'Consultation effectuée',
      dateCreation: '2025-05-18',
      conseillere: 'Sophie Martin',
      interet: 'Permis de travail',
      notes: 'A une offre d\'emploi'
    },
    {
      id: 5,
      nom: 'Morin',
      prenom: 'Isabelle',
      email: 'isabelle.morin@example.com',
      telephone: '+1 438-555-7890',
      source: 'Site web',
      statut: 'Qualifié',
      dateCreation: '2025-05-19',
      conseillere: 'Marie Tremblay',
      interet: 'Résidence permanente',
      notes: 'Entrée express'
    },
    {
      id: 6,
      nom: 'Traoré',
      prenom: 'Amadou',
      email: 'amadou.traore@example.com',
      telephone: '+1 514-555-2468',
      source: 'Site web',
      statut: 'Nouveau',
      dateCreation: '2025-05-20',
      conseillere: '',
      interet: 'Permis d\'études',
      notes: 'À assigner à une conseillère'
    }
  ];
  
  // Options pour les filtres et le formulaire
  const statutOptions = ['Nouveau', 'Contacté', 'À recontacter', 'Rendez-vous pris', 'Consultation effectuée', 'Qualifié', 'Non qualifié', 'Pas intéressé'];
  const sourceOptions = ['Site web', 'LinkedIn', 'Facebook', 'Référence', 'Autre'];
  const conseilleresOptions = ['Marie Tremblay', 'Sophie Martin', 'Julie Lefebvre'];
  
  // Charger les données simulées au chargement du composant
  useEffect(() => {
    setLeads(mockLeads);
  }, []);
  
  // Filtrer les leads selon le rôle de l'utilisateur et les filtres appliqués
  useEffect(() => {
    let roleFiltered = [];
    
    // Filtrage par rôle (permissions spécifiques)
    if (userRole === 'administrateur' || userRole === 'directeur') {
      // Accès à tous les leads
      roleFiltered = [...leads];
    } else if (userRole === 'conseillere') {
      // Accès uniquement à ses propres leads
      roleFiltered = leads.filter(lead => lead.conseillere === 'Marie Tremblay'); // Simuler la conseillère connectée
    } else if (userRole === 'secretaire') {
      // Accès à tous les leads
      roleFiltered = [...leads];
    } else {
      roleFiltered = [...leads];
    }
    
    // Appliquer les filtres
    const filtered = roleFiltered.filter(lead => {
      const conseilleresMatch = filters.conseillere === '' || lead.conseillere === filters.conseillere;
      const statutMatch = filters.statut === '' || lead.statut === filters.statut;
      const sourceMatch = filters.source === '' || lead.source === filters.source;
      
      // Appliquer la recherche
      const searchMatch = searchTerm === '' || 
        `${lead.prenom} ${lead.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telephone.includes(searchTerm);
      
      return conseilleresMatch && statutMatch && sourceMatch && searchMatch;
    });
    
    setFilteredLeads(filtered);
  }, [leads, filters, searchTerm, userRole]);
  
  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      conseillere: '',
      statut: '',
      source: ''
    });
    setSearchTerm('');
  };
  
  // Ouvrir la vue détaillée d'un lead
  const openLeadDetail = (lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };
  
  // Mettre à jour un lead
  const updateLead = (e) => {
    e.preventDefault();
    
    // Vérifier les permissions selon le rôle
    if (userRole === 'conseillere' && selectedLead.conseillere !== 'Marie Tremblay') {
      alert('Vous ne pouvez modifier que vos propres leads.');
      return;
    }
    
    const updatedLeads = leads.map(lead => {
      if (lead.id === selectedLead.id) {
        return selectedLead;
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setShowDetailModal(false);
  };
  
  // Gérer les changements dans le formulaire de détail
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setSelectedLead({
      ...selectedLead,
      [name]: value
    });
  };
  
  // Supprimer un lead (admin et directeur uniquement)
  const deleteLead = (id) => {
    if (userRole === 'administrateur' || userRole === 'directeur') {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
        const updatedLeads = leads.filter(lead => lead.id !== id);
        setLeads(updatedLeads);
      }
    } else {
      alert('Vous n\'avez pas les permissions nécessaires pour supprimer un lead.');
    }
  };
  
  // Ouvrir le modal d'assignation
  const openAssignModal = (id) => {
    // Vérifier les permissions selon le rôle
    if (userRole === 'administrateur' || userRole === 'directeur' || userRole === 'secretaire') {
      setSelectedLeads([id]);
      setShowAssignModal(true);
    } else {
      alert('Vous n\'avez pas les permissions nécessaires pour assigner un lead.');
    }
  };
  
  // Assigner un lead à une conseillère
  const assignLead = (e) => {
    e.preventDefault();
    const conseillere = e.target.conseillere.value;
    
    if (!conseillere) {
      alert('Veuillez sélectionner une conseillère.');
      return;
    }
    
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        return { ...lead, conseillere };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setShowAssignModal(false);
  };
  
  // Ouvrir le modal d'import Excel (admin et directeur uniquement)
  const openImportModal = () => {
    if (userRole === 'administrateur' || userRole === 'directeur') {
      setShowImportModal(true);
    } else {
      alert('Vous n\'avez pas les permissions nécessaires pour importer des leads.');
    }
  };
  
  // Importer des leads depuis Excel (simulé)
  const importLeads = (e) => {
    e.preventDefault();
    
    // Simuler l'import de leads
    const file = e.target.file.files[0];
    const source = e.target.source.value;
    
    if (!file) {
      alert('Veuillez sélectionner un fichier Excel.');
      return;
    }
    
    if (!source) {
      alert('Veuillez sélectionner une source.');
      return;
    }
    
    // Distribution aux conseillères (simulée)
    const distribution = {};
    conseilleresOptions.forEach(conseillere => {
      const inputElement = document.getElementById(`distribution-${conseillere.replace(/\s+/g, '-')}`);
      if (inputElement) {
        distribution[conseillere] = parseInt(inputElement.value) || 0;
      }
    });
    
    // Simuler l'ajout de nouveaux leads
    const newLeads = [
      {
        id: leads.length + 1,
        nom: 'Import1',
        prenom: 'Lead',
        email: 'lead.import1@example.com',
        telephone: '+1 514-555-1111',
        source,
        statut: 'Nouveau',
        dateCreation: new Date().toISOString().split('T')[0],
        conseillere: 'Marie Tremblay',
        interet: 'Permis d\'études',
        notes: 'Lead importé via Excel'
      },
      {
        id: leads.length + 2,
        nom: 'Import2',
        prenom: 'Lead',
        email: 'lead.import2@example.com',
        telephone: '+1 514-555-2222',
        source,
        statut: 'Nouveau',
        dateCreation: new Date().toISOString().split('T')[0],
        conseillere: 'Sophie Martin',
        interet: 'Résidence permanente',
        notes: 'Lead importé via Excel'
      }
    ];
    
    setLeads([...leads, ...newLeads]);
    setShowImportModal(false);
    
    alert(`Import réussi! ${newLeads.length} leads ont été ajoutés et distribués selon vos préférences.`);
  };
  
  // Ajouter un nouveau lead
  const addNewLead = () => {
    // Tous les rôles peuvent ajouter des leads manuellement
    // Mais les conseillères ne peuvent ajouter que pour elles-mêmes
    const defaultConseillere = userRole === 'conseillere' ? 'Marie Tremblay' : '';
    
    const newLead = {
      id: leads.length + 1,
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      source: 'Site web',
      statut: 'Nouveau',
      dateCreation: new Date().toISOString().split('T')[0],
      conseillere: defaultConseillere,
      interet: '',
      notes: ''
    };
    
    setSelectedLead(newLead);
    setShowDetailModal(true);
  };
  
  // Fonction pour obtenir l'icône correspondant au statut
  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'Nouveau':
        return 'fa-star';
      case 'Contacté':
        return 'fa-phone';
      case 'À recontacter':
        return 'fa-phone-slash';
      case 'Rendez-vous pris':
        return 'fa-calendar-check';
      case 'Consultation effectuée':
        return 'fa-clipboard-check';
      case 'Qualifié':
        return 'fa-user-check';
      case 'Non qualifié':
        return 'fa-user-times';
      case 'Pas intéressé':
        return 'fa-times-circle';
      default:
        return 'fa-circle';
    }
  };
  
  return (
    <div className="lead-permissions-container">
      <div className="permissions-header">
        <h2>Gestion des Leads</h2>
        <div className="permissions-actions">
          <button className="btn btn-primary" onClick={addNewLead}>
            <i className="fas fa-plus"></i> Nouveau Lead
          </button>
          
          {/* Import Excel (admin et directeur uniquement) */}
          {(userRole === 'administrateur' || userRole === 'directeur') && (
            <button className="btn btn-secondary" onClick={openImportModal}>
              <i className="fas fa-file-excel"></i> Importer Excel
            </button>
          )}
        </div>
      </div>
      
      <div className="search-filter-container">
        <div className="search-container">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher par nom, email ou téléphone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters-container">
          {/* Filtre par conseillère (admin et directeur uniquement) */}
          {(userRole === 'administrateur' || userRole === 'directeur') && (
            <div className="filter-group">
              <label>Conseillère:</label>
              <select 
                name="conseillere" 
                value={filters.conseillere} 
                onChange={handleFilterChange}
              >
                <option value="">Toutes</option>
                {conseilleresOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="filter-group">
            <label>Statut:</label>
            <select 
              name="statut" 
              value={filters.statut} 
              onChange={handleFilterChange}
            >
              <option value="">Tous</option>
              {statutOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Source:</label>
            <select 
              name="source" 
              value={filters.source} 
              onChange={handleFilterChange}
            >
              <option value="">Toutes</option>
              {sourceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <button className="btn-text" onClick={resetFilters}>
            <i className="fas fa-times"></i> Réinitialiser
          </button>
        </div>
      </div>
      
      <div className="leads-table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Source</th>
              <th>Statut</th>
              <th>Date création</th>
              <th>Conseillère</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map(lead => (
                <tr key={lead.id}>
                  <td className="clickable" onClick={() => openLeadDetail(lead)}>
                    {lead.prenom} {lead.nom}
                  </td>
                  <td>{lead.email}</td>
                  <td>{lead.telephone}</td>
                  <td>{lead.source}</td>
                  <td>
                    <span className={`status-badge status-${lead.statut.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e')}`}>
                      <i className={`fas ${getStatusIcon(lead.statut)}`}></i>
                      {lead.statut}
                    </span>
                  </td>
                  <td>{lead.dateCreation}</td>
                  <td>
                    {lead.conseillere || (
                      <button 
                        className="btn-assign"
                        onClick={() => openAssignModal(lead.id)}
                        disabled={userRole === 'conseillere'}
                      >
                        <i className="fas fa-user-plus"></i> Assigner
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="actions-dropdown">
                      <button className="btn-action">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <div className="dropdown-content">
                        <button onClick={() => openLeadDetail(lead)}>
                          <i className="fas fa-eye"></i> Voir détails
                        </button>
                        
                        {/* Réassigner (admin uniquement) */}
                        {userRole === 'administrateur' && lead.conseillere && (
                          <button onClick={() => openAssignModal(lead.id)}>
                            <i className="fas fa-exchange-alt"></i> Réassigner
                          </button>
                        )}
                        
                        {/* Assigner (secrétaire, admin, directeur) */}
                        {(userRole === 'secretaire' || userRole === 'administrateur' || userRole === 'directeur') && !lead.conseillere && (
                          <button onClick={() => openAssignModal(lead.id)}>
                            <i className="fas fa-user-plus"></i> Assigner
                          </button>
                        )}
                        
                        {/* Modifier statut (tous les rôles, mais conseillères uniquement pour leurs leads) */}
                        {(userRole !== 'conseillere' || (userRole === 'conseillere' && lead.conseillere === 'Marie Tremblay')) && (
                          <button onClick={() => openLeadDetail(lead)}>
                            <i className="fas fa-edit"></i> Modifier statut
                          </button>
                        )}
                        
                        {/* Supprimer (admin et directeur uniquement) */}
                        {(userRole === 'administrateur' || userRole === 'directeur') && (
                          <button className="btn-danger" onClick={() => deleteLead(lead.id)}>
                            <i className="fas fa-trash"></i> Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">Aucun lead ne correspond aux critères de recherche</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal pour assigner un lead à une conseillère */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assigner le lead à une conseillère</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={assignLead}>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    required
                  >
                    <option value="">Sélectionner</option>
                    {conseilleresOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal pour importer des leads depuis Excel */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Importer des leads depuis Excel</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
            </div>
            <form onSubmit={importLeads}>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Fichier Excel:</label>
                  <input 
                    type="file" 
                    name="file" 
                    accept=".xlsx, .xls, .csv" 
                    required 
                  />
                  <p className="form-help">Formats acceptés: .xlsx, .xls, .csv</p>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Source:</label>
                  <select 
                    name="source" 
                    required
                  >
                    <option value="">Sélectionner</option>
                    {sourceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Distribution des leads:</label>
                  <div className="distribution-container">
                    {conseilleresOptions.map(conseillere => (
                      <div key={conseillere} className="distribution-item">
                        <label>{conseillere}:</label>
                        <input 
                          type="number" 
                          id={`distribution-${conseillere.replace(/\s+/g, '-')}`}
                          min="0" 
                          placeholder="Nombre de leads" 
                        />
                      </div>
                    ))}
                    <div className="distribution-item">
                      <label>Secrétaire:</label>
                      <input 
                        type="number" 
                        id="distribution-secretaire"
                        min="0" 
                        placeholder="Nombre de leads" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowImportModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Importer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal pour la vue détaillée d'un lead */}
      {showDetailModal && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>
                {selectedLead.id ? 
                  `Détails du lead: ${selectedLead.prenom} ${selectedLead.nom}` : 
                  'Nouveau lead'
                }
              </h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <form onSubmit={updateLead}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom:</label>
                  <input 
                    type="text" 
                    name="nom" 
                    value={selectedLead.nom} 
                    onChange={handleDetailChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Prénom:</label>
                  <input 
                    type="text" 
                    name="prenom" 
                    value={selectedLead.prenom} 
                    onChange={handleDetailChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email:</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={selectedLead.email} 
                    onChange={handleDetailChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input 
                    type="tel" 
                    name="telephone" 
                    value={selectedLead.telephone} 
                    onChange={handleDetailChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Source:</label>
                  <select 
                    name="source" 
                    value={selectedLead.source} 
                    onChange={handleDetailChange}
                  >
                    {sourceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut:</label>
                  <select 
                    name="statut" 
                    value={selectedLead.statut} 
                    onChange={handleDetailChange}
                  >
                    {statutOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Intérêt principal:</label>
                  <input 
                    type="text" 
                    name="interet" 
                    value={selectedLead.interet} 
                    onChange={handleDetailChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    value={selectedLead.conseillere} 
                    onChange={handleDetailChange}
                    disabled={userRole === 'conseillere'} // Les conseillères ne peuvent pas changer l'assignation
                  >
                    <option value="">À assigner</option>
                    {conseilleresOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Notes:</label>
                  <textarea 
                    name="notes" 
                    value={selectedLead.notes} 
                    onChange={handleDetailChange}
                    rows="5"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {selectedLead.id ? 'Enregistrer les modifications' : 'Ajouter le lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadPermissions;
