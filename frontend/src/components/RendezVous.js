import React, { useState, useEffect } from 'react';
import '../styles/RendezVous.css';
import { getConseillers } from '../services/conseillerAPI';
import clientsAPI from '../services/clientsAPI';
import rendezVousAPI from '../services/rendezVousAPI';
import { getAllLeads } from '../services/leadsAPI';

function RendezVous() {
  const [rendezVous, setRendezVous] = useState([]);
  const [isLoadingRendezVous, setIsLoadingRendezVous] = useState(true);
  
  // 🔴 NOUVEAUX ÉTATS POUR LE TRI
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  const [filtres, setFiltres] = useState({
    conseillere: '',
    statut: '',
    date: '',
    type: ''
  });
  
  const [nouveauRdv, setNouveauRdv] = useState({
    client: '',
    conseillere: '',
    date: '',
    heureDebut: '',
    heureFin: '',
    type: '',
    notes: ''
  });
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rdvDetails, setRdvDetails] = useState(null);
  const [vue, setVue] = useState('liste'); // 'liste' ou 'calendrier'
  
  // États pour les données dynamiques
  const [conseilleresOptions, setConseilleresOptions] = useState([]);
  const [clientsOptions, setClientsOptions] = useState([]);
  const [leadsOptions, setLeadsOptions] = useState([]);
  const [isLoadingConseillers, setIsLoadingConseillers] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  
  // États pour la recherche de clients et leads
  const [rechercheClient, setRechercheClient] = useState('');
  const [resultsRecherches, setResultsRecherches] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Options statiques
  const statutOptions = ['Confirmé', 'En attente', 'Annulé', 'Terminé'];
  const typeOptions = ['Consultation initiale', 'Suivi de dossier', 'Consultation finale', 'Autre'];

  // 🔴 FONCTION DE TRI
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    console.log(`🔄 Tri des rendez-vous par ${key} en ordre ${direction}`);
  };

  // 🔴 FONCTION POUR TRIER LES DONNÉES
  const getSortedRendezVous = (rendezVousList) => {
    if (!sortConfig.key) {
      return rendezVousList;
    }

    return [...rendezVousList].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Gestion spéciale pour les différents types de données
      switch(sortConfig.key) {
        case 'client':
        case 'conseillere':
        case 'type':
          // Tri alphabétique pour texte
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
          break;
        
        case 'date':
          // Tri par date
          aValue = new Date(aValue || '1900-01-01');
          bValue = new Date(bValue || '1900-01-01');
          break;
        
        case 'heureDebut':
          // Tri par heure de début
          aValue = aValue ? `${a.date} ${a.heureDebut}` : '1900-01-01 00:00';
          bValue = bValue ? `${b.date} ${b.heureDebut}` : '1900-01-01 00:00';
          aValue = new Date(aValue);
          bValue = new Date(bValue);
          break;
        
        case 'statut':
          // Tri par statut avec ordre logique
          const statutOrder = {
            'en attente': 0,
            'confirmé': 1,
            'terminé': 2,
            'annulé': 3
          };
          aValue = statutOrder[aValue?.toLowerCase()] ?? 999;
          bValue = statutOrder[bValue?.toLowerCase()] ?? 999;
          break;
        
        default:
          // Tri alphabétique par défaut
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
          break;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 🔴 FONCTION POUR AFFICHER L'ICÔNE DE TRI
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="sort-icon" title="Cliquer pour trier">⇵</span>; // Icône neutre
    }
    return (
      <span className="sort-icon active" title={`Trié par ${columnKey} (${sortConfig.direction === 'asc' ? 'croissant' : 'décroissant'})`}>
        {sortConfig.direction === 'asc' ? '▴' : '▾'}
      </span>
    );
  };
  
  // Charger les rendez-vous depuis l'API
  useEffect(() => {
    const loadRendezVous = async () => {
      try {
        setIsLoadingRendezVous(true);
        console.log('🔄 Chargement des rendez-vous...');
        
        const result = await rendezVousAPI.getAllRendezVous();
        
        if (result.success && result.data && result.data.rendezVous) {
          console.log('📥 Données brutes reçues de l\'API:', result.data);
          
          // Transformer les données de la base (snake_case) vers le format frontend (camelCase)
          const transformedData = result.data.rendezVous.map(rdv => ({
            id: rdv.id,
            client: rdv.client_nom,
            conseillere: rdv.conseillere_nom,
            date: rdv.date_rdv,
            heureDebut: rdv.heure_debut ? rdv.heure_debut.substring(0, 5) : '', // Enlever les secondes
            heureFin: rdv.heure_fin ? rdv.heure_fin.substring(0, 5) : '', // Enlever les secondes
            type: rdv.type_rdv,
            statut: rdv.statut,
            notes: rdv.notes || ''
          }));
          
          setRendezVous(transformedData);
          console.log('✅ Rendez-vous chargés et transformés:', transformedData);
          console.log(`📋 Total: ${transformedData.length} rendez-vous chargés`);
        } else {
          setRendezVous([]);
          console.warn('⚠️ Aucun rendez-vous trouvé dans la réponse:', result);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des rendez-vous:', error);
        setRendezVous([]);
      } finally {
        setIsLoadingRendezVous(false);
      }
    };

    loadRendezVous();
  }, []);

  // Charger les conseillères depuis l'API
  useEffect(() => {
    const loadConseillers = async () => {
      try {
        setIsLoadingConseillers(true);
        console.log('🔄 Chargement des conseillères dans RendezVous...');
        
        const result = await getConseillers();
        
        if (result.success && result.data) {
          // Transformer les données en format attendu pour les options
          const conseillersList = result.data.map(conseiller => conseiller.nomComplet);
          setConseilleresOptions(conseillersList);
          console.log('✅ Conseillères chargées dans RendezVous:', conseillersList);
        } else {
          // En cas d'erreur, utiliser la liste par défaut
          setConseilleresOptions(['Marie Tremblay', 'Sophie Martin', 'Julie Lefebvre']);
          console.warn('⚠️ Utilisation de la liste par défaut des conseillères');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des conseillères dans RendezVous:', error);
        // Liste de secours
        setConseilleresOptions(['Marie Tremblay', 'Sophie Martin', 'Julie Lefebvre']);
      } finally {
        setIsLoadingConseillers(false);
      }
    };

    loadConseillers();
  }, []);

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté
  useEffect(() => {
    // Attendre que les conseillères soient chargées et que le champ ne soit pas déjà rempli
    if (!isLoadingConseillers && conseilleresOptions.length > 0 && !nouveauRdv.conseillere) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré:', userName);
      console.log('📋 Liste des conseillères disponibles:', conseilleresOptions);
      
      if (userName) {
        // Chercher l'utilisateur connecté dans la liste des conseillères
        const userInList = conseilleresOptions.find(conseillere => 
          conseillere.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(conseillere.toLowerCase())
        );
        
        if (userInList) {
          console.log('✅ Préremplissage du champ conseillère avec:', userInList);
          setNouveauRdv(prev => ({
            ...prev,
            conseillere: userInList
          }));
        } else {
          console.log('⚠️ Utilisateur connecté non trouvé dans la liste des conseillères:', {
            userName,
            conseilleresOptions,
            recherchePartielle: conseilleresOptions.filter(c => 
              c.toLowerCase().includes(userName.toLowerCase()) || 
              userName.toLowerCase().includes(c.toLowerCase())
            )
          });
        }
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage');
      }
    }
  }, [isLoadingConseillers, conseilleresOptions, nouveauRdv.conseillere]);

  // Charger les clients depuis l'API
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoadingClients(true);
        console.log('🔄 Chargement des clients dans RendezVous...');
        
        const result = await clientsAPI.getAllClients();
        
        if (result.success && result.data && result.data.clients) {
          // Stocker les données complètes des clients pour la recherche
          setClientsOptions(result.data.clients);
          console.log('✅ Clients chargés dans RendezVous:', result.data.clients.length, 'clients');
        } else {
          // En cas d'erreur, utiliser une liste par défaut
          setClientsOptions([]);
          console.warn('⚠️ Aucun client chargé');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des clients dans RendezVous:', error);
        setClientsOptions([]);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  // Charger les leads depuis l'API
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setIsLoadingLeads(true);
        console.log('🔄 Chargement des leads dans RendezVous...');
        
        const result = await getAllLeads();
        
        if (result.success && result.data && result.data.leads) {
          // Stocker les données complètes des leads pour la recherche
          setLeadsOptions(result.data.leads);
          console.log('✅ Leads chargés dans RendezVous:', result.data.leads.length, 'leads');
        } else {
          // En cas d'erreur, utiliser une liste vide
          setLeadsOptions([]);
          console.warn('⚠️ Aucun lead chargé');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des leads dans RendezVous:', error);
        setLeadsOptions([]);
      } finally {
        setIsLoadingLeads(false);
      }
    };

    loadLeads();
  }, []);

  // Gérer les clics en dehors de la dropdown pour la fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClientDropdown && !event.target.closest('.client-search-container')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);
  
  // Filtrer les rendez-vous
  const rdvFiltres = rendezVous.filter(rdv => {
    const conseillerMatch = filtres.conseillere === '' || rdv.conseillere === filtres.conseillere;
    const statutMatch = filtres.statut === '' || rdv.statut === filtres.statut;
    const dateMatch = filtres.date === '' || rdv.date === filtres.date;
    const typeMatch = filtres.type === '' || rdv.type === filtres.type;
    
    const isVisible = conseillerMatch && statutMatch && dateMatch && typeMatch;
    
    // Debug: Afficher les informations de filtrage pour chaque rendez-vous
    if (!isVisible) {
      console.log(`🔍 RDV ${rdv.id} filtré:`, {
        rdv: `${rdv.client} - ${rdv.date} ${rdv.heureDebut}`,
        conseillerMatch: `${rdv.conseillere} vs ${filtres.conseillere} = ${conseillerMatch}`,
        statutMatch: `${rdv.statut} vs ${filtres.statut} = ${statutMatch}`,
        dateMatch: `${rdv.date} vs ${filtres.date} = ${dateMatch}`,
        typeMatch: `${rdv.type} vs ${filtres.type} = ${typeMatch}`
      });
    }
    
    return isVisible;
  });
  
  // Debug: Afficher les informations sur le filtrage
  console.log(`📊 Filtrage: ${rendezVous.length} total → ${rdvFiltres.length} affichés`, {
    filtres,
    totalRendezVous: rendezVous.length,
    rendezVousAffiches: rdvFiltres.length
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
      conseillere: '',
      statut: '',
      date: '',
      type: ''
    });
  };
  
  // Gérer les changements dans le formulaire de nouveau rendez-vous
  const handleNouveauRdvChange = (e) => {
    const { name, value } = e.target;
    setNouveauRdv({
      ...nouveauRdv,
      [name]: value
    });
  };

  // Gérer la recherche de clients et leads
  const handleRechercheClientChange = (e) => {
    const value = e.target.value;
    setRechercheClient(value);
    
    if (value.trim() === '') {
      setResultsRecherches([]);
      setShowClientDropdown(false);
      return;
    }
    
    const searchTerm = value.toLowerCase();
    const results = [];
    
    // Rechercher dans les clients
    clientsOptions.forEach(client => {
      const nomComplet = `${client.prenom} ${client.nom}`;
      const telephone = client.telephone || '';
      
      if (nomComplet.toLowerCase().includes(searchTerm) || telephone.includes(searchTerm)) {
        results.push({
          type: 'client',
          id: client.id,
          nom: nomComplet,
          telephone: client.telephone,
          email: client.email,
          data: client
        });
      }
    });
    
    // Rechercher dans les leads
    leadsOptions.forEach(lead => {
      const nomComplet = `${lead.prenom} ${lead.nom}`;
      const telephone = lead.telephone || '';
      
      if (nomComplet.toLowerCase().includes(searchTerm) || telephone.includes(searchTerm)) {
        results.push({
          type: 'lead',
          id: lead.id,
          nom: nomComplet,
          telephone: lead.telephone,
          email: lead.email,
          data: lead
        });
      }
    });
    
    // Trier les résultats : clients d'abord, puis leads
    results.sort((a, b) => {
      if (a.type === 'client' && b.type === 'lead') return -1;
      if (a.type === 'lead' && b.type === 'client') return 1;
      return a.nom.localeCompare(b.nom);
    });
    
    setResultsRecherches(results);
    setShowClientDropdown(true);
    console.log('🔍 Recherche:', searchTerm, '- Résultats:', results.length, '(', results.filter(r => r.type === 'client').length, 'clients,', results.filter(r => r.type === 'lead').length, 'leads)');
  };

  // Sélectionner un client ou lead depuis les résultats de recherche
  const selectClient = (result) => {
    const nomComplet = result.nom;
    
    setNouveauRdv({
      ...nouveauRdv,
      client: nomComplet,
      client_type: result.type, // Ajouter le type pour la création du RDV
      client_id: result.id // Ajouter l'ID pour la création du RDV
    });
    setRechercheClient(nomComplet);
    setShowClientDropdown(false);
    setResultsRecherches([]);
    
    console.log('✅ Sélectionné:', result.type, '-', nomComplet, '(ID:', result.id, ')');
  };

  // Réinitialiser la recherche de client
  const resetRechercheClient = () => {
    setRechercheClient('');
    setResultsRecherches([]);
    setShowClientDropdown(false);
    setNouveauRdv({
      ...nouveauRdv,
      client: '',
      client_type: '',
      client_id: ''
    });
  };

  // Fonction pour réinitialiser intelligemment le formulaire (préserve la conseillère)
  const resetFormulaire = () => {
    const userName = localStorage.getItem('userName');
    let conseillerePreremplie = '';
    
    // Garder la conseillère préremplie si elle correspond à l'utilisateur connecté
    if (userName && conseilleresOptions.length > 0) {
      const userInList = conseilleresOptions.find(conseillere => 
        conseillere.toLowerCase().includes(userName.toLowerCase()) ||
        userName.toLowerCase().includes(conseillere.toLowerCase())
      );
      if (userInList) {
        conseillerePreremplie = userInList;
      }
    }
    
    setNouveauRdv({
      client: '',
      conseillere: conseillerePreremplie,
      date: '',
      heureDebut: '',
      heureFin: '',
      type: '',
      notes: '',
      client_type: '',
      client_id: ''
    });
    
    // Réinitialiser aussi la recherche de client
    setRechercheClient('');
    setResultsRecherches([]);
    setShowClientDropdown(false);
    
    console.log('🔄 Formulaire réinitialisé avec conseillère préremplie:', conseillerePreremplie);
  };

  // Fonction pour ouvrir la modal avec préremplissage automatique
  const ouvrirModalRendezVous = () => {
    setShowModal(true);
    // Déclencher le préremplissage après l'ouverture de la modal
    setTimeout(() => {
      if (!isLoadingConseillers && conseilleresOptions.length > 0) {
        const userName = localStorage.getItem('userName');
        if (userName) {
          const userInList = conseilleresOptions.find(conseillere => 
            conseillere.toLowerCase().includes(userName.toLowerCase()) ||
            userName.toLowerCase().includes(conseillere.toLowerCase())
          );
          
          if (userInList && !nouveauRdv.conseillere) {
            console.log('✅ Préremplissage manuel du champ conseillère:', userInList);
            setNouveauRdv(prev => ({
              ...prev,
              conseillere: userInList
            }));
          }
        }
      }
    }, 100); // Petit délai pour s'assurer que la modal est complètement ouverte
    
    resetRechercheClient();
  };

  // Fonction pour fermer la modal avec réinitialisation intelligente
  const fermerModal = () => {
    setShowModal(false);
    resetFormulaire();
  };
  
  // Ajouter un nouveau rendez-vous
  const ajouterRendezVous = async (e) => {
    e.preventDefault();
    
    try {
      // Vérifier que tous les champs requis sont remplis
      if (!nouveauRdv.client || !nouveauRdv.conseillere || !nouveauRdv.date || !nouveauRdv.heureDebut || !nouveauRdv.heureFin || !nouveauRdv.type) {
        alert('Veuillez remplir tous les champs obligatoires.');
        console.log('❌ Champs manquants:', {
          client: !nouveauRdv.client,
          conseillere: !nouveauRdv.conseillere,
          date: !nouveauRdv.date,
          heureDebut: !nouveauRdv.heureDebut,
          heureFin: !nouveauRdv.heureFin,
          type: !nouveauRdv.type
        });
        return;
      }
      
      // Vérifier la disponibilité avant d'envoyer
      if (!verifierDisponibilite()) {
        alert('Conflit d\'horaire détecté ! La conseillère a déjà un rendez-vous à cette heure.');
        return;
      }

      console.log('🔄 Création du rendez-vous...');
      console.log('📋 Données du formulaire:', nouveauRdv);
      
      // Transformer les données du frontend (camelCase) vers le format API (snake_case)
      const dataToSend = {
        client_nom: nouveauRdv.client,
        client_id: nouveauRdv.client_id || null, // Ajouter l'ID du client/lead
        client_type: nouveauRdv.client_type || 'client', // Indiquer le type (client ou lead)
        conseillere_nom: nouveauRdv.conseillere,
        date_rdv: nouveauRdv.date,
        heure_debut: nouveauRdv.heureDebut,
        heure_fin: nouveauRdv.heureFin,
        type_rdv: nouveauRdv.type,
        statut: 'Confirmé',
        notes: nouveauRdv.notes || ''
      };
      
      console.log('📤 Données à envoyer à l\'API:', dataToSend);
      
      const result = await rendezVousAPI.createRendezVous(dataToSend);
      
      if (result.success && result.data) {
        console.log('📥 Réponse complète de l\'API création:', result);
        console.log('📥 Données de creation dans result.data:', result.data);
        
        // Vérifier la structure de la réponse
        const rdvData = result.data.rendezVous || result.data;
        console.log('📋 Données RDV extraites:', rdvData);
        
        // Transformer la réponse de l'API vers le format frontend
        const newRdv = {
          id: rdvData.id,
          client: rdvData.client_nom,
          conseillere: rdvData.conseillere_nom,
          date: rdvData.date_rdv,
          heureDebut: rdvData.heure_debut ? rdvData.heure_debut.substring(0, 5) : nouveauRdv.heureDebut,
          heureFin: rdvData.heure_fin ? rdvData.heure_fin.substring(0, 5) : nouveauRdv.heureFin,
          type: rdvData.type_rdv,
          statut: rdvData.statut,
          notes: rdvData.notes || ''
        };
        
        // Ajouter le nouveau rendez-vous à la liste locale
        setRendezVous([...rendezVous, newRdv]);
        
        // Réinitialiser le formulaire avec préremplissage de la conseillère
        resetFormulaire();
        
        setShowModal(false);
        console.log('✅ Rendez-vous créé avec succès:', newRdv);
        alert('Rendez-vous créé avec succès !');
        
        // Recharger la liste complète des rendez-vous depuis le serveur
        // pour s'assurer que l'affichage est à jour
        try {
          console.log('🔄 Rechargement de la liste des rendez-vous...');
          const refreshResult = await rendezVousAPI.getAllRendezVous();
          if (refreshResult.success && refreshResult.data && refreshResult.data.rendezVous) {
            const refreshedData = refreshResult.data.rendezVous.map(rdv => ({
              id: rdv.id,
              client: rdv.client_nom,
              conseillere: rdv.conseillere_nom,
              date: rdv.date_rdv,
              heureDebut: rdv.heure_debut ? rdv.heure_debut.substring(0, 5) : '',
              heureFin: rdv.heure_fin ? rdv.heure_fin.substring(0, 5) : '',
              type: rdv.type_rdv,
              statut: rdv.statut,
              notes: rdv.notes || ''
            }));
            setRendezVous(refreshedData);
            console.log('✅ Liste des rendez-vous rechargée:', refreshedData.length, 'éléments');
          }
        } catch (refreshError) {
          console.warn('⚠️ Erreur lors du rechargement des rendez-vous:', refreshError);
        }
      } else {
        console.error('❌ Erreur lors de la création:', result.message);
        alert(`Erreur lors de la création: ${result.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      if (error.response && error.response.data) {
        console.error('❌ Détails de l\'erreur serveur:', error.response.data);
        alert(`Erreur: ${error.response.data.message || JSON.stringify(error.response.data)}`);
      } else if (error.message) {
        alert(`Erreur réseau: ${error.message}`);
      } else {
        alert('Erreur lors de la création du rendez-vous - voir console pour détails');
      }
    }
  };
  
  // Voir les détails d'un rendez-vous
  const voirDetails = (rdv) => {
    setRdvDetails(rdv);
    setShowDetailsModal(true);
  };
  
  // Changer le statut d'un rendez-vous
  const changerStatut = async (id, nouveauStatut) => {
    try {
      console.log(`🔄 Mise à jour du statut du rendez-vous ${id} vers ${nouveauStatut}...`);
      
      const rdvToUpdate = rendezVous.find(rdv => rdv.id === id);
      if (!rdvToUpdate) {
        console.error('Rendez-vous non trouvé:', id);
        return;
      }

      // Transformer les données du frontend vers le format API
      const dataToSend = {
        client_nom: rdvToUpdate.client,
        conseillere_nom: rdvToUpdate.conseillere,
        date_rdv: rdvToUpdate.date,
        heure_debut: rdvToUpdate.heureDebut,
        heure_fin: rdvToUpdate.heureFin,
        type_rdv: rdvToUpdate.type,
        statut: nouveauStatut,
        notes: rdvToUpdate.notes || ''
      };

      const result = await rendezVousAPI.updateRendezVous(id, dataToSend);
      
      if (result.success && result.data) {
        // Mettre à jour la liste locale
        const updatedRendezVous = rendezVous.map(rdv => {
          if (rdv.id === id) {
            return { 
              ...rdv, 
              statut: nouveauStatut
            };
          }
          return rdv;
        });
        setRendezVous(updatedRendezVous);
        
        // Mettre à jour les détails si ouverts
        if (rdvDetails && rdvDetails.id === id) {
          setRdvDetails({
            ...rdvDetails,
            statut: nouveauStatut
          });
        }
        
        console.log('✅ Statut mis à jour avec succès');
        
        // Message de confirmation pour l'utilisateur
        const messages = {
          'En attente': 'Rendez-vous mis en attente',
          'Confirmé': 'Rendez-vous confirmé', 
          'Terminé': 'Rendez-vous marqué comme terminé',
          'Annulé': 'Rendez-vous annulé'
        };
        
        // Petite notification discrète
        const notification = document.createElement('div');
        notification.textContent = `✅ ${messages[nouveauStatut] || 'Statut mis à jour'}`;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          z-index: 9999;
          font-size: 14px;
          font-weight: 500;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
        
      } else {
        console.error('❌ Erreur lors de la mise à jour:', result.message);
        alert(`Erreur lors de la mise à jour: ${result.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };
  
  // Vérifier si deux rendez-vous se chevauchent
  const verifierChevauchement = (date, heureDebut, heureFin, conseillere, rdvId = null) => {
    return rendezVous.some(rdv => {
      if (rdv.id === rdvId || rdv.statut === 'Annulé') return false;
      
      if (rdv.date === date && rdv.conseillere === conseillere) {
        const debutA = new Date(`${date}T${heureDebut}`);
        const finA = new Date(`${date}T${heureFin}`);
        const debutB = new Date(`${date}T${rdv.heureDebut}`);
        const finB = new Date(`${date}T${rdv.heureFin}`);
        
        return (debutA < finB && finA > debutB);
      }
      
      return false;
    });
  };
  
  // Vérifier la disponibilité lors de la sélection d'une date/heure
  const verifierDisponibilite = () => {
    if (nouveauRdv.date && nouveauRdv.heureDebut && nouveauRdv.heureFin && nouveauRdv.conseillere) {
      const chevauchement = verifierChevauchement(
        nouveauRdv.date, 
        nouveauRdv.heureDebut, 
        nouveauRdv.heureFin, 
        nouveauRdv.conseillere
      );
      
      return !chevauchement;
    }
    return true;
  };
  
  // Formater la date
  const formaterDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-CA', options);
  };
  
  // Générer les créneaux horaires disponibles
  const genererCreneaux = () => {
    const creneaux = [];
    for (let h = 9; h <= 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        const heure = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        creneaux.push(heure);
      }
    }
    return creneaux;
  };
  
  const creneauxHoraires = genererCreneaux();
  
  // Obtenir la couleur de statut
  const getStatutColor = (statut) => {
    switch(statut) {
      case 'Confirmé': return 'statut-confirme';
      case 'En attente': return 'statut-en-attente';
      case 'Annulé': return 'statut-annule';
      case 'Terminé': return 'statut-termine';
      default: return '';
    }
  };
  
  // Générer le calendrier hebdomadaire
  const genererCalendrier = () => {
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(aujourdhui.getDate() - aujourdhui.getDay() + 1); // Lundi
    
    const jours = [];
    for (let i = 0; i < 5; i++) { // Lundi à vendredi
      const jour = new Date(debutSemaine);
      jour.setDate(debutSemaine.getDate() + i);
      jours.push(jour);
    }
    
    return (
      <div className="calendrier-container">
        <div className="calendrier-header">
          <div className="calendrier-heure-col"></div>
          {jours.map((jour, index) => (
            <div key={index} className="calendrier-jour-col">
              <div className="calendrier-jour-header">
                {jour.toLocaleDateString('fr-CA', { weekday: 'long' })}
                <div className="calendrier-jour-date">
                  {jour.toLocaleDateString('fr-CA', { day: 'numeric', month: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="calendrier-body">
          {creneauxHoraires.map((creneau, index) => (
            <div key={index} className="calendrier-row">
              <div className="calendrier-heure-col">{creneau}</div>
              
              {jours.map((jour, jourIndex) => {
                const dateStr = jour.toISOString().split('T')[0];
                const rdvsJour = rdvFiltres.filter(rdv => 
                  rdv.date === dateStr && 
                  rdv.heureDebut <= creneau && 
                  rdv.heureFin > creneau
                );
                
                return (
                  <div key={jourIndex} className="calendrier-jour-col">
                    {rdvsJour.map(rdv => {
                      const isStart = rdv.heureDebut === creneau;
                      if (!isStart) return null;
                      
                      const debutIndex = creneauxHoraires.indexOf(rdv.heureDebut);
                      const finIndex = creneauxHoraires.indexOf(rdv.heureFin);
                      const duree = finIndex - debutIndex;
                      
                      return (
                        <div 
                          key={rdv.id} 
                          className={`calendrier-event ${getStatutColor(rdv.statut)}`}
                          style={{ height: `${duree * 30}px` }}
                          onClick={() => voirDetails(rdv)}
                        >
                          <div className="calendrier-event-header">
                            {rdv.heureDebut} - {rdv.heureFin}
                          </div>
                          <div className="calendrier-event-client">{rdv.client}</div>
                          <div className="calendrier-event-type">{rdv.type}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="rendez-vous-container">
      <div className="rendez-vous-header">
        <h2>Gestion des Rendez-vous</h2>
        <div className="header-actions">
          <div className="vue-toggle">
            <button 
              className={`btn-toggle ${vue === 'liste' ? 'active' : ''}`} 
              onClick={() => setVue('liste')}
            >
              Liste
            </button>
            <button 
              className={`btn-toggle ${vue === 'calendrier' ? 'active' : ''}`} 
              onClick={() => setVue('calendrier')}
            >
              Calendrier
            </button>
          </div>
          <button className="btn-primary" onClick={ouvrirModalRendezVous}>
            <span>+</span> Nouveau Rendez-vous
          </button>
        </div>
      </div>
      
      <div className="filtres-container">
        <div className="filtre-group">
          <label>Conseillère:</label>
          <select 
            name="conseillere" 
            value={filtres.conseillere} 
            onChange={handleFiltreChange}
            disabled={isLoadingConseillers}
          >
            <option value="">
              {isLoadingConseillers ? 'Chargement...' : 'Toutes'}
            </option>
            {conseilleresOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
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
          <label>Date:</label>
          <input 
            type="date" 
            name="date" 
            value={filtres.date} 
            onChange={handleFiltreChange}
          />
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
        
        <button className="btn-secondary" onClick={resetFiltres}>
          Réinitialiser
        </button>
      </div>
      
      {vue === 'liste' ? (
        <div className="rdv-table-container">
          <table className="rdv-table">
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('client')}
                  className={sortConfig.key === 'client' ? 'sorted' : ''}
                >
                  Client {getSortIcon('client')}
                </th>
                <th 
                  onClick={() => handleSort('conseillere')}
                  className={sortConfig.key === 'conseillere' ? 'sorted' : ''}
                >
                  Conseillère {getSortIcon('conseillere')}
                </th>
                <th 
                  onClick={() => handleSort('date')}
                  className={sortConfig.key === 'date' ? 'sorted' : ''}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  onClick={() => handleSort('heureDebut')}
                  className={sortConfig.key === 'heureDebut' ? 'sorted' : ''}
                >
                  Heure {getSortIcon('heureDebut')}
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className={sortConfig.key === 'type' ? 'sorted' : ''}
                >
                  Type {getSortIcon('type')}
                </th>
                <th 
                  onClick={() => handleSort('statut')}
                  className={sortConfig.key === 'statut' ? 'sorted' : ''}
                >
                  Statut {getSortIcon('statut')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRendezVous ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    🔄 Chargement des rendez-vous...
                  </td>
                </tr>
              ) : rdvFiltres.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    Aucun rendez-vous trouvé
                  </td>
                </tr>
              ) : (
                getSortedRendezVous(rdvFiltres).map(rdv => (
                <tr key={rdv.id}>
                  <td>{rdv.client}</td>
                  <td>{rdv.conseillere}</td>
                  <td>{formaterDate(rdv.date)}</td>
                  <td>{rdv.heureDebut} - {rdv.heureFin}</td>
                  <td>{rdv.type}</td>
                  <td>
                    <div className="statut-container">
                      <select 
                        className={`statut-select ${getStatutColor(rdv.statut)}`}
                        value={rdv.statut}
                        onChange={(e) => {
                          const nouveauStatut = e.target.value;
                          if (rdv.statut !== nouveauStatut) {
                            const confirmationNeeded = 
                              (nouveauStatut === 'Annulé' && rdv.statut === 'Confirmé') ||
                              (nouveauStatut === 'Terminé');
                            
                            if (confirmationNeeded) {
                              const message = nouveauStatut === 'Annulé' 
                                ? `Êtes-vous sûr de vouloir annuler le rendez-vous avec ${rdv.client} ?`
                                : `Êtes-vous sûr de marquer ce rendez-vous avec ${rdv.client} comme terminé ?`;
                              
                              if (window.confirm(message)) {
                                changerStatut(rdv.id, nouveauStatut);
                              } else {
                                // Reset the select to original value
                                e.target.value = rdv.statut;
                              }
                            } else {
                              changerStatut(rdv.id, nouveauStatut);
                            }
                          }
                        }}
                        title="Cliquez pour changer le statut"
                      >
                        {statutOptions.map(statut => (
                          <option key={statut} value={statut}>{statut}</option>
                        ))}
                      </select>
                      <span className={`statut-badge ${getStatutColor(rdv.statut)}`}>
                        {rdv.statut}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-dropdown">
                      <button className="btn-action">Actions</button>
                      <div className="dropdown-content">
                        <button onClick={() => voirDetails(rdv)}>Voir détails</button>
                        <button onClick={() => changerStatut(rdv.id, 'En attente')}>
                          → En attente
                        </button>
                        <button onClick={() => changerStatut(rdv.id, 'Confirmé')}>
                          → Confirmé
                        </button>
                        <button onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de marquer ce rendez-vous avec ${rdv.client} comme terminé ?`)) {
                            changerStatut(rdv.id, 'Terminé');
                          }
                        }}>
                          → Terminé
                        </button>
                        <button onClick={() => {
                          if (window.confirm(`Êtes-vous sûr de vouloir annuler le rendez-vous avec ${rdv.client} ?`)) {
                            changerStatut(rdv.id, 'Annulé');
                          }
                        }}>
                          → Annulé
                        </button>
                      </div>
                    </div>
                  </td>                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        genererCalendrier()
      )}
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ajouter un nouveau rendez-vous</h3>
              <button className="close-btn" onClick={fermerModal}>×</button>
            </div>
            <form onSubmit={ajouterRendezVous}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client:</label>
                  <div className="client-search-container">
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        name="client-search"
                        placeholder={
                          (isLoadingClients || isLoadingLeads) 
                            ? 'Chargement des données...' 
                            : 'Rechercher un client ou lead (nom ou téléphone)...'
                        }
                        value={rechercheClient}
                        onChange={handleRechercheClientChange}
                        disabled={isLoadingClients || isLoadingLeads}
                        required
                        autoComplete="off"
                      />
                      {/* Champ caché pour la validation du formulaire */}
                      <input
                        type="hidden"
                        name="client"
                        value={nouveauRdv.client}
                        required
                      />
                      {rechercheClient && (
                        <button
                          type="button"
                          className="clear-search-btn"
                          onClick={resetRechercheClient}
                          title="Effacer la recherche"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {showClientDropdown && resultsRecherches.length > 0 && (
                      <div className="clients-dropdown">
                        {resultsRecherches.slice(0, 10).map((result, index) => (
                          <div
                            key={index}
                            className={`client-dropdown-item ${result.type}`}
                            onClick={() => selectClient(result)}
                          >
                            <div className="result-info">
                              <div className="result-name">
                                <span className={`type-badge ${result.type}`}>
                                  {result.type === 'client' ? '👤' : '🎯'}
                                </span>
                                {result.nom}
                              </div>
                              <div className="result-details">
                                {result.telephone && (
                                  <span className="result-phone">📞 {result.telephone}</span>
                                )}
                                {result.email && (
                                  <span className="result-email">✉️ {result.email}</span>
                                )}
                              </div>
                            </div>
                            <div className="result-type">
                              {result.type === 'client' ? 'Client' : 'Lead'}
                            </div>
                          </div>
                        ))}
                        {resultsRecherches.length > 10 && (
                          <div className="client-dropdown-info">
                            +{resultsRecherches.length - 10} autres résultats...
                          </div>
                        )}
                      </div>
                    )}
                    
                    {showClientDropdown && resultsRecherches.length === 0 && rechercheClient.trim() !== '' && !isLoadingClients && !isLoadingLeads && (
                      <div className="clients-dropdown">
                        <div className="client-dropdown-no-results">
                          Aucun client ou lead trouvé
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Conseillère:</label>
                  <select 
                    name="conseillere" 
                    value={nouveauRdv.conseillere} 
                    onChange={handleNouveauRdvChange}
                    required
                    disabled={isLoadingConseillers}
                  >
                    <option value="">
                      {isLoadingConseillers ? 'Chargement des conseillères...' : 'Sélectionner une conseillère'}
                    </option>
                    {conseilleresOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={nouveauRdv.date} 
                    onChange={handleNouveauRdvChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Type:</label>
                  <select 
                    name="type" 
                    value={nouveauRdv.type} 
                    onChange={handleNouveauRdvChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {typeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Heure de début:</label>
                  <select 
                    name="heureDebut" 
                    value={nouveauRdv.heureDebut} 
                    onChange={handleNouveauRdvChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {creneauxHoraires.slice(0, -1).map(creneau => (
                      <option key={creneau} value={creneau}>{creneau}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Heure de fin:</label>
                  <select 
                    name="heureFin" 
                    value={nouveauRdv.heureFin} 
                    onChange={handleNouveauRdvChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {creneauxHoraires.slice(1).map(creneau => (
                      <option 
                        key={creneau} 
                        value={creneau}
                        disabled={nouveauRdv.heureDebut && creneau <= nouveauRdv.heureDebut}
                      >
                        {creneau}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {!verifierDisponibilite() && (
                <div className="alert alert-danger">
                  Attention : Cette conseillère a déjà un rendez-vous à ce créneau horaire.
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Notes:</label>
                  <textarea 
                    name="notes" 
                    value={nouveauRdv.notes} 
                    onChange={handleNouveauRdvChange}
                  ></textarea>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={fermerModal}>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!verifierDisponibilite()}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && rdvDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails du rendez-vous</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="rdv-details">
              <div className="rdv-info">
                <h4>Informations générales</h4>
                <p><strong>Client:</strong> {rdvDetails.client}</p>
                <p><strong>Conseillère:</strong> {rdvDetails.conseillere}</p>
                <p><strong>Date:</strong> {formaterDate(rdvDetails.date)}</p>
                <p><strong>Heure:</strong> {rdvDetails.heureDebut} - {rdvDetails.heureFin}</p>
                <p><strong>Type:</strong> {rdvDetails.type}</p>
                <p><strong>Statut:</strong> 
                  <span className={`statut-badge ${getStatutColor(rdvDetails.statut)}`}>
                    {rdvDetails.statut}
                  </span>
                </p>
                <p><strong>Notes:</strong> {rdvDetails.notes || 'Aucune note'}</p>
              </div>
              
              <div className="rdv-actions">
                <h4>Changer le statut</h4>
                <div className="statut-buttons">
                  <button 
                    className={`btn-statut ${rdvDetails.statut === 'En attente' ? 'active' : ''}`}
                    onClick={() => {
                      if (rdvDetails.statut !== 'En attente') {
                        changerStatut(rdvDetails.id, 'En attente');
                      }
                    }}
                    disabled={rdvDetails.statut === 'En attente'}
                  >
                    En attente
                  </button>
                  
                  <button 
                    className={`btn-statut ${rdvDetails.statut === 'Confirmé' ? 'active' : ''}`}
                    onClick={() => {
                      if (rdvDetails.statut !== 'Confirmé') {
                        changerStatut(rdvDetails.id, 'Confirmé');
                      }
                    }}
                    disabled={rdvDetails.statut === 'Confirmé'}
                  >
                    Confirmé
                  </button>
                  
                  <button 
                    className={`btn-statut ${rdvDetails.statut === 'Terminé' ? 'active' : ''}`}
                    onClick={() => {
                      if (rdvDetails.statut !== 'Terminé') {
                        if (window.confirm(`Êtes-vous sûr de marquer ce rendez-vous avec ${rdvDetails.client} comme terminé ?`)) {
                          changerStatut(rdvDetails.id, 'Terminé');
                        }
                      }
                    }}
                    disabled={rdvDetails.statut === 'Terminé'}
                  >
                    Terminé
                  </button>
                  
                  <button 
                    className={`btn-statut btn-danger ${rdvDetails.statut === 'Annulé' ? 'active' : ''}`}
                    onClick={() => {
                      if (rdvDetails.statut !== 'Annulé') {
                        if (window.confirm(`Êtes-vous sûr de vouloir annuler le rendez-vous avec ${rdvDetails.client} ?`)) {
                          changerStatut(rdvDetails.id, 'Annulé');
                        }
                      }
                    }}
                    disabled={rdvDetails.statut === 'Annulé'}
                  >
                    Annulé
                  </button>
                </div>
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

export default RendezVous;
