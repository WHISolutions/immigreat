import React, { useState, useEffect } from 'react';
import '../styles/NewClient.css';
import { useNavigate } from 'react-router-dom';
import { getConseillers } from '../services/conseillerAPI';

function NewClient() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedProcedure, setSelectedProcedure] = useState('');
  
  // État pour contrôler la visibilité du mot de passe
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    // Informations administratives
    typeProcedure: '',
    conseillereAssignee: '',
    
    // Informations personnelles
    nom: '',
    prenom: '',
    dateNaissance: '',
    email: '',
    telephone: '',
    adresse: '',
    nationalite: '',
    loginClient: '',
    motDePasseClient: '',
    
    // Contact alternatif
    contactNom: '',
    contactPrenom: '',
    contactRelation: '',
    contactTelephone: '',
    contactEmail: '',
    
    // Informations spécifiques (initialisées selon le type de procédure)
    informationsSpecifiques: {}
  });
  
  // Fonction pour basculer la visibilité du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Options pour les types de procédures
  const procedureTypes = [
    'Visa Visiteur',
    'Permis de travail',
    'Permis d\'études',
    'Investisseur',
    'Regroupement familial',
    'Résidence permanente'
  ];
  
  // État pour les conseillers (chargés dynamiquement depuis l'API)
  const [conseillers, setConseillers] = useState([]);
  const [isLoadingConseillers, setIsLoadingConseillers] = useState(true);

  // Charger les conseillers depuis l'API
  useEffect(() => {
    const loadConseillers = async () => {
      try {
        setIsLoadingConseillers(true);
        console.log('🔄 Chargement des conseillers dans NewClient...');
        
        const result = await getConseillers();
        
        if (result.success && result.data) {
          // Transformer les données en format attendu (liste de noms)
          const conseillersList = result.data.map(conseiller => conseiller.nomComplet);
          setConseillers(conseillersList);
          console.log('✅ Conseillers chargés dans NewClient:', conseillersList);
        } else {
          // En cas d'erreur, utiliser la liste par défaut
          const defaultList = result.data.map(conseiller => conseiller.nomComplet);
          setConseillers(defaultList);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des conseillers dans NewClient:', error);
        // Liste de secours
        setConseillers(['wafaa chaouby', 'hame amni', 'sanaa sami']);
      } finally {
        setIsLoadingConseillers(false);
      }
    };

    loadConseillers();
  }, []);

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté
  useEffect(() => {
    // Attendre que les conseillers soient chargés et que le champ ne soit pas déjà rempli
    if (!isLoadingConseillers && conseillers.length > 0 && !formData.conseillereAssignee) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré (NewClient):', userName);
      console.log('📋 Liste des conseillers disponibles (NewClient):', conseillers);
      
      if (userName) {
        // Chercher l'utilisateur connecté dans la liste des conseillers
        const userInList = conseillers.find(conseiller => 
          conseiller.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(conseiller.toLowerCase())
        );
        
        if (userInList) {
          console.log('✅ Préremplissage du champ conseillère (NewClient) avec:', userInList);
          setFormData(prev => ({
            ...prev,
            conseillereAssignee: userInList
          }));
        } else {
          console.log('⚠️ Utilisateur connecté non trouvé dans la liste des conseillers (NewClient):', {
            userName,
            conseillers,
            recherchePartielle: conseillers.filter(c => 
              c.toLowerCase().includes(userName.toLowerCase()) || 
              userName.toLowerCase().includes(c.toLowerCase())
            )
          });
        }
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage (NewClient)');
      }
    }
  }, [isLoadingConseillers, conseillers, formData.conseillereAssignee]);
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'typeProcedure') {
      setSelectedProcedure(value);
      
      // Initialiser les champs spécifiques selon le type de procédure
      let specificFields = {};
      
      switch(value) {
        case 'Visa Visiteur':
          specificFields = {
            fondsDisponibles: '',
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            dateVoyage: '',
            emploi: '',
            invitationCanada: 'Non',
            lienParenteInvitant: '',
            representantPrincipal: '',
            voyagesAnterieurs: 'Non',
            visasRefusAnterieurs: 'Non',
            detailsRefus: ''
          };
          break;
          
        case 'Permis de travail':
          specificFields = {
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            representantPrincipal: '',
            emploiActuel: '',
            postes: [{ poste: '', moisExperience: 0 }],
            diplomes: [{ niveau: '', etablissement: '', annee: '' }],
            competencesFrancais: '',
            competencesAnglais: '',
            testsLangue: [{ type: '', score: '', date: '' }],
            offreEmploiCanada: 'Non',
            employeurCanadien: '',
            typePoste: '',
            provinceEmploi: '',
            dureeContrat: '',
            numeroOffre: '',
            typePermis: '',
            provinceVisee: '',
            dateDepart: '',
            fondsDisponibles: '',
            voyagesAnterieurs: 'Non',
            visasPrecedents: '',
            refusAnterieurs: 'Non',
            detailsRefus: ''
          };
          break;
          
        case 'Permis d\'études':
          specificFields = {
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            representantPrincipal: '',
            diplomes: [{ niveau: '', etablissement: '', annee: '' }],
            niveauEtudesActuel: '',
            etablissementsFrequentes: [''],
            competencesFrancais: '',
            competencesAnglais: '',
            testsLangue: [{ type: '', score: '', date: '' }],
            programmeEtudesSouhaite: '',
            etablissementsVises: [''],
            provinceVisee: '',
            dateDebutEtudes: '',
            garants: [],
            capaciteFinanciere: '',
            voyagesAnterieurs: 'Non',
            visasPrecedents: '',
            refusAnterieurs: 'Non',
            detailsRefus: ''
          };
          break;
          
        case 'Investisseur':
          specificFields = {
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            representantPrincipal: '',
            statutProfessionnel: '',
            secteurActivite: '',
            experienceGestion: 0,
            entreprisesDetenues: [''],
            valeurNette: '',
            typeProgrammeInvestisseur: '',
            provinceVisee: '',
            planAffaires: 'Non',
            montantInvestissement: '',
            secteurActiviteVise: '',
            fondsDisponibles: '',
            sourcesFonds: [],
            actifsDetenusDetails: '',
            revenusAnnuels: '',
            voyagesAnterieurs: 'Non',
            visasPrecedents: '',
            refusAnterieurs: 'Non',
            detailsRefus: ''
          };
          break;
          
        case 'Regroupement familial':
          specificFields = {
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            lienParenteRepondant: '',
            nomRepondant: '',
            statutRepondant: '',
            adresseRepondant: '',
            telephoneRepondant: '',
            emailRepondant: '',
            nombrePersonnesChargeRepondant: 0,
            regroupementAnterieurs: 'Non',
            typeParrainage: [],
            provinceDestination: '',
            capaciteFinanciereRepondant: '',
            voyagesAnterieurs: 'Non',
            visasPrecedents: '',
            refusAnterieurs: 'Non',
            detailsRefus: ''
          };
          break;
          
        case 'Résidence permanente':
          specificFields = {
            situationFamiliale: '',
            nombrePersonnesDemande: 1,
            representantPrincipal: '',
            procedureVisee: [],
            niveauEtudes: '',
            diplomes: [{ niveau: '', etablissement: '', annee: '' }],
            experiences: [{ emploi: '', dates: '', employeur: '', poste: '', cnp: '', moisExperience: 0 }],
            competencesFrancais: '',
            competencesAnglais: '',
            testsLangue: [{ type: '', score: '', date: '', dateExpiration: '' }],
            programmeRP: [],
            provinceVisee: '',
            scoreCalcule: '',
            fondsDisponibles: '',
            voyagesAnterieurs: 'Non',
            visasPrecedents: '',
            refusAnterieurs: 'Non',
            detailsRefus: '',
            familleCanada: 'Non',
            lienParenteCanada: ''
          };
          break;
          
        default:
          break;
      }
      
      setFormData({
        ...formData,
        typeProcedure: value,
        informationsSpecifiques: specificFields
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gérer les changements dans les informations spécifiques
  const handleSpecificChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      informationsSpecifiques: {
        ...formData.informationsSpecifiques,
        [name]: value
      }
    });
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Logique de création du client
    console.log('Nouveau client créé:', formData);
    
    // Rediriger vers la liste des clients
    navigate('/clients');
  };
  
  // Passer à l'étape suivante
  const nextStep = () => {
    setActiveStep(activeStep + 1);
  };
  
  // Revenir à l'étape précédente
  const prevStep = () => {
    setActiveStep(activeStep - 1);
  };
  
  return (
    <div className="new-client-container">
      <div className="new-client-header">
        <h2>Nouveau Client</h2>
      </div>
      
      <div className="stepper">
        <div className={`step ${activeStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Type de procédure</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${activeStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Informations personnelles</div>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${activeStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Informations spécifiques</div>
        </div>
      </div>
      
      <div className="new-client-content">
        <form onSubmit={handleSubmit}>
          {/* Étape 1: Type de procédure */}
          {activeStep === 1 && (
            <div className="form-step">
              <div className="form-section">
                <h3>Sélection du type de procédure</h3>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Type de procédure <span className="required">*</span></label>
                    <select 
                      name="typeProcedure" 
                      value={formData.typeProcedure} 
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner un type de procédure</option>
                      {procedureTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>
                      Conseillère assignée <span className="required">*</span>
                      {isLoadingConseillers && <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>(Chargement...)</span>}
                    </label>
                    <select 
                      name="conseillereAssignee" 
                      value={formData.conseillereAssignee} 
                      onChange={handleChange}
                      required
                      disabled={isLoadingConseillers}
                      style={isLoadingConseillers ? { backgroundColor: '#f5f5f5', cursor: 'wait' } : {}}
                    >
                      <option value="">
                        {isLoadingConseillers ? 'Chargement des conseillères...' : 'Sélectionner une conseillère'}
                      </option>
                      {conseillers.map(conseiller => (
                        <option key={conseiller} value={conseiller}>{conseiller}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={nextStep}
                  disabled={!formData.typeProcedure || !formData.conseillereAssignee}
                >
                  Suivant <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}
          
          {/* Étape 2: Informations personnelles */}
          {activeStep === 2 && (
            <div className="form-step">
              <div className="form-section">
                <h3>Informations personnelles</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="nom" 
                      value={formData.nom} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Prénom <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="prenom" 
                      value={formData.prenom} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date de naissance <span className="required">*</span></label>
                    <input 
                      type="date" 
                      name="dateNaissance" 
                      value={formData.dateNaissance} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone <span className="required">*</span></label>
                    <input 
                      type="tel" 
                      name="telephone" 
                      value={formData.telephone} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nationalité <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="nationalite" 
                      value={formData.nationalite} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Adresse complète <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="adresse" 
                      value={formData.adresse} 
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Login client</label>
                    <input 
                      type="text" 
                      name="loginClient" 
                      value={formData.loginClient} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group password-group">
                    <label>Mot de passe client</label>
                    <div className="password-input-container">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="motDePasseClient" 
                        value={formData.motDePasseClient} 
                        onChange={handleChange}
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
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom</label>
                    <input 
                      type="text" 
                      name="contactNom" 
                      value={formData.contactNom} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prénom</label>
                    <input 
                      type="text" 
                      name="contactPrenom" 
                      value={formData.contactPrenom} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <input 
                      type="text" 
                      name="contactRelation" 
                      value={formData.contactRelation} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      name="contactEmail" 
                      value={formData.contactEmail} 
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input 
                      type="tel" 
                      name="contactTelephone" 
                      value={formData.contactTelephone} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={prevStep}>
                  <i className="fas fa-arrow-left"></i> Précédent
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={nextStep}
                  disabled={!formData.nom || !formData.prenom || !formData.dateNaissance || !formData.email || !formData.telephone || !formData.nationalite || !formData.adresse}
                >
                  Suivant <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}
          
          {/* Étape 3: Informations spécifiques selon le type de procédure */}
          {activeStep === 3 && (
            <div className="form-step">
              {/* Visa Visiteur */}
              {formData.typeProcedure === 'Visa Visiteur' && (
                <div className="form-section">
                  <h3>Informations spécifiques au Visa Visiteur</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fonds disponibles en compte</label>
                      <input 
                        type="text" 
                        name="fondsDisponibles" 
                        value={formData.informationsSpecifiques.fondsDisponibles} 
                        onChange={handleSpecificChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Situation familiale</label>
                      <input 
                        type="text" 
                        name="situationFamiliale" 
                        value={formData.informationsSpecifiques.situationFamiliale} 
                        onChange={handleSpecificChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nombre de personnes dans la demande</label>
                      <input 
                        type="number" 
                        name="nombrePersonnesDemande" 
                        value={formData.informationsSpecifiques.nombrePersonnesDemande} 
                        onChange={handleSpecificChange}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date prévue du voyage</label>
                      <input 
                        type="date" 
                        name="dateVoyage" 
                        value={formData.informationsSpecifiques.dateVoyage} 
                        onChange={handleSpecificChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Emploi</label>
                      <select 
                        name="emploi" 
                        value={formData.informationsSpecifiques.emploi} 
                        onChange={handleSpecificChange}
                      >
                        <option value="">Sélectionner</option>
                        <option value="Salarié">Salarié</option>
                        <option value="Entrepreneur">Entrepreneur</option>
                        <option value="Retraité">Retraité</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Invitation du Canada</label>
                      <select 
                        name="invitationCanada" 
                        value={formData.informationsSpecifiques.invitationCanada} 
                        onChange={handleSpecificChange}
                      >
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                      </select>
                    </div>
                    {formData.informationsSpecifiques.invitationCanada === 'Oui' && (
                      <div className="form-group">
                        <label>Lien de parenté avec l'invitant</label>
                        <input 
                          type="text" 
                          name="lienParenteInvitant" 
                          value={formData.informationsSpecifiques.lienParenteInvitant} 
                          onChange={handleSpecificChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  {formData.informationsSpecifiques.nombrePersonnesDemande > 1 && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Représentant principal</label>
                        <input 
                          type="text" 
                          name="representantPrincipal" 
                          value={formData.informationsSpecifiques.representantPrincipal} 
                          onChange={handleSpecificChange}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Avez-vous déjà voyagé à l'étranger ?</label>
                      <select 
                        name="voyagesAnterieurs" 
                        value={formData.informationsSpecifiques.voyagesAnterieurs} 
                        onChange={handleSpecificChange}
                      >
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Avez-vous déjà eu un visa au Canada ou un refus ?</label>
                      <select 
                        name="visasRefusAnterieurs" 
                        value={formData.informationsSpecifiques.visasRefusAnterieurs} 
                        onChange={handleSpecificChange}
                      >
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                      </select>
                    </div>
                  </div>
                  
                  {formData.informationsSpecifiques.visasRefusAnterieurs === 'Oui' && (
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label>Détails des visas ou refus antérieurs</label>
                        <textarea 
                          name="detailsRefus" 
                          value={formData.informationsSpecifiques.detailsRefus} 
                          onChange={handleSpecificChange}
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Permis d'études (exemple) */}
              {formData.typeProcedure === 'Permis d\'études' && (
                <div className="form-section">
                  <h3>Informations spécifiques au Permis d'études</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Situation familiale</label>
                      <input 
                        type="text" 
                        name="situationFamiliale" 
                        value={formData.informationsSpecifiques.situationFamiliale} 
                        onChange={handleSpecificChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nombre de personnes dans la demande</label>
                      <input 
                        type="number" 
                        name="nombrePersonnesDemande" 
                        value={formData.informationsSpecifiques.nombrePersonnesDemande} 
                        onChange={handleSpecificChange}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4>Informations académiques</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Niveau d'études actuel</label>
                        <select 
                          name="niveauEtudesActuel" 
                          value={formData.informationsSpecifiques.niveauEtudesActuel} 
                          onChange={handleSpecificChange}
                        >
                          <option value="">Sélectionner</option>
                          <option value="Niveau BAC">Niveau BAC</option>
                          <option value="BAC">BAC</option>
                          <option value="BAC+2">BAC+2</option>
                          <option value="BAC+3">BAC+3</option>
                          <option value="Master">Master</option>
                          <option value="Doctorat">Doctorat</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Programme d'études souhaité</label>
                        <select 
                          name="programmeEtudesSouhaite" 
                          value={formData.informationsSpecifiques.programmeEtudesSouhaite} 
                          onChange={handleSpecificChange}
                        >
                          <option value="">Sélectionner</option>
                          <option value="DEP">DEP</option>
                          <option value="AEC">AEC</option>
                          <option value="DEC">DEC</option>
                          <option value="Bachelor">Bachelor</option>
                          <option value="Master">Master</option>
                          <option value="Doctorat">Doctorat</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Province visée</label>
                        <input 
                          type="text" 
                          name="provinceVisee" 
                          value={formData.informationsSpecifiques.provinceVisee} 
                          onChange={handleSpecificChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Date prévue de début des études</label>
                        <input 
                          type="date" 
                          name="dateDebutEtudes" 
                          value={formData.informationsSpecifiques.dateDebutEtudes} 
                          onChange={handleSpecificChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Autres sections pour Permis d'études */}
                </div>
              )}
              
              {/* Autres types de procédures... */}
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={prevStep}>
                  <i className="fas fa-arrow-left"></i> Précédent
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-save"></i> Créer le client
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default NewClient;
