import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ClientForm.css';
import '../styles/Notes.css';
import clientsAPI from '../services/clientsAPI';
import { getConseillers } from '../services/conseillerAPI';
import axios from 'axios';

function AddClient() {
  const navigate = useNavigate();
  const { id } = useParams(); // Récupérer l'ID de l'URL pour savoir si on est en mode édition
  const isEditMode = Boolean(id); // true si on a un ID, false sinon
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('informations');
  const [saveStatus, setSaveStatus] = useState(''); // To show draft save status

  // État pour contrôler la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);
  
  // État pour l'info-bulle du dossier financier
  const [showFinancialTooltip, setShowFinancialTooltip] = useState(false);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);

  const initialClientData = {
    // Common fields
    nom: '',
    prenom: '',
    dateNaissance: '',
    email: '',
    telephone: '',
    adresse: '',
    nationalite: '',
    contactNom: '',
    contactPrenom: '',
    contactRelation: '',
    contactTelephone: '',
    contactEmail: '',
    loginClient: '',
    motDePasseClient: '',
    conseillere: '',
    urgent: false,
    statut: 'En attente',
    // Procedure selection
    typeProcedure: '',
    // Dynamic fields based on procedure type
    informationsSpecifiques: {},
    // Documents (local état uniquement)
    documents: [],
    // Notes (les documents sont gérés séparément via l'API dédiée)
    notes: []
  };

  const [clientData, setClientData] = useState(initialClientData);

  const API_BASE_URL = 'http://localhost:5000/api';

  const uploadDocument = async (clientId, typeDocument, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('typeDocument', typeDocument);

    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data?.document;
  };





  // Load draft from localStorage on component mount OR load editing client data
  useEffect(() => {
    if (isEditMode && id) {
      // Mode édition : charger les données du client depuis l'API
      const fetchClient = async () => {
        try {
          const response = await clientsAPI.getClientById(id);
          if (response && response.data) {
            const clientData = response.data;
            // Adapter les données du client au format du formulaire
            const formattedData = {
              nom: clientData.nom || '',
              prenom: clientData.prenom || '',
              dateNaissance: clientData.date_naissance || '',
              email: clientData.email || '',
              telephone: clientData.telephone || '',
              adresse: clientData.adresse || '',
              nationalite: clientData.nationalite || '',
              contactNom: clientData.contact_nom || '',
              contactPrenom: clientData.contact_prenom || '',
              contactRelation: clientData.contact_relation || '',
              contactTelephone: clientData.contact_telephone || '',
              contactEmail: clientData.contact_email || '',
              loginClient: clientData.login_client || '',
              motDePasseClient: clientData.mot_de_passe_client || '',
              conseillere: clientData.conseillere || '',
              urgent: clientData.urgence || false,
              statut: clientData.statut || 'En attente',
              typeProcedure: clientData.type_procedure || '',
              informationsSpecifiques: (typeof clientData.informations_specifiques === 'string' && clientData.informations_specifiques.trim().startsWith('{'))
                ? JSON.parse(clientData.informations_specifiques)
                : (clientData.informations_specifiques || {}),
              documents: (()=>{
                 if (!clientData.documents || !Array.isArray(clientData.documents)) {
                   return [];
                 }
                 
                 // Obtenir la liste des documents requis pour cette procédure
                 let requiredDocs = [];
                 try {
                   const requiredDocsRaw = clientData.type_procedure ? 
                     getRequiredDocuments(clientData.type_procedure) : {};
                   requiredDocs = getDocumentsAsList(requiredDocsRaw);
                   
                   console.log('🔍 DÉBOGAGE Documents:');
                   console.log('   - Type procédure:', clientData.type_procedure);
                   console.log('   - Documents requis bruts:', requiredDocsRaw);
                   console.log('   - Documents requis liste:', requiredDocs);
                   console.log('   - Documents en base:', clientData.documents.map(d => d.type_document));
                 } catch (error) {
                   console.error('❌ Erreur lors de la récupération des documents requis:', error);
                   requiredDocs = [];
                 }
                 
                 return clientData.documents.map(d => {
                   const isAdditional = !requiredDocs.includes(d.type_document);
                   console.log(`   📄 "${d.type_document}" → ${isAdditional ? 'SUPPLÉMENTAIRE' : 'REQUIS'}`);
                   
                   return {
                     id: d.id,
                     nom: d.type_document,
                     fichier: d.nom_fichier,
                     statut: 'fourni',
                     dateUpload: d.date_televersement,
                     isAdditional: isAdditional
                   };
                 });
               })(),
              notes: (() => {
                if (Array.isArray(clientData.notes)) return clientData.notes;
                if (typeof clientData.notes === 'string') {
                  try { return JSON.parse(clientData.notes); } catch { return []; }
                }
                return [];
              })()
            };
            setClientData(formattedData);
            setSaveStatus('Données du client chargées pour modification.');
          }
        } catch (error) {
          console.error("Erreur lors du chargement des données client:", error);
          setSaveStatus('Erreur lors du chargement des données.');
        }
      };
      fetchClient();
    } else {
      // Mode ajout : charger le brouillon comme avant
      const savedDraft = localStorage.getItem('clientDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          // Basic check to ensure it's somewhat valid
          if (draftData && typeof draftData === 'object' && draftData.nom !== undefined) {
             // Ask user if they want to load the draft
             if (window.confirm("Un brouillon non enregistré a été trouvé. Voulez-vous le charger ?")) {
               setClientData(draftData);
               // Restore active tab if saved
               if (draftData.activeTab) {
                 setActiveTab(draftData.activeTab);
               }
               setSaveStatus('Brouillon chargé.');
             } else {
               // User chose not to load, clear the draft
               localStorage.removeItem('clientDraft');
               setSaveStatus('Brouillon ignoré.');
             }
          } else {
            localStorage.removeItem('clientDraft'); // Clear invalid draft
          }
        } catch (error) {
          console.error("Erreur lors du chargement du brouillon:", error);
          localStorage.removeItem('clientDraft'); // Clear corrupted draft
        }
      }
    }
  }, [isEditMode, id]);

  // État pour le téléversement de documents
  const [newDocument, setNewDocument] = useState({
    type: '',
    description: '',
    fichier: null
  });

  // État pour les notes
  const [newNote, setNewNote] = useState('');

  // État pour les conseillères (chargées dynamiquement depuis l'API)
  const [conseilleres, setConseilleres] = useState([]);
  const [isLoadingConseillers, setIsLoadingConseillers] = useState(true);

  // Procédure options - doivent correspondre exactement aux valeurs du modèle backend
  const procedureOptions = [
    'Visa visiteur',
    'Permis de travail',
    'Permis d\'études',
    'Investisseur',
    'Regroupement familial',
    'Résidence permanente',
    'Citoyenneté',
    'Autre'
  ];

  // Effet pour mettre à jour la liste des documents requis lorsque le type de procédure change
  useEffect(() => {
    // Only update if the procedure changes AND it's not part of loading a draft
    if (clientData.typeProcedure && !localStorage.getItem('clientDraft')) {
      const requiredDocsRaw = getRequiredDocuments(clientData.typeProcedure);
      const requiredDocs = getDocumentsAsList(requiredDocsRaw);
      setClientData(prevData => ({
        ...prevData,
        // Keep existing documents, add new required ones if not already present
        documents: [
          ...prevData.documents.filter(doc => !requiredDocs.includes(doc.nom) || doc.statut === 'fourni'), // Keep existing non-required or provided docs
          ...requiredDocs
            .filter(reqDoc => !prevData.documents.some(doc => doc.nom === reqDoc)) // Filter out already existing required docs
            .map(doc => ({ // Add new required docs
              id: Math.random().toString(36).substr(2, 9),
              nom: doc,
              statut: 'a_fournir',
              dateUpload: null,
              description: ''
            }))
        ]
      }));
    }
  }, [clientData.typeProcedure]);

  // Charger les conseillers depuis l'API
  useEffect(() => {
    const loadConseillers = async () => {
      try {
        setIsLoadingConseillers(true);
        console.log('🔄 Chargement des conseillers dans AddClient...');
        
        const result = await getConseillers();
        
        if (result.success && result.data) {
          // Transformer les données en format attendu par le composant
          const conseillersList = result.data.map(conseiller => ({
            id: conseiller.id,
            nom: conseiller.nomComplet
          }));
          setConseilleres(conseillersList);
          console.log('✅ Conseillers chargés dans AddClient:', conseillersList);
        } else {
          // En cas d'erreur, utiliser la liste par défaut
          const defaultList = result.data.map(conseiller => ({
            id: conseiller.id || Math.random(),
            nom: conseiller.nomComplet
          }));
          setConseilleres(defaultList);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des conseillers dans AddClient:', error);
        // Liste de secours
        setConseilleres([
          { id: 1, nom: 'wafaa chaouby' },
          { id: 2, nom: 'hame amni' },
          { id: 3, nom: 'sanaa sami' }
        ]);
      } finally {
        setIsLoadingConseillers(false);
      }
    };

    loadConseillers();
  }, []);

  // Afficher les informations de débogage pour les documents
  useEffect(() => {
    if (clientData.typeProcedure && clientData.documents && clientData.documents.length > 0) {
      const additionalDocs = clientData.documents.filter(d => d.isAdditional);
      const requiredDocs = clientData.documents.filter(d => !d.isAdditional);
      
      console.log('📄 Documents chargés:', {
        total: clientData.documents.length,
        requis: requiredDocs.length,
        supplémentaires: additionalDocs.length,
        détail: {
          supplémentaires: additionalDocs.map(d => d.nom),
          requis: requiredDocs.map(d => d.nom)
        }
      });
    }
  }, [clientData.documents]);

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté (uniquement en mode ajout)
  useEffect(() => {
    // Attendre que les conseillers soient chargés et que le champ ne soit pas déjà rempli
    // Ne préremplir qu'en mode ajout (pas en mode édition)
    if (!isLoadingConseillers && conseilleres.length > 0 && !clientData.conseillere && !isEditMode) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré (AddClient):', userName);
      console.log('📋 Liste des conseillers disponibles (AddClient):', conseilleres);
      
      if (userName) {
        // Chercher l'utilisateur connecté dans la liste des conseillers
        const userInList = conseilleres.find(conseiller => 
          conseiller.nom.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(conseiller.nom.toLowerCase())
        );
        
        if (userInList) {
          console.log('✅ Préremplissage du champ conseillère (AddClient) avec:', userInList.nom);
          setClientData(prev => ({
            ...prev,
            conseillere: userInList.nom
          }));
        } else {
          console.log('⚠️ Utilisateur connecté non trouvé dans la liste des conseillers (AddClient):', {
            userName,
            conseilleres: conseilleres.map(c => c.nom),
            recherchePartielle: conseilleres.filter(c => 
              c.nom.toLowerCase().includes(userName.toLowerCase()) || 
              userName.toLowerCase().includes(c.nom.toLowerCase())
            )
          });
        }
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage (AddClient)');
      }
    }
  }, [isLoadingConseillers, conseilleres, clientData.conseillere, isEditMode]);

  // Fonction pour générer les documents spécifiques au Visa Visiteur
  const generateVisaVisiteurDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnes) || 1;
    const invitationCanada = informationsSpecifiques.invitationCanada || '';
    
    const documentsRepresentant = [
      'Copie de CIN',
      'Copie du passeport et des visas',
      'Photo d\'identité'
    ];
    
    // Ajouter l'invitation si sélectionnée
    if (invitationCanada === 'Oui') {
      documentsRepresentant.push('Invitation');
      documentsRepresentant.push('Statut de l\'invitant');
    }
    
    // Ajouter les documents financiers et d'emploi
    documentsRepresentant.push('Dossier financier');
    documentsRepresentant.push('Dossier emploi');
    
    // Si famille (plus d'une personne ou situation familiale != célibataire)
    const aFamille = nombrePersonnes > 1 || (situationFamiliale && situationFamiliale !== 'Célibataire');
    
    if (aFamille) {
      let allDocuments = [...documentsRepresentant];
      
      // Documents pour les autres membres (si plus d'une personne)
      if (nombrePersonnes > 1) {
        for (let i = 2; i <= nombrePersonnes; i++) {
          const memberDocs = [...documentsRepresentant];
          
          // Vérifier si c'est un enfant à charge
          if (i <= 3) {
            memberDocs.push('Prise en charge');
            memberDocs.push('Attestation de scolarité');
          }
          
          allDocuments = [...allDocuments, ...memberDocs];
        }
      }
      
      // Retourner la liste unique
      return [...new Set(allDocuments)];
    } else {
      return documentsRepresentant;
    }
  };

  // Fonction pour générer les documents spécifiques au Permis de travail
  const generatePermisTravailDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamilialePermis || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesPermis) || 1;
    const offreEmploiCanada = informationsSpecifiques.offreEmploiCanada || '';
    const emploiTypes = informationsSpecifiques.emploiActuelTypes || [];
    
    // Documents de base pour le demandeur principal
    const documentsBase = [
      'Copie de la CIN',
      'Copie du passeport et visas antérieurs',
      'Photo d\'identité'
    ];
    
    // Ajouter les documents spécifiques
    documentsBase.push('Dossier financier');
    documentsBase.push('Dossier emploi');
    
    // Si offre d'emploi confirmée
    if (offreEmploiCanada === 'Oui') {
      documentsBase.push('Contrat de travail');
    }
    
    // Documents conditionnels
    documentsBase.push('Certificat de police (si requis)');
    documentsBase.push('Résultats d\'examen médical (si requis)');
    
    // Si famille (plus d'une personne ou situation familiale != célibataire)
    const aFamille = nombrePersonnes > 1 || (situationFamiliale && situationFamiliale !== 'Célibataire');
    
    if (aFamille) {
      let allDocuments = [...documentsBase];
      
      // Documents pour les autres membres de la famille
      if (nombrePersonnes > 1) {
        for (let i = 2; i <= nombrePersonnes; i++) {
          const memberDocs = [
            'Preuve de lien',
            'Passeport',
            'CIN',
            'Photo',
            'Prise en charge'
          ];
          
          allDocuments = [...allDocuments, ...memberDocs];
        }
      }
      
      // Retourner la liste unique
      return [...new Set(allDocuments)];
    } else {
      // Personne seule
      return documentsBase;
    }
  };

  // Fonction pour obtenir les documents sous forme de liste plate (pour compatibilité)
  const getDocumentsAsList = (categories) => {
    if (Array.isArray(categories)) {
      return categories; // Déjà un tableau
    }
    
    // Convertir l'objet de catégories en tableau plat
    return Object.values(categories).flat();
  };

  // Fonction pour générer les documents spécifiques au Permis d'études
  const generatePermisEtudesDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamilialeEtudes || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesEtudes) || 1;
    const provinceVisee = informationsSpecifiques.provinceViseeEtudes || '';
    
    const categories = {};
    
    // Documents de base pour le demandeur principal
    const documentsBase = [
      'Copie de CIN',
      'Copie du passeport et visas antérieurs',
      'Photo d\'identité',
      'Dossier financier',
      'Diplômes',
      'Lettre d\'admission de l\'établissement d\'enseignement désigné (EED)',
      'Lettre d\'acceptation de l\'établissement d\'enseignement',
      'Certificat de police'
    ];
    
    // Documents conditionnels selon la province
    if (provinceVisee && provinceVisee.toLowerCase().includes('québec')) {
      documentsBase.push('Certificat d\'acceptation du Québec (CAQ)');
    } else if (provinceVisee) {
      documentsBase.push('Lettre d\'attestation provinciale (LAP) ou lettre d\'acceptation territoriale (LAT) (si applicable)');
    }
    
    // Documents optionnels
    documentsBase.push('Lettres de recommandation (si applicable)');
    documentsBase.push('Plan d\'études (si applicable)');
    
    // Si famille (plus d'une personne ou situation familiale != célibataire)
    const aFamille = nombrePersonnes > 1 || (situationFamiliale && situationFamiliale !== 'Célibataire');
    
    if (aFamille) {
      // Documents pour le demandeur principal
      categories['Demandeur principal'] = documentsBase;
      
      // Documents pour les autres membres de la famille
      if (nombrePersonnes > 1) {
        for (let i = 2; i <= nombrePersonnes; i++) {
          const memberDocs = [
            'Preuve de lien',
            'Passeport',
            'CIN',
            'Photo',
            'Prise en charge'
          ];
          
          categories[`Membre ${i} de la famille`] = memberDocs;
        }
      }
    } else {
      // Personne seule
      categories['Documents requis'] = documentsBase;
    }
    
    return categories;
  };

  // Fonction pour générer les documents spécifiques au programme Investisseur
  const generateInvestisseurDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamilialeInvestisseur || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesInvestisseur) || 1;
    const planAffaires = informationsSpecifiques.planAffairesCanada || '';
    
    const categories = {};
    
    // Documents de base pour le demandeur principal
    const documentsBase = [
      'Copie de la CIN',
      'Copie du passeport + visas antérieurs',
      'Photo d\'identité',
      'Dossier financier',
      'Relevés bancaires',
      'Preuves de propriété d\'actifs',
      'Déclarations fiscales',
      'Preuves de l\'origine des fonds'
    ];
    
    // Documents d'entreprise
    const documentsEntreprise = [
      'Registre de commerce',
      'Statuts',
      'Preuves de paiement des impôts',
      'Bilans financiers'
    ];
    
    // Documents conditionnels
    const documentsConditionnels = [];
    if (planAffaires === 'Oui') {
      documentsConditionnels.push('Plan d\'affaires pour le Canada');
    }
    documentsConditionnels.push('Certificat de police (si requis)');
    documentsConditionnels.push('Résultats d\'examen médical (si requis)');
    
    // Si famille (plus d'une personne ou situation familiale != célibataire)
    const aFamille = nombrePersonnes > 1 || (situationFamiliale && situationFamiliale !== 'Célibataire');
    
    if (aFamille) {
      // Documents pour le demandeur principal
      categories['Demandeur principal - Documents personnels'] = documentsBase;
      categories['Demandeur principal - Documents d\'entreprise'] = documentsEntreprise;
      categories['Demandeur principal - Documents conditionnels'] = documentsConditionnels;
      
      // Documents pour les autres membres de la famille
      if (nombrePersonnes > 1) {
        for (let i = 2; i <= nombrePersonnes; i++) {
          const memberDocs = [
            'Preuve de lien',
            'Passeport',
            'CIN',
            'Photo',
            'Prise en charge',
            'Document de prise en charge (pour enfants)'
          ];
          
          categories[`Membre ${i} de la famille`] = memberDocs;
        }
      }
    } else {
      // Personne seule - regrouper tous les documents
      const tousDocuments = [
        ...documentsBase,
        ...documentsEntreprise,
        ...documentsConditionnels
      ];
      categories['Documents requis'] = tousDocuments;
    }
    
    return categories;
  };

  // Fonction pour générer les documents spécifiques au Regroupement familial
  const generateRegroupementFamilialDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const lienParente = informationsSpecifiques.lienParenteRepondant || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesRegroupement) || 1;
    
    const categories = {};
    
    // Documents pour le demandeur principal
    const documentsBase = [
      'Copie de la CIN',
      'Copie du passeport et visas antérieurs',
      'Photo d\'identité',
      'Certificat de police',
      'Résultats d\'examen médical (si requis)'
    ];
    
    // Documents prouvant le lien familial selon le type de relation
    const documentsLienFamilial = [];
    if (lienParente === 'Conjoint(e)') {
      documentsLienFamilial.push('Acte de mariage');
    } else if (lienParente === 'Enfant' || lienParente === 'Parent') {
      documentsLienFamilial.push('Acte de naissance');
    } else if (lienParente.includes('partenaire')) {
      documentsLienFamilial.push('Preuve de relation durable');
    } else {
      documentsLienFamilial.push('Documents prouvant le lien familial');
    }
    
    // Documents pour le répondant au Canada
    const documentsRepondant = [
      'Preuve de statut au Canada (carte de résidence ou citoyenneté)',
      'Preuve de revenus',
      'Engagement de parrainage signé'
    ];
    
    // Organisation des documents
    categories['Demandeur principal'] = [...documentsBase, ...documentsLienFamilial];
    categories['Répondant au Canada'] = documentsRepondant;
    
    // Documents pour les autres membres de la famille (si applicable)
    if (nombrePersonnes > 1) {
      for (let i = 2; i <= nombrePersonnes; i++) {
        const memberDocs = [
          'CIN',
          'Passeport',
          'Photo',
          'Lien familial',
          'Certificat médical (si requis)',
          'Prise en charge (si enfants à charge)'
        ];
        
        categories[`Membre ${i} de la famille`] = memberDocs;
      }
    }
    
    return categories;
  };

  const generateResidencePermanenteDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const nombrePersonnesRP = parseInt(informationsSpecifiques.nombrePersonnesRP) || 1;
    const familleCanadaRP = informationsSpecifiques.familleCanadaRP || '';
    const diplomesObtenusRP = informationsSpecifiques.diplomesObtenusRP || [];
    const experiencesProfessionnellesRP = informationsSpecifiques.experiencesProfessionnellesRP || [];
    const competencesLinguistiquesRP = informationsSpecifiques.competencesLinguistiquesRP || [];
    const programmesRP = informationsSpecifiques.programmesRP || [];
    
    const categories = {
      'Demandeur principal': [
        'Copie de la CIN',
        'Formulaire d\'information client interne signé',
        'Formulaire d\'informations sur la famille signé',
        'Copie du passeport et des visas antérieurs',
        'Photo d\'identité',
        'Certificat de police',
        'Dossier financier'
      ],
      'Diplômes et éducation': [
        'Évaluation des diplômes étrangers (ECA)'
      ],
      'Expérience professionnelle': [],
      'Tests linguistiques': [],
      'Documents conditionnels': [],
      'Membres de la famille': []
    };
    
    // Documents diplômes - un pour chaque diplôme
    diplomesObtenusRP.forEach((diplome, index) => {
      if (diplome.nom) {
        categories['Diplômes et éducation'].push(`Diplôme: ${diplome.nom}`);
        categories['Diplômes et éducation'].push(`Relevé de notes: ${diplome.nom}`);
      }
    });
    
    // Documents expérience professionnelle
    experiencesProfessionnellesRP.forEach((experience, index) => {
      if (experience.entreprise) {
        categories['Expérience professionnelle'].push(`Lettre d'expérience: ${experience.entreprise}`);
        categories['Expérience professionnelle'].push(`Certificat de travail: ${experience.entreprise}`);
      }
    });
    
    // Documents tests linguistiques
    competencesLinguistiquesRP.forEach((test, index) => {
      if (test.typeTest && test.langue) {
        categories['Tests linguistiques'].push(`Résultat ${test.typeTest} ${test.langue}`);
      }
    });
    
    // Documents conditionnels
    if (familleCanadaRP === 'Oui') {
      categories['Documents conditionnels'].push('Document du membre au Canada');
    }
    
    // Résultats d'examen médical (si requis pour certains programmes)
    if (programmesRP.includes('Entrée Express') || programmesRP.includes('Programme des candidats des provinces (PCP)')) {
      categories['Documents conditionnels'].push('Résultats d\'examen médical (si requis)');
    }
    
    // Documents membres de la famille
    if (nombrePersonnesRP > 1) {
      categories['Membres de la famille'] = [
        'CIN des membres de la famille',
        'Passeport des membres de la famille',
        'Photo des membres de la famille',
        'Relevés et diplômes des membres de la famille',
        'Examens médicaux des membres de la famille'
      ];
      
      // Documents de prise en charge pour enfants
      categories['Membres de la famille'].push('Document de prise en charge pour enfants à charge');
    }
    
    return getDocumentsAsList(categories);
  };

  // Fonction pour obtenir les documents requis selon le type de procédure
  const getRequiredDocuments = (typeProcedure) => {
    const commonDocs = ['Copie de CIN', 'Copie du passeport', 'Photo d\'identité'];

    switch (typeProcedure) {
      case 'Visa visiteur':
        return generateVisaVisiteurDocuments();
      case 'Permis de travail':
        return generatePermisTravailDocuments();
      case 'Permis d\'études':
        return generatePermisEtudesDocuments();
      case 'Investisseur':
        return generateInvestisseurDocuments();
      case 'Regroupement familial':
        return generateRegroupementFamilialDocuments();
      case 'Résidence permanente':
        return generateResidencePermanenteDocuments();
      default:
        return commonDocs;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClientData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setSaveStatus(''); // Clear save status on input change
  };

  const handleSpecificInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setClientData(prevData => ({
      ...prevData,
      informationsSpecifiques: {
        ...prevData.informationsSpecifiques,
        [name]: type === 'checkbox' ? checked : value
      }
    }));

    // Clear error when field is modified
    if (errors[`informationsSpecifiques.${name}`]) {
      setErrors(prev => ({ ...prev, [`informationsSpecifiques.${name}`]: null }));
    }
    setSaveStatus(''); // Clear save status on input change
  };

  // Fonctions pour gérer les arrays dynamiques
  const handleDynamicChange = (arrayName, index, field, value) => {
    setClientData(prevData => {
      const currentArray = prevData.informationsSpecifiques[arrayName] || [];
      const newArray = [...currentArray];
      newArray[index] = { ...newArray[index], [field]: value };
      
      return {
        ...prevData,
        informationsSpecifiques: {
          ...prevData.informationsSpecifiques,
          [arrayName]: newArray
        }
      };
    });
    setSaveStatus(''); // Clear save status on input change
  };

  const addDynamicItem = (arrayName, newItem) => {
    setClientData(prevData => {
      const currentArray = prevData.informationsSpecifiques[arrayName] || [];
      return {
        ...prevData,
        informationsSpecifiques: {
          ...prevData.informationsSpecifiques,
          [arrayName]: [...currentArray, newItem]
        }
      };
    });
    setSaveStatus(''); // Clear save status on input change
  };

  const removeDynamicItem = (arrayName, index) => {
    setClientData(prevData => {
      const currentArray = prevData.informationsSpecifiques[arrayName] || [];
      const newArray = currentArray.filter((_, i) => i !== index);
      return {
        ...prevData,
        informationsSpecifiques: {
          ...prevData.informationsSpecifiques,
          [arrayName]: newArray
        }
      };
    });
    setSaveStatus(''); // Clear save status on input change
  };

  const handleProcedureChange = (e) => {
    const { value } = e.target;
    setClientData(prevData => ({
      ...prevData,
      typeProcedure: value,
      informationsSpecifiques: {} // Reset specific info when procedure changes
    }));
    setSaveStatus(''); // Clear save status on input change
  };

  // Gestion des documents
  const handleDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fichier' && files) {
      setNewDocument(prev => ({ ...prev, fichier: files[0] }));
    } else {
      setNewDocument(prev => ({ ...prev, [name]: value }));
    }
    setSaveStatus(''); // Clear save status on input change
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDocument.type || !newDocument.fichier) {
      alert('Veuillez remplir le type de document et choisir un fichier.');
      return;
    }

    try {
      console.log('📄 Début ajout document supplémentaire:', newDocument.type);
      
      if (isEditMode && id) {
        // Mode édition : upload immédiat vers le backend
        console.log('🔄 Upload vers le backend...');
        
        const uploaded = await uploadDocument(id, newDocument.type, newDocument.fichier);
        
        if (!uploaded || !uploaded.id) {
          throw new Error('Échec de l\'upload - réponse serveur invalide');
        }
        
        console.log('✅ Document uploadé:', uploaded);
        
        // SOLUTION SIMPLE : Ajouter directement le document à la liste
        const newDoc = {
          id: uploaded.id,
          nom: uploaded.type_document,
          statut: 'fourni',
          dateUpload: uploaded.date_televersement,
          fichier: uploaded.nom_fichier,
          description: newDocument.description || 'Document supplémentaire',
          isAdditional: true
        };

        // Mettre à jour immédiatement l'interface
        setClientData(prevData => ({
          ...prevData,
          documents: [...prevData.documents, newDoc]
        }));
        
        alert(`✅ Document "${newDocument.type}" enregistré avec succès !`);
        
      } else {
        // Mode création : stocker localement
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          nom: newDocument.type,
          statut: 'fourni',
          dateUpload: new Date().toISOString().split('T')[0],
          description: newDocument.description || 'Document supplémentaire',
          fichier: newDocument.fichier.name,
          tempFile: newDocument.fichier,
          isAdditional: true
        };

        setClientData(prevData => ({
          ...prevData,
          documents: [...prevData.documents, newDoc]
        }));
        
        alert(`📝 Document "${newDocument.type}" ajouté localement.`);
      }

      // Réinitialiser le formulaire
      setNewDocument({
        type: '',
        description: '',
        fichier: null
      });
      
      const fileInput = document.querySelector('input[name="fichier"]');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('❌ Erreur ajout document:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const handleRemoveDocument = async (id) => {
    try {
      // Si c'est un document en mode édition et qu'il existe en base, le supprimer
      const docToRemove = clientData.documents.find(doc => doc.id === id);
      if (isEditMode && docToRemove && !docToRemove.tempFile && docToRemove.isAdditional) {
        await axios.delete(`${API_BASE_URL}/documents/${id}`);
      }
      
      setClientData(prevData => ({
        ...prevData,
        documents: prevData.documents.filter(doc => doc.id !== id)
      }));
      setSaveStatus(''); // Clear save status on input change
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      alert('Erreur lors de la suppression du document.');
    }
  };

  // Fonction pour gérer le remplacement d'un document supplémentaire
  const handleReplaceAdditionalDocument = async (documentToReplace, newFile) => {
    try {
      // Supprimer l'ancien document d'abord
      await handleRemoveDocument(documentToReplace.id);
      
      // Créer un nouveau document avec les mêmes informations
      const tempEvent = {
        preventDefault: () => {},
        target: {
          name: 'fichier',
          files: [newFile]
        }
      };
      
      // Préparer le nouveau document avec les mêmes métadonnées
      setNewDocument({
        type: documentToReplace.nom,
        description: documentToReplace.description || 'Document supplémentaire',
        fichier: newFile
      });
      
      // Ajouter le nouveau document après un court délai
      setTimeout(async () => {
        await handleAddDocument({
          preventDefault: () => {}
        });
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors du remplacement du document:', error);
      alert('Erreur lors du remplacement du document.');
    }
  };

  // Gestion des notes
  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        contenu: newNote,
        auteur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
      };

      setClientData(prevData => ({
        ...prevData,
        notes: [...prevData.notes, newNoteObj]
      }));

      // Sauvegarde immédiate en mode édition
      if (isEditMode) {
        clientsAPI.updateClient(id, { notes: [...clientData.notes, newNoteObj] }).catch(err => {
          console.error('Erreur sauvegarde note', err);
        });
      }

      setNewNote('');
      setSaveStatus(''); // Clear save status on input change
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Validation des champs communs obligatoires
    if (!clientData.nom) newErrors.nom = 'Le nom est requis';
    if (!clientData.prenom) newErrors.prenom = 'Le prénom est requis';
    if (!clientData.email) newErrors.email = 'L\'email est requis';
    if (clientData.email && !/\S+@\S+\.\S+/.test(clientData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!clientData.typeProcedure) newErrors.typeProcedure = 'Le type de procédure est requis';

    // Validation spécifique selon le type de procédure
    if (clientData.typeProcedure === 'Visa Visiteur') {
      if (!clientData.informationsSpecifiques.fondsDisponibles) {
        newErrors['informationsSpecifiques.fondsDisponibles'] = 'Les fonds disponibles sont requis';
      }
      if (!clientData.informationsSpecifiques.situationFamiliale) {
        newErrors['informationsSpecifiques.situationFamiliale'] = 'La situation familiale est requise';
      }
    }

    // Ajouter d'autres validations spécifiques selon les besoins...

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sauvegarder le brouillon
  const handleSaveDraft = () => {
    try {
      // Include active tab in the draft data
      const draftData = { ...clientData, activeTab };
      localStorage.setItem('clientDraft', JSON.stringify(draftData));
      setSaveStatus('Brouillon sauvegardé avec succès.');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du brouillon:", error);
      setSaveStatus('Erreur lors de la sauvegarde du brouillon.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Afficher un message d'erreur général
      alert('Veuillez corriger les erreurs dans le formulaire avant de soumettre.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(`📤 ${isEditMode ? 'Modification' : 'Création'} d'un client via l'API...`);

      // Préparer les données pour l'API (adapter les noms de champs)
      const apiClientData = {
        nom: clientData.nom,
        prenom: clientData.prenom,
        email: clientData.email,
        telephone: clientData.telephone,
        date_naissance: clientData.dateNaissance,
        adresse: clientData.adresse,
        nationalite: clientData.nationalite,
        type_procedure: clientData.typeProcedure,
        statut: clientData.statut || 'En cours',
        conseillere: clientData.conseillere,
        urgence: clientData.urgent || false,
        // Contact alternatif
        contact_nom: clientData.contactNom || null,
        contact_prenom: clientData.contactPrenom || null,
        contact_relation: clientData.contactRelation || null,
        contact_telephone: clientData.contactTelephone || null,
        contact_email: clientData.contactEmail || null,
        // Informations spécifiques (JSON)
        informations_specifiques: typeof clientData.informationsSpecifiques === 'string'
          ? JSON.parse(clientData.informationsSpecifiques)
          : clientData.informationsSpecifiques || null,
        // Notes (les documents sont gérés séparément via l'API dédiée)
        notes: clientData.notes || []
      };

      console.log('📋 Données préparées pour l\'API:', apiClientData);

      // Appel API selon le mode (création ou modification)
      let response;
      if (isEditMode) {
        response = await clientsAPI.updateClient(id, apiClientData);
      } else {
        response = await clientsAPI.createClient(apiClientData);
      }

      if (response.success) {
        console.log(`✅ Client ${isEditMode ? 'modifié' : 'créé'} avec succès:`, response.data);
        
        // En mode création, uploader les documents supplémentaires stockés localement
        if (!isEditMode && response.data && response.data.id) {
          const additionalDocs = clientData.documents?.filter(doc => doc.isAdditional && doc.tempFile);
          if (additionalDocs && additionalDocs.length > 0) {
            console.log(`📄 Upload de ${additionalDocs.length} document(s) supplémentaire(s)...`);
            
            for (const doc of additionalDocs) {
              try {
                await uploadDocument(response.data.id, doc.nom, doc.tempFile);
                console.log(`✅ Document "${doc.nom}" uploadé avec succès`);
              } catch (error) {
                console.error(`❌ Erreur upload document "${doc.nom}":`, error);
                // Continuer avec les autres documents même en cas d'erreur
              }
            }
          }
        }
        
        // Clear the draft from localStorage on successful submission
        localStorage.removeItem('clientDraft');

        if (isEditMode) {
          alert(`Client modifié avec succès!`);
        } else {
          alert(`Nouveau client ajouté avec succès! Numéro de dossier: ${response.data.numero_dossier}`);
        }
        
        navigate('/clients'); // Redirection vers la liste des clients
      } else {
        console.error('❌ Erreur API:', response.message);
        alert(`Erreur lors de ${isEditMode ? 'la modification' : 'l\'ajout'} du client: ` + response.message);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de ${isEditMode ? 'la modification' : 'l\'ajout'} du client:`, error);
      alert(`Une erreur est survenue lors de ${isEditMode ? 'la modification' : 'l\'ajout'} du client. Vérifiez que le serveur backend est démarré.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour basculer la visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Fonction pour obtenir le contenu de l'info-bulle du dossier financier
  const getFinancialTooltipContent = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const typeProcedure = clientData.typeProcedure;
    
    let content = [];
    
    if (typeProcedure === 'Visa visiteur') {
      const emploiTypes = informationsSpecifiques.emploiTypes || [];
      
      if (emploiTypes.includes('Salarié')) {
        content.push({
          title: 'Salarié :',
          items: [
            'Attestation de travail',
            'Attestation de salaire', 
            'Attestation de congé',
            'Bulletins de paie',
            'Autres preuves de revenus (ex : contrat de bail)'
          ]
        });
      }
      
      if (emploiTypes.includes('Entrepreneur') || emploiTypes.includes('Investisseur')) {
        content.push({
          title: 'Entrepreneur / Investisseur :',
          items: [
            'Registre de commerce',
            'Statuts',
            'Justificatif de paiement des impôts',
            'Contrat de bail ou autres preuves de revenus'
          ]
        });
      }
      
      if (emploiTypes.includes('Retraité')) {
        content.push({
          title: 'Retraité :',
          items: [
            'Attestation de retraite',
            'Contrat de bail ou autres preuves de revenus'
          ]
        });
      }
      
      // Si aucun emploi sélectionné, afficher tous les types
      if (emploiTypes.length === 0) {
        content = [
          {
            title: 'Salarié :',
            items: [
              'Attestation de travail',
              'Attestation de salaire', 
              'Attestation de congé',
              'Bulletins de paie',
              'Autres preuves de revenus (ex : contrat de bail)'
            ]
          },
          {
            title: 'Entrepreneur / Investisseur :',
            items: [
              'Registre de commerce',
              'Statuts',
              'Justificatif de paiement des impôts',
              'Contrat de bail ou autres preuves de revenus'
            ]
          },
          {
            title: 'Retraité :',
            items: [
              'Attestation de retraite',
              'Contrat de bail ou autres preuves de revenus'
            ]
          }
        ];
      }
    }
    
    if (typeProcedure === 'Permis de travail') {
      const emploiActuelTypes = informationsSpecifiques.emploiActuelTypes || [];
      
      if (emploiActuelTypes.includes('Salarié')) {
        content.push({
          title: 'Salarié :',
          items: [
            'Bulletins de paie',
            'Attestation de travail',
            'Relevés bancaires',
            'Contrat de travail actuel'
          ]
        });
      }
      
      if (emploiActuelTypes.includes('Entrepreneur')) {
        content.push({
          title: 'Entrepreneur :',
          items: [
            'Registre de commerce',
            'Statuts',
            'Justificatifs impôts',
            'Contrat de location',
            'Relevés bancaires'
          ]
        });
      }
      
      if (emploiActuelTypes.includes('Retraité')) {
        content.push({
          title: 'Retraité :',
          items: [
            'Attestation de retraite',
            'Preuves de revenus',
            'Relevés bancaires'
          ]
        });
      }
      
      // Si aucun emploi sélectionné, afficher tous les types
      if (emploiActuelTypes.length === 0) {
        content = [
          {
            title: 'Salarié :',
            items: [
              'Bulletins de paie',
              'Attestation de travail',
              'Relevés bancaires',
              'Contrat de travail actuel'
            ]
          },
          {
            title: 'Entrepreneur :',
            items: [
              'Registre de commerce',
              'Statuts',
              'Justificatifs impôts',
              'Contrat de location',
              'Relevés bancaires'
            ]
          },
          {
            title: 'Retraité :',
            items: [
              'Attestation de retraite',
              'Preuves de revenus',
              'Relevés bancaires'
            ]
          }
        ];
      }
    }
    
    if (typeProcedure === 'Permis d\'études') {
      const garants = informationsSpecifiques.garants || [];
      
      if (garants.length > 0) {
        garants.forEach((garant, index) => {
          const relation = garant.relation || 'Garant';
          content.push({
            title: `${relation} :`,
            items: [
              'Relevés bancaires (6 derniers mois)',
              'Attestation de revenus',
              'Certificat de travail ou d\'affaires',
              'Justificatifs de propriétés',
              'Déclaration d\'impôts',
              'Lettre de garantie financière'
            ]
          });
        });
      } else {
        content = [
          {
            title: 'Documents financiers requis :',
            items: [
              'Relevés bancaires du garant',
              'Attestation de revenus du garant',
              'Certificat de travail du garant',
              'Justificatifs de fonds pour études',
              'Lettre de garantie financière',
              'Preuve de fonds de subsistance'
            ]
          }
        ];
      }
    }
    
    if (typeProcedure === 'Investisseur') {
      content = [
        {
          title: 'Documents financiers requis :',
          items: [
            'Registre de commerce',
            'Statuts',
            'Déclarations fiscales',
            'Bilans financiers',
            'Justificatifs d\'origine des fonds (contrats de cession, ventes, héritage, etc.)'
          ]
        }
      ];
    }
    
    // Contenu par défaut pour autres procédures
    if (content.length === 0) {
      content = [
        {
          title: 'Documents financiers requis :',
          items: [
            'Relevés bancaires',
            'Attestations de revenus',
            'Preuves de fonds disponibles'
          ]
        }
      ];
    }
    
    return content;
  };

  // Fonctions pour gérer la tooltip financière avec zone combinée
  const handleTooltipZoneEnter = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      setTooltipTimeout(null);
    }
    setShowFinancialTooltip(true);
  };

  const handleTooltipZoneLeave = () => {
    const timeout = setTimeout(() => {
      setShowFinancialTooltip(false);
    }, 100); // Délai très court pour la transition
    setTooltipTimeout(timeout);
  };

  // Fonction pour gérer le clic sur l'icône (alternative au hover)
  const handleTooltipClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      setTooltipTimeout(null);
    }
    setShowFinancialTooltip(!showFinancialTooltip);
  };

  // Nettoyer le timeout lors du démontage du composant
  useEffect(() => {
    return () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
    };
  }, [tooltipTimeout]);

  // Fermer la tooltip en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showFinancialTooltip && !e.target.closest('.financial-tooltip-container')) {
        setShowFinancialTooltip(false);
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          setTooltipTimeout(null);
        }
      }
    };

    if (showFinancialTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFinancialTooltip, tooltipTimeout]);

  // Render specific form fields based on selected procedure
  const renderSpecificFields = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};

    const renderField = (key, label, type = 'text', options = null, required = false) => {
      const value = informationsSpecifiques[key] || (type === 'checkbox-group' ? [] : '');
      
      if (type === 'select' && options) {
        return (
          <div key={key} className="form-group">
            <label htmlFor={key}>{label} {required && <span className="required">*</span>}</label>
            <select
              id={key}
              name={key}
              value={value}
              onChange={handleSpecificInfoChange}
              className="form-control"
              required={required}
            >
              <option value="">Sélectionner...</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      }

      if (type === 'textarea') {
        return (
          <div key={key} className="form-group">
            <label htmlFor={key}>{label} {required && <span className="required">*</span>}</label>
            <textarea
              id={key}
              name={key}
              value={value}
              onChange={handleSpecificInfoChange}
              className="form-control"
              rows="3"
              required={required}
            />
          </div>
        );
      }

      if (type === 'checkbox-group' && options) {
        return (
          <div key={key} className="form-group">
            <label>{label} {required && <span className="required">*</span>}</label>
            <div className="checkbox-group">
              {options.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={option}
                    checked={value.includes(option)}
                    onChange={(e) => {
                      const currentValues = value;
                      let newValues;
                      if (e.target.checked) {
                        newValues = [...currentValues, option];
                      } else {
                        newValues = currentValues.filter(v => v !== option);
                      }
                      handleSpecificInfoChange({
                        target: { name: key, value: newValues }
                      });
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }

      // Default: text, number, date
      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{label} {required && <span className="required">*</span>}</label>
          <input
            id={key}
            name={key}
            type={type}
            value={value}
            onChange={handleSpecificInfoChange}
            className="form-control"
            required={required}
          />
        </div>
      );
    };

    switch (clientData.typeProcedure) {
      case 'Visa visiteur':
        const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
        const invitationCanada = informationsSpecifiques.invitationCanada || '';
        const voyageEtranger = informationsSpecifiques.voyageEtranger || '';
        const visaRefus = informationsSpecifiques.visaRefus || '';
        const emploiTypes = informationsSpecifiques.emploiTypes || [];
        const autreEmploi = emploiTypes.includes('Autre');

        return (
          <div className="procedure-fields visa-visiteur">
            <h4>📋 Informations spécifiques - Visa Visiteur</h4>
            
            {/* Ligne 1: Fonds et Situation familiale */}
            <div className="form-grid">
              <div className="form-group">
                <label className="required">Fonds disponibles en compte (CAD):</label>
                <input
                  type="number"
                  name="fondsDisponibles"
                  value={informationsSpecifiques.fondsDisponibles || ''}
                  onChange={handleSpecificInfoChange}
                  required
                />
                {errors['informationsSpecifiques.fondsDisponibles'] && (
                  <div className="error-message">{errors['informationsSpecifiques.fondsDisponibles']}</div>
                )}
              </div>
              <div className="form-group">
                <label className="required">Situation familiale:</label>
                <select
                  name="situationFamiliale"
                  value={situationFamiliale}
                  onChange={handleSpecificInfoChange}
                  required
                >
                  <option value="">Sélectionner...</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf/Veuve</option>
                  <option value="Union de fait">Union de fait</option>
                </select>
                {errors['informationsSpecifiques.situationFamiliale'] && (
                  <div className="error-message">{errors['informationsSpecifiques.situationFamiliale']}</div>
                )}
              </div>
            </div>
            
            {/* Ligne 2: Nombre de personnes et Date de voyage */}
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de personnes dans la demande:</label>
                <input
                  type="number"
                  name="nombrePersonnes"
                  min="1"
                  value={informationsSpecifiques.nombrePersonnes || '1'}
                  onChange={handleSpecificInfoChange}
                />
              </div>
              <div className="form-group">
                <label>Date prévue du voyage:</label>
                <input
                  type="date"
                  name="dateVoyage"
                  value={informationsSpecifiques.dateVoyage || ''}
                  onChange={handleSpecificInfoChange}
                />
              </div>
            </div>
            
            {/* Ligne 3: Emploi (cases à cocher) */}
            <div className="form-group">
              <label>Emploi:</label>
              <div className="checkbox-group">
                {['Salarié', 'Entrepreneur', 'Retraité', 'Autre'].map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={option}
                      checked={emploiTypes.includes(option)}
                      onChange={(e) => {
                        const currentValues = emploiTypes;
                        let newValues;
                        if (e.target.checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter(v => v !== option);
                        }
                        handleSpecificInfoChange({
                          target: { name: 'emploiTypes', value: newValues }
                        });
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Champ conditionnel: Autre emploi */}
            {autreEmploi && (
              <div className="form-group">
                <label>Précisez le type d'emploi:</label>
                <input
                  type="text"
                  name="autreEmploiPrecision"
                  value={informationsSpecifiques.autreEmploiPrecision || ''}
                  onChange={handleSpecificInfoChange}
                />
              </div>
            )}
            
            {/* Ligne 4: Invitation du Canada */}
            <div className="form-group">
              <label>Invitation du Canada:</label>
              <select
                name="invitationCanada"
                value={invitationCanada}
                onChange={handleSpecificInfoChange}
              >
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
            
            {/* Champ conditionnel: Lien de parenté avec l'invitant */}
            {invitationCanada === 'Oui' && (
              <div className="form-group">
                <label>Lien de parenté avec l'invitant:</label>
                <input
                  type="text"
                  name="lienParenteInvitant"
                  value={informationsSpecifiques.lienParenteInvitant || ''}
                  onChange={handleSpecificInfoChange}
                />
              </div>
            )}
            
            {/* Champ conditionnel: Représentant de la famille */}
            {situationFamiliale && situationFamiliale !== 'Célibataire' && (
              <div className="form-group">
                <label>Qui sera le représentant de la famille ?</label>
                <input
                  type="text"
                  name="representantFamille"
                  value={informationsSpecifiques.representantFamille || ''}
                  onChange={handleSpecificInfoChange}
                />
              </div>
            )}
            
            {/* Ligne 5: Voyages à l'étranger */}
            <div className="form-group">
              <label>Avez-vous déjà voyagé à l'étranger ?</label>
              <select
                name="voyageEtranger"
                value={voyageEtranger}
                onChange={handleSpecificInfoChange}
              >
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtranger === 'Oui' && (
              <div className="form-group">
                <label>Pays, dates, durées:</label>
                <textarea
                  name="detailsVoyages"
                  value={informationsSpecifiques.detailsVoyages || ''}
                  onChange={handleSpecificInfoChange}
                  placeholder="Pays, dates, durée..."
                  rows="3"
                ></textarea>
              </div>
            )}
            
            {/* Ligne 6: Visa ou refus antérieur */}
            <div className="form-group">
              <label>Avez-vous déjà eu un visa ou un refus (Canada ou autre pays) ?</label>
              <select
                name="visaRefus"
                value={visaRefus}
                onChange={handleSpecificInfoChange}
              >
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
            
            {/* Champ conditionnel: Détails visa/refus */}
            {visaRefus === 'Oui' && (
              <div className="form-group">
                <label>Pays, type de visa, dates, accepté/refusé:</label>
                <textarea
                  name="detailsVisaRefus"
                  value={informationsSpecifiques.detailsVisaRefus || ''}
                  onChange={handleSpecificInfoChange}
                  placeholder="Pays, type de visa, dates, accepté/refusé..."
                  rows="3"
                ></textarea>
              </div>
            )}
          </div>
        );

      case 'Permis de travail':
        const situationFamilialePermis = informationsSpecifiques.situationFamilialePermis || '';
        const nombrePersonnesPermis = informationsSpecifiques.nombrePersonnesPermis || '';
        const emploiActuelTypes = informationsSpecifiques.emploiActuelTypes || [];
        const autreEmploiActuel = emploiActuelTypes.includes('Autre');
        const testsLanguePassesPT = informationsSpecifiques.testsLanguePassesPT || '';
        const offreEmploiCanada = informationsSpecifiques.offreEmploiCanada || '';
        const voyageEtrangerPT = informationsSpecifiques.voyageEtrangerPT || '';
        const visaAnterieursOui = informationsSpecifiques.visaAnterieursOui || '';
        const refusVisaOui = informationsSpecifiques.refusVisaOui || '';
        const typePermisTypes = informationsSpecifiques.typePermisTypes || [];
        const autreTypePermis = typePermisTypes.includes('Autre');
        
        return (
          <div className="specific-fields">
            <h4>💼 Informations spécifiques - Permis de travail</h4>
            
            {/* Section 1: Informations personnelles supplémentaires */}
            <div className="section-title">
              <h5>🔹 1. Informations personnelles supplémentaires</h5>
            </div>
            <div className="form-row">
              {renderField('situationFamilialePermis', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'])}
              {renderField('nombrePersonnesPermis', 'Nombre de personnes dans la demande', 'number')}
            </div>
            
            {/* Champ conditionnel: Représentant si > 1 personne */}
            {parseInt(nombrePersonnesPermis) > 1 && (
              <div className="form-row">
                {renderField('representantFamillePermis', 'Qui sera le représentant ?', 'text')}
              </div>
            )}
            
            {/* Section 2: Informations professionnelles */}
            <div className="section-title">
              <h5>🔹 2. Informations professionnelles</h5>
            </div>
            <div className="form-row">
              {renderField('emploiActuelTypes', 'Emploi actuel', 'checkbox-group', 
                ['Salarié', 'Entrepreneur', 'Retraité', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre emploi */}
            {autreEmploiActuel && (
              <div className="form-row">
                {renderField('autreEmploiActuelPrecision', 'Précisez le type d\'emploi actuel', 'text')}
              </div>
            )}
            
            {/* Postes occupés - Section dynamique */}
            <div className="dynamic-section">
              <label>Postes occupés :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.postesOccupes || []).map((poste, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du poste :</label>
                        <input
                          type="text"
                          value={poste.nom || ''}
                          onChange={(e) => {
                            const newPostes = [...(informationsSpecifiques.postesOccupes || [])];
                            newPostes[index] = { ...newPostes[index], nom: e.target.value };
                            handleSpecificInfoChange({ target: { name: 'postesOccupes', value: newPostes } });
                          }}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mois d'expérience :</label>
                        <input
                          type="number"
                          value={poste.moisExperience || ''}
                          onChange={(e) => {
                            const newPostes = [...(informationsSpecifiques.postesOccupes || [])];
                            newPostes[index] = { ...newPostes[index], moisExperience: e.target.value };
                            handleSpecificInfoChange({ target: { name: 'postesOccupes', value: newPostes } });
                          }}
                          className="form-control"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newPostes = (informationsSpecifiques.postesOccupes || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange({ target: { name: 'postesOccupes', value: newPostes } });
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    const newPostes = [...(informationsSpecifiques.postesOccupes || []), { nom: '', moisExperience: '' }];
                    handleSpecificInfoChange({ target: { name: 'postesOccupes', value: newPostes } });
                  }}
                >
                  Ajouter un poste
                </button>
              </div>
            </div>
            
            {/* Diplômes - Section dynamique */}
            <div className="dynamic-section">
              <label>Diplômes obtenus :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.diplomesObtenus || []).map((diplome, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Diplôme :</label>
                        <input
                          type="text"
                          value={diplome.nom || ''}
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenus || [])];
                            newDiplomes[index] = { ...newDiplomes[index], nom: e.target.value };
                            handleSpecificInfoChange({ target: { name: 'diplomesObtenus', value: newDiplomes } });
                          }}
                          className="form-control"
                          placeholder="Ex: Licence en informatique"
                        />
                      </div>
                      <div className="form-group">
                        <label>Établissement :</label>
                        <input
                          type="text"
                          value={diplome.etablissement || ''}
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenus || [])];
                            newDiplomes[index] = { ...newDiplomes[index], etablissement: e.target.value };
                            handleSpecificInfoChange({ target: { name: 'diplomesObtenus', value: newDiplomes } });
                          }}
                          className="form-control"
                          placeholder="Ex: Université XYZ"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newDiplomes = (informationsSpecifiques.diplomesObtenus || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange({ target: { name: 'diplomesObtenus', value: newDiplomes } });
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    const newDiplomes = [...(informationsSpecifiques.diplomesObtenus || []), { nom: '', etablissement: '' }];
                    handleSpecificInfoChange({ target: { name: 'diplomesObtenus', value: newDiplomes } });
                  }}
                >
                  Ajouter un diplôme
                </button>
              </div>
            </div>
            
            {/* Compétences linguistiques */}
            <div className="form-row">
              {renderField('competencesFrancais', 'Compétences en français', 'select', 
                ['Débutant', 'Intermédiaire', 'Avancé', 'Langue maternelle'])}
              {renderField('competencesAnglais', 'Compétences en anglais', 'select', 
                ['Débutant', 'Intermédiaire', 'Avancé', 'Langue maternelle'])}
            </div>
            
            {/* Tests de langue */}
            <div className="form-row">
              {renderField('testsLanguePassesPT', 'Tests de langue passés', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champs conditionnels: Détails tests de langue */}
            {testsLanguePassesPT === 'Oui' && (
              <div className="form-row">
                {renderField('typeTestLangue', 'Type de test', 'select', 
                  ['IELTS', 'TEF', 'CELPIP', 'TCF', 'Autre'])}
                {renderField('scoresObtenus', 'Scores obtenus', 'text')}
              </div>
            )}
            
            {/* Section 3: Offre d'emploi au Canada */}
            <div className="section-title">
              <h5>🔹 3. Offre d'emploi au Canada</h5>
            </div>
            <div className="form-row">
              {renderField('offreEmploiCanada', 'Avez-vous une offre d\'emploi au Canada ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champs conditionnels: Détails offre d'emploi */}
            {offreEmploiCanada === 'Oui' && (
              <>
                <div className="form-row">
                  {renderField('nomEmployeurCanadien', 'Nom de l\'employeur canadien', 'text')}
                  {renderField('typePosteCanada', 'Type de poste', 'text')}
                </div>
                <div className="form-row">
                  {renderField('provinceEmploi', 'Province d\'emploi', 'select', 
                    ['Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick', 'Terre-Neuve-et-Labrador', 
                     'Territoires du Nord-Ouest', 'Nouvelle-Écosse', 'Nunavut', 'Ontario', 'Île-du-Prince-Édouard', 
                     'Québec', 'Saskatchewan', 'Yukon'])}
                  {renderField('dureeContrat', 'Durée prévue du contrat', 'text')}
                </div>
                <div className="form-row">
                  {renderField('numeroOffreEIMT', 'Numéro d\'offre d\'emploi ou EIMT (si applicable)', 'text')}
                </div>
              </>
            )}
            
            {/* Section 4: Informations spécifiques au programme */}
            <div className="section-title">
              <h5>🔹 4. Informations spécifiques au programme</h5>
            </div>
            <div className="form-row">
              {renderField('typePermisTypes', 'Type de permis de travail visé', 'checkbox-group', 
                ['Permis fermé', 'Permis ouvert', 'Permis post-diplôme', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre type de permis */}
            {autreTypePermis && (
              <div className="form-row">
                {renderField('autreTypePermisPrecision', 'Précisez le type de permis', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('provinceViseePermis', 'Province visée', 'select', 
                ['Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick', 'Terre-Neuve-et-Labrador', 
                 'Territoires du Nord-Ouest', 'Nouvelle-Écosse', 'Nunavut', 'Ontario', 'Île-du-Prince-Édouard', 
                 'Québec', 'Saskatchewan', 'Yukon'])}
              {renderField('datePrevueDepart', 'Date prévue de départ', 'date')}
            </div>
            
            {/* Section 5: Informations financières */}
            <div className="section-title">
              <h5>🔹 5. Informations financières</h5>
            </div>
            <div className="form-row">
              {renderField('fondsDisponiblesPermis', 'Fonds disponibles en compte (CAD)', 'number')}
            </div>
            
            {/* Section 6: Antécédents de voyage */}
            <div className="section-title">
              <h5>🔹 6. Antécédents de voyage</h5>
            </div>
            <div className="form-row">
              {renderField('voyageEtrangerPT', 'Avez-vous voyagé à l\'étranger ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtrangerPT === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyagesPT', 'Pays, dates, durée', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('visaAnterieursOui', 'Avez-vous déjà eu un visa ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa antérieurs */}
            {visaAnterieursOui === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaAnterieurs', 'Visa obtenu, pays, date', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('refusVisaOui', 'Avez-vous déjà eu un refus de visa ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails refus visa */}
            {refusVisaOui === 'Oui' && (
              <div className="form-row">
                {renderField('detailsRefusVisa', 'Pays, type de visa, motif de refus (si connu)', 'textarea')}
              </div>
            )}
          </div>
        );

      case 'Permis d\'études':
        const situationFamilialeEtudes = informationsSpecifiques.situationFamilialeEtudes || '';
        const nombrePersonnesEtudes = informationsSpecifiques.nombrePersonnesEtudes || '';
        const niveauEtudesActuel = informationsSpecifiques.niveauEtudesActuel || [];
        const autreNiveauEtudes = niveauEtudesActuel.includes('Autre');
        const testsLanguePassesEtudes = informationsSpecifiques.testsLanguePassesEtudes || '';
        const programmeEtudesSouhaite = informationsSpecifiques.programmeEtudesSouhaite || '';
        const autreProgrammeEtudes = programmeEtudesSouhaite === 'Autre';
        const voyageEtrangerEtudes = informationsSpecifiques.voyageEtrangerEtudes || '';
        const visaAnterieursEtudes = informationsSpecifiques.visaAnterieursEtudes || '';
        const refusVisaEtudes = informationsSpecifiques.refusVisaEtudes || '';
        
        return (
          <div className="specific-fields">
            <h4>📚 Informations spécifiques - Permis d'études</h4>
            
            {/* Section 1: Informations personnelles supplémentaires */}
            <div className="section-title">
              <h5>🔹 1. Informations personnelles supplémentaires</h5>
            </div>
            <div className="form-row">
              {renderField('situationFamilialeEtudes', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'])}
              {renderField('nombrePersonnesEtudes', 'Nombre de personnes dans la demande', 'number')}
            </div>
            
            {/* Champ conditionnel: Représentant si > 1 personne */}
            {parseInt(nombrePersonnesEtudes) > 1 && (
              <div className="form-row">
                {renderField('representantFamilleEtudes', 'Qui sera le représentant ?', 'text')}
              </div>
            )}
            
            {/* Section 2: Informations académiques */}
            <div className="section-title">
              <h5>🔹 2. Informations académiques</h5>
            </div>
            
            {/* Diplômes déjà obtenus - Section dynamique */}
            <div className="dynamic-section">
              <label>Diplômes déjà obtenus :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.diplomesObtenusEtudes || []).map((diplome, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Diplôme :</label>
                        <input
                          type="text"
                          value={diplome.nom || ''}
                          onChange={(e) => handleDynamicChange('diplomesObtenusEtudes', index, 'nom', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Baccalauréat scientifique"
                        />
                      </div>
                      <div className="form-group">
                        <label>Établissement :</label>
                        <input
                          type="text"
                          value={diplome.etablissement || ''}
                          onChange={(e) => handleDynamicChange('diplomesObtenusEtudes', index, 'etablissement', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Lycée Mohammed V"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => removeDynamicItem('diplomesObtenusEtudes', index)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('diplomesObtenusEtudes', { nom: '', etablissement: '' })}
                >
                  Ajouter un diplôme
                </button>
              </div>
            </div>
            
            {/* Niveau d'études actuel */}
            <div className="form-row">
              {renderField('niveauEtudesActuel', 'Niveau d\'études actuel', 'checkbox-group', 
                ['Niveau bac', 'Bac', 'Bac+2', 'Bac+3', 'Master', 'Doctorat', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre niveau */}
            {autreNiveauEtudes && (
              <div className="form-row">
                {renderField('autreNiveauEtudesPrecision', 'Précisez le niveau d\'études', 'text')}
              </div>
            )}
            
            {/* Établissements fréquentés - Section dynamique */}
            <div className="dynamic-section">
              <label>Établissements fréquentés :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.etablissementsFrequentes || []).map((etablissement, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom de l'établissement :</label>
                        <input
                          type="text"
                          value={etablissement.nom || ''}
                          onChange={(e) => handleDynamicChange('etablissementsFrequentes', index, 'nom', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Université Hassan II"
                        />
                      </div>
                      <div className="form-group">
                        <label>Période :</label>
                        <input
                          type="text"
                          value={etablissement.periode || ''}
                          onChange={(e) => handleDynamicChange('etablissementsFrequentes', index, 'periode', e.target.value)}
                          className="form-control"
                          placeholder="Ex: 2020-2023"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => removeDynamicItem('etablissementsFrequentes', index)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('etablissementsFrequentes', { nom: '', periode: '' })}
                >
                  Ajouter un établissement
                </button>
              </div>
            </div>
            
            {/* Compétences linguistiques */}
            <div className="form-row">
              {renderField('competencesFrancaisEtudes', 'Compétences en français', 'select', 
                ['Débutant', 'Intermédiaire', 'Avancé', 'Langue maternelle'])}
              {renderField('competencesAnglaisEtudes', 'Compétences en anglais', 'select', 
                ['Débutant', 'Intermédiaire', 'Avancé', 'Langue maternelle'])}
            </div>
            
            {/* Tests de langue */}
            <div className="form-row">
              {renderField('testsLanguePassesEtudes', 'Tests de langue passés', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champs conditionnels: Détails tests de langue */}
            {testsLanguePassesEtudes === 'Oui' && (
              <div className="form-row">
                {renderField('typeTestLangueEtudes', 'Type de test', 'select', 
                  ['IELTS', 'TEF', 'CELPIP', 'TCF', 'Autre'])}
                {renderField('scoresObtenusEtudes', 'Scores obtenus', 'text')}
              </div>
            )}
            
            {/* Section 3: Informations spécifiques au programme */}
            <div className="section-title">
              <h5>🔹 3. Informations spécifiques au programme</h5>
            </div>
            <div className="form-row">
              {renderField('programmeEtudesSouhaite', 'Programme d\'études souhaité', 'select', 
                ['DEP', 'AEC', 'DEC', 'Bachelor', 'Maîtrise', 'Doctorat', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre programme */}
            {autreProgrammeEtudes && (
              <div className="form-row">
                {renderField('autreProgrammeEtudesPrecision', 'Précisez le programme d\'études', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('etablissementViseCanada', 'Établissement(s) visé(s) au Canada', 'text')}
              {renderField('provinceViseeEtudes', 'Province visée', 'text')}
            </div>
            
            <div className="form-row">
              {renderField('dateDebutEtudes', 'Date prévue de début des études', 'date')}
            </div>
            
            {/* Section 4: Informations financières */}
            <div className="section-title">
              <h5>🔹 4. Informations financières</h5>
            </div>
            
            {/* Garants - Section dynamique */}
            <div className="dynamic-section">
              <label>Garant(s) :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.garants || []).map((garant, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Relation :</label>
                        <select
                          value={garant.relation || ''}
                          onChange={(e) => handleDynamicChange('garants', index, 'relation', e.target.value)}
                          className="form-control"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Lui-même">Lui-même</option>
                          <option value="Père">Père</option>
                          <option value="Mère">Mère</option>
                          <option value="Frère">Frère</option>
                          <option value="Sœur">Sœur</option>
                          <option value="Oncle">Oncle</option>
                          <option value="Tante">Tante</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Capacité financière (CAD) :</label>
                        <input
                          type="number"
                          value={garant.capaciteFinanciere || ''}
                          onChange={(e) => handleDynamicChange('garants', index, 'capaciteFinanciere', e.target.value)}
                          className="form-control"
                          placeholder="Ex: 50000"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => removeDynamicItem('garants', index)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('garants', { relation: '', capaciteFinanciere: '' })}
                >
                  Ajouter un garant
                </button>
              </div>
            </div>
            
            {/* Section 5: Antécédents de voyage */}
            <div className="section-title">
              <h5>🔹 5. Antécédents de voyage</h5>
            </div>
            <div className="form-row">
              {renderField('voyageEtrangerEtudes', 'Voyages antérieurs à l\'étranger', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtrangerEtudes === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyagesEtudes', 'Détails des voyages (pays, dates, durée)', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('visaAnterieursEtudes', 'Visas précédemment obtenus', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa antérieurs */}
            {visaAnterieursEtudes === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaAnterieursEtudes', 'Détails des visas obtenus (pays, type, dates)', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('refusVisaEtudes', 'Refus antérieurs (Canada ou autre pays)', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails refus visa */}
            {refusVisaEtudes === 'Oui' && (
              <div className="form-row">
                {renderField('detailsRefusVisaEtudes', 'Détails des refus (pays, motifs, dates)', 'textarea')}
              </div>
            )}
          </div>
        );

      case 'Investisseur':
        const situationFamilialeInvestisseur = informationsSpecifiques.situationFamilialeInvestisseur || '';
        const nombrePersonnesInvestisseur = informationsSpecifiques.nombrePersonnesInvestisseur || '';
        const statutProfessionnelTypes = informationsSpecifiques.statutProfessionnelTypes || [];
        const typeProgrammeInvestisseur = informationsSpecifiques.typeProgrammeInvestisseur || [];
        const autreProgrammeInvestisseur = typeProgrammeInvestisseur.includes('Autre');
        const planAffairesCanada = informationsSpecifiques.planAffairesCanada || '';
        const voyageEtrangerInvestisseur = informationsSpecifiques.voyageEtrangerInvestisseur || '';
        const visaAnterieursInvestisseur = informationsSpecifiques.visaAnterieursInvestisseur || '';
        const refusVisaInvestisseur = informationsSpecifiques.refusVisaInvestisseur || '';
        
        return (
          <div className="specific-fields">
            <h4>💰 Informations spécifiques - Programme investisseur</h4>
            
            {/* Section 1: Informations personnelles supplémentaires */}
            <div className="section-title">
              <h5>🔹 1. Informations personnelles supplémentaires</h5>
            </div>
            <div className="form-row">
              {renderField('situationFamilialeInvestisseur', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'])}
              {renderField('nombrePersonnesInvestisseur', 'Nombre de personnes dans la demande', 'number')}
            </div>
            
            {/* Champ conditionnel: Représentant si > 1 personne */}
            {parseInt(nombrePersonnesInvestisseur) > 1 && (
              <div className="form-row">
                {renderField('representantFamilleInvestisseur', 'Qui sera le représentant de la famille ?', 'text')}
              </div>
            )}
            
            {/* Section 2: Informations professionnelles et entrepreneuriales */}
            <div className="section-title">
              <h5>🔹 2. Informations professionnelles et entrepreneuriales</h5>
            </div>
            <div className="form-row">
              {renderField('statutProfessionnelTypes', 'Statut professionnel actuel', 'checkbox-group', 
                ['Entrepreneur', 'Dirigeant d\'entreprise', 'Investisseur', 'PME'])}
            </div>
            
            <div className="form-row">
              {renderField('secteurActivite', 'Secteur d\'activité', 'text')}
              {renderField('experienceGestionEntreprise', 'Expérience en gestion d\'entreprise (années)', 'number')}
            </div>
            
            <div className="form-row">
              {renderField('entreprisesDetenues', 'Entreprises détenues ou dirigées', 'textarea')}
              {renderField('valeurNettePersonnelle', 'Valeur nette personnelle', 'text')}
            </div>
            
            {/* Section 3: Informations spécifiques au programme */}
            <div className="section-title">
              <h5>🔹 3. Informations spécifiques au programme</h5>
            </div>
            <div className="form-row">
              {renderField('typeProgrammeInvestisseur', 'Type de programme d\'investisseur visé', 'checkbox-group', 
                ['Programme des entrepreneurs', 'Programme de démarrage d\'entreprise (Start-up Visa)', 
                 'Programme d\'immigration des travailleurs autonomes', 'Programme des investisseurs du Québec', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre programme */}
            {autreProgrammeInvestisseur && (
              <div className="form-row">
                {renderField('autreProgrammeInvestisseurPrecision', 'Précisez le type de programme', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('provinceViseeInvestisseur', 'Province visée', 'text')}
              {renderField('planAffairesCanada', 'Plan d\'affaires pour le Canada', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Résumé plan d'affaires */}
            {planAffairesCanada === 'Oui' && (
              <div className="form-row">
                {renderField('resumePlanAffaires', 'Résumé du plan d\'affaires prévu pour le Canada', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('montantInvestissementPrevu', 'Montant d\'investissement prévu', 'text')}
              {renderField('secteurActiviteCanada', 'Secteur d\'activité visé au Canada', 'text')}
            </div>
            
            {/* Section 4: Informations financières */}
            <div className="section-title">
              <h5>🔹 4. Informations financières</h5>
            </div>
            <div className="form-row">
              {renderField('fondsDisponiblesMontant', 'Fonds disponibles (montant total)', 'text')}
              {renderField('sourcesFonds', 'Sources des fonds', 'textarea')}
            </div>
            
            <div className="form-row">
              {renderField('actifsDetenu', 'Actifs détenus (immobilier, actions, etc.)', 'textarea')}
              {renderField('revenusAnnuels', 'Revenus annuels', 'text')}
            </div>
            
            {/* Section 5: Antécédents de voyage */}
            <div className="section-title">
              <h5>🔹 5. Antécédents de voyage</h5>
            </div>
            <div className="form-row">
              {renderField('voyageEtrangerInvestisseur', 'Voyages antérieurs à l\'étranger', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtrangerInvestisseur === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyagesInvestisseur', 'Pays visités, dates', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('visaAnterieursInvestisseur', 'Visas précédemment obtenus', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa antérieurs */}
            {visaAnterieursInvestisseur === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaAnterieursInvestisseur', 'Pays, type de visa', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('refusVisaInvestisseur', 'Refus antérieurs (Canada ou autre pays)', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails refus visa */}
            {refusVisaInvestisseur === 'Oui' && (
              <div className="form-row">
                {renderField('detailsRefusVisaInvestisseur', 'Pays, type, motif (si connu)', 'textarea')}
              </div>
            )}
            
            {/* Section 6: Remarques */}
            <div className="section-title">
              <h5>🔹 6. Remarques</h5>
            </div>
            <div className="form-row">
              {renderField('remarquesInvestisseur', 'Remarques ou informations importantes sur le dossier', 'textarea')}
            </div>
          </div>
        );

      case 'Regroupement familial':
        const situationFamilialeRegroupement = informationsSpecifiques.situationFamilialeRegroupement || '';
        const nombrePersonnesRegroupement = informationsSpecifiques.nombrePersonnesRegroupement || '';
        const lienParenteRepondant = informationsSpecifiques.lienParenteRepondant || '';
        const autreParentePrecision = lienParenteRepondant === 'Autre';
        const statutRepondantTypes = informationsSpecifiques.statutRepondantTypes || [];
        const typeParrainageTypes = informationsSpecifiques.typeParrainageTypes || [];
        const autreMembre = typeParrainageTypes.includes('Autre membre de la famille');
        const regroupementAnterieur = informationsSpecifiques.regroupementAnterieur || '';
        const voyageEtrangerRegroupement = informationsSpecifiques.voyageEtrangerRegroupement || '';
        const visaAnterieursRegroupement = informationsSpecifiques.visaAnterieursRegroupement || '';
        const refusVisaRegroupement = informationsSpecifiques.refusVisaRegroupement || '';
        
        return (
          <div className="specific-fields">
            <h4>👨‍👩‍👧‍👦 Informations spécifiques - Regroupement familial</h4>
            
            {/* Section 1: Informations personnelles supplémentaires */}
            <div className="section-title">
              <h5>🔹 1. Informations personnelles supplémentaires</h5>
            </div>
            <div className="form-row">
              {renderField('situationFamilialeRegroupement', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'])}
              {renderField('nombrePersonnesRegroupement', 'Nombre de personnes dans la demande', 'number')}
            </div>
            
            <div className="form-row">
              {renderField('lienParenteRepondant', 'Lien de parenté avec le répondant au Canada', 'select', 
                ['Conjoint(e)', 'Enfant', 'Parent', 'Grand-parent', 'Frère/Sœur', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre lien de parenté */}
            {autreParentePrecision && (
              <div className="form-row">
                {renderField('autreParentePrecision', 'Précisez le lien de parenté', 'text')}
              </div>
            )}
            
            {/* Section 2: Informations sur le répondant au Canada */}
            <div className="section-title">
              <h5>🔹 2. Informations sur le répondant au Canada</h5>
            </div>
            <div className="form-row">
              {renderField('nomCompletRepondant', 'Nom complet du répondant', 'text')}
              {renderField('statutRepondantTypes', 'Statut du répondant au Canada', 'checkbox-group', 
                ['Citoyen', 'Résident permanent'])}
            </div>
            
            <div className="form-row">
              {renderField('adresseCompleteCanada', 'Adresse complète au Canada', 'textarea')}
            </div>
            
            <div className="form-row">
              {renderField('telephoneRepondant', 'Téléphone du répondant', 'text')}
              {renderField('emailRepondant', 'Email du répondant', 'text')}
            </div>
            
            <div className="form-row">
              {renderField('personnesChargeRepondant', 'Nombre de personnes à charge du répondant', 'number')}
              {renderField('regroupementAnterieur', 'Le répondant a-t-il déjà fait un regroupement familial ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Section 3: Informations spécifiques au programme */}
            <div className="section-title">
              <h5>🔹 3. Informations spécifiques au programme</h5>
            </div>
            <div className="form-row">
              {renderField('typeParrainageTypes', 'Type de parrainage', 'checkbox-group', 
                ['Conjoint(e) / partenaire', 'Enfant', 'Parent', 'Grand-parent', 'Autre membre de la famille'])}
            </div>
            
            {/* Champ conditionnel: Autre membre de la famille */}
            {autreMembre && (
              <div className="form-row">
                {renderField('autreMembrePrecision', 'Précisez le type de membre de la famille', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('provinceDestinationRegroupement', 'Province de destination', 'select', 
                ['Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick', 'Terre-Neuve-et-Labrador', 
                 'Territoires du Nord-Ouest', 'Nouvelle-Écosse', 'Nunavut', 'Ontario', 'Île-du-Prince-Édouard', 
                 'Québec', 'Saskatchewan', 'Yukon'])}
            </div>
            
            {/* Section 4: Informations financières */}
            <div className="section-title">
              <h5>🔹 4. Informations financières</h5>
            </div>
            <div className="form-row">
              {renderField('capaciteFinanciereRepondant', 'Capacité financière du répondant', 'textarea')}
            </div>
            
            {/* Section 5: Antécédents de voyage */}
            <div className="section-title">
              <h5>🔹 5. Antécédents de voyage</h5>
            </div>
            <div className="form-row">
              {renderField('voyageEtrangerRegroupement', 'Voyages antérieurs à l\'étranger', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtrangerRegroupement === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyagesRegroupement', 'Pays visités, dates', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('visaAnterieursRegroupement', 'Visas précédemment obtenus', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa antérieurs */}
            {visaAnterieursRegroupement === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaAnterieursRegroupement', 'Pays, type de visa', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('refusVisaRegroupement', 'Refus antérieurs (Canada ou autre pays)', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails refus visa */}
            {refusVisaRegroupement === 'Oui' && (
              <div className="form-row">
                {renderField('detailsRefusVisaRegroupement', 'Pays, type de visa, motif du refus (si connu)', 'textarea')}
              </div>
            )}
            
            {/* Section 6: Remarques */}
            <div className="section-title">
              <h5>🔹 6. Remarques</h5>
            </div>
            <div className="form-row">
              {renderField('remarquesRegroupement', 'Remarques ou informations importantes sur le dossier', 'textarea')}
            </div>
          </div>
        );

      case 'Résidence permanente':
        const situationFamilialeRP = clientData.informationsSpecifiques.situationFamilialeRP || '';
        const nombrePersonnesRP = clientData.informationsSpecifiques.nombrePersonnesRP || '';
        const proceduresRP = clientData.informationsSpecifiques.proceduresRP || [];
        const autreProcedureRP = proceduresRP.includes('Autre');
        const programmesRP = clientData.informationsSpecifiques.programmesRP || [];
        const autreProgrammeRP = programmesRP.includes('Autre');
        const voyageEtrangerRP = clientData.informationsSpecifiques.voyageEtrangerRP || '';
        const visaAnterieursRP = clientData.informationsSpecifiques.visaAnterieursRP || '';
        const refusVisaRP = clientData.informationsSpecifiques.refusVisaRP || '';
        const familleCanadaRP = clientData.informationsSpecifiques.familleCanadaRP || '';
        
        // Fonction pour vérifier si un test expire bientôt (< 3 mois)
        const isTestExpiringSoon = (dateExpiration) => {
          if (!dateExpiration) return false;
          const today = new Date();
          const expirationDate = new Date(dateExpiration);
          const diffTime = expirationDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 90 && diffDays >= 0; // Expire dans 90 jours ou moins
        };
        
        return (
          <div className="specific-fields">
            <h4>🏠 Informations spécifiques - Résidence permanente</h4>
            
            {/* Section 1: Informations personnelles supplémentaires */}
            <div className="section-title">
              <h5>🔹 1. Informations personnelles supplémentaires</h5>
            </div>
            <div className="form-row">
              {renderField('situationFamilialeRP', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'])}
              {renderField('nombrePersonnesRP', 'Nombre de personnes dans la demande', 'number')}
            </div>
            
            {/* Champ conditionnel: Représentant si > 1 personne */}
            {parseInt(nombrePersonnesRP) > 1 && (
              <div className="form-row">
                {renderField('representantFamilleRP', 'Qui sera le représentant de la famille ?', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('proceduresRP', 'Procédure(s)', 'checkbox-group', 
                ['Arrima (Québec)', 'Entrée Express', 'Candidat des provinces (PCP)', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre procédure */}
            {autreProcedureRP && (
              <div className="form-row">
                {renderField('autreProcedureRPPrecision', 'Préciser la procédure', 'text')}
              </div>
            )}
            
            {/* Section 2: Informations professionnelles et académiques */}
            <div className="section-title">
              <h5>🔹 2. Informations professionnelles et académiques</h5>
            </div>
            <div className="form-row">
              {renderField('niveauEtudesEleveRP', 'Niveau d\'études le plus élevé', 'select', 
                ['Secondaire', 'Collégial', 'Universitaire - Baccalauréat', 'Universitaire - Maîtrise', 'Universitaire - Doctorat'])}
            </div>
            
            {/* Diplômes obtenus - Section dynamique */}
            <div className="dynamic-section">
              <label>Diplômes obtenus :</label>
              <div className="dynamic-list">
                {(clientData.informationsSpecifiques.diplomesObtenusRP || []).map((diplome, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du diplôme :</label>
                        <input
                          type="text"
                          value={diplome.nom || ''}
                          onChange={(e) => handleDynamicChange('diplomesObtenusRP', index, 'nom', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Licence en informatique"
                        />
                      </div>
                      <div className="form-group">
                        <label>Établissement :</label>
                        <input
                          type="text"
                          value={diplome.etablissement || ''}
                          onChange={(e) => handleDynamicChange('diplomesObtenusRP', index, 'etablissement', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Université XYZ"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date d'obtention :</label>
                        <input
                          type="date"
                          value={diplome.dateObtention || ''}
                          onChange={(e) => handleDynamicChange('diplomesObtenusRP', index, 'dateObtention', e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => removeDynamicItem('diplomesObtenusRP', index)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('diplomesObtenusRP', { nom: '', etablissement: '', dateObtention: '' })}
                >
                  Ajouter un diplôme
                </button>
              </div>
            </div>
            
            {/* Expérience professionnelle - Section dynamique */}
            <div className="dynamic-section">
              <label>Expérience professionnelle détaillée :</label>
              <div className="dynamic-list">
                {(clientData.informationsSpecifiques.experiencesProfessionnellesRP || []).map((experience, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom de l'entreprise :</label>
                        <input
                          type="text"
                          value={experience.entreprise || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'entreprise', e.target.value)}
                          className="form-control"
                          placeholder="Ex: ABC Corporation"
                        />
                      </div>
                      <div className="form-group">
                        <label>Poste occupé :</label>
                        <input
                          type="text"
                          value={experience.poste || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'poste', e.target.value)}
                          className="form-control"
                          placeholder="Ex: Développeur senior"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de début :</label>
                        <input
                          type="date"
                          value={experience.dateDebut || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'dateDebut', e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date de fin :</label>
                        <input
                          type="date"
                          value={experience.dateFin || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'dateFin', e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Code CNP :</label>
                        <input
                          type="text"
                          value={experience.codeCNP || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'codeCNP', e.target.value)}
                          className="form-control"
                          placeholder="Ex: 2174"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mois d'expérience :</label>
                        <input
                          type="number"
                          value={experience.moisExperience || ''}
                          onChange={(e) => handleDynamicChange('experiencesProfessionnellesRP', index, 'moisExperience', e.target.value)}
                          className="form-control"
                          placeholder="Ex: 24"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      onClick={() => removeDynamicItem('experiencesProfessionnellesRP', index)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('experiencesProfessionnellesRP', 
                    { entreprise: '', poste: '', dateDebut: '', dateFin: '', codeCNP: '', moisExperience: '' })}
                >
                  Ajouter une expérience
                </button>
              </div>
            </div>
            
            {/* Compétences linguistiques - Section dynamique avec alertes */}
            <div className="dynamic-section">
              <label>Compétences linguistiques :</label>
              <div className="dynamic-list">
                {(clientData.informationsSpecifiques.competencesLinguistiquesRP || []).map((test, index) => {
                  const isExpiring = isTestExpiringSoon(test.dateExpiration);
                  return (
                    <div key={index} className={`dynamic-item ${isExpiring ? 'test-expiring' : ''}`}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Langue :</label>
                          <select
                            value={test.langue || ''}
                            onChange={(e) => handleDynamicChange('competencesLinguistiquesRP', index, 'langue', e.target.value)}
                            className="form-control"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="Français">Français</option>
                            <option value="Anglais">Anglais</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Type de test :</label>
                          <select
                            value={test.typeTest || ''}
                            onChange={(e) => handleDynamicChange('competencesLinguistiquesRP', index, 'typeTest', e.target.value)}
                            className="form-control"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="IELTS">IELTS</option>
                            <option value="TEF">TEF</option>
                            <option value="TCF">TCF</option>
                            <option value="CELPIP">CELPIP</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Scores par épreuve :</label>
                          <input
                            type="text"
                            value={test.scores || ''}
                            onChange={(e) => handleDynamicChange('competencesLinguistiquesRP', index, 'scores', e.target.value)}
                            className="form-control"
                            placeholder="Ex: L:8.5, R:7.0, W:7.5, S:8.0"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Date du test :</label>
                          <input
                            type="date"
                            value={test.dateTest || ''}
                            onChange={(e) => handleDynamicChange('competencesLinguistiquesRP', index, 'dateTest', e.target.value)}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Date d'expiration :
                            {isExpiring && <span className="expiring-warning">⚠️ Expire bientôt!</span>}
                          </label>
                          <input
                            type="date"
                            value={test.dateExpiration || ''}
                            onChange={(e) => handleDynamicChange('competencesLinguistiquesRP', index, 'dateExpiration', e.target.value)}
                            className={`form-control ${isExpiring ? 'expiring-field' : ''}`}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-danger btn-small"
                          onClick={() => removeDynamicItem('competencesLinguistiquesRP', index)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => addDynamicItem('competencesLinguistiquesRP', 
                    { langue: '', typeTest: '', scores: '', dateTest: '', dateExpiration: '' })}
                >
                  Ajouter un test de langue
                </button>
              </div>
            </div>
            
            {/* Section 3: Informations spécifiques au programme */}
            <div className="section-title">
              <h5>🔹 3. Informations spécifiques au programme</h5>
            </div>
            <div className="form-row">
              {renderField('programmesRP', 'Programme(s) de résidence permanente visé(s)', 'checkbox-group', 
                ['Entrée Express', 'Programme des candidats des provinces (PCP)', 'Arrima', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre programme */}
            {autreProgrammeRP && (
              <div className="form-row">
                {renderField('autreProgrammeRPPrecision', 'Précisez le programme', 'text')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('provinceViseeRP', 'Province visée', 'select', 
                ['Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick', 'Terre-Neuve-et-Labrador', 
                 'Territoires du Nord-Ouest', 'Nouvelle-Écosse', 'Nunavut', 'Ontario', 'Île-du-Prince-Édouard', 
                 'Québec', 'Saskatchewan', 'Yukon'])}
            </div>
            
            <div className="form-row">
              {renderField('scoreCalculeRP', 'Score calculé pour les programmes sélectionnés', 'text')}
            </div>
            
            {/* Section 4: Informations financières */}
            <div className="section-title">
              <h5>🔹 4. Informations financières</h5>
            </div>
            <div className="form-row">
              {renderField('fondsDisponiblesRP', 'Fonds disponibles en compte', 'text')}
            </div>
            
            {/* Section 5: Antécédents de voyage */}
            <div className="section-title">
              <h5>🔹 5. Antécédents de voyage</h5>
            </div>
            <div className="form-row">
              {renderField('voyageEtrangerRP', 'Voyages antérieurs à l\'étranger', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtrangerRP === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyagesRP', 'Pays visités, dates', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('visaAnterieursRP', 'Visas précédemment obtenus', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa antérieurs */}
            {visaAnterieursRP === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaAnterieursRP', 'Pays, type de visa', 'textarea')}
              </div>
            )}
            
            <div className="form-row">
              {renderField('refusVisaRP', 'Refus antérieurs (Canada ou autre pays)', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails refus visa */}
            {refusVisaRP === 'Oui' && (
              <div className="form-row">
                {renderField('detailsRefusVisaRP', 'Pays, type, motif du refus (si connu)', 'textarea')}
              </div>
            )}
            
            {/* Section 6: Famille au Canada */}
            <div className="section-title">
              <h5>🔹 6. Famille au Canada</h5>
            </div>
            <div className="form-row">
              {renderField('familleCanadaRP', 'Vous ou votre conjoint(e) avez un membre de la famille au Canada ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champs conditionnels: Détails famille au Canada */}
            {familleCanadaRP === 'Oui' && (
              <>
                <div className="form-row">
                  {renderField('membreFamilleCanada', 'Quel membre de la famille ?', 'text')}
                  {renderField('statutMembreFamille', 'Quel est son statut au Canada ?', 'select', 
                    ['Citoyen canadien', 'Résident permanent', 'Travailleur temporaire', 'Étudiant', 'Autre'])}
                </div>
              </>
            )}
            
            {/* Section 7: Remarques */}
            <div className="section-title">
              <h5>🔹 7. Remarques</h5>
            </div>
            <div className="form-row">
              {renderField('remarquesRP', 'Remarques ou informations importantes sur le dossier', 'textarea')}
            </div>
          </div>
        );

      default:
        return (
          <div className="procedure-fields">
            <p>Veuillez sélectionner un type de procédure pour afficher les champs spécifiques.</p>
          </div>
        );
    }
  };

  // Render document section
  const renderDocumentSection = () => {
    return (
      <div className="form-section">
        <h3>Documents requis pour {clientData.typeProcedure}</h3>

        {/* Documents requis et supplémentaires */}
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
              {/* Documents requis */}
              {getDocumentsAsList(getRequiredDocuments(clientData.typeProcedure)).map((documentName, index) => {
                const existingDoc = clientData.documents?.find(doc => doc.nom === documentName && !doc.isAdditional);
                const isProvided = existingDoc && existingDoc.statut === 'fourni';
                return (
                  <tr key={`required-${index}`} className={isProvided ? 'document-provided' : 'document-pending'}>
                    <td className="document-name-cell">
                      <span className="document-name">{documentName}</span>
                                              {documentName === 'Dossier financier' && ['Visa visiteur', 'Permis de travail', 'Permis d\'études', 'Investisseur'].includes(clientData.typeProcedure) && (
                          <div 
                            className="financial-tooltip-container"
                            onMouseEnter={handleTooltipZoneEnter}
                            onMouseLeave={handleTooltipZoneLeave}
                          >
                            <span 
                              className="financial-warning-icon"
                              onClick={handleTooltipClick}
                              title="Cliquer ou survoler pour voir les détails du dossier financier"
                            >
                              !
                            </span>
                            {showFinancialTooltip && (
                              <div className="financial-tooltip">
                                <div className="tooltip-content">
                                  {getFinancialTooltipContent().map((section, idx) => (
                                    <div key={idx} className="tooltip-section">
                                      <h4>{section.title}</h4>
                                      <ul>
                                        {section.items.map((item, itemIdx) => (
                                          <li key={itemIdx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
                              ({new Date(existingDoc.dateUpload).toLocaleDateString('fr-FR')})
                            </small>
                          )}
                        </div>
                      ) : (
                        <div className="file-upload-wrapper">
                          <input
                            type="file"
                            id={`file-${index}`}
                            className="file-upload-input"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleRequiredDocumentSelect(documentName, e.target.files[0]);
                              }
                            }}
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
                            type="button"
                            className="btn-icon"
                            onClick={() => handleViewDocument(existingDoc)}
                            title="Voir"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            type="button"
                            className="btn-icon btn-danger"
                            onClick={() => handleRemoveDocument(existingDoc.id)}
                            title="Supprimer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          {/* Bouton modifier */}
                          <input 
                            type="file" 
                            id={`replace-${index}`} 
                            style={{display:'none'}}
                            onChange={e=>{
                              if(e.target.files && e.target.files[0]){
                                handleRequiredDocumentSelect(documentName, e.target.files[0], existingDoc);
                              }
                            }}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          <button 
                            type="button"
                            className="btn-icon"
                            onClick={()=>document.getElementById(`replace-${index}`).click()}
                            title="Modifier"
                          >
                            <i className="fas fa-pen"></i>
                          </button>
                        </>
                      ) : (
                        <span className="no-actions">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Documents supplémentaires */}
              {clientData.documents?.filter(doc => doc.isAdditional).map((document, index) => (
                <tr key={`additional-${document.id}`} className="document-provided">
                  <td className="document-name-cell">
                    <span className="document-name">{document.nom}</span>
                  </td>
                  <td>
                    <span className="status-badge status-fourni">
                      FOURNI
                    </span>
                  </td>
                  <td className="file-upload-cell">
                    <div className="file-info">
                      <i className="fas fa-file-pdf text-success"></i>
                      <span className="file-name">{document.fichier}</span>
                      {document.dateUpload && (
                        <small className="upload-date">
                          ({new Date(document.dateUpload).toLocaleDateString('fr-FR')})
                        </small>
                      )}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button 
                      type="button"
                      className="btn-icon"
                      onClick={() => handleViewDocument(document)}
                      title="Voir"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleRemoveDocument(document.id)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    {/* Bouton modifier pour documents supplémentaires */}
                    <input 
                      type="file" 
                      id={`replace-additional-${document.id}`} 
                      style={{display:'none'}}
                      onChange={(e) => {
                        if(e.target.files && e.target.files[0]) {
                          handleReplaceAdditionalDocument(document, e.target.files[0]);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <button 
                      type="button"
                      className="btn-icon"
                      onClick={() => document.getElementById(`replace-additional-${document.id}`).click()}
                      title="Modifier"
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Documents additionnels */}
        <div className="document-upload-form" style={{marginTop: '30px'}}>
          <h4>Ajouter un document supplémentaire</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Type de document:</label>
              <input
                type="text"
                name="type"
                value={newDocument.type}
                onChange={handleDocumentChange}
                placeholder="Ex: Autre document pertinent"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={newDocument.description}
                onChange={handleDocumentChange}
                placeholder="Description optionnelle"
              />
            </div>
            <div className="form-group">
              <label>Fichier:</label>
              <input
                type="file"
                name="fichier"
                onChange={handleDocumentChange}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddDocument}
            disabled={!newDocument.type || !newDocument.fichier}
          >
            Ajouter le document
          </button>
        </div>
      </div>
    );
  };

  // Render notes section
  const renderNotesSection = () => {
    const notesArray = Array.isArray(clientData.notes)
      ? clientData.notes.filter(n => n && n.contenu && n.contenu.trim() !== '')
      : [];

    return (
      <div className="form-section">
        <h3>Notes</h3>

        <div className="notes-list">
          {notesArray.length > 0 ? (
            notesArray.map(note => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <span className="note-date">{note.date}</span>
                  <span className="note-author">{note.auteur}</span>
                </div>
                <div className="note-content">{note.contenu}</div>
              </div>
            ))
          ) : (
            <p>Aucune note pour le moment.</p>
          )}
        </div>

        <div className="note-add-form">
          <h4>Ajouter une note</h4>
          <div className="form-group">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Saisir une nouvelle note..."
              rows="3"
            ></textarea>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
          >
            Ajouter la note
          </button>
        </div>
      </div>
    );
  };

  const handleRequiredDocumentSelect = async (documentName, file, currentDoc=null) => {
    if (!file) return;
    if (isEditMode) {
      // si doc existant, supprimer d'abord
      if(currentDoc && currentDoc.id){
        try{ await axios.delete(`${API_BASE_URL}/documents/${currentDoc.id}`);}catch(err){console.warn('Del doc fail',err)}
      }
      try {
        const uploaded = await uploadDocument(id, documentName, file);
        const newDoc = {
          id: uploaded.id,
          nom: uploaded.type_document,
          statut: 'fourni',
          dateUpload: uploaded.date_televersement,
          fichier: uploaded.nom_fichier
        };
        setClientData(prev => ({
          ...prev,
          documents: [...prev.documents.filter(d => d.nom !== documentName), newDoc]
        }));
      } catch (err) {
        console.error('Erreur upload', err);
        alert('Erreur lors du téléversement');
      }
    } else {
      const newDoc = {
        tempFile: file,
        nom: documentName,
        statut: 'fourni',
        dateUpload: new Date().toISOString(),
        fichier: file.name
      };
      setClientData(prev => ({
        ...prev,
        documents: [...prev.documents.filter(d => d.nom !== documentName), newDoc]
      }));
    }
  };

  const handleViewDocument = (doc) => {
    window.open(`${API_BASE_URL}/documents/file/${doc.id}`, '_blank');
  };

  return (
    <div className="client-form-container">
      <div className="client-form-header">
        <h2>{isEditMode ? 'Modifier le client' : 'Ajouter un nouveau client'}</h2>
        <button type="button" className="btn-secondary btn-back" onClick={() => navigate('/clients')}>
          <i className="fas fa-arrow-left"></i> Retour à la liste
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="tabs-navigation">
        <button
          className={activeTab === 'informations' ? 'tab-active' : ''}
          onClick={() => setActiveTab('informations')}
        >
          Informations
        </button>
        <button
          className={activeTab === 'procedure' ? 'tab-active' : ''}
          onClick={() => setActiveTab('procedure')}
          disabled={!clientData.nom || !clientData.prenom}
        >
          Procédure
        </button>
        <button
          className={activeTab === 'documents' ? 'tab-active' : ''}
          onClick={() => setActiveTab('documents')}
          disabled={!clientData.typeProcedure}
        >
          Documents
        </button>
        <button
          className={activeTab === 'notes' ? 'tab-active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab content */}
        {activeTab === 'informations' && (
          <>
            {/* Step 1: Common Information */}
            <div className="form-section">
              <h3>Informations personnelles communes</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="required">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={clientData.nom}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.nom && <div className="error-message">{errors.nom}</div>}
                </div>
                <div className="form-group">
                  <label className="required">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={clientData.prenom}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.prenom && <div className="error-message">{errors.prenom}</div>}
                </div>
                <div className="form-group">
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={clientData.dateNaissance}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="required">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={clientData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={clientData.telephone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Adresse complète</label>
                  <textarea
                    name="adresse"
                    value={clientData.adresse}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Nationalité</label>
                  <input
                    type="text"
                    name="nationalite"
                    value={clientData.nationalite}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Login client</label>
                  <input
                    type="text"
                    name="loginClient"
                    value={clientData.loginClient}
                    onChange={handleInputChange}
                  />
                </div>
                                <div className="form-group password-group">
                  <label>Mot de passe client</label>
                  <div className="password-input-container">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="motDePasseClient" 
                      value={clientData.motDePasseClient} 
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={togglePasswordVisibility}
                      title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Contact alternatif</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    name="contactNom"
                    value={clientData.contactNom}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    name="contactPrenom"
                    value={clientData.contactPrenom}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <input
                    type="text"
                    name="contactRelation"
                    value={clientData.contactRelation}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    name="contactTelephone"
                    value={clientData.contactTelephone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={clientData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Administrative Info */}
            <div className="form-section">
              <h3>Informations administratives</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Conseillère assignée 
                    {isLoadingConseillers && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Chargement...)</span>}
                  </label>
                  <select
                    name="conseillere"
                    value={clientData.conseillere}
                    onChange={handleInputChange}
                    disabled={isLoadingConseillers}
                    style={isLoadingConseillers ? { backgroundColor: '#f5f5f5', cursor: 'wait' } : {}}
                  >
                    <option value="">Non assignée</option>
                    {conseilleres.map(conseillere => (
                      <option key={conseillere.id} value={conseillere.nom}>
                        {conseillere.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut initial</label>
                  <select
                    name="statut"
                    value={clientData.statut}
                    onChange={handleInputChange}
                  >
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Refusé">Refusé</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label htmlFor="urgent">Dossier urgent?</label>
                  <input
                    type="checkbox"
                    id="urgent"
                    name="urgent"
                    checked={clientData.urgent}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveDraft}
              >
                Sauvegarder le brouillon
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('procedure')}
                disabled={!clientData.nom || !clientData.prenom || !clientData.email}
              >
                Suivant: Procédure
              </button>
            </div>
          </>
        )}

        {activeTab === 'procedure' && (
          <>
            {/* Procedure Selection & Specific Info */}
            <div className="form-section">
              <h3>Procédure d'immigration</h3>
              <div className="form-group">
                <label className="required">Type de procédure</label>
                <select
                  name="typeProcedure"
                  value={clientData.typeProcedure}
                  onChange={handleProcedureChange}
                  required
                >
                  <option value="" disabled>Sélectionner une procédure...</option>
                  {procedureOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.typeProcedure && <div className="error-message">{errors.typeProcedure}</div>}
              </div>

              {/* Render dynamic fields based on selection */}
              {renderSpecificFields()}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('informations')}>
                Précédent: Informations
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveDraft}
              >
                Sauvegarder le brouillon
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('documents')}
                disabled={!clientData.typeProcedure}
              >
                Suivant: Documents
              </button>
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <>
            {renderDocumentSection()}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('procedure')}>
                Précédent: Procédure
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveDraft}
              >
                Sauvegarder le brouillon
              </button>
              <button type="button" className="btn-primary" onClick={() => setActiveTab('notes')}>
                Suivant: Notes
              </button>
            </div>
          </>
        )}

        {activeTab === 'notes' && (
          <>
            {renderNotesSection()}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('documents')}>
                Précédent: Documents
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveDraft}
              >
                Sauvegarder le brouillon
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Modifier le client' : 'Ajouter le client')}
              </button>
            </div>
          </>
        )}
      </form>
      {saveStatus && <div className="save-status-message">{saveStatus}</div>}
    </div>
  );
}

export default AddClient;

