import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ClientForm.css';
import '../styles/ClientEdit.css';
import '../styles/Notes.css';
import { getConseillers } from '../services/conseillerAPI';

function ClientEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('informations');
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  
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
    // Documents
    documents: [],
    // Notes
    notes: []
  };

  const [clientData, setClientData] = useState(initialClientData);

  // Fonction pour basculer la visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

  // Simuler le chargement des données du client depuis l'API
  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      try {
        // Fonction pour obtenir les headers d'authentification
        const getAuthHeaders = () => {
          const token = localStorage.getItem('token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          return headers;
        };

        // Dans une vraie application, on récupérerait les données depuis l'API
        // const response = await fetch(`http://localhost:5000/api/clients/${id}`, {
        //   headers: getAuthHeaders()
        // });
        // const data = await response.json();
        
        // Simuler un appel API avec un délai
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données simulées pour le client
        const mockClient = {
          id: id,
          numeroDossier: `CL-2025-${id}`,
          nom: 'Dupont',
          prenom: 'Jean',
          dateNaissance: '1985-05-15',
          email: 'jean.dupont@example.com',
          telephone: '+1 514-555-1234',
          adresse: '123 Rue Principale, Montréal, QC',
          nationalite: 'Française',
          contactNom: 'Dupont',
          contactPrenom: 'Marie',
          contactRelation: 'Épouse',
          contactTelephone: '+1 514-555-5678',
          contactEmail: 'marie.dupont@example.com',
          loginClient: 'jdupont',
          motDePasseClient: '********',
          conseillere: 'Marie Tremblay',
          urgent: false,
          statut: 'En cours',
          typeProcedure: 'Visa Visiteur',
          informationsSpecifiques: {
            fondsDisponibles: 15000,
            situationFamiliale: 'Marié(e)',
            nombrePersonnesDemande: 2,
            dateVoyage: '2025-08-15',
            emploi: 'Salarié',
            invitation: 'non'
          },
          documents: [
            {
              id: 'doc1',
              nom: 'Copie de CIN',
              statut: 'fourni',
              dateUpload: '2025-04-15',
              description: 'Carte d\'identité valide'
            },
            {
              id: 'doc2',
              nom: 'Copie du passeport',
              statut: 'fourni',
              dateUpload: '2025-04-15',
              description: 'Passeport valide jusqu\'en 2030'
            },
            {
              id: 'doc3',
              nom: 'Photo d\'identité',
              statut: 'fourni',
              dateUpload: '2025-04-15',
              description: 'Photo récente'
            }
          ],
          notes: [
            {
              id: 'note1',
              date: '2025-04-15',
              contenu: 'Première consultation effectuée. Client très motivé.',
              auteur: 'Marie Tremblay'
            },
            {
              id: 'note2',
              date: '2025-04-20',
              contenu: 'Documents reçus et vérifiés.',
              auteur: 'Marie Tremblay'
            }
          ],
          dateCreation: '2025-04-15'
        };
        
        setClientData(mockClient);
      } catch (error) {
        console.error('Erreur lors du chargement des données du client:', error);
        alert('Erreur lors du chargement des données du client. Veuillez réessayer.');
        navigate('/clients');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientData();
  }, [id, navigate]);

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

  // Procédure options
  const procedureOptions = [
    'Visa Visiteur',
    'Permis de travail',
    'Permis d\'études',
    'Investisseur',
    'Regroupement familial',
    'Résidence permanente'
  ];

  // Charger les conseillers depuis l'API
  useEffect(() => {
    const loadConseillers = async () => {
      try {
        setIsLoadingConseillers(true);
        console.log('🔄 Chargement des conseillers dans ClientEdit...');
        
        const result = await getConseillers();
        
        if (result.success && result.data) {
          // Transformer les données en format attendu par le composant
          const conseillersList = result.data.map(conseiller => ({
            id: conseiller.id,
            nom: conseiller.nomComplet
          }));
          setConseilleres(conseillersList);
          console.log('✅ Conseillers chargés dans ClientEdit:', conseillersList);
        } else {
          // En cas d'erreur, utiliser la liste par défaut
          const defaultList = result.data.map(conseiller => ({
            id: conseiller.id || Math.random(),
            nom: conseiller.nomComplet
          }));
          setConseilleres(defaultList);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des conseillers dans ClientEdit:', error);
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

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté (seulement si pas déjà assigné)
  useEffect(() => {
    // Attendre que les conseillers soient chargés et que les données client soient chargées
    // Ne préremplir que si le champ conseillère est vide
    if (!isLoadingConseillers && conseilleres.length > 0 && clientData && !clientData.conseillere && !isLoading) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré (ClientEdit):', userName);
      console.log('📋 Liste des conseillers disponibles (ClientEdit):', conseilleres);
      
      if (userName) {
        // Chercher l'utilisateur connecté dans la liste des conseillers
        const userInList = conseilleres.find(conseiller => 
          conseiller.nom.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(conseiller.nom.toLowerCase())
        );
        
        if (userInList) {
          console.log('✅ Préremplissage du champ conseillère (ClientEdit) avec:', userInList.nom);
          setClientData(prev => ({
            ...prev,
            conseillere: userInList.nom
          }));
        } else {
          console.log('⚠️ Utilisateur connecté non trouvé dans la liste des conseillers (ClientEdit):', {
            userName,
            conseilleres: conseilleres.map(c => c.nom),
            recherchePartielle: conseilleres.filter(c => 
              c.nom.toLowerCase().includes(userName.toLowerCase()) || 
              userName.toLowerCase().includes(c.nom.toLowerCase())
            )
          });
        }
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage (ClientEdit)');
      }
    }
  }, [isLoadingConseillers, conseilleres, clientData, isLoading]);

  // Fonction pour générer les documents spécifiques au Visa Visiteur
  const generateVisaVisiteurDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnes) || 1;
    const invitationCanada = informationsSpecifiques.invitationCanada || '';
    const emploiTypes = informationsSpecifiques.emploiTypes || [];
    
    const categories = {};
    
    // Documents de base pour le représentant
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
      // Documents pour le représentant
      categories['Représentant de la famille'] = documentsRepresentant;
      
      // Documents pour les autres membres (si plus d'une personne)
      if (nombrePersonnes > 1) {
        for (let i = 2; i <= nombrePersonnes; i++) {
          const memberDocs = [...documentsRepresentant];
          
          // Vérifier si c'est un enfant à charge (on assume que c'est les membres 2+ pour l'exemple)
          // Dans une vraie application, on demanderait l'âge de chaque membre
          if (i <= 3) { // Supposons que les membres 2 et 3 peuvent être des enfants
            memberDocs.push('Prise en charge');
            memberDocs.push('Attestation de scolarité');
          }
          
          categories[`Membre ${i} de la famille`] = memberDocs;
        }
      }
    } else {
      // Personne seule
      categories['Documents requis'] = documentsRepresentant;
    }
    
    return categories;
  };

  // Fonction pour générer les documents spécifiques au Permis de travail
  const generatePermisTravailDocuments = () => {
    const informationsSpecifiques = clientData.informationsSpecifiques || {};
    const situationFamiliale = informationsSpecifiques.situationFamilialePermis || '';
    const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesPermis) || 1;
    const offreEmploiCanada = informationsSpecifiques.offreEmploiCanada || '';
    const emploiTypes = informationsSpecifiques.emploiActuelTypes || [];
    
    const categories = {};
    
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
    const provinceViseeRP = informationsSpecifiques.provinceViseeRP || '';
    
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

  // Fonction pour obtenir les documents requis organisés par catégories selon le type de procédure
  const getDocumentCategories = (typeProcedure) => {
    const categories = {
      'Documents d\'identité': [
        'Copie de CIN',
        'Copie du passeport',
        'Photo d\'identité'
      ]
    };

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
        return categories;
    }
  };

  // Fonction pour obtenir tous les documents sous forme de liste plate (pour compatibilité)
  const getRequiredDocuments = (typeProcedure) => {
    const categories = getDocumentCategories(typeProcedure);
    return getDocumentsAsList(categories);
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
  };

  // Fonction pour gérer les changements dans les informations spécifiques
  const handleSpecificInfoChange = (key, value) => {
    setClientData(prev => ({
      ...prev,
      informationsSpecifiques: {
        ...prev.informationsSpecifiques,
        [key]: value
      }
    }));
  };

  const handleProcedureChange = (e) => {
    const { value } = e.target;
    setClientData(prevData => ({
      ...prevData,
      typeProcedure: value,
      informationsSpecifiques: {} // Reset specific info when procedure changes
    }));
  };

  // Gestion des documents
  const handleDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'fichier' && files) {
      setNewDocument(prev => ({ ...prev, fichier: files[0] }));
    } else {
      setNewDocument(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (newDocument.type && newDocument.fichier) {
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        nom: newDocument.type,
        statut: 'fourni',
        dateUpload: new Date().toISOString().split('T')[0],
        description: newDocument.description || 'Aucune description fournie',
        fichier: newDocument.fichier.name // Dans une application réelle, on enverrait le fichier au serveur
      };

      setClientData(prevData => ({
        ...prevData,
        documents: [...prevData.documents, newDoc]
      }));

      setNewDocument({
        type: '',
        description: '',
        fichier: null
      });
    }
  };

  // Fonction pour remplacer un document
  const handleReplaceDocument = (documentType) => {
    console.log(`Remplacer le document: ${documentType}`);
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      if (e.target.files[0]) {
        handleQuickUpload(documentType, e.target.files[0]);
      }
    };
    input.click();
  };

  // Fonction pour supprimer un document
  const handleRemoveDocument = (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      // Supprimer le document de la liste
      setClientData(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId)
      }));
      
      console.log(`Document supprimé: ${documentId}`);
      // Ici on pourrait faire une requête API pour supprimer le fichier du serveur
    }
  };

  // Fonction pour télécharger un document
  const handleDownloadDocument = (document) => {
    console.log(`Télécharger le document: ${document.nom}`);
    // Si on a une URL, on peut créer un lien de téléchargement
    if (document.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.nom;
      link.click();
    } else {
      alert('Le téléchargement de ce document n\'est pas encore disponible.');
    }
  };

  // Fonction pour visualiser un document
  const handleViewDocument = (document) => {
    // Dans une vraie application, on ouvrirait le document dans une nouvelle fenêtre
    // ou on afficherait un aperçu
    console.log('Visualisation du document:', document);
    alert(`Visualisation du document: ${document.nom}\nFichier: ${document.fichier}\nStatut: ${document.statut}`);
  };

  // Fonction pour gérer le dépôt de fichier par drag & drop
  const handleDropDocument = (e, documentType) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(documentType, files[0]);
    }
  };

  // Fonction pour l'upload rapide de documents avec input file
  const handleQuickUpload = (category, documentType) => {
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Simuler l'upload du document
        const newDocument = {
          id: Date.now(),
          nom: documentType,
          fichier: file.name,
          type: documentType,
          category: category,
          statut: 'fourni',
          dateUpload: new Date().toISOString().split('T')[0],
          taille: file.size
        };
        
        // Ajouter le document à la liste
        setClientData(prev => ({
          ...prev,
          documents: [...prev.documents, newDocument]
        }));
        
        console.log('Document téléversé:', newDocument);
        // Dans une vraie application, on enverrait le fichier au serveur
      }
    };
    
    input.click();
  };

  // Fonction pour l'upload direct avec fichier (pour les zones de dépôt)
  const handleFileUpload = (documentType, file) => {
    if (file) {
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
        nom: documentType,
        fichier: file.name,
        type: documentType,
        statut: 'fourni',
        dateUpload: new Date().toISOString(),
        taille: file.size
      };
      
      // Ajouter le document à la liste (remplacer s'il existe déjà)
      setClientData(prev => ({
        ...prev,
        documents: [
          ...prev.documents.filter(doc => doc.nom !== documentType),
          newDocument
        ]
      }));
      
      console.log('Document téléversé:', newDocument);
      alert(`Document "${documentType}" téléversé avec succès !`);
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validation des champs requis
      if (!clientData.nom || !clientData.prenom || !clientData.email || !clientData.telephone) {
        alert('Veuillez remplir tous les champs obligatoires (nom, prénom, email, téléphone)');
        return;
      }

      setLoading(true);

      // Préparer les données pour l'envoi - CORRECTION: utiliser informationsSpecifiques (camelCase)
      const dataToSend = {
        ...clientData,
        // Mapper les noms de champs du frontend vers les noms de colonnes de la base de données
        type_procedure: clientData.typeProcedure,
        date_naissance: clientData.dateNaissance,
        contact_nom: clientData.contactNom,
        contact_prenom: clientData.contactPrenom,
        contact_relation: clientData.contactRelation,
        contact_telephone: clientData.contactTelephone,
        contact_email: clientData.contactEmail,
        login_client: clientData.loginClient,
        mot_de_passe_client: clientData.motDePasseClient,
        urgence: clientData.urgent,
        // Convertir informationsSpecifiques en JSON string pour la base de données
        informations_specifiques: JSON.stringify(clientData.informationsSpecifiques || {}),
        date_modification: new Date().toISOString()
      };

      // Debug: Afficher les données qui vont être envoyées
      console.log('Données du client à envoyer:', dataToSend);
      console.log('Informations spécifiques:', clientData.informationsSpecifiques);
      console.log('Type de procédure:', clientData.typeProcedure);

      // Fonction pour obtenir les headers d'authentification
      const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        return headers;
      };

      let response;
      if (isEditing) {
        // Modification d'un client existant
        console.log('Envoi de la mise à jour du client:', dataToSend);
        response = await fetch(`http://localhost:5000/api/clients/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(dataToSend)
        });
      } else {
        // Création d'un nouveau client
        console.log('Envoi de la création du client:', dataToSend);
        response = await fetch('http://localhost:5000/api/clients', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...dataToSend,
            date_creation: new Date().toISOString(),
            numero_dossier: `DOS-${Date.now()}`
          })
        });
      }

      console.log('Réponse du serveur:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Réponse réussie du serveur:', result);
        alert(isEditing ? 'Client modifié avec succès !' : 'Client créé avec succès !');
        
        // Rediriger vers la liste des clients
        if (navigate) {
          navigate('/clients');
        } else {
          window.location.href = '/clients';
        }
      } else {
        const error = await response.json();
        console.error('Erreur du serveur:', error);
        console.error('Status:', response.status);
        console.error('Données envoyées:', dataToSend);
        alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du client');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rendre les champs spécifiques selon le type de procédure
  const renderSpecificFields = () => {
    const typeProcedure = clientData.typeProcedure;
    
    if (!typeProcedure) return null;

    const informationsSpecifiques = clientData.informationsSpecifiques || {};

    const renderField = (key, label, type = 'text', options = null, required = false) => {
      const value = informationsSpecifiques[key] || '';
      
      if (type === 'select' && options) {
        return (
          <div key={key} className="form-group">
            <label htmlFor={key}>{label} {required && <span className="required">*</span>}</label>
            <select
              id={key}
              name={`informationsSpecifiques.${key}`}
              value={value}
              onChange={(e) => handleSpecificInfoChange(key, e.target.value)}
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
              name={`informationsSpecifiques.${key}`}
              value={value}
              onChange={(e) => handleSpecificInfoChange(key, e.target.value)}
              className="form-control"
              rows="3"
              required={required}
            />
          </div>
        );
      }

      if (type === 'checkbox-group') {
        return (
          <div key={key} className="form-group">
            <label>{label} {required && <span className="required">*</span>}</label>
            <div className="checkbox-group">
              {options.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={`informationsSpecifiques.${key}`}
                    value={option}
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleSpecificInfoChange(key, [...currentValues, option]);
                      } else {
                        handleSpecificInfoChange(key, currentValues.filter(v => v !== option));
                      }
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="form-group">
          <label htmlFor={key}>{label} {required && <span className="required">*</span>}</label>
          <input
            type={type}
            id={key}
            name={`informationsSpecifiques.${key}`}
            value={value}
            onChange={(e) => handleSpecificInfoChange(key, e.target.value)}
            className="form-control"
            required={required}
          />
        </div>
      );
    };

    switch (typeProcedure) {
      case 'Visa visiteur':
        const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
        const invitationCanada = informationsSpecifiques.invitationCanada || '';
        const voyageEtranger = informationsSpecifiques.voyageEtranger || '';
        const visaRefus = informationsSpecifiques.visaRefus || '';
        const emploiTypes = informationsSpecifiques.emploiTypes || [];
        const autreEmploi = emploiTypes.includes('Autre');
        
        return (
          <div className="specific-fields">
            <h4>📋 Informations spécifiques - Visa visiteur</h4>
            
            {/* Ligne 1: Fonds et Situation familiale */}
            <div className="form-row">
              {renderField('fondsDisponibles', 'Fonds disponibles en compte (CAD)', 'number', null, true)}
              {renderField('situationFamiliale', 'Situation familiale', 'select', 
                ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait'], true)}
            </div>
            
            {/* Ligne 2: Nombre de personnes et Date de voyage */}
            <div className="form-row">
              {renderField('nombrePersonnes', 'Nombre de personnes dans la demande', 'number')}
              {renderField('dateVoyage', 'Date prévue du voyage', 'date')}
            </div>
            
            {/* Ligne 3: Emploi (cases à cocher) */}
            <div className="form-row">
              {renderField('emploiTypes', 'Emploi', 'checkbox-group', 
                ['Salarié', 'Entrepreneur', 'Retraité', 'Autre'])}
            </div>
            
            {/* Champ conditionnel: Autre emploi */}
            {autreEmploi && (
              <div className="form-row">
                {renderField('autreEmploiPrecision', 'Précisez le type d\'emploi', 'text')}
              </div>
            )}
            
            {/* Ligne 4: Invitation du Canada */}
            <div className="form-row">
              {renderField('invitationCanada', 'Invitation du Canada', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Lien de parenté avec l'invitant */}
            {invitationCanada === 'Oui' && (
              <div className="form-row">
                {renderField('lienParenteInvitant', 'Lien de parenté avec l\'invitant', 'text')}
              </div>
            )}
            
            {/* Champ conditionnel: Représentant de la famille */}
            {situationFamiliale && situationFamiliale !== 'Célibataire' && (
              <div className="form-row">
                {renderField('representantFamille', 'Qui sera le représentant de la famille ?', 'text')}
              </div>
            )}
            
            {/* Ligne 5: Voyages à l'étranger */}
            <div className="form-row">
              {renderField('voyageEtranger', 'Avez-vous déjà voyagé à l\'étranger ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails voyages */}
            {voyageEtranger === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVoyages', 'Pays, dates, durées', 'textarea')}
              </div>
            )}
            
            {/* Ligne 6: Visa ou refus antérieur */}
            <div className="form-row">
              {renderField('visaRefus', 'Avez-vous déjà eu un visa ou un refus (Canada ou autre pays) ?', 'select', ['Oui', 'Non'])}
            </div>
            
            {/* Champ conditionnel: Détails visa/refus */}
            {visaRefus === 'Oui' && (
              <div className="form-row">
                {renderField('detailsVisaRefus', 'Pays, type de visa, dates, accepté/refusé', 'textarea')}
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
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenusEtudes || [])];
                            newDiplomes[index] = { ...newDiplomes[index], nom: e.target.value };
                            handleSpecificInfoChange('diplomesObtenusEtudes', newDiplomes);
                          }}
                          className="form-control"
                          placeholder="Ex: Baccalauréat scientifique"
                        />
                      </div>
                      <div className="form-group">
                        <label>Établissement :</label>
                        <input
                          type="text"
                          value={diplome.etablissement || ''}
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenusEtudes || [])];
                            newDiplomes[index] = { ...newDiplomes[index], etablissement: e.target.value };
                            handleSpecificInfoChange('diplomesObtenusEtudes', newDiplomes);
                          }}
                          className="form-control"
                          placeholder="Ex: Lycée Mohammed V"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newDiplomes = (informationsSpecifiques.diplomesObtenusEtudes || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange('diplomesObtenusEtudes', newDiplomes);
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
                    const newDiplomes = [...(informationsSpecifiques.diplomesObtenusEtudes || []), { nom: '', etablissement: '' }];
                    handleSpecificInfoChange('diplomesObtenusEtudes', newDiplomes);
                  }}
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
                          onChange={(e) => {
                            const newEtablissements = [...(informationsSpecifiques.etablissementsFrequentes || [])];
                            newEtablissements[index] = { ...newEtablissements[index], nom: e.target.value };
                            handleSpecificInfoChange('etablissementsFrequentes', newEtablissements);
                          }}
                          className="form-control"
                          placeholder="Ex: Université Hassan II"
                        />
                      </div>
                      <div className="form-group">
                        <label>Période :</label>
                        <input
                          type="text"
                          value={etablissement.periode || ''}
                          onChange={(e) => {
                            const newEtablissements = [...(informationsSpecifiques.etablissementsFrequentes || [])];
                            newEtablissements[index] = { ...newEtablissements[index], periode: e.target.value };
                            handleSpecificInfoChange('etablissementsFrequentes', newEtablissements);
                          }}
                          className="form-control"
                          placeholder="Ex: 2020-2023"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newEtablissements = (informationsSpecifiques.etablissementsFrequentes || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange('etablissementsFrequentes', newEtablissements);
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
                    const newEtablissements = [...(informationsSpecifiques.etablissementsFrequentes || []), { nom: '', periode: '' }];
                    handleSpecificInfoChange('etablissementsFrequentes', newEtablissements);
                  }}
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
                          onChange={(e) => {
                            const newGarants = [...(informationsSpecifiques.garants || [])];
                            newGarants[index] = { ...newGarants[index], relation: e.target.value };
                            handleSpecificInfoChange('garants', newGarants);
                          }}
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
                          onChange={(e) => {
                            const newGarants = [...(informationsSpecifiques.garants || [])];
                            newGarants[index] = { ...newGarants[index], capaciteFinanciere: e.target.value };
                            handleSpecificInfoChange('garants', newGarants);
                          }}
                          className="form-control"
                          placeholder="Ex: 50000"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newGarants = (informationsSpecifiques.garants || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange('garants', newGarants);
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
                    const newGarants = [...(informationsSpecifiques.garants || []), { relation: '', capaciteFinanciere: '' }];
                    handleSpecificInfoChange('garants', newGarants);
                  }}
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
                            handleSpecificInfoChange('postesOccupes', newPostes);
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
                            handleSpecificInfoChange('postesOccupes', newPostes);
                          }}
                          className="form-control"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newPostes = (informationsSpecifiques.postesOccupes || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange('postesOccupes', newPostes);
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
                    handleSpecificInfoChange('postesOccupes', newPostes);
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
                            handleSpecificInfoChange('diplomesObtenus', newDiplomes);
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
                            handleSpecificInfoChange('diplomesObtenus', newDiplomes);
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
                          handleSpecificInfoChange('diplomesObtenus', newDiplomes);
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
                    handleSpecificInfoChange('diplomesObtenus', newDiplomes);
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
            
            {/* Section  1: Informations personnelles supplémentaires */}
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
        const situationFamilialeRP = informationsSpecifiques.situationFamilialeRP || '';
        const nombrePersonnesRP = informationsSpecifiques.nombrePersonnesRP || '';
        const programmesRP = informationsSpecifiques.programmesRP || [];
        const autreProgrammeRP = programmesRP.includes('Autre');
        const voyageEtrangerRP = informationsSpecifiques.voyageEtrangerRP || '';
        const visaAnterieursRP = informationsSpecifiques.visaAnterieursRP || '';
        const refusVisaRP = informationsSpecifiques.refusVisaRP || '';
        const familleCanadaRP = informationsSpecifiques.familleCanadaRP || '';
        
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
                {(informationsSpecifiques.diplomesObtenusRP || []).map((diplome, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du diplôme :</label>
                        <input
                          type="text"
                          value={diplome.nom || ''}
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenusRP || [])];
                            newDiplomes[index] = { ...newDiplomes[index], nom: e.target.value };
                            handleSpecificInfoChange('diplomesObtenusRP', newDiplomes);
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
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenusRP || [])];
                            newDiplomes[index] = { ...newDiplomes[index], etablissement: e.target.value };
                            handleSpecificInfoChange('diplomesObtenusRP', newDiplomes);
                          }}
                          className="form-control"
                          placeholder="Ex: Université XYZ"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date d'obtention :</label>
                        <input
                          type="date"
                          value={diplome.dateObtention || ''}
                          onChange={(e) => {
                            const newDiplomes = [...(informationsSpecifiques.diplomesObtenusRP || [])];
                            newDiplomes[index] = { ...newDiplomes[index], dateObtention: e.target.value };
                            handleSpecificInfoChange('diplomesObtenusRP', newDiplomes);
                          }}
                          className="form-control"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => {
                          const newDiplomes = (informationsSpecifiques.diplomesObtenusRP || []).filter((_, i) => i !== index);
                          handleSpecificInfoChange('diplomesObtenusRP', newDiplomes);
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
                    const newDiplomes = [...(informationsSpecifiques.diplomesObtenusRP || []), { nom: '', etablissement: '', dateObtention: '' }];
                    handleSpecificInfoChange('diplomesObtenusRP', newDiplomes);
                  }}
                >
                  Ajouter un diplôme
                </button>
              </div>
            </div>
            
            {/* Expérience professionnelle - Section dynamique */}
            <div className="dynamic-section">
              <label>Expérience professionnelle détaillée :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.experiencesProfessionnellesRP || []).map((experience, index) => (
                  <div key={index} className="dynamic-item">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom de l'entreprise :</label>
                        <input
                          type="text"
                          value={experience.entreprise || ''}
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], entreprise: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
                          className="form-control"
                          placeholder="Ex: ABC Corporation"
                        />
                      </div>
                      <div className="form-group">
                        <label>Poste occupé :</label>
                        <input
                          type="text"
                          value={experience.poste || ''}
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], poste: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
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
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], dateDebut: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Date de fin :</label>
                        <input
                          type="date"
                          value={experience.dateFin || ''}
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], dateFin: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Code CNP :</label>
                        <input
                          type="text"
                          value={experience.codeCNP || ''}
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], codeCNP: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
                          className="form-control"
                          placeholder="Ex: 2174"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mois d'expérience :</label>
                        <input
                          type="number"
                          value={experience.moisExperience || ''}
                          onChange={(e) => {
                            const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || [])];
                            newExperiences[index] = { ...newExperiences[index], moisExperience: e.target.value };
                            handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                          }}
                          className="form-control"
                          placeholder="Ex: 24"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      onClick={() => {
                        const newExperiences = (informationsSpecifiques.experiencesProfessionnellesRP || []).filter((_, i) => i !== index);
                        handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    const newExperiences = [...(informationsSpecifiques.experiencesProfessionnellesRP || []), 
                      { entreprise: '', poste: '', dateDebut: '', dateFin: '', codeCNP: '', moisExperience: '' }];
                    handleSpecificInfoChange('experiencesProfessionnellesRP', newExperiences);
                  }}
                >
                  Ajouter une expérience
                </button>
              </div>
            </div>
            
            {/* Compétences linguistiques - Section dynamique avec alertes */}
            <div className="dynamic-section">
              <label>Compétences linguistiques :</label>
              <div className="dynamic-list">
                {(informationsSpecifiques.competencesLinguistiquesRP || []).map((test, index) => {
                  const isExpiring = isTestExpiringSoon(test.dateExpiration);
                  return (
                    <div key={index} className={`dynamic-item ${isExpiring ? 'test-expiring' : ''}`}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Langue :</label>
                          <select
                            value={test.langue || ''}
                            onChange={(e) => {
                              const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || [])];
                              newTests[index] = { ...newTests[index], langue: e.target.value };
                              handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                            }}
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
                            onChange={(e) => {
                              const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || [])];
                              newTests[index] = { ...newTests[index], typeTest: e.target.value };
                              handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                            }}
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
                            onChange={(e) => {
                              const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || [])];
                              newTests[index] = { ...newTests[index], scores: e.target.value };
                              handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                            }}
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
                            onChange={(e) => {
                              const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || [])];
                              newTests[index] = { ...newTests[index], dateTest: e.target.value };
                              handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                            }}
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
                            onChange={(e) => {
                              const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || [])];
                              newTests[index] = { ...newTests[index], dateExpiration: e.target.value };
                              handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                            }}
                            className={`form-control ${isExpiring ? 'expiring-field' : ''}`}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-danger btn-small"
                          onClick={() => {
                            const newTests = (informationsSpecifiques.competencesLinguistiquesRP || []).filter((_, i) => i !== index);
                            handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                          }}
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
                  onClick={() => {
                    const newTests = [...(informationsSpecifiques.competencesLinguistiquesRP || []), 
                      { langue: '', typeTest: '', scores: '', dateTest: '', dateExpiration: '' }];
                    handleSpecificInfoChange('competencesLinguistiquesRP', newTests);
                  }}
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
        return null;
    }
  };

  // Fonction pour ajouter une note
  const handleAddNote = async () => {
    if (newNote.trim()) {
      const newNoteObj = {
        id: Date.now(),
        texte: newNote.trim(),
        auteur: 'Utilisateur actuel', // À remplacer par l'utilisateur connecté
        date: new Date().toISOString(),
        type: 'Note générale'
      };
      
      try {
        // Fonction pour obtenir les headers d'authentification
        const getAuthHeaders = () => {
          const token = localStorage.getItem('token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          return headers;
        };

        // Ajouter la note localement
        setClientData(prev => ({
          ...prev,
          notes: [...(prev.notes || []), newNoteObj]
        }));

        // Sauvegarder la note via l'API
        const response = await fetch(`http://localhost:5000/api/clients/${id}/notes`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ note: newNoteObj })
        });

        if (response.ok) {
          console.log('✅ Note sauvegardée avec succès');
        } else {
          console.warn('⚠️ Erreur lors de la sauvegarde de la note');
        }

        setNewNote('');
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la note:', error);
        // La note reste ajoutée localement même en cas d'erreur
        setNewNote('');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données du client...</p>
      </div>
    );
  }

  return (
    <div className="client-form-container">
      <div className="form-header">
        <h2>Modifier le client</h2>
        <div className="client-info">
          <p><strong>Numéro de dossier:</strong> {clientData.numeroDossier}</p>
          <p><strong>Date de création:</strong> {clientData.dateCreation}</p>
        </div>
      </div>

      <div className="form-tabs">
        <button
          className={activeTab === 'informations' ? 'active' : ''}
          onClick={() => setActiveTab('informations')}
        >
          Informations générales
        </button>
        <button
          className={activeTab === 'procedure' ? 'active' : ''}
          onClick={() => setActiveTab('procedure')}
        >
          Procédure
        </button>
        <button
          className={activeTab === 'documents' ? 'active' : ''}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Onglet Informations générales */}
        {activeTab === 'informations' && (
          <div className="form-section">
            <h3>Informations personnelles</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="required">Nom:</label>
                <input
                  type="text"
                  name="nom"
                  value={clientData.nom}
                  onChange={handleInputChange}
                />
                {errors.nom && <div className="error-message">{errors.nom}</div>}
              </div>
              <div className="form-group">
                <label className="required">Prénom:</label>
                <input
                  type="text"
                  name="prenom"
                  value={clientData.prenom}
                  onChange={handleInputChange}
                />
                {errors.prenom && <div className="error-message">{errors.prenom}</div>}
              </div>
              <div className="form-group">
                <label>Date de naissance:</label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={clientData.dateNaissance}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="required">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={clientData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label>Téléphone:</label>
                <input
                  type="tel"
                  name="telephone"
                  value={clientData.telephone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="adresse"
                  value={clientData.adresse}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Nationalité:</label>
                <input
                  type="text"
                  name="nationalite"
                  value={clientData.nationalite}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <h3>Contact d'urgence</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nom:</label>
                <input
                  type="text"
                  name="contactNom"
                  value={clientData.contactNom}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Prénom:</label>
                <input
                  type="text"
                  name="contactPrenom"
                  value={clientData.contactPrenom}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Relation:</label>
                <input
                  type="text"
                  name="contactRelation"
                  value={clientData.contactRelation}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Téléphone:</label>
                <input
                  type="tel"
                  name="contactTelephone"
                  value={clientData.contactTelephone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={clientData.contactEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <h3>Informations de compte</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Login client:</label>
                <input
                  type="text"
                  name="loginClient"
                  value={clientData.loginClient}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group password-group">
                <label>Mot de passe client:</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
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

            <h3>Gestion interne</h3>
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
                  <option value="">
                    {isLoadingConseillers ? 'Chargement...' : 'Sélectionner...'}
                  </option>
                  {conseilleres.map(conseillere => (
                    <option key={conseillere.id} value={conseillere.nom}>
                      {conseillere.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Statut:</label>
                <select
                  name="statut"
                  value={clientData.statut}
                  onChange={handleInputChange}
                >
                  <option value="En attente">En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Complété">Complété</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={clientData.urgent}
                    onChange={handleInputChange}
                  />
                  Dossier urgent
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Procédure */}
        {activeTab === 'procedure' && (
          <div className="form-section">
            <h3>Informations de procédure</h3>
            <div className="form-group">
              <label className="required">Type de procédure:</label>
              <select
                name="typeProcedure"
                value={clientData.typeProcedure}
                onChange={handleProcedureChange}
              >
                <option value="">Sélectionner...</option>
                {procedureOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.typeProcedure && <div className="error-message">{errors.typeProcedure}</div>}
            </div>

            {clientData.typeProcedure && renderSpecificFields()}
            
            {/* Champs cachés pour garantir que les informations spécifiques sont incluses dans le formulaire */}
            <input 
              type="hidden" 
              name="informationsSpecifiques" 
              value={JSON.stringify(clientData.informationsSpecifiques || {})} 
            />
          </div>
        )}

        {/* Onglet Documents */}
        {activeTab === 'documents' && (
          <div className="form-section">
            <h3>Documents requis pour {clientData.typeProcedure}</h3>
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
                  {getRequiredDocuments(clientData.typeProcedure).map((documentName, index) => {
                    const existingDoc = clientData.documents?.find(doc => doc.nom === documentName);
                    const isProvided = existingDoc && existingDoc.statut === 'fourni';
                    return (
                      <tr key={index} className={isProvided ? 'document-provided' : 'document-pending'}>
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
        )}

        {/* Onglet Notes */}
        {activeTab === 'notes' && (
          <div className="form-section">
            <h3>Notes</h3>
            <div className="notes-list">
              {clientData.notes.map(note => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <span className="note-date">{note.date}</span>
                    <span className="note-author">{note.auteur}</span>
                  </div>
                  <div className="note-content">{note.contenu}</div>
                </div>
              ))}
            </div>

            <div className="add-note-form">
              <h4>Ajouter une note</h4>
              <div className="form-group">
                <textarea
                  name="newNote"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Saisir une nouvelle note..."
                  rows="4"
                ></textarea>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                Ajouter une note
              </button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/clients')}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientEdit;
