import React, { useState, useEffect } from 'react';
import '../styles/Clients.css';
import '../styles/TableSorting.css';
import { Link, useNavigate } from 'react-router-dom';
import FactureForm from './FactureForm';
import ContratForm from './ContratForm';
import ClientActions from './ClientActions';
import ClientDetailModal from './ClientDetailModal';
import clientsAPI from '../services/clientsAPI';
import { getConseillers } from '../services/usersAPI';
import { canCreateFacture, canModifyFacture, canCreateContrat } from '../utils/PermissionsClient';
import { connectSocket } from '../services/socket';

function Clients({ userRole = 'conseillere', onEditClient }) {
  const navigate = useNavigate();
  
  console.log('🎯 [CLIENTS DEBUG] Composant Clients initialisé avec userRole:', userRole);
  
  // États pour les clients et les filtres
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    procedure: '',
    statut: '',
    conseillere: ''
  });
  
  // États pour le tri
  const [sortField, setSortField] = useState('date_creation');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // États pour les modales de facture et contrat
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [showContratModal, setShowContratModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [selectedContrat, setSelectedContrat] = useState(null);
  
  // État pour gérer les dropdowns d'actions ouverts
  const [openDropdown, setOpenDropdown] = useState(null);

  // États pour l'assignation de clients
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    clientId: null,
    conseillere: ''
  });

  // Options pour les filtres
  const procedureOptions = ['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Investisseur', 'Regroupement familial'];
  const statutOptions = ['En cours', 'En attente', 'Terminé', 'Refusé'];
  
  // État pour les conseillères (dynamique)
  const [conseilleresOptions, setConseilleresOptions] = useState([]);
  
  // État pour stocker la liste complète des conseillers (objet avec id & nom)
  const [conseillersList, setConseillersList] = useState([]);
  
  // État pour stocker le nom de la conseillère connectée
  const [nomConseillerConnectee, setNomConseillerConnectee] = useState('');

  // Fonction de tri
  const handleSort = (field) => {
    if (sortField === field) {
      // Si on clique sur la même colonne, inverser l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si on clique sur une nouvelle colonne, définir le tri croissant par défaut
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Fonction pour trier les clients
  const getSortedClients = () => {
    const sortedClients = [...filteredClients].sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortField) {
        case 'nom':
          aValue = `${a.prenom} ${a.nom}`.toLowerCase();
          bValue = `${b.prenom} ${b.nom}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'telephone':
          aValue = a.telephone;
          bValue = b.telephone;
          break;
        case 'type_procedure':
          aValue = a.type_procedure.toLowerCase();
          bValue = b.type_procedure.toLowerCase();
          break;
        case 'date_creation':
          aValue = new Date(a.date_creation).getTime();
          bValue = new Date(b.date_creation).getTime();
          break;
        case 'statut':
          aValue = a.statut.toLowerCase();
          bValue = b.statut.toLowerCase();
          break;
        case 'conseillere':
          aValue = (a.conseillere || '').toLowerCase();
          bValue = (b.conseillere || '').toLowerCase();
          break;
        case 'numero_dossier':
          aValue = a.numero_dossier.toLowerCase();
          bValue = b.numero_dossier.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedClients;
  };

  // Fonction pour charger les clients depuis l'API
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des clients depuis l\'API...');
      
      const response = await clientsAPI.getAllClients();
      console.log('✅ Clients récupérés:', response);
      
      if (response.success && response.data && response.data.clients) {
        const clientsData = response.data.clients;
        console.log('📊 [CLIENTS DEBUG] Clients reçus du backend:', clientsData.length);
        console.log('🔍 [CLIENTS DEBUG] Premier client exemple:', clientsData[0]);
        console.log('� [CLIENTS DEBUG] Conseillères uniques dans les clients:', [...new Set(clientsData.map(c => c.conseillere))]);
        
        setClients(clientsData);
        setFilteredClients(clientsData);
        console.log(`📊 ${clientsData.length} clients chargés avec succès`);
      } else {
        console.log('⚠️ Aucun client trouvé ou format de réponse inattendu');
        setClients([]);
        setFilteredClients([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des clients:', error);
      setError('Erreur lors du chargement des clients. Vérifiez que le serveur backend est démarré.');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les conseillères depuis l'API
  const loadConseillers = async () => {
    // Les conseillères n'ont pas besoin de voir la liste des autres conseillères
    if (userRole === 'conseillere') {
      console.log('👤 Utilisateur conseillère - pas de chargement des autres conseillères');
      setConseilleresOptions([]);
      return;
    }

    try {
      console.log('🔄 Chargement des conseillères depuis l\'API...');
      const conseilleres = await getConseillers();
      console.log('✅ Conseillères récupérées:', conseilleres);
      
      if (Array.isArray(conseilleres)) {
        // Extraire seulement les noms complets pour le filtre
        const nomsConseillers = conseilleres.map(c => c.nomComplet);
        setConseilleresOptions(nomsConseillers);
        
        // Sauvegarder la liste complète pour l'assignation
        setConseillersList(conseilleres);
        
        console.log(`📊 ${nomsConseillers.length} conseillères ajoutées au filtre:`, nomsConseillers);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conseillères:', error);
      // En cas d'erreur, garder une liste vide
      setConseilleresOptions([]);
    }
  };

  // Charger les clients au chargement du composant
  useEffect(() => {
    loadClients();
    loadConseillers();
    
    // Configuration des événements Socket.IO pour les mises à jour temps réel
    const socket = connectSocket();
    
    socket.on('clientCreated', () => {
      console.log('🔔 Nouveau client créé - rechargement de la liste');
      loadClients();
    });
    
    socket.on('clientUpdated', () => {
      console.log('🔔 Client mis à jour - rechargement de la liste');
      loadClients();
    });
    
    socket.on('clientDeleted', () => {
      console.log('🔔 Client supprimé - rechargement de la liste');
      loadClients();
    });
    
    // Nettoyage des événements à la destruction du composant
    return () => {
      socket.off('clientCreated');
      socket.off('clientUpdated');
      socket.off('clientDeleted');
    };
  }, []);

  // Capturer le nom de la conseillère connectée depuis localStorage
  useEffect(() => {
    const userName = localStorage.getItem('userName');
    const userRoleStorage = localStorage.getItem('userRole');
    console.log('🔍 [CLIENTS DEBUG] localStorage userName:', userName);
    console.log('🔍 [CLIENTS DEBUG] localStorage userRole:', userRoleStorage);
    console.log('🔍 [CLIENTS DEBUG] Props userRole:', userRole);
    
    if (userName && userRole === 'conseillere') {
      setNomConseillerConnectee(userName);
      console.log('👤 Nom de la conseillère connectée capturé:', userName);
    } else {
      console.log('⚠️ [CLIENTS DEBUG] Condition non remplie pour capturer le nom conseillère');
      console.log('⚠️ [CLIENTS DEBUG] userName:', userName, 'userRole === conseillere:', userRole === 'conseillere');
    }
  }, [userRole]);

  // Filtrer les clients selon les critères de recherche et les filtres
  useEffect(() => {
    console.log('🔍 [CLIENTS DEBUG] Début du filtrage');
    console.log('📊 [CLIENTS DEBUG] Total clients:', clients.length);
    console.log('👤 [CLIENTS DEBUG] UserRole:', userRole);
    console.log('💾 [CLIENTS DEBUG] LocalStorage userName:', localStorage.getItem('userName'));
    
    const filtered = clients.filter(client => {
      // Appliquer la recherche
      const searchMatch = searchTerm === '' || 
        `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone.includes(searchTerm) ||
        client.numero_dossier.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Appliquer les filtres
      const procedureMatch = filters.procedure === '' || client.type_procedure === filters.procedure;
      const statutMatch = filters.statut === '' || client.statut === filters.statut;
      
      // Pour les conseillères, filtrer par leur nom depuis localStorage
      let conseilleresMatch = true;
      if (userRole === 'conseillere') {
        const userName = localStorage.getItem('userName');
        if (userName) {
          // MODE DEBUG TEMPORAIRE - afficher tous les clients pour diagnostiquer
          const DEBUG_MODE = true; // Changer à false une fois le problème résolu
          
          if (DEBUG_MODE) {
            console.log(`🐛 [DEBUG MODE ACTIF] Affichage de tous les clients pour la conseillère ${userName}`);
            conseilleresMatch = true; // Temporaire : afficher tous les clients
          } else {
            // Vérifier si le client a une conseillère assignée
            if (!client.conseillere || client.conseillere === '') {
              console.log(`⚠️ [CLIENTS DEBUG] Client ${client.prenom} ${client.nom} n'a pas de conseillère assignée`);
              conseilleresMatch = false; // Ne pas afficher les clients sans conseillère
            } else {
              // Comparaison plus flexible (insensible à la casse et aux espaces)
              const clientConseillere = client.conseillere.trim().toLowerCase();
              const userNameNormalized = userName.trim().toLowerCase();
              conseilleresMatch = clientConseillere === userNameNormalized || 
                                 clientConseillere.includes(userNameNormalized) ||
                                 userNameNormalized.includes(clientConseillere);
              console.log(`🔍 [CLIENTS DEBUG] Client ${client.prenom} ${client.nom}: conseillere="${client.conseillere}" vs userName="${userName}" => match=${conseilleresMatch}`);
            }
          }
        } else {
          console.log('⚠️ [CLIENTS DEBUG] Aucun userName trouvé dans localStorage');
          conseilleresMatch = false; // Si pas de userName, ne rien afficher
        }
      } else {
        conseilleresMatch = filters.conseillere === '' || client.conseillere === filters.conseillere;
      }
      
      const finalMatch = searchMatch && procedureMatch && statutMatch && conseilleresMatch;
      if (!finalMatch) {
        console.log(`❌ [CLIENTS DEBUG] Client ${client.prenom} ${client.nom} filtré: search=${searchMatch}, procedure=${procedureMatch}, statut=${statutMatch}, conseillere=${conseilleresMatch}`);
      }
      
      return finalMatch;
    });
    
    console.log('✅ [CLIENTS DEBUG] Clients filtrés:', filtered.length);
    setFilteredClients(filtered);
  }, [clients, searchTerm, filters, userRole]);

  // Gérer les changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Ouvrir le modal de facture
  const openFactureModal = (client) => {
    if (canCreateFacture(userRole)) {
      setSelectedClient(client);
      setSelectedFacture(null);
      setShowFactureModal(true);
    } else {
      alert('Vous n\'avez pas les droits nécessaires pour cette action.');
    }
  };
  
  // Ouvrir le modal de contrat
  const openContratModal = (client) => {
    if (canCreateContrat(userRole)) {
      setSelectedClient(client);
      setSelectedContrat(null);
      setShowContratModal(true);
    } else {
      alert('Vous n\'avez pas les droits nécessaires pour cette action.');
    }
  };

  // Fonction pour supprimer un client
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression du client ${clientId}...`);
      const response = await clientsAPI.deleteClient(clientId);
      
      if (response.success) {
        console.log('✅ Client supprimé avec succès');
        // Recharger la liste des clients
        await loadClients();
      } else {
        console.error('❌ Erreur lors de la suppression:', response.message);
        alert('Erreur lors de la suppression du client: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du client:', error);
      alert('Erreur lors de la suppression du client. Vérifiez que le serveur backend est démarré.');
    }
  };

  // Gérer l'affichage des détails d'un client
  const handleViewClient = (client) => {
    // Utiliser directement les données du client depuis la base de données
    // Les documents et notes réels sont déjà inclus via l'API
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  // Gérer la modification d'un client
  const handleEditClient = (client) => {
    // Sauvegarder les données du client dans localStorage pour les pré-remplir dans le formulaire
    localStorage.setItem('editingClient', JSON.stringify(client));
    
    // Naviguer vers le formulaire d'édition
    navigate(`/client/modifier/${client.id}`);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      procedure: '',
      statut: '',
      conseillere: ''
    });
    setSearchTerm('');
  };

  // Obtenir la classe CSS pour le statut
  const getStatusClass = (statut) => {
    switch(statut) {
      case 'En cours':
        return 'status-en-cours';
      case 'En attente':
        return 'status-en-attente';
      case 'Terminé':
        return 'status-termine';
      case 'Refusé':
        return 'status-refuse';
      default:
        return '';
    }
  };

  // Obtenir l'icône pour le statut
  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'En cours':
        return 'fa-spinner';
      case 'En attente':
        return 'fa-clock';
      case 'Terminé':
        return 'fa-check-circle';
      case 'Refusé':
        return 'fa-times-circle';
      default:
        return 'fa-circle';
    }
  };

  // Gérer l'ouverture/fermeture des dropdowns d'actions
  const toggleDropdown = (clientId) => {
    setOpenDropdown(openDropdown === clientId ? null : clientId);
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fonctions pour l'assignation de clients
  const openAssignModal = (id) => {
    setAssignData({
      clientId: id,
      conseillere: ''
    });
    setShowAssignModal(true);
  };

  // Assigner un client à une conseillère
  const assignClient = async (e) => {
    e.preventDefault();
    try {
      const selected = conseillersList.find(c => c.nomComplet === assignData.conseillere);
      if (!selected) {
        alert('Conseillère non trouvée');
        return;
      }

      // Vérifier si c'est une réassignation
      const currentClient = clients.find(c => c.id === assignData.clientId);
      const isReassignation = currentClient && currentClient.conseillere && currentClient.conseillere !== assignData.conseillere;

      console.log(`📋 ${isReassignation ? 'Réassignation' : 'Assignation'} du client ${assignData.clientId} à ${assignData.conseillere}`);

      const response = await fetch(`http://localhost:5000/api/clients/${assignData.clientId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conseiller_id: selected.id
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          // Mettre à jour l'état local
          const updatedClients = clients.map(client => {
            if (client.id === assignData.clientId) {
              return { ...client, conseillere: assignData.conseillere, conseiller_id: selected.id };
            }
            return client;
          });
          setClients(updatedClients);
          setFilteredClients(updatedClients);
          setShowAssignModal(false);
          
          const actionText = isReassignation ? 'Client réassigné avec succès' : 'Client assigné avec succès';
          const notificationText = isReassignation 
            ? 'La nouvelle conseillère a été notifiée de cette réassignation.' 
            : 'La conseillère a été notifiée de cette assignation.';
          
          alert(`✅ ${actionText}!\n📱 ${notificationText}`);
          console.log(`✅ ${actionText} - notification envoyée`);
          
          // Recharger les clients pour avoir les données à jour
          await loadClients();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'assignation');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      alert(`❌ Erreur lors de l'assignation: ${error.message}`);
    }
  };

  // Gérer les changements dans le formulaire d'assignation
  const handleAssignChange = (e) => {
    const { name, value } = e.target;
    setAssignData({
      ...assignData,
      [name]: value
    });
  };

  // Vérifier si l'utilisateur peut réassigner un client
  const canReassignClient = () => {
    return userRole === 'admin' || userRole === 'administrateur';
  };

  const sortedClients = getSortedClients();

  return (
    <div className="clients-container">
      {/* Affichage du chargement */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des clients...</p>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadClients} className="retry-button">
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu principal - affiché seulement si pas de chargement et pas d'erreur */}
      {!loading && !error && (
        <>
          <div className="clients-header">
            <div className="header-left">
              <Link to="/" className="btn btn-secondary btn-back">
                <i className="fas fa-home"></i> Accueil
              </Link>
              <h2>Gestion des Clients</h2>
            </div>
            <div className="header-right">
              {userRole !== 'secretaire' && (
                <Link to="/client/nouveau" className="btn btn-primary">
                  <i className="fas fa-plus"></i> Nouveau Client
                </Link>
              )}
            </div>
          </div>
      
      <div className="search-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', padding: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', minWidth: 300, height: 40, background: '#f8f9fa', borderRadius: 8, padding: '0 16px', marginRight: 16, marginBottom: 8 }}>
          <i className="fas fa-search" style={{ marginRight: 8, color: 'var(--text-secondary)' }}></i>
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, téléphone ou numéro de dossier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', height: 40, lineHeight: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Procédure:</label>
            <select 
              name="procedure" 
              value={filters.procedure} 
              onChange={handleFilterChange}
              style={{ padding: '8px 12px', border: '1px solid var(--color-neutral-medium)', borderRadius: 6, fontSize: '1rem', minWidth: 120, height: 40, boxSizing: 'border-box' }}
            >
              <option value="">Toutes</option>
              {procedureOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Statut:</label>
            <select 
              name="statut" 
              value={filters.statut} 
              onChange={handleFilterChange}
              style={{ padding: '8px 12px', border: '1px solid var(--color-neutral-medium)', borderRadius: 6, fontSize: '1rem', minWidth: 120, height: 40, boxSizing: 'border-box' }}
            >
              <option value="">Tous</option>
              {statutOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {userRole !== 'secretaire' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
              <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Conseillère:</label>
              <select 
                name="conseillere" 
                value={filters.conseillere} 
                onChange={handleFilterChange}
                disabled={userRole === 'conseillere'}
                style={{
                  backgroundColor: userRole === 'conseillere' ? '#f5f5f5' : 'white',
                  color: userRole === 'conseillere' ? '#999' : 'black',
                  cursor: userRole === 'conseillere' ? 'not-allowed' : 'pointer',
                  padding: '8px 12px',
                  border: '1px solid var(--color-neutral-medium)',
                  borderRadius: 6,
                  fontSize: '1rem',
                  minWidth: 120,
                  height: 40,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">
                  {userRole === 'conseillere' ? (nomConseillerConnectee || 'Mes clients') : 'Toutes'}
                </option>
                {userRole !== 'conseillere' && conseilleresOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn-text" onClick={resetFilters} style={{ height: 40, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 4, fontSize: '1rem', padding: '8px 12px', borderRadius: 6, marginLeft: 8, whiteSpace: 'nowrap' }}>
            <i className="fas fa-times"></i> Réinitialiser
          </button>
        </div>
      </div>
      
      <div className="clients-table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('numero_dossier')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                N° Dossier {getSortIcon('numero_dossier')}
              </th>
              <th 
                onClick={() => handleSort('nom')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Nom complet {getSortIcon('nom')}
              </th>
              <th 
                onClick={() => handleSort('email')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Email {getSortIcon('email')}
              </th>
              <th 
                onClick={() => handleSort('telephone')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Téléphone {getSortIcon('telephone')}
              </th>
              <th 
                onClick={() => handleSort('type_procedure')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Type de procédure {getSortIcon('type_procedure')}
              </th>
              <th 
                onClick={() => handleSort('date_creation')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Date de création {getSortIcon('date_creation')}
              </th>
              <th 
                onClick={() => handleSort('statut')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Statut {getSortIcon('statut')}
              </th>
              <th 
                onClick={() => handleSort('conseillere')}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Cliquer pour trier"
              >
                Conseillère {getSortIcon('conseillere')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.length > 0 ? (
              sortedClients.map(client => {
                // Debug temporaire
                console.log(`Client ${client.prenom} ${client.nom}: urgence=${client.urgence}, urgent=${client.urgent}`);
                
                return (
                <tr key={client.id} className={client.urgence ? 'urgent-row' : ''}>
                  <td>{client.numero_dossier}</td>
                  <td className="client-name">
                    {client.urgence && <i className="fas fa-exclamation-circle urgent-icon" title="Dossier urgent"></i>}
                    {client.prenom} {client.nom}
                  </td>
                  <td>{client.email}</td>
                  <td>{client.telephone}</td>
                  <td>{client.type_procedure}</td>
                  <td>{new Date(client.date_creation).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(client.statut)}`}>
                      <i className={`fas ${getStatusIcon(client.statut)}`}></i>
                      {client.statut}
                    </span>
                  </td>
                  <td>{client.conseillere}</td>
                  <td>
                    <div className="actions-dropdown">
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setOpenDropdown(openDropdown === client.id ? null : client.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                        {openDropdown === client.id && (
                          <div style={{
                            position: 'absolute',
                            right: '0',
                            top: '100%',
                            backgroundColor: 'white',
                            minWidth: '200px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            zIndex: 1000,
                            overflow: 'hidden'
                          }}>
                            <div style={{ padding: '8px 0' }}>
                              <button 
                                onClick={() => { handleViewClient(client); setOpenDropdown(null); }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <i className="fas fa-eye"></i> Voir détails
                              </button>
                              
                              <button 
                                onClick={() => { handleEditClient(client); setOpenDropdown(null); }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <i className="fas fa-edit"></i> Modifier
                              </button>

                              {canReassignClient() && (
                                <button 
                                  onClick={() => { openAssignModal(client.id); setOpenDropdown(null); }}
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#007bff'
                                  }}
                                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
                                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <i className="fas fa-user-plus"></i> Assigner
                                </button>
                              )}
                              
                              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                              
                              <button 
                                onClick={() => { handleDeleteClient(client.id); setOpenDropdown(null); }}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: '#dc3545'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <i className="fas fa-trash"></i> Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  {filteredClients.length === 0 && clients.length > 0 ? 
                    'Aucun client trouvé avec les critères de recherche.' :
                    'Aucun client trouvé.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Modals */}
      {showFactureModal && (
        <FactureForm 
          client={selectedClient}
          facture={selectedFacture}
          onClose={() => setShowFactureModal(false)}
          onSave={() => {
            setShowFactureModal(false);
            // Optionnel: recharger les données
          }}
        />
      )}

      {showContratModal && (
        <ContratForm 
          client={selectedClient}
          contrat={selectedContrat}
          onClose={() => setShowContratModal(false)}
          onSave={() => {
            setShowContratModal(false);
            // Optionnel: recharger les données
          }}
        />
      )}

      {showDetailModal && selectedClient && (
        <ClientDetailModal 
          client={selectedClient}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          readOnly={true}
          showAll={true}
        />
      )}

      {/* Modal pour assigner un client à une conseillère */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assigner le client à une conseillère</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={assignClient}>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    value={assignData.conseillere} 
                    onChange={handleAssignChange}
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
      </>
      )}
    </div>
  );
}

export default Clients;
