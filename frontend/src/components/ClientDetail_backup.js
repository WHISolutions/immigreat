import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ClientDetail.css';
import '../styles/VisaVisiteur.css';
import '../styles/PermisTravaill.css';
import '../styles/PermisEtude.css';
import '../styles/Investisseur.css';
import '../styles/RegroupementResidence.css';
import clientsAPI from '../services/clientsAPI';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

console.log('AFFICHAGE : ClientDetail_backup.js');

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState('informations');
  const [userRole, setUserRole] = useState('conseillere'); // À remplacer par le rôle réel de l'utilisateur connecté
  
  // États pour les formulaires dynamiques
  const [newPoste, setNewPoste] = useState({ titre: '', moisExperience: '' });
  const [newDiplome, setNewDiplome] = useState({ titre: '', annee: '', etablissement: '' });
  const [newTestLangue, setNewTestLangue] = useState({ type: '', date: '', scores: '' });
  const [newEtablissement, setNewEtablissement] = useState('');
  const [newEntreprise, setNewEntreprise] = useState({ nom: '', secteur: '', poste: '', annees: '' });
  const [newExperience, setNewExperience] = useState({ 
    emploi: '', 
    dateDebut: '', 
    dateFin: '', 
    employeur: '', 
    poste: '', 
    cnp: '',
    moisExperience: ''
  });
  
  // État pour le téléversement de documents
  const [newDocument, setNewDocument] = useState({
    type: '',
    membre: '',
    description: '',
    fichier: null
  });
  
  // Vérifier si l'utilisateur a les permissions d'édition
  const canEdit = userRole === 'admin' || userRole === 'directeur' || userRole === 'conseillere';
  
  // Vérifier si l'utilisateur a les permissions de suppression
  const canDelete = userRole === 'admin' || userRole === 'directeur';
  
  // Vérifier si l'utilisateur a les permissions financières
  const canManageFinances = userRole === 'admin' || userRole === 'directeur' || userRole === 'comptable';
  
  // Simuler le chargement des données du client
  useEffect(() => {
    const loadClientDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 Chargement des détails du client ${id}...`);
        
        const response = await clientsAPI.getClientById(id);
        console.log('✅ Détails du client récupérés:', response);
        
        if (response.success && response.data) {
          // Adapter les données de l'API au format attendu par l'interface
          const clientData = {
            ...response.data,
            typeProcedure: response.data.type_procedure,
            dateNaissance: response.data.date_naissance,
            // Ajouter des données par défaut pour les sections non encore implémentées dans l'API
            contactAlternatif: response.data.contact_nom ? {
              nom: response.data.contact_nom,
              prenom: response.data.contact_prenom,
              relation: response.data.contact_relation,
              telephone: response.data.contact_telephone,
              email: response.data.contact_email
            } : {},
            informationsAdministratives: response.data.informations_specifiques ? 
              JSON.parse(response.data.informations_specifiques) : {},
            documents: [],
            notes: []
          };
          setClient(clientData);
          console.log(`📊 Client ${clientData.nom} ${clientData.prenom} chargé avec succès`);
        } else {
          console.log('⚠️ Client non trouvé ou format de réponse inattendu');
          setError('Client non trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du client:', error);
        setError('Erreur lors du chargement des détails du client. Vérifiez que le serveur backend est démarré.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadClientDetails();
    }
      // Données fictives pour la démonstration
      const mockClient = {
        id: id,
        nom: 'Martin',
        prenom: 'Antoine',
        dateNaissance: '1985-04-13',
        email: 'a.martin@email.com',
        telephone: '+33 6 12 34 56 78',
        adresse: '12 rue des Fleurs, 75015 Paris',
        nationalite: 'Française',
        typeProcedure: 'Regroupement familial', // Changé pour démontrer le Regroupement familial
        statut: 'En cours',
        dateCreation: '2025-03-15',
        conseillere: 'Sophie Martin',
        urgent: true,
        loginClient: 'amartin2025',
        motDePasseClient: 'client123',
        
        // Contact alternatif
        contactNom: 'Martin',
        contactPrenom: 'Marie',
        contactRelation: 'Épouse',
        contactTelephone: '+33 6 98 76 54 32',
        contactEmail: 'm.martin@email.com',
        
        // Informations spécifiques au Regroupement familial
        informationsSpecifiques: {
          // Informations personnelles supplémentaires
          situationFamiliale: 'Marié',
          nombrePersonnesDemande: 2,
          lienParenteRepondant: 'Frère',
          
          // Informations sur le répondant au Canada
          nomRepondant: 'Martin Jean-Pierre',
          statutRepondant: 'Citoyen',
          adresseRepondant: '123 Rue Sainte-Catherine, Montréal, QC H2X 1Z4, Canada',
          telephoneRepondant: '+1 514-123-4567',
          emailRepondant: 'jp.martin@email.ca',
          nombrePersonnesChargeRepondant: 2,
          regroupementFamilialAnterieur: 'Non',
          
          // Informations spécifiques au programme
          typeParrainage: {
            conjointPartenaire: false,
            enfant: false,
            parent: false,
            grandParent: false,
            autreMembre: true,
            autrePrecision: 'Frère'
          },
          provinceDestination: 'Québec',
          
          // Informations financières
          capaciteFinanciereRepondant: 'Suffisante - 65,000 CAD annuel',
          
          // Antécédents de voyage
          voyagesAnterieurs: 'Oui',
          visasPrecedents: 'Visa touristique pour les États-Unis (2023), Visa Schengen (2022)',
          refusAnterieurs: 'Non',
          detailsRefus: '',
          
          // Remarques
          remarques: 'Le répondant est établi au Canada depuis 10 ans et a une situation financière stable.'
        },
        
        // Documents
        documents: [
          // Documents pour Antoine Martin
          { id: 1, nom: 'Copie de CIN', membre: 'Antoine Martin', statut: 'fourni', dateUpload: '2025-03-16', description: 'Carte d\'identité nationale' },
          { id: 2, nom: 'Copie du passeport', membre: 'Antoine Martin', statut: 'fourni', dateUpload: '2025-03-16', description: 'Pages principales du passeport' },
          { id: 3, nom: 'Photo d\'identité', membre: 'Antoine Martin', statut: 'fourni', dateUpload: '2025-03-16', description: 'Format réglementaire' },
          { id: 4, nom: 'Certificat de police', membre: 'Antoine Martin', statut: 'a_fournir', dateUpload: null, description: 'Extrait de casier judiciaire' },
          
          // Documents pour Marie Martin
          { id: 5, nom: 'Copie de CIN', membre: 'Marie Martin', statut: 'fourni', dateUpload: '2025-03-17', description: 'Carte d\'identité nationale' },
          { id: 6, nom: 'Copie du passeport', membre: 'Marie Martin', statut: 'fourni', dateUpload: '2025-03-17', description: 'Pages principales du passeport' },
          { id: 7, nom: 'Photo d\'identité', membre: 'Marie Martin', statut: 'fourni', dateUpload: '2025-03-17', description: 'Format réglementaire' },
          { id: 8, nom: 'Certificat de police', membre: 'Marie Martin', statut: 'a_fournir', dateUpload: null, description: 'Extrait de casier judiciaire' },
          
          // Documents prouvant le lien familial
          { id: 9, nom: 'Acte de naissance', membre: 'lien_familial', statut: 'fourni', dateUpload: '2025-03-18', description: 'Acte de naissance prouvant le lien fraternel' },
          
          // Documents du répondant
          { id: 10, nom: 'Preuve de statut au Canada', membre: 'repondant', statut: 'fourni', dateUpload: '2025-03-18', description: 'Certificat de citoyenneté canadienne' },
          { id: 11, nom: 'Preuve de revenus', membre: 'repondant', statut: 'fourni', dateUpload: '2025-03-18', description: 'Avis de cotisation et T4 des 3 dernières années' },
          { id: 12, nom: 'Engagement de parrainage signé', membre: 'repondant', statut: 'a_fournir', dateUpload: null, description: 'Formulaire IMM 1344' },
          
          // Document "Autre"
          { id: 13, nom: 'Autre', membre: 'Antoine Martin', statut: 'fourni', dateUpload: '2025-03-19', description: 'Lettre de motivation pour le regroupement familial' }
        ],
        
        // Historique des interactions
        historique: [
          { id: 1, date: '2025-03-15', type: 'Création', description: 'Création du dossier client', utilisateur: 'Sophie Martin' },
          { id: 2, date: '2025-03-16', type: 'Document', description: 'Téléversement des documents d\'identité', utilisateur: 'Antoine Martin' },
          { id: 3, date: '2025-03-18', type: 'Rendez-vous', description: 'Consultation initiale', utilisateur: 'Sophie Martin' },
          { id: 4, date: '2025-03-20', type: 'Facture', description: 'Émission de la facture initiale', utilisateur: 'Julie Comptable' },
          { id: 5, date: '2025-03-25', type: 'Paiement', description: 'Réception du paiement initial', utilisateur: 'Julie Comptable' },
          { id: 6, date: '2025-04-05', type: 'Document', description: 'Vérification des documents fournis', utilisateur: 'Sophie Martin' },
          { id: 7, date: '2025-04-10', type: 'Procédure', description: 'Préparation du dossier de parrainage', utilisateur: 'Sophie Martin' }
        ],
        
        // Factures
        factures: [
          { id: 1, numero: 'F2025-001', date: '2025-03-20', montant: 2500, statut: 'Payée', dateEcheance: '2025-04-20', datePaiement: '2025-03-25' },
          { id: 2, numero: 'F2025-002', date: '2025-04-15', montant: 2500, statut: 'En attente', dateEcheance: '2025-05-15', datePaiement: null }
        ],
        
        // Rendez-vous
        rendezVous: [
          { id: 1, date: '2025-03-18T10:00:00', type: 'Consultation initiale', statut: 'Terminé', notes: 'Présentation du processus de regroupement familial' },
          { id: 2, date: '2025-04-05T14:30:00', type: 'Suivi de dossier', statut: 'Terminé', notes: 'Vérification des documents et préparation du dossier' },
          { id: 3, date: '2025-05-10T11:00:00', type: 'Préparation soumission', statut: 'Planifié', notes: 'Finalisation du dossier avant soumission aux autorités' }
    }
  }, [id]);
  
  // Fonction pour ajouter une nouvelle expérience professionnelle
  const handleAddExperience = () => {
    if (newExperience.emploi && newExperience.employeur) {
      const updatedClient = { ...client };
      const newId = updatedClient.informationsSpecifiques.experiencesProfessionnelles 
        ? (updatedClient.informationsSpecifiques.experiencesProfessionnelles.length > 0 
          ? Math.max(...updatedClient.informationsSpecifiques.experiencesProfessionnelles.map(e => e.id)) + 1 
          : 1)
        : 1;
      
      if (!updatedClient.informationsSpecifiques.experiencesProfessionnelles) {
        updatedClient.informationsSpecifiques.experiencesProfessionnelles = [];
      }
      
      updatedClient.informationsSpecifiques.experiencesProfessionnelles.push({
        id: newId,
        emploi: newExperience.emploi,
        dateDebut: newExperience.dateDebut,
        dateFin: newExperience.dateFin,
        employeur: newExperience.employeur,
        poste: newExperience.poste,
        cnp: newExperience.cnp,
        moisExperience: newExperience.moisExperience
      });
      
      setClient(updatedClient);
      setNewExperience({ 
        emploi: '', 
        dateDebut: '', 
        dateFin: '', 
        employeur: '', 
        poste: '', 
        cnp: '',
        moisExperience: ''
      });
    }
  };
  
  // Fonction pour supprimer une expérience professionnelle
  const handleDeleteExperience = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette expérience professionnelle ?')) {
      const updatedClient = { ...client };
      updatedClient.informationsSpecifiques.experiencesProfessionnelles = updatedClient.informationsSpecifiques.experiencesProfessionnelles.filter(e => e.id !== id);
      setClient(updatedClient);
    }
  };
  
  // Fonction pour ajouter un nouveau test de langue
  const handleAddTestLangue = () => {
    if (newTestLangue.type && newTestLangue.date) {
      const updatedClient = { ...client };
      const newId = updatedClient.informationsSpecifiques.testsLangue 
        ? (updatedClient.informationsSpecifiques.testsLangue.length > 0 
          ? Math.max(...updatedClient.informationsSpecifiques.testsLangue.map(t => t.id)) + 1 
          : 1)
        : 1;
      
      if (!updatedClient.informationsSpecifiques.testsLangue) {
        updatedClient.informationsSpecifiques.testsLangue = [];
      }
      
      updatedClient.informationsSpecifiques.testsLangue.push({
        id: newId,
        type: newTestLangue.type,
        date: newTestLangue.date,
        scores: newTestLangue.scores,
        dateExpiration: new Date(new Date(newTestLangue.date).setFullYear(new Date(newTestLangue.date).getFullYear() + 2)).toISOString().split('T')[0]
      });
      
      setClient(updatedClient);
      setNewTestLangue({ type: '', date: '', scores: '' });
    }
  };
  
  // Fonction pour supprimer un test de langue
  const handleDeleteTestLangue = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce test de langue ?')) {
      const updatedClient = { ...client };
      updatedClient.informationsSpecifiques.testsLangue = updatedClient.informationsSpecifiques.testsLangue.filter(t => t.id !== id);
      setClient(updatedClient);
    }
  };
  
  // Fonction pour téléverser un document
  const handleUploadDocument = (event) => {
    event.preventDefault();
    
    if (newDocument.type && newDocument.membre) {
      const updatedClient = { ...client };
      const newId = Math.max(...updatedClient.documents.map(d => d.id)) + 1;
      
      updatedClient.documents.push({
        id: newId,
        nom: newDocument.type,
        membre: newDocument.membre,
        statut: 'fourni',
        dateUpload: new Date().toISOString().split('T')[0],
        description: newDocument.description || 'Aucune description fournie'
      });
      
      // Ajouter une entrée dans l'historique
      const newHistoryId = Math.max(...updatedClient.historique.map(h => h.id)) + 1;
      updatedClient.historique.push({
        id: newHistoryId,
        date: new Date().toISOString().split('T')[0],
        type: 'Document',
        description: `Téléversement du document "${newDocument.type}" pour ${newDocument.membre}`,
        utilisateur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
      });
      
      setClient(updatedClient);
      setNewDocument({
        type: '',
        membre: '',
        description: '',
        fichier: null
      });
      
      // Dans une application réelle, ceci enverrait le fichier au serveur
      alert('Document téléversé avec succès. Dans une application réelle, le fichier serait envoyé au serveur.');
    } else {
      alert('Veuillez sélectionner un type de document et un membre.');
    }
  };
  
  // Fonction pour supprimer un document
  const handleDeleteDocument = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      const updatedClient = { ...client };
      const documentToDelete = updatedClient.documents.find(d => d.id === id);
      
      updatedClient.documents = updatedClient.documents.filter(d => d.id !== id);
      
      // Ajouter une entrée dans l'historique
      const newHistoryId = Math.max(...updatedClient.historique.map(h => h.id)) + 1;
      updatedClient.historique.push({
        id: newHistoryId,
        date: new Date().toISOString().split('T')[0],
        type: 'Document',
        description: `Suppression du document "${documentToDelete.nom}" pour ${documentToDelete.membre}`,
        utilisateur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
      });
      
      setClient(updatedClient);
    }
  };
  
  // Fonction pour générer une facture
  const handleGenerateInvoice = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(18);
    doc.text('FACTURE', 105, 20, { align: 'center' });
    
    // Informations de l'entreprise
    doc.setFontSize(10);
    doc.text('Bureau d\'immigration et d\'études au Canada', 20, 30);
    doc.text('123 Avenue des Consultants', 20, 35);
    doc.text('75001 Paris, France', 20, 40);
    doc.text('Tél: +33 1 23 45 67 89', 20, 45);
    doc.text('Email: contact@immigration-canada.com', 20, 50);
    
    // Informations du client
    doc.text('Facturé à:', 120, 30);
    doc.text(`${client.prenom} ${client.nom}`, 120, 35);
    doc.text(client.adresse, 120, 40);
    doc.text(`Email: ${client.email}`, 120, 45);
    doc.text(`Tél: ${client.telephone}`, 120, 50);
    
    // Numéro et date de facture
    doc.text(`Facture N°: INV-${new Date().getFullYear()}-${client.id}`, 20, 65);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
    
    // Tableau des services
    doc.autoTable({
      startY: 80,
      head: [['Description', 'Quantité', 'Prix unitaire (€)', 'Total (€)']],
      body: [
        [`Services de consultation - ${client.typeProcedure}`, '1', '2500.00', '2500.00'],
        ['Frais de dossier', '1', '500.00', '500.00'],
        ['Préparation des documents', '1', '1000.00', '1000.00']
      ],
      foot: [['', '', 'Total HT', '4000.00'], ['', '', 'TVA (20%)', '800.00'], ['', '', 'Total TTC', '4800.00']],
      theme: 'striped',
      headStyles: { fillColor: [26, 75, 140] }
    });
    
    // Conditions de paiement
    doc.text('Conditions de paiement:', 20, doc.autoTable.previous.finalY + 20);
    doc.text('Paiement à réception de la facture', 20, doc.autoTable.previous.finalY + 25);
    doc.text('Coordonnées bancaires: FR76 1234 5678 9012 3456 7890 123', 20, doc.autoTable.previous.finalY + 30);
    
    // Enregistrer le PDF
    doc.save(`facture_${client.nom}_${client.prenom}.pdf`);
    
    // Ajouter une entrée dans l'historique
    const updatedClient = { ...client };
    const newHistoryId = Math.max(...updatedClient.historique.map(h => h.id)) + 1;
    updatedClient.historique.push({
      id: newHistoryId,
      date: new Date().toISOString().split('T')[0],
      type: 'Facture',
      description: 'Génération d\'une nouvelle facture',
      utilisateur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
    });
    
    setClient(updatedClient);
  };
  
  // Fonction pour générer un contrat
  const handleGenerateContract = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(18);
    doc.text('CONTRAT DE SERVICES', 105, 20, { align: 'center' });
    
    // Informations des parties
    doc.setFontSize(12);
    doc.text('ENTRE LES SOUSSIGNÉS :', 20, 40);
    
    doc.setFontSize(10);
    doc.text('Bureau d\'immigration et d\'études au Canada, société immatriculée sous le numéro 123 456 789,', 20, 50);
    doc.text('dont le siège social est situé au 123 Avenue des Consultants, 75001 Paris, France,', 20, 55);
    doc.text('représentée par Mme Dupont, en sa qualité de Directrice,', 20, 60);
    doc.text('ci-après dénommée "le Prestataire",', 20, 65);
    
    doc.text('ET', 105, 75, { align: 'center' });
    
    doc.text(`${client.prenom} ${client.nom}, résidant au ${client.adresse},`, 20, 85);
    doc.text(`né(e) le ${new Date(client.dateNaissance).toLocaleDateString()}, de nationalité ${client.nationalite},`, 20, 90);
    doc.text('ci-après dénommé(e) "le Client",', 20, 95);
    
    // Objet du contrat
    doc.setFontSize(12);
    doc.text('IL A ÉTÉ CONVENU CE QUI SUIT :', 20, 110);
    
    doc.setFontSize(10);
    doc.text('Article 1 - Objet du contrat', 20, 120);
    doc.text(`Le présent contrat a pour objet la fourniture par le Prestataire au Client de services d'accompagnement`, 20, 125);
    doc.text(`dans ses démarches d'obtention d'un ${client.typeProcedure} pour le Canada.`, 20, 130);
    
    // Services fournis
    doc.text('Article 2 - Services fournis', 20, 140);
    doc.text('Le Prestataire s\'engage à fournir les services suivants :', 20, 145);
    doc.text('- Évaluation de l\'admissibilité du Client', 20, 150);
    doc.text('- Conseil sur les documents à fournir', 20, 155);
    doc.text('- Préparation et vérification du dossier', 20, 160);
    doc.text('- Suivi de la demande jusqu\'à l\'obtention d\'une décision', 20, 165);
    
    // Durée
    doc.text('Article 3 - Durée', 20, 180);
    doc.text('Le présent contrat prend effet à la date de sa signature pour une durée de 18 mois.', 20, 185);
    
    // Prix
    doc.text('Article 4 - Prix et modalités de paiement', 20, 195);
    doc.text('Le prix des services est fixé à 4800 € TTC, payable comme suit :', 20, 200);
    doc.text('- 50% à la signature du contrat', 20, 205);
    doc.text('- 50% à la soumission du dossier aux autorités canadiennes', 20, 210);
    
    // Signatures
    doc.text('Fait à Paris, le ' + new Date().toLocaleDateString(), 20, 230);
    
    doc.text('Le Prestataire', 50, 245);
    doc.text('Le Client', 150, 245);
    
    // Enregistrer le PDF
    doc.save(`contrat_${client.nom}_${client.prenom}.pdf`);
    
    // Ajouter une entrée dans l'historique
    const updatedClient = { ...client };
    const newHistoryId = Math.max(...updatedClient.historique.map(h => h.id)) + 1;
    updatedClient.historique.push({
      id: newHistoryId,
      date: new Date().toISOString().split('T')[0],
      type: 'Contrat',
      description: 'Génération d\'un nouveau contrat',
      utilisateur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
    });
    
    setClient(updatedClient);
  };
  
  // Fonction pour ajouter une note
  const handleAddNote = (note) => {
    if (note.trim() !== '') {
      const updatedClient = { ...client };
      const newId = Math.max(...updatedClient.notes.map(n => n.id)) + 1;
      
      updatedClient.notes.push({
        id: newId,
        date: new Date().toISOString().split('T')[0],
        contenu: note,
        auteur: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
      });
      
      setClient(updatedClient);
    }
  };
  
  // Vérifier si un test de langue expire bientôt (moins de 3 mois)
  const isTestExpiringSoon = (dateExpiration) => {
    const today = new Date();
    const expirationDate = new Date(dateExpiration);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    return expirationDate <= threeMonthsFromNow;
  };
  
  // Obtenir les types de documents selon le type de procédure
  const getDocumentTypes = () => {
    const commonDocuments = ['Copie de CIN', 'Copie du passeport', 'Photo d\'identité', 'Certificat de police'];
    
    switch(client.typeProcedure) {
      case 'Visa Visiteur':
        return [
          ...commonDocuments,
          'Invitation',
          'Statut de l\'invitant',
          'Dossier financier',
          'Dossier emploi',
          'Prise en charge',
          'Attestation de scolarité',
          'Autre'
        ];
      case 'Permis de travail':
        return [
          ...commonDocuments,
          'Formulaire information client interne signé',
          'Dossier financier',
          'Dossier d\'emploi',
          'Contrat de travail',
          'Résultats d\'examen médical',
          'Preuve de lien',
          'Prise en charge',
          'Autre'
        ];
      case 'Permis d\'étude':
        return [
          ...commonDocuments,
          'Formulaire information client interne signé',
          'Dossier financier',
          'Diplômes et relevés de notes',
          'Lettre d\'admission',
          'Lettres de recommandation',
          'Plan d\'études',
          'Certificat d\'acceptation du Québec (CAQ)',
          'Lettre d\'attestation provinciale (LAP)',
          'Preuve de lien',
          'Prise en charge',
          'Autre'
        ];
      case 'Investisseur':
        return [
          ...commonDocuments,
          'Relevés bancaires',
          'Preuves de propriété d\'actifs',
          'Déclarations fiscales',
          'Preuves de l\'origine des fonds',
          'Registre de commerce',
          'Statuts de l\'entreprise',
          'Preuves de paiement des impôts',
          'Bilans financiers',
          'Plan d\'affaires pour le Canada',
          'Résultats d\'examen médical',
          'Preuve de lien',
          'Prise en charge',
          'Autre'
        ];
      case 'Regroupement familial':
        return [
          ...commonDocuments,
          'Acte de mariage',
          'Acte de naissance',
          'Preuve de relation durable',
          'Preuve de statut au Canada',
          'Preuve de revenus',
          'Engagement de parrainage signé',
          'Prise en charge',
          'Autre'
        ];
      case 'Résidence permanente':
        return [
          ...commonDocuments,
          'Formulaire information client interne signé',
          'Formulaire informations sur la famille signé',
          'Diplômes et relevés de notes',
          'Évaluation des diplômes d\'études (EDE)',
          'Preuves d\'expérience professionnelle',
          'Résultats des tests de langue',
          'Dossier financier',
          'Résultats d\'examen médical',
          'Document du membre de la famille au Canada',
          'Preuve de lien',
          'Prise en charge',
          'Autre'
        ];
      default:
        return [...commonDocuments, 'Autre'];
    }
  };
  
  // Obtenir les membres possibles pour les documents
  const getDocumentMembers = () => {
    const members = [`${client.prenom} ${client.nom}`];
    
    // Ajouter le contact alternatif s'il existe
    if (client.contactPrenom && client.contactNom) {
      members.push(`${client.contactPrenom} ${client.contactNom}`);
    }
    
    // Ajouter des catégories spéciales selon le type de procédure
    if (client.typeProcedure === 'Regroupement familial') {
      members.push('repondant', 'lien_familial');
    } else if (client.typeProcedure === 'Résidence permanente' && client.informationsSpecifiques?.familleCanada === 'Oui') {
      members.push('membre_famille_canada');
    }
    
    return members;
  };
  
  if (loading) {
    return <div className="loading">Chargement...</div>;
  }
  
  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }
  
  if (!client) {
    return <div className="not-found">Client non trouvé</div>;
  }
  
  return (
    <div className="client-detail-container">
      <div className="client-detail-header">
        <h2>Client - {client.prenom} {client.nom}</h2>
        <div className="client-detail-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/clients')}>Retour à la liste</button>
          {canEdit && <button className="btn btn-primary">Modifier</button>}
          {canDelete && <button className="btn btn-danger">Supprimer</button>}
        </div>
      </div>
      
      <div className="client-detail-tabs">
        <button 
          className={`tab-button ${activeTab === 'informations' ? 'active' : ''}`}
          onClick={() => setActiveTab('informations')}
        >
          Informations personnelles
        </button>
        <button 
          className={`tab-button ${activeTab === 'procedure' ? 'active' : ''}`}
          onClick={() => setActiveTab('procedure')}
        >
          Procédure
        </button>
        <button 
          className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button 
          className={`tab-button ${activeTab === 'historique' ? 'active' : ''}`}
          onClick={() => setActiveTab('historique')}
        >
          Historique
        </button>
        <button 
          className={`tab-button ${activeTab === 'factures' ? 'active' : ''}`}
          onClick={() => setActiveTab('factures')}
        >
          Factures
        </button>
        <button 
          className={`tab-button ${activeTab === 'rendez-vous' ? 'active' : ''}`}
          onClick={() => setActiveTab('rendez-vous')}
        >
          Rendez-vous
        </button>
        <button 
          className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>
      
      <div className="client-detail-content">
        {activeTab === 'informations' && (
          <div className="client-info-section">
            <h3>Informations personnelles</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nom</label>
                <p>{client.nom}</p>
              </div>
              <div className="info-item">
                <label>Prénom</label>
                <p>{client.prenom}</p>
              </div>
              <div className="info-item">
                <label>Date de naissance</label>
                <p>{new Date(client.dateNaissance).toLocaleDateString()}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{client.email}</p>
              </div>
              <div className="info-item">
                <label>Téléphone</label>
                <p>{client.telephone}</p>
              </div>
              <div className="info-item">
                <label>Adresse</label>
                <p>{client.adresse}</p>
              </div>
              <div className="info-item">
                <label>Nationalité</label>
                <p>{client.nationalite}</p>
              </div>
              <div className="info-item">
                <label>Type de procédure</label>
                <p>{client.typeProcedure}</p>
              </div>
            </div>
            
            <h3>Contact alternatif</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Nom</label>
                <p>{client.contactNom}</p>
              </div>
              <div className="info-item">
                <label>Prénom</label>
                <p>{client.contactPrenom}</p>
              </div>
              <div className="info-item">
                <label>Relation</label>
                <p>{client.contactRelation}</p>
              </div>
              <div className="info-item">
                <label>Téléphone</label>
                <p>{client.contactTelephone}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{client.contactEmail}</p>
              </div>
            </div>
            
            <h3>Informations de compte</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Login client</label>
                <p>{client.loginClient}</p>
              </div>
              <div className="info-item">
                <label>Mot de passe client</label>
                <p>••••••••</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'procedure' && (
          <div className="procedure-section">
            <div className="procedure-header">
              <h3>Détails de la procédure - {client.typeProcedure}</h3>
              <div className="procedure-actions">
                {canManageFinances && (
                  <button className="btn btn-primary" onClick={handleGenerateInvoice}>
                    <i className="fas fa-file-invoice"></i> Générer facture
                  </button>
                )}
                {canEdit && (
                  <button className="btn btn-primary" onClick={handleGenerateContract}>
                    <i className="fas fa-file-contract"></i> Générer contrat
                  </button>
                )}
              </div>
            </div>
            
            <div className="procedure-status">
              <div className="status-item">
                <label>Statut</label>
                <span className={`status-badge ${client.statut.toLowerCase().replace(' ', '-')}`}>
                  {client.statut}
                </span>
              </div>
              <div className="status-item">
                <label>Date de création</label>
                <p>{new Date(client.dateCreation).toLocaleDateString()}</p>
              </div>
              <div className="status-item">
                <label>Conseillère</label>
                <p>{client.conseillere}</p>
              </div>
              <div className="status-item">
                <label>Priorité</label>
                <span className={`priority-badge ${client.urgent ? 'urgent' : 'normal'}`}>
                  {client.urgent ? 'Urgent' : 'Normal'}
                </span>
              </div>
            </div>
            
            {client.typeProcedure === 'Regroupement familial' && (
              <div className="regroupement-familial-section">
                <h4>INFORMATIONS PERSONNELLES SUPPLÉMENTAIRES</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Situation familiale</label>
                    <p>{client.informationsSpecifiques.situationFamiliale}</p>
                  </div>
                  <div className="info-item">
                    <label>Nombre de personnes dans la demande</label>
                    <p>{client.informationsSpecifiques.nombrePersonnesDemande}</p>
                  </div>
                  <div className="info-item">
                    <label>Lien de parenté avec le répondant</label>
                    <p>{client.informationsSpecifiques.lienParenteRepondant}</p>
                  </div>
                </div>
                
                <h4>INFORMATIONS SUR LE RÉPONDANT AU CANADA</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom complet du répondant</label>
                    <p>{client.informationsSpecifiques.nomRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Statut du répondant au Canada</label>
                    <p>{client.informationsSpecifiques.statutRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Adresse complète au Canada</label>
                    <p>{client.informationsSpecifiques.adresseRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <p>{client.informationsSpecifiques.telephoneRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{client.informationsSpecifiques.emailRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Nombre de personnes à charge</label>
                    <p>{client.informationsSpecifiques.nombrePersonnesChargeRepondant}</p>
                  </div>
                  <div className="info-item">
                    <label>Regroupement familial antérieur</label>
                    <p>{client.informationsSpecifiques.regroupementFamilialAnterieur}</p>
                  </div>
                </div>
                
                <h4>INFORMATIONS SPÉCIFIQUES AU PROGRAMME</h4>
                <div className="repondant-info-section">
                  <h5>Type de parrainage</h5>
                  <div className="parrainage-options">
                    <div className="parrainage-option">
                      <input 
                        type="checkbox" 
                        id="conjoint-partenaire" 
                        checked={client.informationsSpecifiques.typeParrainage.conjointPartenaire} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                      <label htmlFor="conjoint-partenaire">Conjoint(e)/Partenaire</label>
                    </div>
                    <div className="parrainage-option">
                      <input 
                        type="checkbox" 
                        id="enfant" 
                        checked={client.informationsSpecifiques.typeParrainage.enfant} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                      <label htmlFor="enfant">Enfant</label>
                    </div>
                    <div className="parrainage-option">
                      <input 
                        type="checkbox" 
                        id="parent" 
                        checked={client.informationsSpecifiques.typeParrainage.parent} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                      <label htmlFor="parent">Parent</label>
                    </div>
                    <div className="parrainage-option">
                      <input 
                        type="checkbox" 
                        id="grand-parent" 
                        checked={client.informationsSpecifiques.typeParrainage.grandParent} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                      <label htmlFor="grand-parent">Grand-parent</label>
                    </div>
                    <div className="parrainage-option">
                      <input 
                        type="checkbox" 
                        id="autre-membre" 
                        checked={client.informationsSpecifiques.typeParrainage.autreMembre} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                      <label htmlFor="autre-membre">Autre membre de la famille</label>
                    </div>
                  </div>
                  
                  {client.informationsSpecifiques.typeParrainage.autreMembre && (
                    <div className="form-group">
                      <label>Précisez</label>
                      <input 
                        type="text" 
                        value={client.informationsSpecifiques.typeParrainage.autrePrecision} 
                        onChange={() => {}} 
                        disabled={!canEdit}
                      />
                    </div>
                  )}
                </div>
                
                <div className="info-grid">
                  <div className="info-item">
                    <label>Province de destination</label>
                    <p>{client.informationsSpecifiques.provinceDestination}</p>
                  </div>
                </div>
                
                <h4>INFORMATIONS FINANCIÈRES</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Capacité financière du répondant</label>
                    <p>{client.informationsSpecifiques.capaciteFinanciereRepondant}</p>
                  </div>
                </div>
                
                <h4>ANTÉCÉDENTS DE VOYAGE</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Voyages antérieurs à l'étranger</label>
                    <p>{client.informationsSpecifiques.voyagesAnterieurs}</p>
                  </div>
                  <div className="info-item">
                    <label>Visas précédemment obtenus</label>
                    <p>{client.informationsSpecifiques.visasPrecedents}</p>
                  </div>
                  <div className="info-item">
                    <label>Refus antérieurs (Canada ou autre pays)</label>
                    <p>{client.informationsSpecifiques.refusAnterieurs}</p>
                  </div>
                  {client.informationsSpecifiques.refusAnterieurs === 'Oui' && (
                    <div className="info-item">
                      <label>Détails des refus</label>
                      <p>{client.informationsSpecifiques.detailsRefus}</p>
                    </div>
                  )}
                </div>
                
                <div className="remarks-section">
                  <h4>REMARQUES</h4>
                  <p>{client.informationsSpecifiques.remarques}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div className="documents-section">
            <h3>Documents</h3>
            
            {canEdit && (
              <div className="document-upload-form">
                <h4>Téléverser un nouveau document</h4>
                <form onSubmit={handleUploadDocument}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="document-type">Type de document</label>
                      <select 
                        id="document-type" 
                        value={newDocument.type}
                        onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        {getDocumentTypes().map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="document-membre">Pour qui</label>
                      <select 
                        id="document-membre" 
                        value={newDocument.membre}
                        onChange={(e) => setNewDocument({...newDocument, membre: e.target.value})}
                        required
                      >
                        <option value="">Sélectionner un membre</option>
                        {getDocumentMembers().map(member => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="document-description">Description</label>
                    <textarea 
                      id="document-description" 
                      value={newDocument.description}
                      onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                      placeholder="Description du document"
                      rows="2"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="document-file">Fichier</label>
                    <input 
                      type="file" 
                      id="document-file" 
                      onChange={(e) => setNewDocument({...newDocument, fichier: e.target.files[0]})}
                      required
                    />
                    <small>Formats acceptés: PDF, JPG, PNG. Taille maximale: 2 Mo</small>
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-upload"></i> Téléverser
                  </button>
                </form>
              </div>
            )}
            
            <div className="documents-list">
              <h4>Documents fournis</h4>
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Pour qui</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.documents.filter(doc => doc.statut === 'fourni').map(document => (
                    <tr key={document.id}>
                      <td>{document.nom}</td>
                      <td>{document.membre}</td>
                      <td>{document.description}</td>
                      <td>
                        <span className="status-badge status-fourni">
                          <i className="fas fa-check-circle"></i> Fourni
                        </span>
                      </td>
                      <td>{document.dateUpload}</td>
                      <td>
                        <div className="document-actions">
                          <button className="btn-icon" title="Voir">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn-icon" title="Télécharger">
                            <i className="fas fa-download"></i>
                          </button>
                          {canEdit && (
                            <button 
                              className="btn-icon btn-danger" 
                              title="Supprimer"
                              onClick={() => handleDeleteDocument(document.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <h4>Documents à fournir</h4>
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Pour qui</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.documents.filter(doc => doc.statut === 'a_fournir').map(document => (
                    <tr key={document.id}>
                      <td>{document.nom}</td>
                      <td>{document.membre}</td>
                      <td>{document.description}</td>
                      <td>
                        <span className="status-badge status-a-fournir">
                          <i className="fas fa-clock"></i> À fournir
                        </span>
                      </td>
                      <td>
                        {canEdit && (
                          <button className="btn-small">
                            <i className="fas fa-upload"></i> Téléverser
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'historique' && (
          <div className="historique-section">
            <h3>Historique des interactions</h3>
            <div className="historique-timeline">
              {client.historique.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-date">
                    <span className="date">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-icon">
                      <i className={`fas ${
                        item.type === 'Création' ? 'fa-plus-circle' :
                        item.type === 'Document' ? 'fa-file-alt' :
                        item.type === 'Rendez-vous' ? 'fa-calendar-check' :
                        item.type === 'Facture' ? 'fa-file-invoice-dollar' :
                        item.type === 'Paiement' ? 'fa-money-bill-wave' :
                        item.type === 'Procédure' ? 'fa-tasks' :
                        item.type === 'Contrat' ? 'fa-file-contract' :
                        'fa-info-circle'
                      }`}></i>
                    </div>
                    <div className="timeline-details">
                      <h4>{item.type}</h4>
                      <p>{item.description}</p>
                      <small>Par: {item.utilisateur}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'factures' && (
          <div className="factures-section">
            <h3>Factures</h3>
            <div className="factures-header">
              <div className="factures-summary">
                <div className="summary-item">
                  <span className="label">Total facturé</span>
                  <span className="value">{client.factures.reduce((sum, facture) => sum + facture.montant, 0)} €</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total payé</span>
                  <span className="value">{client.factures.filter(f => f.statut === 'Payée').reduce((sum, facture) => sum + facture.montant, 0)} €</span>
                </div>
                <div className="summary-item">
                  <span className="label">Reste à payer</span>
                  <span className="value">{client.factures.filter(f => f.statut !== 'Payée').reduce((sum, facture) => sum + facture.montant, 0)} €</span>
                </div>
              </div>
              
              {canManageFinances && (
                <button className="btn btn-primary" onClick={handleGenerateInvoice}>
                  <i className="fas fa-plus"></i> Nouvelle facture
                </button>
              )}
            </div>
            
            <table className="factures-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Échéance</th>
                  <th>Date de paiement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.factures.map(facture => (
                  <tr key={facture.id}>
                    <td>{facture.numero}</td>
                    <td>{new Date(facture.date).toLocaleDateString()}</td>
                    <td>{facture.montant} €</td>
                    <td>
                      <span className={`status-badge ${
                        facture.statut === 'Payée' ? 'status-payee' :
                        facture.statut === 'En attente' ? 'status-en-attente' :
                        facture.statut === 'Annulée' ? 'status-annulee' :
                        'status-default'
                      }`}>
                        {facture.statut}
                      </span>
                    </td>
                    <td>{new Date(facture.dateEcheance).toLocaleDateString()}</td>
                    <td>{facture.datePaiement ? new Date(facture.datePaiement).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="facture-actions">
                        <button className="btn-icon" title="Voir">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-icon" title="Télécharger">
                          <i className="fas fa-download"></i>
                        </button>
                        {canManageFinances && facture.statut === 'En attente' && (
                          <>
                            <button className="btn-icon btn-success" title="Marquer comme payée">
                              <i className="fas fa-check"></i>
                            </button>
                            <button className="btn-icon btn-danger" title="Annuler">
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'rendez-vous' && (
          <div className="rendez-vous-section">
            <h3>Rendez-vous</h3>
            <div className="rendez-vous-header">
              {canEdit && (
                <button className="btn btn-primary">
                  <i className="fas fa-plus"></i> Nouveau rendez-vous
                </button>
              )}
            </div>
            
            <div className="rendez-vous-list">
              <h4>Rendez-vous à venir</h4>
              <table className="rendez-vous-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.rendezVous
                    .filter(rdv => new Date(rdv.date) >= new Date() && rdv.statut !== 'Annulé')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(rdv => (
                      <tr key={rdv.id}>
                        <td>{new Date(rdv.date).toLocaleString()}</td>
                        <td>{rdv.type}</td>
                        <td>
                          <span className={`status-badge ${
                            rdv.statut === 'Planifié' ? 'status-planifie' :
                            rdv.statut === 'Confirmé' ? 'status-confirme' :
                            rdv.statut === 'Terminé' ? 'status-termine' :
                            rdv.statut === 'Annulé' ? 'status-annule' :
                            'status-default'
                          }`}>
                            {rdv.statut}
                          </span>
                        </td>
                        <td>{rdv.notes}</td>
                        <td>
                          <div className="rendez-vous-actions">
                            {canEdit && (
                              <>
                                <button className="btn-icon" title="Modifier">
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="btn-icon btn-danger" title="Annuler">
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              <h4>Historique des rendez-vous</h4>
              <table className="rendez-vous-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {client.rendezVous
                    .filter(rdv => new Date(rdv.date) < new Date() || rdv.statut === 'Annulé')
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(rdv => (
                      <tr key={rdv.id}>
                        <td>{new Date(rdv.date).toLocaleString()}</td>
                        <td>{rdv.type}</td>
                        <td>
                          <span className={`status-badge ${
                            rdv.statut === 'Planifié' ? 'status-planifie' :
                            rdv.statut === 'Confirmé' ? 'status-confirme' :
                            rdv.statut === 'Terminé' ? 'status-termine' :
                            rdv.statut === 'Annulé' ? 'status-annule' :
                            'status-default'
                          }`}>
                            {rdv.statut}
                          </span>
                        </td>
                        <td>{rdv.notes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className="notes-section">
            <h3>Notes</h3>
            
            {canEdit && (
              <div className="note-form">
                <h4>Ajouter une note</h4>
                <div className="form-group">
                  <textarea 
                    id="new-note" 
                    placeholder="Saisir une nouvelle note..."
                    rows="3"
                  ></textarea>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAddNote(document.getElementById('new-note').value)}
                >
                  <i className="fas fa-plus"></i> Ajouter
                </button>
              </div>
            )}
            
            <div className="notes-list">
              {client.notes.sort((a, b) => new Date(b.date) - new Date(a.date)).map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-header">
                    <div className="note-meta">
                      <span className="note-date">{new Date(note.date).toLocaleDateString()}</span>
                      <span className="note-author">Par: {note.auteur}</span>
                    </div>
                    {canEdit && (
                      <div className="note-actions">
                        <button className="btn-icon" title="Modifier">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-icon btn-danger" title="Supprimer">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="note-content">
                    <p>{note.contenu}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDetail;
