import React, { useState, useEffect } from 'react';
import '../styles/LeadWorkflow.css';

function LeadWorkflow({ userRole = 'conseillere' }) {
  // États pour les différentes étapes du workflow
  const [leads, setLeads] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('tous');
  
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
      conseillere: '',
      interet: 'Permis d\'études',
      notes: 'Intéressé par les universités de Montréal',
      derniereAction: null,
      prochaineAction: null
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
      conseillere: 'Marie Tremblay',
      interet: 'Résidence permanente',
      notes: 'A déjà un permis de travail',
      derniereAction: '2025-05-18',
      prochaineAction: '2025-05-25'
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
      notes: 'Souhaite visiter sa famille',
      derniereAction: '2025-05-19',
      prochaineAction: '2025-05-21'
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
      notes: 'A une offre d\'emploi',
      derniereAction: '2025-05-20',
      prochaineAction: null
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
      notes: 'Entrée express',
      derniereAction: '2025-05-20',
      prochaineAction: '2025-05-27'
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
      notes: 'À assigner à une conseillère',
      derniereAction: null,
      prochaineAction: null
    },
    {
      id: 7,
      nom: 'Patel',
      prenom: 'Raj',
      email: 'raj.patel@example.com',
      telephone: '+1 514-555-1357',
      source: 'Référence',
      statut: 'Consultation manquée',
      dateCreation: '2025-05-17',
      conseillere: 'Sophie Martin',
      interet: 'Permis de travail',
      notes: 'N\'est pas venu au rendez-vous',
      derniereAction: '2025-05-20',
      prochaineAction: null
    }
  ];
  
  // Données simulées pour les notifications
  const mockNotifications = [
    {
      id: 1,
      type: 'nouveau_lead',
      message: 'Nouveau lead créé: Amadou Traoré',
      date: '2025-05-20',
      lu: false
    },

    {
      id: 3,
      type: 'rappel_rdv',
      message: 'Rappel: Rendez-vous demain avec Maria Garcia',
      date: '2025-05-20',
      lu: false
    },
    {
      id: 4,
      type: 'consultation_manquee',
      message: 'Consultation manquée: Raj Patel',
      date: '2025-05-20',
      lu: false
    }
  ];
  
  // Options pour les filtres et formulaires
  const statutOptions = [
    'Nouveau', 
    'Contacté', 
    'À recontacter', 
    'Rendez-vous pris', 
    'Consultation effectuée', 
    'Consultation manquée',
    'Qualifié', 
    'Non qualifié',
    'Pas intéressé',
    'Client'
  ];
  
  const conseilleresOptions = ['Marie Tremblay', 'Sophie Martin', 'Julie Lefebvre'];
  
  // Charger les données simulées au chargement du composant
  useEffect(() => {
    setLeads(mockLeads);
    setNotifications(mockNotifications);
  }, []);
  
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
      case 'Consultation manquée':
        return 'fa-calendar-times';
      case 'Qualifié':
        return 'fa-user-check';
      case 'Non qualifié':
        return 'fa-user-times';
      case 'Pas intéressé':
        return 'fa-times-circle';
      case 'Client':
        return 'fa-user-tie';
      default:
        return 'fa-circle';
    }
  };
  
  // Fonction pour obtenir la couleur correspondant au statut
  const getStatusClass = (statut) => {
    switch(statut) {
      case 'Nouveau':
        return 'status-nouveau';
      case 'Contacté':
        return 'status-contacte';
      case 'À recontacter':
        return 'status-a-recontacter';
      case 'Rendez-vous pris':
        return 'status-rendez-vous-pris';
      case 'Consultation effectuée':
        return 'status-consultation-effectuee';
      case 'Consultation manquée':
        return 'status-consultation-manquee';
      case 'Qualifié':
        return 'status-qualifie';
      case 'Non qualifié':
        return 'status-non-qualifie';
      case 'Pas intéressé':
        return 'status-pas-interesse';
      case 'Client':
        return 'status-client';
      default:
        return '';
    }
  };
  
  // Filtrer les leads selon le rôle et l'onglet actif
  const getFilteredLeads = () => {
    // Filtrer d'abord par rôle
    let roleFiltered = [];
    
    if (userRole === 'administrateur' || userRole === 'directeur') {
      // Accès à tous les leads
      roleFiltered = [...leads];
    } else if (userRole === 'conseillere') {
      // Accès uniquement à ses propres leads
      roleFiltered = leads.filter(lead => lead.conseillere === 'Marie Tremblay'); // Simuler la conseillère connectée
    } else if (userRole === 'secretaire') {
      // Accès à tous les leads non assignés ou à assigner
      roleFiltered = leads.filter(lead => lead.conseillere === '' || lead.conseillere === 'À assigner');
    } else {
      roleFiltered = [...leads];
    }
    
    // Ensuite, filtrer par onglet actif
    if (activeTab === 'tous') {
      return roleFiltered;
    } else if (activeTab === 'nouveaux') {
      return roleFiltered.filter(lead => lead.statut === 'Nouveau');
    } else if (activeTab === 'contactes') {
      return roleFiltered.filter(lead => lead.statut === 'Contacté' || lead.statut === 'À recontacter');
    } else if (activeTab === 'rendez-vous') {
      return roleFiltered.filter(lead => lead.statut === 'Rendez-vous pris');
    } else if (activeTab === 'consultations') {
      return roleFiltered.filter(lead => lead.statut === 'Consultation effectuée' || lead.statut === 'Consultation manquée');
    } else if (activeTab === 'qualifies') {
      return roleFiltered.filter(lead => lead.statut === 'Qualifié' || lead.statut === 'Non qualifié');
    } else if (activeTab === 'clients') {
      return roleFiltered.filter(lead => lead.statut === 'Client');
    } else {
      return roleFiltered;
    }
  };
  
  const filteredLeads = getFilteredLeads();
  
  // Gérer la sélection/désélection d'un lead
  const toggleLeadSelection = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };
  
  // Sélectionner/désélectionner tous les leads
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };
  
  // Ouvrir le modal d'assignation pour les leads sélectionnés
  const openAssignModal = () => {
    if (selectedLeads.length > 0) {
      setShowAssignModal(true);
    }
  };
  
  // Assigner les leads sélectionnés à une conseillère
  const assignLeads = (conseillere) => {
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        return { ...lead, conseillere, statut: lead.statut === 'Nouveau' ? 'Nouveau' : lead.statut };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setSelectedLeads([]);
    setShowAssignModal(false);
    
    // Simuler l'envoi de notifications
    const newNotifications = selectedLeads.map((leadId, index) => {
      const lead = leads.find(l => l.id === leadId);
      return {
        id: notifications.length + index + 1,
        type: 'lead_assigne',
        message: `Lead assigné à ${conseillere}: ${lead.prenom} ${lead.nom}`,
        date: new Date().toISOString().split('T')[0],
        lu: false
      };
    });
    
    setNotifications([...notifications, ...newNotifications]);
  };
  
  // Changer le statut des leads sélectionnés
  const changeLeadsStatus = (nouveauStatut) => {
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        return { 
          ...lead, 
          statut: nouveauStatut,
          derniereAction: new Date().toISOString().split('T')[0]
        };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setSelectedLeads([]);
    
    // Si le statut est "Rendez-vous pris", ouvrir le modal de rappel
    if (nouveauStatut === 'Rendez-vous pris') {
      setShowReminderModal(true);
    }
    
    // Si le statut est "Qualifié", ouvrir le modal de conversion
    if (nouveauStatut === 'Qualifié') {
      setShowConversionModal(true);
    }
  };
  
  // Convertir les leads sélectionnés en clients
  const convertToClients = () => {
    const updatedLeads = leads.map(lead => {
      if (selectedLeads.includes(lead.id)) {
        return { 
          ...lead, 
          statut: 'Client',
          derniereAction: new Date().toISOString().split('T')[0]
        };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setSelectedLeads([]);
    setShowConversionModal(false);
    
    // Simuler l'envoi de notifications
    const newNotifications = selectedLeads.map((leadId, index) => {
      const lead = leads.find(l => l.id === leadId);
      return {
        id: notifications.length + index + 1,
        type: 'lead_converti',
        message: `Lead converti en client: ${lead.prenom} ${lead.nom}`,
        date: new Date().toISOString().split('T')[0],
        lu: false
      };
    });
    
    setNotifications([...notifications, ...newNotifications]);
  };
  
  // Marquer une notification comme lue
  const markNotificationAsRead = (id) => {
    const updatedNotifications = notifications.map(notif => {
      if (notif.id === id) {
        return { ...notif, lu: true };
      }
      return notif;
    });
    
    setNotifications(updatedNotifications);
  };
  
  // Nombre de notifications non lues
  const unreadNotificationsCount = notifications.filter(notif => !notif.lu).length;
  
  return (
    <div className="lead-workflow-container">
      <div className="workflow-header">
        <h2>Processus de Gestion des Leads</h2>
        
        <div className="workflow-actions">
          <div className="notification-bell">
            <i className="fas fa-bell"></i>
            {unreadNotificationsCount > 0 && (
              <span className="notification-badge">{unreadNotificationsCount}</span>
            )}
            <div className="notification-dropdown">
              <h3>Notifications</h3>
              {notifications.length > 0 ? (
                <ul>
                  {notifications.map(notif => (
                    <li 
                      key={notif.id} 
                      className={notif.lu ? 'read' : 'unread'}
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <span className="notification-icon">
                        <i className={`fas ${
                          notif.type === 'nouveau_lead' ? 'fa-star' :
                          notif.type === 'lead_assigne' ? 'fa-user-plus' :
                          notif.type === 'rappel_rdv' ? 'fa-calendar-check' :
                          notif.type === 'consultation_manquee' ? 'fa-calendar-times' :
                          notif.type === 'lead_converti' ? 'fa-user-tie' :
                          'fa-bell'
                        }`}></i>
                      </span>
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span className="notification-date">{notif.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-notifications">Aucune notification</p>
              )}
            </div>
          </div>
          
          {(userRole === 'administrateur' || userRole === 'directeur' || userRole === 'secretaire') && selectedLeads.length > 0 && (
            <button className="btn-primary" onClick={openAssignModal}>
              <i className="fas fa-user-plus"></i> Assigner ({selectedLeads.length})
            </button>
          )}
          
          {selectedLeads.length > 0 && (
            <div className="status-actions-dropdown">
              <button className="btn-secondary">
                <i className="fas fa-exchange-alt"></i> Changer statut <i className="fas fa-caret-down"></i>
              </button>
              <div className="dropdown-content">
                {statutOptions.map(statut => (
                  <button key={statut} onClick={() => changeLeadsStatus(statut)}>
                    <i className={`fas ${getStatusIcon(statut)}`}></i> {statut}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="workflow-tabs">
        <button 
          className={activeTab === 'tous' ? 'active' : ''} 
          onClick={() => setActiveTab('tous')}
        >
          Tous
        </button>
        <button 
          className={activeTab === 'nouveaux' ? 'active' : ''} 
          onClick={() => setActiveTab('nouveaux')}
        >
          Nouveaux
        </button>
        <button 
          className={activeTab === 'contactes' ? 'active' : ''} 
          onClick={() => setActiveTab('contactes')}
        >
          Contactés
        </button>
        <button 
          className={activeTab === 'rendez-vous' ? 'active' : ''} 
          onClick={() => setActiveTab('rendez-vous')}
        >
          Rendez-vous
        </button>
        <button 
          className={activeTab === 'consultations' ? 'active' : ''} 
          onClick={() => setActiveTab('consultations')}
        >
          Consultations
        </button>
        <button 
          className={activeTab === 'qualifies' ? 'active' : ''} 
          onClick={() => setActiveTab('qualifies')}
        >
          Qualifiés
        </button>
        <button 
          className={activeTab === 'clients' ? 'active' : ''} 
          onClick={() => setActiveTab('clients')}
        >
          Clients
        </button>
      </div>
      
      <div className="workflow-table-container">
        <table className="workflow-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0} 
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Conseillère</th>
              <th>Dernière action</th>
              <th>Prochaine action</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedLeads.includes(lead.id)} 
                      onChange={() => toggleLeadSelection(lead.id)}
                    />
                  </td>
                  <td className="lead-name">
                    {lead.prenom} {lead.nom}
                  </td>
                  <td>{lead.email}</td>
                  <td>{lead.telephone}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(lead.statut)}`}>
                      <i className={`fas ${getStatusIcon(lead.statut)}`}></i>
                      {lead.statut}
                    </span>
                  </td>
                  <td>
                    {lead.conseillere || (
                      <span className="not-assigned">Non assigné</span>
                    )}
                  </td>
                  <td>
                    {lead.derniereAction || (
                      <span className="no-action">-</span>
                    )}
                  </td>
                  <td>
                    {lead.prochaineAction ? (
                      <span className={new Date(lead.prochaineAction) <= new Date() ? 'action-due' : ''}>
                        {lead.prochaineAction}
                      </span>
                    ) : (
                      <span className="no-action">-</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-dropdown">
                      <button className="btn-action">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <div className="dropdown-content">
                        {lead.statut === 'Nouveau' && (
                          <button onClick={() => changeLeadsStatus('Contacté')}>
                            <i className="fas fa-phone"></i> Marquer comme contacté
                          </button>
                        )}
                        
                        {(lead.statut === 'Nouveau' || lead.statut === 'Contacté') && (
                          <button onClick={() => changeLeadsStatus('À recontacter')}>
                            <i className="fas fa-phone-slash"></i> Planifier un rappel
                          </button>
                        )}
                        
                        {(lead.statut === 'Nouveau' || lead.statut === 'Contacté' || lead.statut === 'À recontacter') && (
                          <button onClick={() => changeLeadsStatus('Rendez-vous pris')}>
                            <i className="fas fa-calendar-plus"></i> Prendre rendez-vous
                          </button>
                        )}
                        
                        {lead.statut === 'Rendez-vous pris' && (
                          <>
                            <button onClick={() => changeLeadsStatus('Consultation effectuée')}>
                              <i className="fas fa-clipboard-check"></i> Consultation effectuée
                            </button>
                            <button onClick={() => changeLeadsStatus('Consultation manquée')}>
                              <i className="fas fa-calendar-times"></i> Consultation manquée
                            </button>
                          </>
                        )}
                        
                        {(lead.statut === 'Consultation effectuée' || lead.statut === 'Consultation manquée') && (
                          <>
                            <button onClick={() => changeLeadsStatus('Qualifié')}>
                              <i className="fas fa-user-check"></i> Qualifier
                            </button>
                            <button onClick={() => changeLeadsStatus('Non qualifié')}>
                              <i className="fas fa-user-times"></i> Non qualifié
                            </button>
                          </>
                        )}
                        
                        {lead.statut === 'Qualifié' && (
                          <button onClick={() => {
                            setSelectedLeads([lead.id]);
                            setShowConversionModal(true);
                          }}>
                            <i className="fas fa-user-tie"></i> Convertir en client
                          </button>
                        )}
                        
                        {(lead.statut === 'Nouveau' || lead.statut === 'Contacté' || lead.statut === 'À recontacter') && (
                          <button onClick={() => changeLeadsStatus('Pas intéressé')}>
                            <i className="fas fa-times-circle"></i> Pas intéressé
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-results">Aucun lead ne correspond aux critères sélectionnés</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modal pour assigner des leads */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assigner {selectedLeads.length} lead(s)</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Sélectionnez une conseillère pour assigner les leads sélectionnés:</p>
              <div className="assign-options">
                {conseilleresOptions.map(conseillere => (
                  <div key={conseillere} className="assign-option">
                    <button className="btn-assign" onClick={() => assignLeads(conseillere)}>
                      <i className="fas fa-user-plus"></i> {conseillere}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour le rappel de rendez-vous */}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rendez-vous planifié</h3>
              <button className="close-btn" onClick={() => setShowReminderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Le rendez-vous a été planifié avec succès.</p>
              <p>Un rappel sera envoyé automatiquement la veille du rendez-vous.</p>
              <div className="reminder-details">
                <div className="reminder-icon">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="reminder-text">
                  <p>N'oubliez pas d'envoyer un SMS de confirmation au client avec l'adresse et l'heure du rendez-vous.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowReminderModal(false)}>
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour la conversion en client */}
      {showConversionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Convertir en client</h3>
              <button className="close-btn" onClick={() => setShowConversionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Vous êtes sur le point de convertir {selectedLeads.length} lead(s) en client(s).</p>
              <p>Cette action sera effectuée après le paiement initial des frais.</p>
              <div className="conversion-details">
                <div className="conversion-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="conversion-text">
                  <p>Les leads seront automatiquement ajoutés à la liste des clients tout en restant visibles dans l'historique des leads.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowConversionModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={convertToClients}>
                Confirmer la conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadWorkflow;
