import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  getAllFactures, 
  createFacture,
  updateFacture, 
  formatMontant, 
  getSymboleMonnaie,
  getStatutClass, 
  mapStatutForDisplay,
  formatDate,
  canEditFacture 
} from '../services/facturesAPI';
import '../styles/Facturation.css';
import FactureForm from './FactureForm';
import ClientAutocomplete from './ClientAutocomplete'; // 🔴 NOUVEAU : Import du composant autocomplete

// 🔴 FONCTIONS POUR GESTION TTC
// Calculer le montant HT à partir du montant TTC selon la monnaie
const calculerMontantHT = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  let ht;
  
  if (monnaie === 'CAD') {
    // TVA Canada : 14,975%
    ht = ttc / 1.14975; // Montant HT = TTC / 1.14975
  } else {
    // TVA Maroc : 20%
    ht = ttc / 1.2; // Montant HT = TTC / 1.2
  }
  
  return Math.round(ht * 100) / 100; // Arrondir à 2 décimales
};

// Calculer la TVA à partir du montant TTC selon la monnaie
const calculerMontantTVA = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  const ht = calculerMontantHT(montantTTC, monnaie);
  const tva = ttc - ht;
  return Math.round(tva * 100) / 100; // Arrondir à 2 décimales
};

// 🔴 FONCTION POUR DÉTECTER LES FACTURES EN RETARD
const estFactureEnRetard = (facture) => {
  // Si le backend fournit déjà la propriété en_retard, l'utiliser
  if (typeof facture.en_retard === 'boolean') {
    return facture.en_retard;
  }
  
  // Sinon, calculer côté client (fallback)
  // Une facture est en retard si :
  // 1. Elle n'est pas payée (statut différent de 'payee')
  // 2. Sa date d'échéance est dépassée de plus de 30 jours
  if (facture.statut?.toLowerCase() === 'payee' || facture.statut?.toLowerCase() === 'annulee') {
    return false;
  }
  
  if (!facture.dateEcheance) {
    return false;
  }
  
  const dateEcheance = new Date(facture.dateEcheance);
  const maintenant = new Date();
  const diffEnJours = Math.floor((maintenant - dateEcheance) / (1000 * 60 * 60 * 24));
  
  return diffEnJours > 30;
};

// Formater un montant TTC en affichant les détails HT et TVA
const formatMontantDetaille = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  return formatMontant(ttc, monnaie);
};

// Formater pour affichage avec détail HT et TVA
const formatMontantAvecDetails = (montantTTC, monnaie = 'MAD') => {
  const ttc = parseFloat(montantTTC) || 0;
  const ht = calculerMontantHT(montantTTC, monnaie);
  const tva = calculerMontantTVA(montantTTC, monnaie);
  const symbole = getSymboleMonnaie(monnaie);
  const tauxTVA = monnaie === 'CAD' ? '14,975%' : '20%';
  return `${ttc.toFixed(2)} ${symbole} TTC (HT: ${ht.toFixed(2)} ${symbole} + TVA ${tauxTVA}: ${tva.toFixed(2)} ${symbole})`;
};

function Facturation({ userRole = 'conseillere' }) {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [filteredBy, setFilteredBy] = useState('');
  
  // 🔴 NOUVEAUX ÉTATS POUR LE TRI
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  
  const [filtres, setFiltres] = useState({
    statut: '',
    client: '',
    periode: ''
  });
  
  const [nouvelleFacture, setNouvelleFacture] = useState({
    client: '',
    selectedClientId: null, // 🔴 NOUVEAU : ID du client sélectionné
    montant: '',
    monnaie: 'MAD', // 🔴 NOUVEAU : Monnaie par défaut MAD
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    description: ''
  });
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [factureDetails, setFactureDetails] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [factureToEdit, setFactureToEdit] = useState(null);
  
  // État pour gérer l'ouverture/fermeture des menus Actions
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  
  // Options pour les filtres et le formulaire
  const statutOptions = ['Brouillon', 'Payable', 'Payée', 'En retard', 'Annulée'];
  const periodeOptions = ['Tous', 'Ce mois', 'Mois précédent', 'Ce trimestre', 'Cette année'];
  const methodePaiementOptions = ['Carte de crédit', 'Virement bancaire', 'Chèque', 'Espèces', 'PayPal'];

  // 🔴 FONCTION DE TRI
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    console.log(`🔄 Tri par ${key} en ordre ${direction}`);
  };

  // 🔴 FONCTION POUR TRIER LES DONNÉES
  const getSortedFactures = (factures) => {
    if (!sortConfig.key) {
      return factures;
    }

    return [...factures].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Gestion spéciale pour les différents types de données
      switch(sortConfig.key) {
        case 'numero':
          // Tri alphanumérique pour les numéros de facture
          aValue = aValue || '';
          bValue = bValue || '';
          break;
        
        case 'montant':
          // Tri numérique pour les montants
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
          break;
        
        case 'dateEmission':
        case 'dateEcheance':
          // Tri par date
          aValue = new Date(aValue || '1900-01-01');
          bValue = new Date(bValue || '1900-01-01');
          break;
        
        case 'statut':
          // Tri par statut avec ordre logique
          const statutOrder = {
            'brouillon': 0,
            'payable': 1,
            'en_retard': 2,
            'payee': 3,
            'annulee': 4
          };
          aValue = statutOrder[aValue?.toLowerCase()] ?? 999;
          bValue = statutOrder[bValue?.toLowerCase()] ?? 999;
          break;
        
        case 'client':
        default:
          // Tri alphabétique pour texte
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
  
  // Charger les factures depuis l'API
  const chargerFactures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getAllFactures();
      
      if (result.success) {
        setFactures(result.data);
        setFilteredBy(result.filteredBy || 'Toutes');
        console.log('✅ Factures chargées:', result.data.length, 'factures');
        console.log('🔍 Filtrées par:', result.filteredBy || 'Toutes');
        console.log('👤 Utilisateur connecté:', userName, '- Rôle:', userRole);
        
        // Debug: Afficher les factures et leur validePar pour comprendre le filtrage
        if (userRole === 'conseillere') {
          console.log('🔍 Détail des factures pour débogage:');
          result.data.forEach(facture => {
            console.log(`   Facture ${facture.numero}: validePar="${facture.validePar}"`);
          });
        }
        
        // Message informatif pour les conseillères
        if (userRole === 'conseillere' && result.filteredBy && result.filteredBy !== 'Toutes') {
          console.log('🔒 Affichage limité aux factures de la conseillère connectée');
        }
      } else {
        setError(result.error || 'Erreur lors du chargement des factures');
        console.error('❌ Erreur:', result.error);
      }
    } catch (error) {
      setError('Erreur de connexion à l\'API');
      console.error('❌ Erreur de connexion:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les informations utilisateur au démarrage
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName') || '';
    const storedRole = localStorage.getItem('role') || '';
    setUserName(storedUserName);
    console.log('👤 Utilisateur connecté:', storedUserName, '- Rôle:', storedRole);
  }, []);

  // Charger les factures au démarrage
  useEffect(() => {
    chargerFactures();
  }, []);
  
  // Obtenir la liste des clients depuis les factures
  const clientsOptions = Array.from(
    new Set(factures.map(f => f.client).filter(Boolean))
  ).sort();
  
  // Filtrer les factures
  const facturesFiltrees = factures.filter(facture => {
    return (
      (filtres.statut === '' || facture.statut === filtres.statut) &&
      (filtres.client === '' || facture.client === filtres.client) &&
      (filtres.periode === '' || filtrerParPeriode(facture.dateEmission, filtres.periode))
    );
  });
  
  // Filtrer par période
  const filtrerParPeriode = (dateEmission, periode) => {
    const date = new Date(dateEmission);
    const maintenant = new Date();
    
    switch(periode) {
      case 'Ce mois':
        return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
      case 'Mois précédent':
        const moisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1);
        return date.getMonth() === moisPrecedent.getMonth() && date.getFullYear() === moisPrecedent.getFullYear();
      case 'Ce trimestre':
        const trimestre = Math.floor(maintenant.getMonth() / 3);
        const trimestreDate = Math.floor(date.getMonth() / 3);
        return trimestreDate === trimestre && date.getFullYear() === maintenant.getFullYear();
      case 'Cette année':
        return date.getFullYear() === maintenant.getFullYear();
      default:
        return true;
    }
  };
  
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
      client: '',
      periode: ''
    });
  };
  
  // Gérer les changements dans le formulaire de nouvelle facture
  const handleNouvelleFactureChange = (e) => {
    const { name, value } = e.target;
    setNouvelleFacture({
      ...nouvelleFacture,
      [name]: value
    });
  };
  
  // 🔴 NOUVEAU : Gérer la sélection d'un client depuis l'autocomplete
  const handleClientSelect = (selection) => {
    setNouvelleFacture({
      ...nouvelleFacture,
      client: selection.displayText || '',
      selectedClientId: selection.clientId || null
    });
  };
  
  // Calculer la date d'échéance (30 jours après émission)
  const calculerDateEcheance = (dateEmission) => {
    const date = new Date(dateEmission);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  // Mettre à jour la date d'échéance lorsque la date d'émission change
  const handleDateEmissionChange = (e) => {
    const dateEmission = e.target.value;
    const dateEcheance = calculerDateEcheance(dateEmission);
    
    setNouvelleFacture({
      ...nouvelleFacture,
      dateEmission,
      dateEcheance
    });
  };
  
  // Ajouter une nouvelle facture
  const ajouterFacture = async (e) => {
    e.preventDefault();
    
    // Validation des données
    if (!nouvelleFacture.selectedClientId || !nouvelleFacture.montant || !nouvelleFacture.description) {
      alert('Veuillez remplir tous les champs requis (client, montant, description)');
      return;
    }
    
    try {
      console.log('📝 Envoi des données de création de facture:', {
        client_id: nouvelleFacture.selectedClientId,
        montant: nouvelleFacture.montant,
        monnaie: nouvelleFacture.monnaie,
        description: nouvelleFacture.description,
        dateEmission: nouvelleFacture.dateEmission,
        dateEcheance: nouvelleFacture.dateEcheance
      });
      
      // Créer la facture via l'API backend
      const response = await createFacture({
        client_id: nouvelleFacture.selectedClientId,
        montant: parseFloat(nouvelleFacture.montant),
        monnaie: nouvelleFacture.monnaie,
        description: nouvelleFacture.description,
        dateEmission: nouvelleFacture.dateEmission,
        dateEcheance: nouvelleFacture.dateEcheance,
        statut: 'brouillon'
      });
      
      if (response.success) {
        console.log('✅ Facture créée avec succès:', response.data);
        
        // Recharger la liste des factures
        await chargerFactures();
        
        // Réinitialiser le formulaire
        setNouvelleFacture({
          client: '',
          selectedClientId: null,
          montant: '',
          monnaie: 'MAD',
          dateEmission: new Date().toISOString().split('T')[0],
          dateEcheance: '',
          description: ''
        });
        
        setShowModal(false);
        alert('Facture créée avec succès !');
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la facture');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de la facture:', error);
      alert('Erreur lors de la création de la facture: ' + error.message);
    }
  };
  
  // Voir les détails d'une facture
  const voirDetails = (facture) => {
    setFactureDetails(facture);
    setShowDetailsModal(true);
  };
  
  // Changer le statut d'une facture
  const changerStatut = async (id, nouveauStatut, methodePaiement = null) => {
    try {
      console.log('🔄 === DEBUT CHANGEMENT STATUT ===');
      console.log('🔄 ID facture:', id);
      console.log('🔄 Nouveau statut:', nouveauStatut);
      console.log('🔄 Méthode de paiement:', methodePaiement);
      
      // 🔴 CORRECTION: Normaliser les statuts français vers les statuts anglais pour l'API
      const statutMapping = {
        'Brouillon': 'brouillon',
        'Payable': 'payable', 
        'Payée': 'payee',        // ⭐ CORRECTION: "Payée" → "payee"
        'En retard': 'en_retard',
        'Annulée': 'annulee'
      };
      
      const statutNormalise = statutMapping[nouveauStatut] || nouveauStatut.toLowerCase();
      console.log('🔄 Statut normalisé pour l\'API:', statutNormalise);
      
      const updateData = {
        statut: statutNormalise,
        datePaiement: nouveauStatut === 'Payée' ? new Date().toISOString().split('T')[0] : null,
        methodePaiement: nouveauStatut === 'Payée' ? methodePaiement : null
      };
      
      console.log('📤 Données à envoyer à l\'API:', updateData);
      
      const result = await updateFacture(id, updateData);
      
      console.log('📥 Réponse de l\'API:', result);
      
      if (result.success) {
        // Recharger les factures pour avoir les données à jour
        await chargerFactures();
        
        // Fermer les modals et mettre à jour les détails si nécessaire
        if (showDetailsModal) {
          setShowDetailsModal(false);
          setFactureDetails(null);
        }
        
        console.log('✅ Statut de facture mis à jour:', nouveauStatut);
        
        // Message de succès discret
        const notification = document.createElement('div');
        notification.textContent = `✅ Facture ${nouveauStatut.toLowerCase()} avec succès ${methodePaiement ? `(${methodePaiement})` : ''}`;
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
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 4000);
        
      } else {
        console.error('❌ Erreur mise à jour:', result.error);
        const errorMessage = result.error || 'Erreur lors de la mise à jour du statut';
        setError(errorMessage);
        alert(`❌ Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ === ERREUR CHANGEMENT STATUT ===');
      console.error('❌ Erreur complète:', error);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack trace:', error.stack);
      
      const errorMessage = error.message || 'Erreur lors du changement de statut';
      setError(errorMessage);
      alert(`❌ Erreur technique: ${errorMessage}`);
    }
  };
  
  // Calculer les statistiques (montants déjà en TTC dans la base)
  const calculerStatistiques = () => {
    const totalFactures = factures.length;
    
    // 🔥 IMPORTANT: Les montants en base sont déjà TTC
    // On les traite directement sans conversion
    let totalMontantMAD = 0;
    let totalMontantCAD = 0;
    
    factures.forEach(facture => {
      const montantTTC = parseFloat(facture.montant || 0); // Déjà TTC en base
      const monnaie = facture.monnaie || 'MAD'; // Par défaut MAD si non spécifié
      
      if (monnaie === 'MAD') {
        totalMontantMAD += montantTTC;
      } else if (monnaie === 'CAD') {
        totalMontantCAD += montantTTC;
      }
    });
    
    // 🔥 Afficher le montant principal selon la monnaie dominante
    let montantPrincipal = totalMontantMAD;
    let monnaieAffichage = 'MAD';
    
    // Si les factures sont principalement en CAD, utiliser CAD
    if (totalMontantCAD > totalMontantMAD) {
      montantPrincipal = totalMontantCAD;
      monnaieAffichage = 'CAD';
    }
    
    const totalPayees = factures.filter(facture => facture.statut?.toLowerCase() === 'payee').length;
    const totalEnAttente = factures.filter(facture => ['brouillon', 'payable'].includes(facture.statut?.toLowerCase())).length;
    
    // 🔴 UTILISER LA LOGIQUE MÉTIER POUR CALCULER LES FACTURES EN RETARD
    const totalEnRetard = factures.filter(facture => estFactureEnRetard(facture)).length;
    
    console.log('📊 Statistiques calculées:', {
      totalMAD: totalMontantMAD.toFixed(2),
      totalCAD: totalMontantCAD.toFixed(2),
      monnaieAffichage,
      montantPrincipal: montantPrincipal.toFixed(2)
    });
    
    return {
      totalFactures,
      totalMontant: formatMontantDetaille(montantPrincipal, monnaieAffichage), // Afficher avec la bonne monnaie
      totalPayees,
      totalEnAttente,
      totalEnRetard
    };
  };
  
  const stats = calculerStatistiques();
  
  // 🔴 FONCTION POUR CHARGER LE LOGO EN BASE64
  const loadLogoAsBase64 = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionner l'image pour la facture (100x50 pixels)
        canvas.width = 100;
        canvas.height = 50;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, 100, 50);
        
        // Convertir en base64
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      
      img.onerror = function() {
        console.warn('Logo non trouvé, utilisation du placeholder');
        resolve(null); // Retourner null si le logo ne peut pas être chargé
      };
      
      // Charger le logo depuis le dossier public
      img.src = '/assets/logo.png';
    });
  };
  
  // Function to download an invoice as a PDF (FORMAT OFFICIEL)
  const telechargerFacture = async (facture) => {
    const doc = new jsPDF();
    
    // 🔴 CHARGER LE LOGO
    const logoBase64 = await loadLogoAsBase64();
    
    // 🔴 CONFIGURATION DU DOCUMENT
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // 🔴 EN-TÊTE OFFICIEL
    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 10, 40, 20);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
        // Fallback: rectangle gris
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, 10, 40, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('LOGO', margin + 15, 22);
      }
    } else {
      // Placeholder si le logo n'est pas disponible
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, 10, 40, 20, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('LOGO', margin + 15, 22);
    }
    
    // Informations de l'entreprise
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICES D\'IMMIGRATION EXPERT', margin + 50, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Rue Principale, Montréal, QC H1A 1A1', margin + 50, 28);
    doc.text('Tél: (514) 123-4567 | Email: info@immigration-expert.ca', margin + 50, 34);
    doc.text('Numéro TPS: 123456789RT0001 | Numéro TVQ: 1234567890TQ0001', margin + 50, 40);
    
    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // 🔴 TITRE FACTURE
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Bleu professionnel
    doc.text('FACTURE', pageWidth - margin - 50, 70);
    
    // 🔴 INFORMATIONS FACTURE ET CLIENT
    let yPosition = 90;
    
    // Informations facture (côté droit)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Numéro de facture:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.numero, pageWidth - margin - 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Date d\'émission:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.dateEmission), pageWidth - margin - 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Date d\'échéance:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.dateEcheance), pageWidth - margin - 20, yPosition);
    
    if (facture.datePaiement) {
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Date de paiement:', pageWidth - margin - 80, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(facture.datePaiement), pageWidth - margin - 20, yPosition);
    }
    
    // Informations client (côté gauche)
    yPosition = 90;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À:', margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(facture.client, margin, yPosition);
    
    // 🔴 TABLEAU DES SERVICES
    yPosition += 30;
    
    // 🔥 DÉTERMINER LA MONNAIE ET LE SYMBOLE
    const monnaieFacture = facture.monnaie || 'MAD';
    const symboleMonnaie = monnaieFacture === 'MAD' ? 'DH' : '$';
    const tauxTVA = monnaieFacture === 'MAD' ? 1.2 : 1.15; // 20% pour MAD, 15% pour CAD
    const pourcentageTVA = monnaieFacture === 'MAD' ? '20%' : '15%';
    
    // 🔥 CALCULS CORRECTS : Le montant en base est déjà TTC
    const montantTTC = parseFloat(facture.montant) || 0;
    const montantHT = montantTTC / tauxTVA;
    const tva = montantTTC - montantHT;
    
    // En-tête du tableau
    doc.setFillColor(41, 128, 185);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DESCRIPTION DU SERVICE', margin + 5, yPosition + 7);
    doc.text(`MONTANT (${monnaieFacture})`, pageWidth - margin - 40, yPosition + 7);
    
    yPosition += 15;
    
    // Contenu du tableau
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Service principal
    doc.text(facture.description || 'Service de consultation en immigration', margin + 5, yPosition);
    doc.text(`${montantHT.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 40, yPosition);
    
    yPosition += 10;
    
    // Ligne de séparation
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    // 🔴 CALCULS DES TOTAUX
    yPosition += 15;
    
    // Sous-total
    doc.setFont('helvetica', 'normal');
    doc.text('Sous-total (HT):', pageWidth - margin - 80, yPosition);
    doc.text(`${montantHT.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 25, yPosition);
    
    yPosition += 8;
    doc.text(`TVA (${pourcentageTVA}):`, pageWidth - margin - 80, yPosition);
    doc.text(`${tva.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 25, yPosition);
    
    yPosition += 8;
    
    // Total en gras
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL À PAYER:', pageWidth - margin - 80, yPosition);
    doc.text(`${montantTTC.toFixed(2)} ${symboleMonnaie} ${monnaieFacture}`, pageWidth - margin - 35, yPosition);
    
    // Encadrer le total
    doc.setLineWidth(1);
    doc.rect(pageWidth - margin - 90, yPosition - 5, 85, 12);
    
    // 🔴 INFORMATIONS DE PAIEMENT
    yPosition += 25;
    
    if (facture.methodePaiement) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Méthode de paiement:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(facture.methodePaiement, margin + 50, yPosition);
      yPosition += 8;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Statut de paiement:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const statutDisplay = mapStatutForDisplay(facture.statut);
    doc.text(statutDisplay, margin + 50, yPosition);
    
    // 🔴 CONDITIONS DE PAIEMENT
    yPosition += 20;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONDITIONS DE PAIEMENT:', margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('• Paiement exigible dans les 30 jours suivant la date d\'émission', margin, yPosition);
    yPosition += 6;
    doc.text('• Des frais de retard de 1,5% par mois s\'appliquent aux paiements en retard', margin, yPosition);
    yPosition += 6;
    doc.text('• En cas de litige, les tribunaux de Montréal seront seuls compétents', margin, yPosition);
    
    // 🔴 PIED DE PAGE
    const footerY = pageHeight - 30;
    
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Merci de votre confiance | Services d\'Immigration Expert', margin, footerY);
    doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-CA')}`, pageWidth - margin - 60, footerY);
    
    // Télécharger le PDF
    doc.save(`Facture-Officielle-${facture.numero}.pdf`);
  };

  // Function to print an invoice as a PDF (FORMAT OFFICIEL)
  const imprimerFacture = async (facture) => {
    const doc = new jsPDF();
    
    // 🔴 CHARGER LE LOGO
    const logoBase64 = await loadLogoAsBase64();
    
    // 🔴 CONFIGURATION DU DOCUMENT
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // 🔴 EN-TÊTE OFFICIEL
    // Logo
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 10, 40, 20);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
        // Fallback: rectangle gris
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, 10, 40, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('LOGO', margin + 15, 22);
      }
    } else {
      // Placeholder si le logo n'est pas disponible
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, 10, 40, 20, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('LOGO', margin + 15, 22);
    }
    
    // Informations de l'entreprise
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICES D\'IMMIGRATION EXPERT', margin + 50, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Rue Principale, Montréal, QC H1A 1A1', margin + 50, 28);
    doc.text('Tél: (514) 123-4567 | Email: info@immigration-expert.ca', margin + 50, 34);
    doc.text('Numéro TPS: 123456789RT0001 | Numéro TVQ: 1234567890TQ0001', margin + 50, 40);
    
    // ⚠️ PERSONNALISATION: Modifiez ces informations selon votre entreprise
    // Nom de l'entreprise, adresse, téléphone, email, numéros de taxes
    
    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(margin, 50, pageWidth - margin, 50);
    
    // 🔴 TITRE FACTURE
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Bleu professionnel
    doc.text('FACTURE', pageWidth - margin - 50, 70);
    
    // 🔴 INFORMATIONS FACTURE ET CLIENT
    let yPosition = 90;
    
    // Informations facture (côté droit)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Numéro de facture:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(facture.numero, pageWidth - margin - 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Date d\'émission:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.dateEmission), pageWidth - margin - 20, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Date d\'échéance:', pageWidth - margin - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(facture.dateEcheance), pageWidth - margin - 20, yPosition);
    
    if (facture.datePaiement) {
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Date de paiement:', pageWidth - margin - 80, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(facture.datePaiement), pageWidth - margin - 20, yPosition);
    }
    
    // Informations client (côté gauche)
    yPosition = 90;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À:', margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(facture.client, margin, yPosition);
    
    // 🔴 TABLEAU DES SERVICES
    yPosition += 30;
    
    // 🔥 DÉTERMINER LA MONNAIE ET LE SYMBOLE
    const monnaieFacture = facture.monnaie || 'MAD';
    const symboleMonnaie = monnaieFacture === 'MAD' ? 'DH' : '$';
    const tauxTVA = monnaieFacture === 'MAD' ? 1.2 : 1.15; // 20% pour MAD, 15% pour CAD
    const pourcentageTVA = monnaieFacture === 'MAD' ? '20%' : '15%';
    
    // 🔥 CALCULS CORRECTS : Le montant en base est déjà TTC
    const montantTTC = parseFloat(facture.montant) || 0;
    const montantHT = montantTTC / tauxTVA;
    const tva = montantTTC - montantHT;
    
    // En-tête du tableau
    doc.setFillColor(41, 128, 185);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DESCRIPTION DU SERVICE', margin + 5, yPosition + 7);
    doc.text(`MONTANT (${monnaieFacture})`, pageWidth - margin - 40, yPosition + 7);
    
    yPosition += 15;
    
    // Contenu du tableau
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Service principal
    doc.text(facture.description || 'Service de consultation en immigration', margin + 5, yPosition);
    doc.text(`${montantHT.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 40, yPosition);
    
    yPosition += 10;
    
    // Ligne de séparation
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    
    // 🔴 CALCULS DES TOTAUX
    yPosition += 15;
    
    // Sous-total
    doc.setFont('helvetica', 'normal');
    doc.text('Sous-total (HT):', pageWidth - margin - 80, yPosition);
    doc.text(`${montantHT.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 25, yPosition);
    
    yPosition += 8;
    doc.text(`TVA (${pourcentageTVA}):`, pageWidth - margin - 80, yPosition);
    doc.text(`${tva.toFixed(2)} ${symboleMonnaie}`, pageWidth - margin - 25, yPosition);
    
    yPosition += 8;
    
    // Total en gras
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL À PAYER:', pageWidth - margin - 80, yPosition);
    doc.text(`${montantTTC.toFixed(2)} ${symboleMonnaie} ${monnaieFacture}`, pageWidth - margin - 35, yPosition);
    
    // Encadrer le total
    doc.setLineWidth(1);
    doc.rect(pageWidth - margin - 90, yPosition - 5, 85, 12);
    
    // 🔴 INFORMATIONS DE PAIEMENT
    yPosition += 25;
    
    if (facture.methodePaiement) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Méthode de paiement:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(facture.methodePaiement, margin + 50, yPosition);
      yPosition += 8;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Statut de paiement:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    const statutDisplay = mapStatutForDisplay(facture.statut);
    doc.text(statutDisplay, margin + 50, yPosition);
    
    // 🔴 CONDITIONS DE PAIEMENT
    yPosition += 20;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONDITIONS DE PAIEMENT:', margin, yPosition);
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('• Paiement exigible dans les 30 jours suivant la date d\'émission', margin, yPosition);
    yPosition += 6;
    doc.text('• Des frais de retard de 1,5% par mois s\'appliquent aux paiements en retard', margin, yPosition);
    yPosition += 6;
    doc.text('• En cas de litige, les tribunaux de Montréal seront seuls compétents', margin, yPosition);
    
    // 🔴 PIED DE PAGE
    const footerY = pageHeight - 30;
    
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Merci de votre confiance | Services d\'Immigration Expert', margin, footerY);
    doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-CA')}`, pageWidth - margin - 60, footerY);
    
    // Ouvrir le PDF pour impression
    window.open(doc.output('bloburl'), '_blank');
  };
  
  // État pour gérer l'ouverture/fermeture des menus Actions
  const toggleDropdown = (id) => {
    setDropdownOpenId(prev => (prev === id ? null : id));
  };
  
  const ouvrirEdition = (facture) => {
    console.log('🔧 Ouverture édition pour facture:', facture);
    
    // Extraire les prestations du prestations_details si disponible
    let prestations = [];
    if (facture.prestations_details) {
      try {
        prestations = JSON.parse(facture.prestations_details);
        console.log('📋 Prestations extraites:', prestations);
        // S'assurer que les montants sont numériques
        prestations = prestations.map(p => ({
          description: p.description || '',
          montant: parseFloat(p.montant) || 0
        }));
      } catch (error) {
        console.error('Erreur parsing prestations_details:', error);
        prestations = [{ description: facture.description || '', montant: parseFloat(facture.montant) || 0 }];
      }
    } else if (facture.prestations && Array.isArray(facture.prestations)) {
      prestations = facture.prestations.map(p => ({
        description: p.description || '',
        montant: parseFloat(p.montant) || 0
      }));
    } else {
      prestations = [{ description: facture.description || '', montant: parseFloat(facture.montant) || 0 }];
    }

    // Calculer les montants
    const montantHT = prestations.reduce((sum, p) => sum + (parseFloat(p.montant) || 0), 0);
    const tva = montantHT * 0.15;
    const montantTTC = montantHT + tva;

    console.log('💰 Montants calculés:', { montantHT, tva, montantTTC });

    // Enrichir la facture avec des prestations par défaut si manquantes
    const factureComplete = {
      ...facture,
      prestations,
      montantHT,
      tva,
      montantTTC,
      // S'assurer que la date est au bon format pour le formulaire
      date: facture.dateEmission || facture.date_creation?.split('T')[0] || new Date().toISOString().split('T')[0]
    };
    
    console.log('📝 Facture complète pour édition:', factureComplete);
    
    setFactureToEdit(factureComplete);
    setShowEditModal(true);
    setDropdownOpenId(null);
  };
  
  const handleSaveEdition = async (updatedFacture) => {
    try {
      console.log('📝 === DEBUT SAUVEGARDE FACTURE ===');
      console.log('📝 Facture reçue pour sauvegarde:', updatedFacture);
      
      // Extraire les données essentielles
      const { id, numero, date, prestations, ...restData } = updatedFacture;
      
      // 🔴 ETAPE 1: VALIDATION ET NETTOYAGE DES PRESTATIONS
      let prestationsValidees = [];
      if (Array.isArray(prestations) && prestations.length > 0) {
        prestationsValidees = prestations
          .filter(p => p && (p.description || p.montant)) // Filtrer les prestations vides
          .map(p => ({
            description: (p.description || '').trim() || 'Service de consultation',
            montant: parseFloat(p.montant) || 0
          }));
      }
      
      // Si aucune prestation valide, créer une prestation par défaut
      if (prestationsValidees.length === 0) {
        prestationsValidees = [{
          description: 'Service de consultation',
          montant: 0
        }];
      }
      
      console.log('📋 Prestations validées:', prestationsValidees);
      
      // 🔴 ETAPE 2: CALCUL DU MONTANT DEFINITIF (HT uniquement pour cohérence)
      const montantHT = prestationsValidees.reduce((total, prestation) => {
        return total + (parseFloat(prestation.montant) || 0);
      }, 0);
      
      // Arrondir à 2 décimales pour éviter les erreurs de flottant
      const montantFinal = Math.round(montantHT * 100) / 100;
      
      console.log('💰 === CALCULS MONTANTS ===');
      console.log('💰 Montant HT calculé:', montantHT);
      console.log('💰 Montant final (arrondi):', montantFinal);
      console.log('💰 TVA (15%):', Math.round(montantFinal * 0.15 * 100) / 100);
      console.log('💰 TTC:', Math.round(montantFinal * 1.15 * 100) / 100);
      
      // 🔴 ETAPE 3: MISE A JOUR DES PRESTATIONS SI NECESSAIRE
      // Si le montant total des prestations ne correspond pas au montant final
      // (peut arriver lors de modifications manuelles), on met à jour la première prestation
      const sommePrestations = prestationsValidees.reduce((sum, p) => sum + p.montant, 0);
      if (Math.abs(sommePrestations - montantFinal) > 0.01) {
        console.log('⚠️ Correction automatique des prestations');
        console.log(`⚠️ Somme prestations: ${sommePrestations}, Montant attendu: ${montantFinal}`);
        
        if (prestationsValidees.length > 0) {
          prestationsValidees[0].montant = montantFinal;
          prestationsValidees[0].description = `Service de consultation - ${montantFinal} CAD`;
        }
      }
      
      console.log('📋 Prestations finales:', prestationsValidees);
      
      // 🔴 ETAPE 4: PREPARATION DU PAYLOAD API
      const payload = {
        numero: numero || `F-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        montant: montantFinal, // ⭐ MONTANT HT UNIQUEMENT
        dateEmission: date || new Date().toISOString().split('T')[0],
        description: (prestationsValidees[0]?.description || 'Service de consultation'),
        statut: updatedFacture.statut || 'brouillon',
        prestations_details: JSON.stringify(prestationsValidees), // ⭐ PRESTATIONS COHERENTES
        dateValidation: new Date().toISOString(),
        validePar: userName || 'utilisateur',
        // Conserver les autres champs existants
        client: restData.client,
        client_id: restData.client_id,
        dateEcheance: restData.dateEcheance,
        datePaiement: restData.datePaiement,
        methodePaiement: restData.methodePaiement
      };
      
      console.log('📤 === PAYLOAD FINAL ===');
      console.log('📤 Payload à envoyer:', payload);
      console.log('📤 Montant final dans payload:', payload.montant);
      console.log('📤 Prestations_details:', payload.prestations_details);
      
      // 🔴 ETAPE 5: ENVOI A L'API
      const result = await updateFacture(id, payload);
      
      if (result.success) {
        console.log('✅ === SAUVEGARDE REUSSIE ===');
        console.log('✅ Facture mise à jour avec succès');
        console.log('✅ Montant sauvegardé:', payload.montant);
        
        // Recharger les données pour vérifier la cohérence
        await chargerFactures();
        setShowEditModal(false);
        setFactureToEdit(null);
        
        // Message de confirmation
        alert(`✅ Facture ${payload.numero} mise à jour avec succès!\nMontant: ${payload.montant} $ (HT)`);
      } else {
        console.error('❌ Erreur API:', result.error);
        alert(`❌ Erreur lors de la mise à jour: ${result.error || 'Erreur inconnue'}`);
      }
      
    } catch (err) {
      console.error('❌ === ERREUR SAUVEGARDE ===');
      console.error('❌ Erreur lors de la sauvegarde:', err);
      alert('❌ Erreur lors de la mise à jour de la facture');
    }
  };
  
  // Gérer l'état de chargement
  if (loading) {
    return (
      <div className="facturation-container">
        <div className="loading-container">
          <h2>Chargement des factures...</h2>
          <div className="loading-spinner">⏳</div>
        </div>
      </div>
    );
  }

  return (
    <div className="facturation-container">
      <div className="facturation-header">
        <h2>Gestion de la Facturation</h2>
        {userRole === 'conseillere' && (
          <div className="filtrage-info">
            <span className="filtrage-badge" title={`Vous ne voyez que les factures où validePar = "${userName}" pour des raisons de confidentialité`}>
              🔒 Mes factures {filteredBy && filteredBy !== 'Toutes' ? `(${filteredBy})` : ''}
            </span>
          </div>
        )}
        <div className="header-actions">
          <button className="btn-secondary" onClick={chargerFactures} disabled={loading}>
            🔄 Actualiser
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <span>+</span> Nouvelle Facture
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-container">
          <p className="error-message">❌ {error}</p>
          <button className="btn-secondary" onClick={() => setError(null)}>
            Fermer
          </button>
        </div>
      )}
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>{userRole === 'conseillere' ? 'Mes factures' : 'Total des factures'}</h3>
          <p className="stat-value">{stats.totalFactures}</p>
        </div>
        <div className="stat-card">
          <h3>Montant total</h3>
          <p className="stat-value">{stats.totalMontant}</p>
        </div>
        <div className="stat-card">
          <h3>Factures payées</h3>
          <p className="stat-value">{stats.totalPayees}</p>
        </div>
        <div className="stat-card">
          <h3>En attente</h3>
          <p className="stat-value">{stats.totalEnAttente}</p>
        </div>
        <div className="stat-card">
          <h3>En retard</h3>
          <p className="stat-value stat-alert">{stats.totalEnRetard}</p>
        </div>
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
          <label>Client:</label>
          <select 
            name="client" 
            value={filtres.client} 
            onChange={handleFiltreChange}
          >
            <option value="">Tous</option>
            {clientsOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-group">
          <label>Période:</label>
          <select 
            name="periode" 
            value={filtres.periode} 
            onChange={handleFiltreChange}
          >
            <option value="">Toutes</option>
            {periodeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button className="btn-secondary" onClick={resetFiltres}>
          Réinitialiser
        </button>
      </div>
      
      <div className="factures-table-container">
        <table className="factures-table">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('numero')}
                className={sortConfig.key === 'numero' ? 'sorted' : ''}
              >
                Numéro {getSortIcon('numero')}
              </th>
              <th 
                onClick={() => handleSort('client')}
                className={sortConfig.key === 'client' ? 'sorted' : ''}
              >
                Client {getSortIcon('client')}
              </th>
              <th 
                onClick={() => handleSort('montant')}
                className={sortConfig.key === 'montant' ? 'sorted' : ''}
              >
                Montant {getSortIcon('montant')}
              </th>
              <th 
                onClick={() => handleSort('statut')}
                className={sortConfig.key === 'statut' ? 'sorted' : ''}
              >
                Statut {getSortIcon('statut')}
              </th>
              <th 
                onClick={() => handleSort('dateEmission')}
                className={sortConfig.key === 'dateEmission' ? 'sorted' : ''}
              >
                Date émission {getSortIcon('dateEmission')}
              </th>
              <th 
                onClick={() => handleSort('dateEcheance')}
                className={sortConfig.key === 'dateEcheance' ? 'sorted' : ''}
              >
                Date échéance {getSortIcon('dateEcheance')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facturesFiltrees.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  {loading ? 'Chargement...' : 'Aucune facture trouvée'}
                </td>
              </tr>
            ) : (
              getSortedFactures(facturesFiltrees).map(facture => (
                <tr key={facture.id} className={`${estFactureEnRetard(facture) ? 'facture-en-retard' : ''} ${facture.statut?.toLowerCase() === 'brouillon' ? 'facture-brouillon' : ''}`}>
                  <td>
                    {facture.numero}
                    {/* 🔴 NOUVEAU : Indicateur visuel pour les factures en brouillon */}
                    {facture.statut?.toLowerCase() === 'brouillon' && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '3px' }}>
                        BROUILLON
                      </span>
                    )}
                  </td>
                  <td>{facture.client}</td>
                  <td>{formatMontantDetaille(facture.montant, facture.monnaie)}</td>
                  <td>
                    <span className={`statut-badge ${getStatutClass(facture.statut)}`}>
                      {mapStatutForDisplay(facture.statut)}
                    </span>
                  </td>
                  <td>{formatDate(facture.dateEmission)}</td>
                  <td>{formatDate(facture.dateEcheance)}</td>
                <td>
                  <div className="actions-dropdown">
                    <button className="btn-action" onClick={() => toggleDropdown(facture.id)}>Actions ▾</button>
                    <div className={`dropdown-content ${dropdownOpenId === facture.id ? 'show' : ''}`}>
                      <button onClick={() => voirDetails(facture)}>Voir détails</button>
                      <button onClick={async () => await telechargerFacture(facture)}>Télécharger</button>
                      <button onClick={async () => await imprimerFacture(facture)}>Imprimer</button>
                      {canEditFacture(facture.statut, userRole) && (
                        <button onClick={() => ouvrirEdition(facture)}>✏️ Modifier</button>
                      )}
                      {/* 🔴 NOUVEAU : Bouton pour passer rapidement de brouillon à payable */}
                      {facture.statut?.toLowerCase() === 'brouillon' && (
                        <button onClick={() => changerStatut(facture.id, 'Payable')} style={{ backgroundColor: '#2196f3', color: 'white' }}>
                          📝 Rendre payable
                        </button>
                      )}
                      {canEditFacture(facture.statut, userRole) && facture.statut?.toLowerCase() !== 'payee' && (
                        <button onClick={() => changerStatut(facture.id, 'Payée', 'Carte de crédit')}>
                          Marquer comme payée
                        </button>
                      )}
                      {canEditFacture(facture.statut, userRole) && facture.statut?.toLowerCase() !== 'en_retard' && (
                        <button onClick={() => changerStatut(facture.id, 'En retard')}>
                          Marquer en retard
                        </button>
                      )}
                      {facture.statut?.toLowerCase() !== 'annulee' && (
                        <button onClick={() => changerStatut(facture.id, 'Annulée')}>
                          Annuler la facture
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Créer une nouvelle facture</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={ajouterFacture}>
              <div className="form-row">
                <div className="form-group">
                  <label>Client:</label>
                  <ClientAutocomplete
                    value={nouvelleFacture.client}
                    onSelect={handleClientSelect}
                    placeholder="Rechercher un client par nom ou téléphone..."
                    required
                  />
                  {nouvelleFacture.selectedClientId && (
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      ✅ Client sélectionné (ID: {nouvelleFacture.selectedClientId})
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Montant TTC:</label>
                  <input 
                    type="number" 
                    name="montant" 
                    value={nouvelleFacture.montant} 
                    onChange={handleNouvelleFactureChange} 
                    step="0.01"
                    min="0"
                    required 
                  />
                  {nouvelleFacture.montant && (
                    <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {formatMontantAvecDetails(nouvelleFacture.montant, nouvelleFacture.monnaie)}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Monnaie:</label>
                  <select 
                    name="monnaie" 
                    value={nouvelleFacture.monnaie} 
                    onChange={handleNouvelleFactureChange}
                    required
                  >
                    <option value="MAD">MAD (Dirham Marocain)</option>
                    <option value="CAD">CAD (Dollar Canadien)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date d'émission:</label>
                  <input 
                    type="date" 
                    name="dateEmission" 
                    value={nouvelleFacture.dateEmission} 
                    onChange={handleDateEmissionChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Date d'échéance:</label>
                  <input 
                    type="date" 
                    name="dateEcheance" 
                    value={nouvelleFacture.dateEcheance} 
                    onChange={handleNouvelleFactureChange} 
                    required 
                    readOnly
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Description:</label>
                  <textarea 
                    name="description" 
                    value={nouvelleFacture.description} 
                    onChange={handleNouvelleFactureChange} 
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && factureDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails de la facture</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="facture-details">
              <div className="facture-info">
                <h4>Informations générales</h4>
                <p><strong>Numéro:</strong> {factureDetails.numero}</p>
                <p><strong>Client:</strong> {factureDetails.client}</p>
                <p><strong>Montant:</strong> {formatMontantAvecDetails(factureDetails.montant, factureDetails.monnaie)}</p>
                <p><strong>Statut:</strong> 
                  <span className={`statut-badge statut-${factureDetails.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                    {factureDetails.statut}
                  </span>
                </p>
                <p><strong>Date d'émission:</strong> {factureDetails.dateEmission}</p>
                <p><strong>Date d'échéance:</strong> {factureDetails.dateEcheance}</p>
                {factureDetails.datePaiement && (
                  <p><strong>Date de paiement:</strong> {factureDetails.datePaiement}</p>
                )}
                {factureDetails.methodePaiement && (
                  <p><strong>Méthode de paiement:</strong> {factureDetails.methodePaiement}</p>
                )}
                <p><strong>Description:</strong> {factureDetails.description}</p>
              </div>
              
              {factureDetails.statut !== 'Payée' && factureDetails.statut !== 'Annulée' && (
                <div className="facture-actions">
                  <h4>Actions</h4>
                  <div className="paiement-form">
                    <h5>Marquer comme payée</h5>
                    <div className="form-group">
                      <label>Méthode de paiement:</label>
                      <select 
                        id="methodePaiement" 
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            console.log('🔄 Tentative de changement de statut avec méthode:', e.target.value);
                            changerStatut(factureDetails.id, 'Payée', e.target.value);
                          }
                        }}
                      >
                        <option value="">Sélectionner une méthode</option>
                        {methodePaiementOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="paiement-actions">
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          setShowDetailsModal(false);
                          setFactureDetails(null);
                        }}
                        style={{ marginTop: '10px' }}
                      >
                        FERMER
                      </button>
                    </div>
                    
                    <div className="other-actions">
                      {factureDetails.statut !== 'En retard' && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => changerStatut(factureDetails.id, 'En retard')}
                        >
                          Marquer en retard
                        </button>
                      )}
                      <button 
                        className="btn-secondary" 
                        onClick={() => changerStatut(factureDetails.id, 'Annulée')}
                      >
                        Annuler la facture
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'édition */}
      {showEditModal && factureToEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FactureForm
              client={{ 
                nom: factureToEdit.client,
                prenom: '',
                email: '',
                telephone: '',
                numeroDossier: factureToEdit.numero 
              }}
              userRole={userRole}
              existingFacture={factureToEdit}
              onCancel={() => { setShowEditModal(false); setFactureToEdit(null); }}
              onSave={handleSaveEdition}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Facturation;
