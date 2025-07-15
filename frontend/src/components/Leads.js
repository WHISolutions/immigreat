import React, { useState, useEffect } from 'react';
import '../styles/Leads.css';
import '../styles/icons.css';
import '../styles/TableSorting.css';
import LeadProcessHelp from './LeadProcessHelp';
import CreateLeadForm from './CreateLeadForm';
import LeadsList from './LeadsList';
import ConvertLeadModal from './ConvertLeadModal';
import ImportExcelModal from './ImportExcelModal';
import ConsultationManager from './ConsultationManager';
import { convertLeadToClient } from '../services/leadsAPI';
import { getConseillers, getConseillerNames } from '../services/conseillerAPI';
import { consultationService } from '../services/consultationAPI';
import { connectSocket } from '../services/socket';
import axios from 'axios';

// Ajouter automatiquement le token d'authentification à toutes les requêtes Axios
const storedToken = localStorage.getItem('token');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

function Leads({ userRole = 'conseillere' }) {
  // Supprimer le state showApiLeads - utiliser toujours l'interface originale avec API
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);

  // États pour la conversion de lead en client
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // États pour le tri
  const [sortField, setSortField] = useState('dateCreation');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleLeadCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Écoute des événements temps réel pour mettre à jour la liste des leads
  useEffect(() => {
    const socket = connectSocket();

    socket.on('leadCreated', () => {
      console.log('[Leads] Lead créé - actualisation de la liste');
      setRefreshTrigger(prev => prev + 1);
    });

    socket.on('leadUpdated', () => {
      console.log('[Leads] Lead mis à jour - actualisation de la liste');
      setRefreshTrigger(prev => prev + 1);
    });

    socket.on('leadDeleted', () => {
      console.log('[Leads] Lead supprimé - actualisation de la liste');
      setRefreshTrigger(prev => prev + 1);
    });

    socket.on('clientCreated', () => {
      console.log('[Leads] Client créé (conversion) - actualisation de la liste');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      socket.off('leadCreated');
      socket.off('leadUpdated');
      socket.off('leadDeleted');
      socket.off('clientCreated');
    };
  }, []);

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

  // Fonction pour trier les leads
  const getSortedLeads = () => {
    const filteredLeads = getFilteredLeads();
    const sortedLeads = [...filteredLeads].sort((a, b) => {
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
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        case 'statut':
          aValue = a.statut.toLowerCase();
          bValue = b.statut.toLowerCase();
          break;
        case 'dateCreation':
          aValue = new Date(a.dateCreation).getTime();
          bValue = new Date(b.dateCreation).getTime();
          break;
        case 'conseillere':
          aValue = (a.conseillere || '').toLowerCase();
          bValue = (b.conseillere || '').toLowerCase();
          break;
        case 'interet':
          aValue = a.interet.toLowerCase();
          bValue = b.interet.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedLeads;
  };

  // Fonction pour ouvrir le modal de conversion
  const openConvertModal = (lead) => {
    // Adapter les données du lead pour correspondre à l'interface ConvertLeadModal
    const adaptedLead = {
      id: lead.id,
      nom: lead.nom,
      prenom: lead.prenom,
      email: lead.email,
      telephone: lead.telephone,
      source: lead.source,
      interet: lead.interet,
      conseillere: lead.conseillere,
      statut: lead.statut
    };
    setSelectedLeadForConversion(adaptedLead);
    setShowConvertModal(true);
    setOpenDropdown(null);
  };

  // Fonction pour fermer le modal de conversion
  const closeConvertModal = () => {
    setSelectedLeadForConversion(null);
    setShowConvertModal(false);
  };

  // Fonction pour gérer la conversion de lead en client
  const handleConvertLead = async (leadId, utilisateur, notes) => {
    try {
      const response = await convertLeadToClient(leadId, utilisateur, notes);
      
      if (response.success) {
        // Mettre à jour l'état local du lead
        const updatedLeads = leads.map(lead => {
          if (lead.id === leadId) {
            return { ...lead, statut: 'Client' };
          }
          return lead;
        });
        setLeads(updatedLeads);
        
        // Afficher un message de succès
        alert(`✅ Lead converti avec succès!\n\nNuméro de dossier: ${response.data.numeroDossier}\nClient créé: ${response.data.client.nom} ${response.data.client.prenom}`);
        
        // Recharger les leads pour avoir les données à jour
        loadLeadsFromAPI();
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      alert(`❌ Erreur lors de la conversion: ${error.message}`);
      throw error;
    }
  };

  // Fonction pour gérer l'ouverture/fermeture du dropdown avec debounce
  const toggleDropdown = (leadId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setOpenDropdown(prevOpen => {
      const newValue = prevOpen === leadId ? null : leadId;
      
      // Si on ouvre un dropdown, ajuster sa position si nécessaire
      if (newValue === leadId) {
        setTimeout(() => {
          const dropdownElement = event.target.closest('.actions-dropdown')?.querySelector('.actions-dropdown-menu');
          if (dropdownElement) {
            adjustDropdownPosition(dropdownElement, event.target);
          }
        }, 10);
      }
      
      return newValue;
    });
  };

  // Fonction pour ajuster la position du dropdown si il est coupé
  const adjustDropdownPosition = (dropdownElement, buttonElement) => {
    if (!dropdownElement || !buttonElement) return;
    
    const dropdownRect = dropdownElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Réinitialiser les classes de position
    dropdownElement.classList.remove('dropdown-top', 'dropdown-left');
    
    // Vérifier si le dropdown est coupé en bas
    if (dropdownRect.bottom > viewportHeight - 10) {
      dropdownElement.classList.add('dropdown-top');
    }
    
    // Vérifier si le dropdown est coupé à droite
    if (dropdownRect.right > viewportWidth - 10) {
      dropdownElement.classList.add('dropdown-left');
    }
  };

  // Fermer le dropdown avec une approche plus robuste
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Vérifier si le clic est en dehors du dropdown
      const dropdownElement = event.target.closest('.actions-dropdown');
      const isDropdownButton = event.target.closest('.actions-dropdown-button');
      
      if (!dropdownElement && !isDropdownButton && openDropdown !== null) {
        setOpenDropdown(null);
      }
    };

    // Utiliser capture: true pour capturer l'événement avant qu'il n'atteigne les éléments enfants
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [openDropdown]);

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

  // État pour les leads - commence vide, sera chargé depuis l'API
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  // Fonction pour charger les leads depuis l'API
  const loadLeadsFromAPI = async () => {
    console.log('🔄 Chargement des leads depuis l\'API...');
    
    try {
      setIsLoadingLeads(true);
      
      // Configurer le token dynamiquement pour chaque requête
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token configuré pour la requête:', token.substring(0, 20) + '...');
      } else {
        console.log('⚠️ Aucun token trouvé dans localStorage');
      }
      
      const response = await axios.get('http://localhost:5000/api/leads', { headers });
      
      console.log('📡 Réponse API loadLeads:', response.data);
      
      if (response.data.success) {
        // Transformer les données de l'API pour correspondre au format attendu
        const apiLeads = response.data.data.leads.map(lead => ({
          id: lead.id,
          nom: lead.nom,
          prenom: lead.prenom,
          email: lead.email,
          telephone: lead.telephone,
          source: lead.source,
          statut: lead.statut,
          dateCreation: lead.date_creation ? lead.date_creation.split('T')[0] : new Date().toISOString().split('T')[0],
          conseillere: lead.conseillere || '',
          interet: lead.interet,
          notes: lead.notes || ''
        }));
        
        console.log('✅ Leads transformés:', apiLeads);
        setLeads(apiLeads);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des leads:', error);
      // En cas d'erreur, garder les leads existants ou un tableau vide
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Charger les leads et les conseillers au démarrage du composant
  useEffect(() => {
    loadLeadsFromAPI();
    loadConseillers();
  }, []);

  // Fonction pour charger les conseillers depuis l'API
  const loadConseillers = async () => {
    try {
      console.log('🔄 Chargement des conseillers pour Leads.js...');
      const result = await getConseillers();
      
      if (result.success && result.data) {
        setConseillersList(result.data);
        const conseillerNames = getConseillerNames(result.data);
        
        // Pour les conseillères, s'assurer que leur nom est inclus
        if (userRole === 'conseillere') {
          const userName = localStorage.getItem('userName');
          if (userName && !conseillerNames.includes(userName)) {
            console.log('👤 Ajout du nom de la conseillère connectée:', userName);
            conseillerNames.push(userName);
          }
          setConseilleresOptions(conseillerNames);
        } else {
          setConseilleresOptions(conseillerNames);
        }
        
        console.log('✅ Conseillers chargés dans Leads.js:', conseillerNames);
      } else {
        // En cas d'échec, au moins inclure la conseillère connectée
        if (userRole === 'conseillere') {
          const userName = localStorage.getItem('userName');
          if (userName) {
            setConseilleresOptions([userName]);
            console.log('🔧 Fallback: ajout de la conseillère connectée:', userName);
          }
        } else {
          const defaultNames = getConseillerNames(result.data);
          setConseilleresOptions(defaultNames);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conseillers dans Leads.js:', error);
      
      // En cas d'erreur, au moins inclure la conseillère connectée
      if (userRole === 'conseillere') {
        const userName = localStorage.getItem('userName');
        if (userName) {
          setConseilleresOptions([userName]);
          console.log('🔧 Erreur fallback: ajout de la conseillère connectée:', userName);
        }
      }
    }
  };

  // État pour les filtres
  const [filtres, setFiltres] = useState({
    statut: '',
    source: '',
    conseillere: ''
  });
  
  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour stocker le nom de la conseillère connectée
  const [nomConseillerConnectee, setNomConseillerConnectee] = useState('');
  
  // État pour le nouveau lead
  const [nouveauLead, setNouveauLead] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    source: 'Site web',
    statut: 'Nouveau',
    conseillere: '',
    interet: '',
    notes: ''
  });
  
  // État pour le lead sélectionné (vue détaillée)
  const [selectedLead, setSelectedLead] = useState(null);
  
  // État pour les modales
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRappelModal, setShowRappelModal] = useState(false);
  const [showProcessHelp, setShowProcessHelp] = useState(false);
  
  // État pour l'assignation
  const [assignData, setAssignData] = useState({
    leadId: null,
    conseillere: ''
  });
  
  // État pour le rappel
  const [rappelData, setRappelData] = useState({
    leadId: null,
    date: '',
    heure: '',
    notes: ''
  });

  // État pour les conseillers
  const [conseilleresOptions, setConseilleresOptions] = useState(['wafaa chaouby', 'hame amni', 'sanaa sami']);
  // État pour la liste complète des conseillers (objet avec id & nom)
  const [conseillersList, setConseillersList] = useState([]);

  // Options pour les filtres et le formulaire
  const statutOptions = ['Nouveau', 'Contacté', 'À recontacter', 'Rendez-vous pris', 'Consultation effectuée', 'Consultation manquée', 'Qualifié', 'Non qualifié', 'Pas intéressé', 'Client'];
  const sourceOptions = ['Site web', 'LinkedIn', 'Facebook', 'Référence', 'Autre'];
  const interetOptions = ['Permis d\'études', 'Permis de travail', 'Résidence permanente', 'Visa visiteur', 'Citoyenneté', 'Autre'];

  // Récupérer le nom de la conseillère connectée au chargement
  useEffect(() => {
    if (userRole === 'conseillere') {
      const userName = localStorage.getItem('userName');
      if (userName) {
        setNomConseillerConnectee(userName);
        console.log('👤 Nom de la conseillère connectée défini:', userName);
      }
    }
  }, [userRole]);

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté
  useEffect(() => {
    // Pour les conseillères, préremplir automatiquement avec leur nom
    if (userRole === 'conseillere' && !nouveauLead.conseillere) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré (Leads.js):', userName);
      
      if (userName) {
        console.log('✅ Préremplissage du champ conseillère avec:', userName);
        setNouveauLead(prev => ({
          ...prev,
          conseillere: userName
        }));
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage (Leads.js)');
      }
    }
  }, [userRole, nouveauLead.conseillere]);
  
  // Filtrer les leads selon le rôle de l'utilisateur
  const getFilteredLeads = () => {
    // Filtrer d'abord par rôle
    let roleFiltered = [];
    
    if (userRole === 'administrateur' || userRole === 'directeur') {
      // Accès à tous les leads pour administrateur et directeur
      roleFiltered = [...leads];
    } else if (userRole === 'conseillere') {
      // Accès uniquement à ses propres leads  
      const userName = localStorage.getItem('userName');
      if (userName) {
        roleFiltered = leads.filter(lead => {
          if (!lead.conseillere) return true; // Leads non assignés
          // Vérifier si le lead appartient à la conseillère connectée
          return lead.conseillere.toLowerCase().includes(userName.toLowerCase()) ||
                 userName.toLowerCase().includes(lead.conseillere.toLowerCase());
        });
      } else {
        roleFiltered = leads.filter(lead => !lead.conseillere); // Seulement les non assignés si pas de nom
      }
    } else if (userRole === 'secretaire') {
      // Accès à tous les leads pour la secrétaire (nouvelle règle)
      roleFiltered = [...leads];
    } else {
      roleFiltered = [...leads];
    }
    
    // Ensuite, appliquer les filtres de recherche et de statut/source
    return roleFiltered.filter(lead => {
      // Appliquer la recherche globale améliorée (disponible pour tous les rôles)
      const searchMatch = searchTerm === '' || 
        `${lead.prenom} ${lead.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telephone.includes(searchTerm) ||
        (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.statut && lead.statut.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.interet && lead.interet.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.conseillere && lead.conseillere.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Appliquer les filtres
      const statutMatch = filtres.statut === '' || lead.statut === filtres.statut;
      const sourceMatch = filtres.source === '' || lead.source === filtres.source;
      const conseilleresMatch = filtres.conseillere === '' || lead.conseillere === filtres.conseillere;
      
      return searchMatch && statutMatch && sourceMatch && conseilleresMatch;
    });
  };
  
  const leadsFiltrés = getSortedLeads();
  
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
      source: '',
      conseillere: ''
    });
    setSearchTerm('');
  };
  
  // Gérer les changements dans le formulaire de nouveau lead
  const handleNouveauLeadChange = (e) => {
    const { name, value } = e.target;
    setNouveauLead({
      ...nouveauLead,
      [name]: value
    });
  };

  // Fonction pour réinitialiser intelligemment le formulaire (préserve la conseillère)
  const resetFormulaireLead = () => {
    let conseillerePreremplie = '';
    
    // Pour les conseillères, préremplir automatiquement avec leur nom
    if (userRole === 'conseillere') {
      const userName = localStorage.getItem('userName');
      if (userName) {
        conseillerePreremplie = userName;
      }
    }
    
    setNouveauLead({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      source: 'Site web',
      statut: 'Nouveau',
      conseillere: conseillerePreremplie,
      interet: '',
      notes: ''
    });
    
    console.log('🔄 Formulaire lead réinitialisé avec conseillère préremplie:', conseillerePreremplie);
  };

  // Fonction pour ouvrir la modal avec préremplissage automatique
  const ouvrirModalLead = () => {
    setShowModal(true);
    // Pour les conseillères, s'assurer que le champ est pré-rempli
    if (userRole === 'conseillere' && !nouveauLead.conseillere) {
      const userName = localStorage.getItem('userName');
      if (userName) {
        console.log('✅ Préremplissage modal conseillère:', userName);
        setNouveauLead(prev => ({
          ...prev,
          conseillere: userName
        }));
      }
    }
  };

  // Fonction pour fermer la modal avec réinitialisation intelligente
  const fermerModalLead = () => {
    setShowModal(false);
    resetFormulaireLead();
  };

  // Ajouter un nouveau lead via API
  const ajouterLead = async (e) => {
    e.preventDefault();
    
    try {
      // Envoyer le lead à l'API backend
      const response = await axios.post('http://localhost:5000/api/leads', {
        nom: nouveauLead.nom,
        prenom: nouveauLead.prenom,
        email: nouveauLead.email,
        telephone: nouveauLead.telephone,
        source: nouveauLead.source,
        interet: nouveauLead.interet,
        conseillere: nouveauLead.conseillere,
        notes: nouveauLead.notes
      });

      if (response.data.success) {
        // Ajouter le nouveau lead à l'état local au lieu de recharger tout
        const newLead = {
          id: response.data.data.id,
          nom: nouveauLead.nom,
          prenom: nouveauLead.prenom,
          email: nouveauLead.email,
          telephone: nouveauLead.telephone,
          source: nouveauLead.source,
          statut: 'Nouveau',
          dateCreation: new Date().toISOString().split('T')[0],
          conseillere: nouveauLead.conseillere,
          interet: nouveauLead.interet,
          notes: nouveauLead.notes
        };
        
        setLeads(prevLeads => [...prevLeads, newLead]);
        
        // Réinitialiser le formulaire avec préremplissage de la conseillère
        resetFormulaireLead();
        
        setShowModal(false);
        alert('Lead créé avec succès et enregistré en base de données !');
      }
    } catch (error) {
      console.error('Erreur lors de la création du lead:', error);
      alert('Erreur lors de la création du lead: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Changer le statut d'un lead et sauvegarder en base de données
  const changerStatut = async (id, nouveauStatut) => {
    console.log(`🔄 Tentative de changement de statut pour lead ${id}: ${nouveauStatut}`);
    
    // Vérifier si le lead est déjà converti en client
    const lead = leads.find(l => l.id === id);
    if (lead && lead.statut === 'Client') {
      alert('❌ Impossible de modifier le statut : ce lead a été converti en client et son statut est verrouillé.');
      return;
    }
    
    try {
      // Mettre à jour le statut via l'API
      const response = await axios.put(`http://localhost:5000/api/leads/${id}`, {
        statut: nouveauStatut
      });

      console.log('📡 Réponse API:', response.data);

      if (response.data.success) {
        // Mettre à jour l'état local après succès de l'API
        const updatedLeads = leads.map(lead => {
          if (lead.id === id) {
            return { ...lead, statut: nouveauStatut };
          }
          return lead;
        });
        setLeads(updatedLeads);
        
        console.log(`✅ Statut du lead ${id} mis à jour: ${nouveauStatut}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      console.error('📊 Détails de l\'erreur:', error.response?.data);
      alert('Erreur lors de la mise à jour du statut: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Ouvrir la vue détaillée d'un lead
  const openLeadDetail = (lead) => {
    // Pour les conseillères, toujours pré-remplir avec leur nom si le lead n'est pas assigné
    if (userRole === 'conseillere') {
      const userName = localStorage.getItem('userName');
      console.log('👤 Conseillère connectée:', userName);
      
      // Si le lead n'a pas de conseillère assignée, assigner automatiquement la conseillère connectée
      if ((!lead.conseillere || lead.conseillere === '' || lead.conseillere === 'À assigner') && userName) {
        console.log('🔄 Attribution automatique de la conseillère connectée');
        
        // Utiliser directement le nom de l'utilisateur connecté
        setSelectedLead({
          ...lead,
          conseillere: userName
        });
        console.log('✅ Conseillère assignée automatiquement:', userName);
      } else {
        // Garder l'assignation existante
        setSelectedLead(lead);
      }
    } else {
      // Pour les autres rôles, garder le lead tel quel
      setSelectedLead(lead);
    }
    setShowDetailModal(true);
  };
  
  // Mettre à jour un lead via l'API
  const updateLead = async (e) => {
    e.preventDefault();
    
    console.log(`🔄 Mise à jour du lead ${selectedLead.id} via l'API...`);
    
    try {
      // Si c'est une conseillère et qu'elle modifie un lead non assigné, l'assigner automatiquement
      let leadDataToUpdate = { ...selectedLead };
      
      if (userRole === 'conseillere' && (!selectedLead.conseillere || selectedLead.conseillere === '' || selectedLead.conseillere === 'À assigner')) {
        const userName = localStorage.getItem('userName');
        if (userName) {
          console.log('✅ Attribution automatique lors de la sauvegarde à:', userName);
          leadDataToUpdate.conseillere = userName;
          setSelectedLead(leadDataToUpdate); // Mettre à jour l'état aussi
        }
      }
      
      // Vérifier si le statut change vers "Consultation effectuée"
      const previousLead = leads.find(lead => lead.id === selectedLead.id);
      const isConsultationEffectuee = leadDataToUpdate.statut === 'Consultation effectuée' && 
                                     previousLead?.statut !== 'Consultation effectuée';
      
      // Détecter les changements d'assignation
      const assignationChanged = previousLead?.conseillere !== leadDataToUpdate.conseillere;
      const isReassignation = previousLead?.conseillere && previousLead.conseillere !== leadDataToUpdate.conseillere;
      
      // Préparer les données pour l'API
      const updateData = {
        nom: leadDataToUpdate.nom,
        prenom: leadDataToUpdate.prenom,
        email: leadDataToUpdate.email,
        telephone: leadDataToUpdate.telephone,
        source: leadDataToUpdate.source,
        statut: leadDataToUpdate.statut,
        interet: leadDataToUpdate.interet,
        conseillere: leadDataToUpdate.conseillere,
        notes: leadDataToUpdate.notes
      };

      // Envoyer la mise à jour à l'API
      const response = await axios.put(`http://localhost:5000/api/leads/${selectedLead.id}`, updateData);
      
      console.log('📡 Réponse API updateLead:', response.data);

      if (response.data.success) {
        // Si consultation effectuée, créer une consultation
        if (isConsultationEffectuee) {
          try {
            // Trouver l'ID du conseiller
            console.log('🔍 Recherche du conseiller:', leadDataToUpdate.conseillere);
            console.log('🔍 Liste des conseillers:', conseillersList);
            
            // Chercher le conseiller par différentes méthodes
            let conseiller = null;
            
            // 1. Recherche exacte par nomComplet
            conseiller = conseillersList.find(c => c.nomComplet === leadDataToUpdate.conseillere);
            
            // 2. Recherche par userName (pour les conseillères connectées)
            if (!conseiller && userRole === 'conseillere') {
              const userName = localStorage.getItem('userName');
              const userId = localStorage.getItem('userId');
              console.log('🔍 Recherche par userName:', userName, 'userId:', userId);
              
              if (userId) {
                conseiller = conseillersList.find(c => c.id === parseInt(userId));
                console.log('🔍 Conseiller trouvé par userId:', conseiller);
              } else if (userName) {
                // Recherche par nom partiel
                conseiller = conseillersList.find(c => 
                  c.nomComplet && (
                    c.nomComplet.toLowerCase().includes(userName.toLowerCase()) ||
                    userName.toLowerCase().includes(c.nomComplet.toLowerCase())
                  )
                );
                console.log('🔍 Conseiller trouvé par recherche partielle:', conseiller);
              }
            }
            
            // 3. Recherche par nom/prénom séparés
            if (!conseiller) {
              const [prenom, ...nomParts] = leadDataToUpdate.conseillere.split(' ');
              const nom = nomParts.join(' ');
              conseiller = conseillersList.find(c => 
                c.prenom === prenom && c.nom === nom
              );
              console.log('🔍 Conseiller trouvé par nom/prénom:', conseiller);
            }
            
            console.log('🔍 Conseiller final trouvé:', conseiller);
            
            if (conseiller) {
              console.log('📝 Création de la consultation pour le conseiller ID:', conseiller.id);
              await consultationService.createConsultation(
                leadDataToUpdate.id || selectedLead.id,
                conseiller.id,
                'Consultation effectuée - mise à jour du statut'
              );
              console.log('✅ Consultation créée automatiquement');
            } else {
              console.warn('⚠️ Impossible de trouver le conseiller pour créer la consultation');
              console.warn('⚠️ Lead.conseillere:', leadDataToUpdate.conseillere);
              console.warn('⚠️ userName:', localStorage.getItem('userName'));
              console.warn('⚠️ userId:', localStorage.getItem('userId'));
              console.warn('⚠️ Conseillers disponibles:', conseillersList.map(c => ({ id: c.id, nomComplet: c.nomComplet, prenom: c.prenom, nom: c.nom })));
            }
          } catch (consultationError) {
            console.error('❌ Erreur lors de la création de la consultation:', consultationError);
            // Ne pas bloquer la mise à jour du lead pour cette erreur
          }
        }
        
        // Mettre à jour l'état local après succès de l'API
        const updatedLeads = leads.map(lead => {
          if (lead.id === selectedLead.id) {
            return leadDataToUpdate; // Utiliser les données mises à jour
          }
          return lead;
        });
        setLeads(updatedLeads);
        setShowDetailModal(false);
        
        console.log(`✅ Lead ${selectedLead.id} mis à jour avec succès`);
        
        // Message personnalisé en fonction des changements
        let successMessage = 'Lead mis à jour avec succès !';
        if (isConsultationEffectuee) {
          successMessage += ' Consultation enregistrée automatiquement.';
        }
        if (assignationChanged && isReassignation) {
          successMessage += ' 📱 La nouvelle conseillère a été notifiée de cette réassignation.';
        } else if (assignationChanged) {
          successMessage += ' 📱 La conseillère a été notifiée de cette assignation.';
        }
        
        alert(successMessage);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du lead:', error);
      console.error('📊 Détails de l\'erreur:', error.response?.data);
      alert('Erreur lors de la mise à jour du lead: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Gérer les changements dans le formulaire de détail
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    
    // Empêcher la modification du statut pour les leads convertis en clients
    if (name === 'statut' && selectedLead.statut === 'Client') {
      alert('❌ Impossible de modifier le statut : ce lead a été converti en client et son statut est verrouillé.');
      return;
    }
    
    // Vérifier si l'utilisateur a le droit de modifier ce champ
    if (canEditAllFields() || name === 'statut' || name === 'notes') {
      setSelectedLead({
        ...selectedLead,
        [name]: value
      });
    }
  };
  
  // Supprimer un lead (admin et directeur uniquement)
  const deleteLead = async (id) => {
    if (userRole === 'administrateur' || userRole === 'directeur') {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
        try {
          const response = await axios.delete(`http://localhost:5000/api/leads/${id}`);
          
          if (response.data.success) {
            // Mettre à jour l'état local après suppression réussie
            const updatedLeads = leads.filter(lead => lead.id !== id);
            setLeads(updatedLeads);
            console.log(`✅ Lead ${id} supprimé avec succès`);
          }
        } catch (error) {
          console.error('Erreur lors de la suppression du lead:', error);
          alert('Erreur lors de la suppression du lead: ' + (error.response?.data?.message || error.message));
        }
      }
    }
  };
  
  // Vérifier si l'utilisateur peut modifier tous les champs
  const canEditAllFields = () => {
    return userRole === 'administrateur' || userRole === 'directeur';
  };
  
  // Vérifier si l'utilisateur peut réassigner un lead
  const canReassignLead = () => {
    return userRole === 'administrateur';
  };
  
  // Vérifier si l'utilisateur peut importer des leads Excel
  const canImportExcel = () => {
    return userRole === 'administrateur' || userRole === 'directeur' || userRole === 'secretaire';
  };
  
  // Vérifier si l'utilisateur peut distribuer des leads
  const canDispatchLeads = () => {
    return userRole === 'administrateur' || userRole === 'directeur';
  };
  
  // Ouvrir le modal d'assignation
  const openAssignModal = (id) => {
    setAssignData({
      leadId: id,
      conseillere: ''
    });
    setShowAssignModal(true);
  };
  
  // Assigner un lead à une conseillère
  const assignLead = async (e) => {
    e.preventDefault();
    try {
      const selected = conseillersList.find(c => c.nomComplet === assignData.conseillere);
      if (!selected) {
        alert('Conseiller non trouvé');
        return;
      }

      // Vérifier si c'est une réassignation
      const currentLead = leads.find(l => l.id === assignData.leadId);
      const isReassignation = currentLead && currentLead.conseillere && currentLead.conseillere !== assignData.conseillere;

      console.log(`📋 ${isReassignation ? 'Réassignation' : 'Assignation'} du lead ${assignData.leadId} à ${assignData.conseillere}`);

      const response = await axios.post(`http://localhost:5000/api/leads/${assignData.leadId}/assign`, {
        conseiller_id: selected.id
      });

      if (response.data.success) {
        // Mettre à jour l'état local
        const updatedLeads = leads.map(lead => {
          if (lead.id === assignData.leadId) {
            return { ...lead, conseillere: assignData.conseillere, conseiller_id: selected.id };
          }
          return lead;
        });
        setLeads(updatedLeads);
        setShowAssignModal(false);
        
        const actionText = isReassignation ? 'Lead réassigné avec succès' : 'Lead assigné avec succès';
        const notificationText = isReassignation 
          ? 'La nouvelle conseillère a été notifiée de cette réassignation.' 
          : 'La conseillère a été notifiée de cette assignation.';
        
        alert(`✅ ${actionText}!\n📱 ${notificationText}`);
        console.log(`✅ ${actionText} - notification envoyée`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'assignation:', error);
      alert(`❌ Erreur lors de l'assignation: ${error.response?.data?.message || error.message}`);
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
  
  // Ouvrir le modal de rappel
  const openRappelModal = (id) => {
    setRappelData({
      leadId: id,
      date: '',
      heure: '',
      notes: ''
    });
    setShowRappelModal(true);
  };
  
  // Planifier un rappel
  const planifierRappel = (e) => {
    e.preventDefault();
    
    // Simuler la planification du rappel
    alert(`Rappel planifié pour le ${rappelData.date} à ${rappelData.heure}`);
    
    // Mettre à jour le statut du lead
    const updatedLeads = leads.map(lead => {
      if (lead.id === rappelData.leadId) {
        return { ...lead, statut: 'À recontacter' };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    setShowRappelModal(false);
  };
  
  // Gérer les changements dans le formulaire de rappel
  const handleRappelChange = (e) => {
    const { name, value } = e.target;
    setRappelData({
      ...rappelData,
      [name]: value
    });
  };
  
  
  // Gérer le succès d'importation Excel
  const handleImportSuccess = (result) => {
    console.log('✅ Importation réussie:', result);
    
    // Actualiser la liste des leads
    setRefreshTrigger(prev => prev + 1);
    
    // Afficher un message de succès
    let message = `✅ ${result.totalImported} leads importés avec succès !`;
    
    if (result.errors && result.errors.length > 0) {
      message += `\n\n⚠️ ${result.errors.length} erreurs rencontrées :`;
      result.errors.forEach(error => {
        message += `\n• ${error.lead}: ${error.error}`;
      });
    }
    
    alert(message);
  };

  return (
    <div className="leads-container">
      <div className="page-header">
        <h1>Gestion des Leads</h1>
        <div className="header-actions">
          <button 
            className="btn btn-help" 
            onClick={() => setShowProcessHelp(true)}
          >
            <i className="fas fa-question-circle"></i> Aide
          </button>
          <button 
            className="btn btn-primary" 
            onClick={ouvrirModalLead}
          >
            <i className="fas fa-plus"></i> Nouveau Lead
          </button>
          
          {canImportExcel() && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowImportModal(true)}
            >
              <i className="fas fa-file-import"></i> Importer Excel
            </button>
          )}
        </div>
      </div>
      
      <div className="search-filter-container" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', padding: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', minWidth: 300, height: 40, background: '#f8f9fa', borderRadius: 8, padding: '0 16px', marginRight: 16, marginBottom: 8 }}>
          <i className="fas fa-search" style={{ marginRight: 8, color: 'var(--text-secondary)' }}></i>
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, téléphone, statut, source, conseillère, intérêt ou notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', height: 40, lineHeight: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Statut:</label>
            <select 
              name="statut" 
              value={filtres.statut} 
              onChange={handleFiltreChange}
              style={{ padding: '8px 12px', border: '1px solid var(--color-neutral-medium)', borderRadius: 6, fontSize: '1rem', minWidth: 120, height: 40, boxSizing: 'border-box' }}
            >
              <option value="">Tous</option>
              {statutOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Source:</label>
            <select 
              name="source" 
              value={filtres.source} 
              onChange={handleFiltreChange}
              style={{ padding: '8px 12px', border: '1px solid var(--color-neutral-medium)', borderRadius: 6, fontSize: '1rem', minWidth: 120, height: 40, boxSizing: 'border-box' }}
            >
              <option value="">Toutes</option>
              {sourceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '40px', marginRight: 4 }}>Conseillère:</label>
            <select 
              name="conseillere" 
              value={filtres.conseillere} 
              onChange={handleFiltreChange}
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
                {userRole === 'conseillere' ? 
                  (nomConseillerConnectee ? `${nomConseillerConnectee}` : 'Mes leads') : 
                  'Toutes'
                }
              </option>
              {userRole !== 'conseillere' && conseilleresOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <button className="btn-text" onClick={resetFiltres} style={{ height: 40, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 4, fontSize: '1rem', padding: '8px 12px', borderRadius: 6, marginLeft: 8, whiteSpace: 'nowrap' }}>
            <i className="fas fa-times"></i> Réinitialiser
          </button>
        </div>
      </div>
      
      <div className="leads-table-container">
        <table className="leads-table sortable-table">
          <thead>
            <tr>
              <th 
                className={`sortable-header ${sortField === 'nom' ? 'active' : ''}`}
                onClick={() => handleSort('nom')}
                title="Cliquer pour trier"
              >
                Nom complet <span className="sort-indicator">{getSortIcon('nom')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'email' ? 'active' : ''}`}
                onClick={() => handleSort('email')}
                title="Cliquer pour trier"
              >
                Email <span className="sort-indicator">{getSortIcon('email')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'telephone' ? 'active' : ''}`}
                onClick={() => handleSort('telephone')}
                title="Cliquer pour trier"
              >
                Téléphone <span className="sort-indicator">{getSortIcon('telephone')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'source' ? 'active' : ''}`}
                onClick={() => handleSort('source')}
                title="Cliquer pour trier"
              >
                Source <span className="sort-indicator">{getSortIcon('source')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'statut' ? 'active' : ''}`}
                onClick={() => handleSort('statut')}
                title="Cliquer pour trier"
              >
                Statut <span className="sort-indicator">{getSortIcon('statut')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'dateCreation' ? 'active' : ''}`}
                onClick={() => handleSort('dateCreation')}
                title="Cliquer pour trier"
              >
                Date création <span className="sort-indicator">{getSortIcon('dateCreation')}</span>
              </th>
              <th 
                className={`sortable-header ${sortField === 'conseillere' ? 'active' : ''}`}
                onClick={() => handleSort('conseillere')}
                title="Cliquer pour trier"
              >
                Conseillère <span className="sort-indicator">{getSortIcon('conseillere')}</span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLeads ? (
              <tr>
                <td colSpan="8" className="loading-state" style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#007bff' }}></i>
                  <p style={{ margin: '10px 0 0 0' }}>Chargement des leads depuis l'API backend...</p>
                </td>
              </tr>
            ) : leadsFiltrés.length > 0 ? (
              leadsFiltrés.map(lead => (
                <tr key={lead.id}>
                  <td className="clickable" onClick={() => openLeadDetail(lead)}>
                    {lead.prenom} {lead.nom}
                  </td>
                  <td>{lead.email}</td>
                  <td>{lead.telephone}</td>
                  <td>{lead.source}</td>
                  <td>
                    <span className={`status-badge status-${lead.statut.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e')} ${lead.statut === 'Client' ? 'locked' : ''}`}>
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
                        disabled={userRole !== 'secretaire' && userRole !== 'administrateur' && userRole !== 'directeur'}
                      >
                        <i className="fas fa-user-plus"></i> Assigner
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="actions-dropdown">
                      <button 
                        className="btn-action actions-dropdown-button"
                        onClick={(e) => toggleDropdown(lead.id, e)}
                        type="button"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openDropdown === lead.id && (
                        <div className="dropdown-content actions-dropdown-menu show">
                          <button className="actions-dropdown-item" onClick={(e) => {
                            e.stopPropagation();
                            openLeadDetail(lead);
                            setTimeout(() => setOpenDropdown(null), 100);
                          }}>
                            <i className="fas fa-eye"></i> Voir détails
                          </button>
                          
                          {/* Actions de changement de statut - masquées pour les clients convertis */}
                          {lead.statut !== 'Client' && (
                            <>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                changerStatut(lead.id, 'Contacté');
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-phone"></i> Marquer comme contacté
                              </button>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                openRappelModal(lead.id);
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-clock"></i> Planifier un rappel
                              </button>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                changerStatut(lead.id, 'Rendez-vous pris');
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-calendar-plus"></i> Prendre rendez-vous
                              </button>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                changerStatut(lead.id, 'Qualifié');
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-user-check"></i> Qualifier
                              </button>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                changerStatut(lead.id, 'Pas intéressé');
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-user-times"></i> Pas intéressé
                              </button>
                              <button className="actions-dropdown-item" onClick={(e) => {
                                e.stopPropagation();
                                openConvertModal(lead);
                                setTimeout(() => setOpenDropdown(null), 100);
                              }}>
                                <i className="fas fa-user-tie"></i> Convertir en client
                              </button>
                            </>
                          )}
                          
                          {/* Message informatif pour les clients convertis */}
                          {lead.statut === 'Client' && (
                            <div className="dropdown-info">
                              <i className="fas fa-lock"></i> Lead converti en client
                              <small>Le statut ne peut plus être modifié</small>
                            </div>
                          )}
                          
                          {(userRole === 'administrateur' || userRole === 'directeur') && (
                            <button className="actions-dropdown-item danger" onClick={(e) => {
                              e.stopPropagation();
                              deleteLead(lead.id);
                              setTimeout(() => setOpenDropdown(null), 100);
                            }}>
                              <i className="fas fa-trash"></i> Supprimer
                            </button>
                          )}
                        </div>
                      )}
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
      
      {/* Modal d'aide sur le processus */}
      {showProcessHelp && <LeadProcessHelp onClose={() => setShowProcessHelp(false)} />}
      
      {/* Modal pour ajouter un nouveau lead */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ajouter un nouveau lead</h3>
              <button className="close-btn" onClick={fermerModalLead}>×</button>
            </div>
            <form onSubmit={ajouterLead}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom:</label>
                  <input 
                    type="text" 
                    name="nom" 
                    value={nouveauLead.nom} 
                    onChange={handleNouveauLeadChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Prénom:</label>
                  <input 
                    type="text" 
                    name="prenom" 
                    value={nouveauLead.prenom} 
                    onChange={handleNouveauLeadChange} 
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
                    value={nouveauLead.email} 
                    onChange={handleNouveauLeadChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input 
                    type="tel" 
                    name="telephone" 
                    value={nouveauLead.telephone} 
                    onChange={handleNouveauLeadChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Source:</label>
                  <select 
                    name="source" 
                    value={nouveauLead.source} 
                    onChange={handleNouveauLeadChange}
                  >
                    {sourceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Intérêt principal:</label>
                  <select 
                    name="interet" 
                    value={nouveauLead.interet} 
                    onChange={handleNouveauLeadChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {interetOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Conseillère:</label>
                  {userRole === 'conseillere' ? (
                    <input
                      type="text"
                      name="conseillere"
                      value={nomConseillerConnectee || nouveauLead.conseillere}
                      readOnly
                      className="form-control"
                    />
                  ) : (
                    <select 
                      name="conseillere" 
                      value={nouveauLead.conseillere} 
                      onChange={handleNouveauLeadChange}
                    >
                      <option value="">À assigner</option>
                      {conseilleresOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Notes:</label>
                  <textarea 
                    name="notes" 
                    value={nouveauLead.notes} 
                    onChange={handleNouveauLeadChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={fermerModalLead}>
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
      
      {/* Modal pour importer des leads depuis Excel */}
      <ImportExcelModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
        conseillers={conseillersList}
      />
      
      {/* Modal pour la vue détaillée d'un lead */}
      {showDetailModal && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>Détails du lead: {selectedLead.prenom} {selectedLead.nom}</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <form onSubmit={updateLead}>
              {/* Message informatif pour les leads convertis */}
              {selectedLead.statut === 'Client' && (
                <div className="modal-info-message">
                  <i className="fas fa-info-circle"></i>
                  Ce lead a été converti en client. Certaines modifications sont restreintes pour préserver l'intégrité des données.
                </div>
              )}
              
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
                    disabled={selectedLead.statut === 'Client'}
                    style={{
                      backgroundColor: selectedLead.statut === 'Client' ? '#f8f9fa' : 'white',
                      cursor: selectedLead.statut === 'Client' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {statutOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {selectedLead.statut === 'Client' && (
                    <small style={{ color: '#6c757d', display: 'block', marginTop: '5px' }}>
                      <i className="fas fa-lock"></i> Le statut ne peut plus être modifié car le lead a été converti en client
                    </small>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Intérêt principal:</label>
                  <select 
                    name="interet" 
                    value={selectedLead.interet} 
                    onChange={handleDetailChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {interetOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    value={selectedLead.conseillere} 
                    onChange={handleDetailChange}
                  >
                    <option value="">À assigner</option>
                    {conseilleresOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date de création:</label>
                  <input 
                    type="text" 
                    value={selectedLead.dateCreation} 
                    readOnly 
                  />
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
              
              {/* Gestionnaire de consultations */}
              <ConsultationManager 
                leadId={selectedLead.id}
                conseillerId={(() => {
                  // Méthode robuste pour trouver l'ID du conseiller
                  let conseiller = null;
                  
                  // 1. Recherche exacte par nomComplet
                  conseiller = conseillersList.find(c => c.nomComplet === selectedLead.conseillere);
                  
                  // 2. Recherche par userId pour les conseillères connectées
                  if (!conseiller && userRole === 'conseillere') {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                      conseiller = conseillersList.find(c => c.id === parseInt(userId));
                    }
                  }
                  
                  // 3. Recherche par nom partiel
                  if (!conseiller && selectedLead.conseillere) {
                    const [prenom, ...nomParts] = selectedLead.conseillere.split(' ');
                    const nom = nomParts.join(' ');
                    conseiller = conseillersList.find(c => 
                      c.prenom === prenom && c.nom === nom
                    );
                  }
                  
                  console.log('🔍 ConsultationManager - Conseiller trouvé:', conseiller?.id);
                  return conseiller?.id;
                })()}
                onConsultationChange={(action, consultation) => {
                  console.log(`Consultation ${action}:`, consultation);
                  // Optionnel : actualiser les données si nécessaire
                }}
              />
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Fermer
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
      
      {/* Modal pour planifier un rappel */}
      {showRappelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Planifier un rappel</h3>
              <button className="close-btn" onClick={() => setShowRappelModal(false)}>×</button>
            </div>
            <form onSubmit={planifierRappel}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={rappelData.date} 
                    onChange={handleRappelChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Heure:</label>
                  <input 
                    type="time" 
                    name="heure" 
                    value={rappelData.heure} 
                    onChange={handleRappelChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Notes:</label>
                  <textarea 
                    name="notes" 
                    value={rappelData.notes} 
                    onChange={handleRappelChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRappelModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal pour convertir un lead en client */}
      {selectedLeadForConversion && (
        <ConvertLeadModal
          lead={selectedLeadForConversion}
          isOpen={showConvertModal}
          onClose={closeConvertModal}
          onConvert={handleConvertLead}
          currentUser={userRole === 'administrateur' ? 'Administrateur' : selectedLeadForConversion.conseillere || 'Administrateur'}
        />
      )}
    </div>
  );
}

export default Leads;
