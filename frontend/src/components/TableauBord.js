import React, { useState, useEffect, useRef } from 'react';
import '../styles/TableauBord.css';
import { getDashboardStats, getVentesParConseillere, getMesVentes, getRendezVousAVenir, getActivitesRecentes, getConsultations, getConsultationStats } from '../services/dashboardAPI';
import { connectSocket } from '../services/socket';
import ClientDetailModal from './ClientDetailModal';
import clientsAPI from '../services/clientsAPI';
import { getAllLeads } from '../services/leadsAPI';
import statisticsService from '../services/statisticsService';

function TableauBord({ userRole = 'directeur', userName = 'Utilisateur Test', onNavigate }) {
  // État pour la période sélectionnée
  const [periode, setPeriode] = useState('mois');
  const [titrePage, setTitrePage] = useState('Aperçu du Mois'); // État pour le titre de la page

  const currentPeriodeRef = useRef(periode);

  // État pour les vraies données de ventes par conseillère
  const [vraiesVentesConseilleres, setVraiesVentesConseilleres] = useState([]);
  const [loadingVentes, setLoadingVentes] = useState(false);

  // État pour les données personnelles de la conseillère connectée
  const [mesVentesData, setMesVentesData] = useState({
    mesFactures: [],
    monTotalTTC: 0,
    monNombreFactures: 0
  });
  const [loadingMesVentes, setLoadingMesVentes] = useState(false);

  // États pour les consultations effectuées
  const [consultationsData, setConsultationsData] = useState({
    totalConsultations: 0,
    consultationsRecentes: [],
    evolution: '+0%'
  });
  const [loadingConsultations, setLoadingConsultations] = useState(false);

  // États pour les rendez-vous à venir
  const [vraiesRendezVousAVenir, setVraiesRendezVousAVenir] = useState([]);
  const [loadingRendezVous, setLoadingRendezVous] = useState(false);

  // États pour les activités récentes en temps réel
  const [vraiesActivitesRecentes, setVraiesActivitesRecentes] = useState([]);
  const [loadingActivites, setLoadingActivites] = useState(false);
  const [derniereMAJActivites, setDerniereMAJActivites] = useState(null);

  // États pour le modal client/lead
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState('client'); // 'client' ou 'lead'
  const [loadingClient, setLoadingClient] = useState(false);

  // Mettre à jour le titre de la page lorsque la période change
  useEffect(() => {
    let nouveauTitre = 'Aperçu ';
    switch (periode) {
      case 'jour':
        nouveauTitre += 'du Jour';
        break;
      case 'semaine':
        nouveauTitre += 'de la Semaine';
        break;
      case 'mois':
        nouveauTitre += 'du Mois';
        break;
      case 'trimestre':
        nouveauTitre += 'du Trimestre';
        break;
      case 'annee':
        nouveauTitre += "de l'Année"; // Utilisation de guillemets doubles pour éviter les problèmes d'échappement
        break;
      default:
        nouveauTitre += 'du Mois'; // Valeur par défaut
    }
    setTitrePage(nouveauTitre);
  }, [periode]); // Se déclenche à chaque changement de 'periode'
  
  // État pour les statistiques et données du tableau de bord
  const [stats, setStats] = useState({
    // Statistiques générales
    totalLeads: 24,
    leadsActifs: 18,
    tauxConversion: 75,
    totalClients: 42,
    clientsActifs: 38,
    dossiersEnCours: 31,
    dossiersCompletes: 15,
    facturesEnAttente: 8,
    montantFacturesEnAttente: 12500,
    montantFacturesPaye: 45000,
    rendezVousAVenir: 12,
    chargesAVenir: 5,
    montantChargesAVenir: 8500,
    
    // Statistiques spécifiques aux conseillères
    mesClients: 0,
    mesLeads: 0,
    mesDossiers: 0,
    mesFacturesImpayees: 0,
    mesConsultations: 28,
    mesVentes: 15,
    
    // Statistiques spécifiques au comptable
    totalVentes: 45000,
    paiementsRecents: 18500,
    
    // Statistiques spécifiques à la secrétaire
    leadsATraiter: 6,
    rendezVousJour: 8,
    nouveauxLeads: 4,
    
    // Statistiques par conseillère (pour admin/directeur)
    ventesParConseillere: [
      { conseillere: 'wafaa chaouby', valeur: 18500 },
      { conseillere: 'hame amni', valeur: 15200 },
      { conseillere: 'sanaa sami', valeur: 11300 }
    ],

    // Évolution (sera calculée dynamiquement)
    evolutionClients: 0,
    evolutionLeads: 0
  });
  
  // Données complètes pour les graphiques (toutes périodes)
  const [allGraphData, setAllGraphData] = useState({
    // Données pour les leads par source
    leadsParSource: {
      jour: [
        { source: 'Site Web', valeur: 3 },
        { source: 'Référence', valeur: 1 },
        { source: 'Réseaux Sociaux', valeur: 2 },
        { source: 'Autre', valeur: 0 }
      ],
      semaine: [
        { source: 'Site Web', valeur: 8 },
        { source: 'Référence', valeur: 3 },
        { source: 'Réseaux Sociaux', valeur: 3 },
        { source: 'Autre', valeur: 2 }
      ],
      mois: [
        { source: 'Site Web', valeur: 12 },
        { source: 'Référence', valeur: 5 },
        { source: 'Réseaux Sociaux', valeur: 4 },
        { source: 'Autre', valeur: 3 }
      ],
      trimestre: [
        { source: 'Site Web', valeur: 35 },
        { source: 'Référence', valeur: 14 },
        { source: 'Réseaux Sociaux', valeur: 12 },
        { source: 'Autre', valeur: 9 }
      ],
      annee: [
        { source: 'Site Web', valeur: 120 },
        { source: 'Référence', valeur: 45 },
        { source: 'Réseaux Sociaux', valeur: 38 },
        { source: 'Autre', valeur: 27 }
      ]
    },
    
    // Données pour les revenus par mois
    revenusParMois: {
      jour: [
        { mois: 'Lun', valeur: 1200 },
        { mois: 'Mar', valeur: 1500 },
        { mois: 'Mer', valeur: 1100 },
        { mois: 'Jeu', valeur: 1800 },
        { mois: 'Ven', valeur: 2100 }
      ],
      semaine: [
        { mois: 'Sem 1', valeur: 5500 },
        { mois: 'Sem 2', valeur: 6200 },
        { mois: 'Sem 3', valeur: 5800 },
        { mois: 'Sem 4', valeur: 7500 },
        { mois: 'Sem 5', valeur: 8000 }
      ],
      mois: [
        { mois: 'Jan', valeur: 15000 },
        { mois: 'Fév', valeur: 18000 },
        { mois: 'Mar', valeur: 16500 },
        { mois: 'Avr', valeur: 21000 },
        { mois: 'Mai', valeur: 24500 }
      ],
      trimestre: [
        { mois: 'T1', valeur: 49500 },
        { mois: 'T2', valeur: 61500 },
        { mois: 'T3', valeur: 55000 },
        { mois: 'T4', valeur: 68000 }
      ],
      annee: [
        { mois: '2024', valeur: 180000 },
        { mois: '2025', valeur: 234000 }
      ]
    },
    
    // Données pour les dossiers par type
    dossiersParType: {
      jour: [
        { type: 'Permis d\'études', valeur: 2 },
        { type: 'Résidence permanente', valeur: 1 },
        { type: 'Visa visiteur', valeur: 1 },
        { type: 'Permis de travail', valeur: 0 },
        { type: 'Citoyenneté', valeur: 0 }
      ],
      semaine: [
        { type: 'Permis d\'études', valeur: 6 },
        { type: 'Résidence permanente', valeur: 4 },
        { type: 'Visa visiteur', valeur: 3 },
        { type: 'Permis de travail', valeur: 2 },
        { type: 'Citoyenneté', valeur: 1 }
      ],
      mois: [
        { type: 'Permis d\'études', valeur: 18 },
        { type: 'Résidence permanente', valeur: 12 },
        { type: 'Visa visiteur', valeur: 8 },
        { type: 'Permis de travail', valeur: 5 },
        { type: 'Citoyenneté', valeur: 3 }
      ],
      trimestre: [
        { type: 'Permis d\'études', valeur: 45 },
        { type: 'Résidence permanente', valeur: 32 },
        { type: 'Visa visiteur', valeur: 24 },
        { type: 'Permis de travail', valeur: 18 },
        { type: 'Citoyenneté', valeur: 9 }
      ],
      annee: [
        { type: 'Permis d\'études', valeur: 180 },
        { type: 'Résidence permanente', valeur: 120 },
        { type: 'Visa visiteur', valeur: 95 },
        { type: 'Permis de travail', valeur: 65 },
        { type: 'Citoyenneté', valeur: 40 }
      ]
    },
    
    // Données pour les ventes par conseillère
    ventesParConseillere: {
      jour: [
        { conseillere: 'wafaa chaouby', valeur: 1500 },
        { conseillere: 'hame amni', valeur: 1200 },
        { conseillere: 'sanaa sami', valeur: 900 }
      ],
      semaine: [
        { conseillere: 'wafaa chaouby', valeur: 8500 },
        { conseillere: 'hame amni', valeur: 7200 },
        { conseillere: 'sanaa sami', valeur: 5300 }
      ],
      mois: [
        { conseillere: 'wafaa chaouby', valeur: 18500 },
        { conseillere: 'hame amni', valeur: 15200 },
        { conseillere: 'sanaa sami', valeur: 11300 }
      ],
      trimestre: [
        { conseillere: 'wafaa chaouby', valeur: 55000 },
        { conseillere: 'hame amni', valeur: 48000 },
        { conseillere: 'sanaa sami', valeur: 36000 }
      ],
      annee: [
        { conseillere: 'wafaa chaouby', valeur: 220000 },
        { conseillere: 'hame amni', valeur: 185000 },
        { conseillere: 'sanaa sami', valeur: 145000 }
      ]
    }
  });
  
  // Données filtrées pour les graphiques selon la période sélectionnée
  const [graphData, setGraphData] = useState({
    leadsParSource: [],
    revenusParMois: [],
    dossiersParType: [],
    ventesParConseillere: []
  });
  
  // Activités récentes pour admin/directeur
  const [activitesRecentes, setActivitesRecentes] = useState([]);

  // Mes activités récentes (pour les conseillères)
  const [mesActivitesRecentes, setMesActivitesRecentes] = useState([]);
  
  // Rendez-vous à venir pour admin/directeur
  const [rendezVousAVenir, setRendezVousAVenir] = useState([]);

  // Mes rendez-vous à venir (pour les conseillères)
  const [mesRendezVousAVenir, setMesRendezVousAVenir] = useState([]);

  // Rendez-vous du jour (pour la secrétaire)
  const [rendezVousJour, setRendezVousJour] = useState([]);

  // Nouveaux leads (pour la secrétaire)
  const [nouveauxLeads, setNouveauxLeads] = useState([]);

  // Dernières factures (pour le comptable)
  const [dernieresFactures, setDernieresFactures] = useState([]);

  // Paiements récents (pour le comptable)
  const [paiementsRecents, setPaiementsRecents] = useState([]);

  // Charges (pour le comptable)
  const [charges, setCharges] = useState([
    {
      id: 'C-2025-023',
      description: 'Loyer bureau',
      montant: 3500,
      date: '2025-05-01',
      statut: 'Payée'
    },
    {
      id: 'C-2025-024',
      description: 'Services publics',
      montant: 850,
      date: '2025-05-05',
      statut: 'Payée'
    },
    {
      id: 'C-2025-025',
      description: 'Fournitures de bureau',
      montant: 450,
      date: '2025-05-12',
      statut: 'En attente'
    },
    {
      id: 'C-2025-026',
      description: 'Services informatiques',
      montant: 1200,
      date: '2025-05-15',
      statut: 'En attente'
    }
  ]);
  
  // Tâches en attente (pour les conseillères)
  const [tachesEnAttente, setTachesEnAttente] = useState([]);
  
  // Fonction pour formater les montants en devise
  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(montant);
  };
  
  // Fonction pour obtenir l'icône selon le type d'activité
  const getIconeActivite = (type) => {
    switch(type) {
      case 'lead': return '👤';
      case 'client': return '👥';
      case 'dossier': return '📁';
      case 'facture': return '💰';
      case 'rendez-vous': return '📅';
      default: return '📝';
    }
  };
  
  // Fonction pour obtenir la classe de priorité
  const getClassePriorite = (priorite) => {
    switch(priorite) {
      case 'haute': return 'priorite-haute';
      case 'moyenne': return 'priorite-moyenne';
      case 'basse': return 'priorite-basse';
      default: return '';
    }
  };
  
  // Fonction pour calculer dynamiquement les statistiques selon la période
  const calculerStatistiques = (nouvellePeriode) => {
    // Obtenir la date actuelle
    const maintenant = new Date();
    
    // Calculer les dates de début et de fin selon la période
    let dateDebut, dateFin;
    dateFin = new Date(maintenant);
    
    switch(nouvellePeriode) {
      case 'jour':
        dateDebut = new Date(maintenant);
        dateDebut.setHours(0, 0, 0, 0);
        break;
      case 'semaine':
        dateDebut = new Date(maintenant);
        dateDebut.setDate(dateDebut.getDate() - 7);
        break;
      case 'mois':
        dateDebut = new Date(maintenant);
        dateDebut.setMonth(dateDebut.getMonth() - 1);
        break;
      case 'trimestre':
        dateDebut = new Date(maintenant);
        dateDebut.setMonth(dateDebut.getMonth() - 3);
        break;
      case 'annee':
        dateDebut = new Date(maintenant);
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        break;
      default:
        dateDebut = new Date(maintenant);
        dateDebut.setMonth(dateDebut.getMonth() - 1); // Par défaut: mois
    }
    
    // Dans une application réelle, ces données seraient récupérées via une API
    // en utilisant les dates calculées comme paramètres de filtrage
    
    // Pour cette démonstration, nous utilisons les données pré-calculées
    // stockées dans allGraphData selon la période sélectionnée
    return {
      graphData: {
        leadsParSource: allGraphData.leadsParSource[nouvellePeriode] || [],
        revenusParMois: allGraphData.revenusParMois[nouvellePeriode] || [],
        dossiersParType: allGraphData.dossiersParType[nouvellePeriode] || [],
        ventesParConseillere: allGraphData.ventesParConseillere[nouvellePeriode] || []
      },
      stats: getStatsByPeriode(nouvellePeriode)
    };
  };
  
  // Fonction pour obtenir les statistiques selon la période
  const getStatsByPeriode = (periode) => {
    // Dans une application réelle, ces données seraient calculées dynamiquement
    // à partir des données de la base de données filtrées par période
    
    switch(periode) {
      case 'jour':
        return {
          totalLeads: 3,
          leadsActifs: 3,
          tauxConversion: 67,
          totalClients: 42,
          clientsActifs: 38,
          dossiersEnCours: 31,
          dossiersCompletes: 1,
          facturesEnAttente: 2,
          montantFacturesEnAttente: 3200,
          montantFacturesPaye: 2500,
          rendezVousAVenir: 5,
          chargesAVenir: 1,
          montantChargesAVenir: 1200,
          // Statistiques spécifiques aux conseillères
          mesClients: 15,
          mesLeads: 2,
          mesDossiers: 12,
          mesFacturesImpayees: 1,
          mesConsultations: 3,
          mesVentes: 1,
          // Statistiques spécifiques au comptable
          totalVentes: 2500,
          paiementsRecents: 2200,
          // Statistiques spécifiques à la secrétaire
          leadsATraiter: 2,
          rendezVousJour: 5,
          nouveauxLeads: 1,
          // Statistiques par conseillère
                  ventesParConseillere: [
          { conseillere: 'wafaa chaouby', valeur: 1500 },
          { conseillere: 'hame amni', valeur: 1200 },
          { conseillere: 'sanaa sami', valeur: 900 }
        ]
        };
      case 'semaine':
        return {
          totalLeads: 8,
          leadsActifs: 6,
          tauxConversion: 70,
          totalClients: 42,
          clientsActifs: 38,
          dossiersEnCours: 31,
          dossiersCompletes: 3,
          facturesEnAttente: 4,
          montantFacturesEnAttente: 5500,
          montantFacturesPaye: 8000,
          rendezVousAVenir: 8,
          chargesAVenir: 2,
          montantChargesAVenir: 3500,
          // Statistiques spécifiques aux conseillères
          mesClients: 15,
          mesLeads: 3,
          mesDossiers: 12,
          mesFacturesImpayees: 2,
          mesConsultations: 6,
          mesVentes: 3,
          // Statistiques spécifiques au comptable
          totalVentes: 8000,
          paiementsRecents: 5500,
          // Statistiques spécifiques à la secrétaire
          leadsATraiter: 3,
          rendezVousJour: 8,
          nouveauxLeads: 2,
          // Statistiques par conseillère
                  ventesParConseillere: [
          { conseillere: 'wafaa chaouby', valeur: 3500 },
          { conseillere: 'hame amni', valeur: 2800 },
          { conseillere: 'sanaa sami', valeur: 1700 }
        ]
        };
      case 'trimestre':
        return {
          totalLeads: 65,
          leadsActifs: 18,
          tauxConversion: 72,
          totalClients: 42,
          clientsActifs: 38,
          dossiersEnCours: 31,
          dossiersCompletes: 42,
          facturesEnAttente: 8,
          montantFacturesEnAttente: 12500,
          montantFacturesPaye: 120000,
          rendezVousAVenir: 12,
          chargesAVenir: 12,
          montantChargesAVenir: 25000,
          // Statistiques spécifiques aux conseillères
          mesClients: 15,
          mesLeads: 22,
          mesDossiers: 12,
          mesFacturesImpayees: 4,
          mesConsultations: 85,
          mesVentes: 42,
          // Statistiques spécifiques au comptable
          totalVentes: 120000,
          paiementsRecents: 45000,
          // Statistiques spécifiques à la secrétaire
          leadsATraiter: 6,
          rendezVousJour: 8,
          nouveauxLeads: 4,
          // Statistiques par conseillère
                  ventesParConseillere: [
          { conseillere: 'wafaa chaouby', valeur: 52000 },
          { conseillere: 'hame amni', valeur: 43500 },
          { conseillere: 'sanaa sami', valeur: 24500 }
        ]
        };
      case 'annee':
        return {
          totalLeads: 210,
          leadsActifs: 18,
          tauxConversion: 68,
          totalClients: 42,
          clientsActifs: 38,
          dossiersEnCours: 31,
          dossiersCompletes: 145,
          facturesEnAttente: 8,
          montantFacturesEnAttente: 12500,
          montantFacturesPaye: 480000,
          rendezVousAVenir: 12,
          chargesAVenir: 24,
          montantChargesAVenir: 95000,
          // Statistiques spécifiques aux conseillères
          mesClients: 15,
          mesLeads: 75,
          mesDossiers: 12,
          mesFacturesImpayees: 4,
          mesConsultations: 320,
          mesVentes: 145,
          // Statistiques spécifiques au comptable
          totalVentes: 480000,
          paiementsRecents: 180000,
          // Statistiques spécifiques à la secrétaire
          leadsATraiter: 6,
          rendezVousJour: 8,
          nouveauxLeads: 4,
          // Statistiques par conseillère
                  ventesParConseillere: [
          { conseillere: 'wafaa chaouby', valeur: 195000 },
          { conseillere: 'hame amni', valeur: 168000 },
          { conseillere: 'sanaa sami', valeur: 117000 }
        ]
        };
      default: // mois
        return {
          totalLeads: 24,
          leadsActifs: 18,
          tauxConversion: 75,
          totalClients: 42,
          clientsActifs: 38,
          dossiersEnCours: 31,
          dossiersCompletes: 15,
          facturesEnAttente: 8,
          montantFacturesEnAttente: 12500,
          montantFacturesPaye: 45000,
          rendezVousAVenir: 12,
          chargesAVenir: 5,
          montantChargesAVenir: 8500,
          // Statistiques spécifiques aux conseillères
          mesClients: 15,
          mesLeads: 8,
          mesDossiers: 12,
          mesFacturesImpayees: 4,
          mesConsultations: 28,
          mesVentes: 15,
          // Statistiques spécifiques au comptable
          totalVentes: 45000,
          paiementsRecents: 18500,
          // Statistiques spécifiques à la secrétaire
          leadsATraiter: 6,
          rendezVousJour: 8,
          nouveauxLeads: 4,
          // Statistiques par conseillère
                  ventesParConseillere: [
          { conseillere: 'wafaa chaouby', valeur: 18500 },
          { conseillere: 'hame amni', valeur: 15200 },
          { conseillere: 'sanaa sami', valeur: 11300 }
        ]
        };
    }
  };
  
  // Fonction pour charger les vraies données de ventes par conseillère (pour admin/directeur)
  const chargerVraiesVentes = async (periodeChoisie = periode) => {
    try {
      setLoadingVentes(true);
      console.log(`🔄 [TableauBord] Chargement ventes conseillères pour période: ${periodeChoisie}, userRole: ${userRole}`);
      
      const result = await getVentesParConseillere(periodeChoisie);
      console.log(`📊 [TableauBord] Résultat API ventes:`, result);
      
      if (result.success) {
        console.log(`✅ [TableauBord] ${result.data.length} ventes chargées:`, result.data);
        setVraiesVentesConseilleres(result.data);
        
        // Mettre à jour les stats avec les vraies données
        setStats(prev => ({
          ...prev,
          ventesParConseillere: result.data,
          totalVentes: result.summary?.totalVentesTTC || prev.totalVentes
        }));
        
        // Mettre à jour aussi les données des graphiques
        setGraphData(prev => ({
          ...prev,
          ventesParConseillere: result.data
        }));
      } else {
        console.error('❌ [TableauBord] Erreur chargement ventes:', result.error);
        // En cas d'erreur, garder les données vides
        setVraiesVentesConseilleres([]);
      }
    } catch (error) {
      console.error('❌ [TableauBord] Erreur chargement ventes conseillères:', error);
      setVraiesVentesConseilleres([]);
    } finally {
      setLoadingVentes(false);
    }
  };

  // Fonction pour charger MES données de ventes (pour conseillères)
  const chargerMesVentes = async (periodeChoisie = periode) => {
    try {
      setLoadingMesVentes(true);
      
      // 🔴 AMÉLIORATION : Logique robuste pour déterminer le nom d'utilisateur
      let nomUtilisateur = userName;
      
      // Essayer différentes sources pour le nom d'utilisateur
      if (!nomUtilisateur || nomUtilisateur === 'Utilisateur Test') {
        const storedUserName = localStorage.getItem('userName');
        const storedUser = localStorage.getItem('user');
        const storedFullName = localStorage.getItem('fullName');
        
        if (storedUserName) {
          nomUtilisateur = storedUserName;
        } else if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            nomUtilisateur = userData.nom || userData.prenom || userData.username || nomUtilisateur;
          } catch (e) {
            console.warn('⚠️ Erreur parsing user data du localStorage');
          }
        } else if (storedFullName) {
          nomUtilisateur = storedFullName;
        }
      }
      
      console.log(`🔄 Chargement MES ventes pour: "${nomUtilisateur}" (original: "${userName}"), période: ${periodeChoisie}`);
      console.log(`🔍 Sources testées: localStorage.userName="${localStorage.getItem('userName')}", localStorage.user="${localStorage.getItem('user')?.substring(0, 50)}..."`);
      
      const result = await getMesVentes(nomUtilisateur, periodeChoisie);
      
      if (result.success) {
        console.log(`✅ Mes ventes chargées:`, result.data);
        setMesVentesData(result.data);
        
        // Mettre à jour les stats avec mes données
        setStats(prev => ({
          ...prev,
          mesClients: result.data.monNombreFactures || 0, // Approximation
          mesFacturesImpayees: result.data.facturesEnAttente || 0,
          mesVentes: result.data.facturesPayees || 0,
          totalMesVentes: result.data.monTotalTTC || 0
        }));
      } else {
        console.error('❌ Erreur chargement mes ventes:', result.error);
      }
    } catch (error) {
      console.error('❌ Erreur chargement mes ventes:', error);
    } finally {
      setLoadingMesVentes(false);
    }
  };

  // Fonction pour charger les vrais rendez-vous à venir
  const chargerRendezVousAVenir = async () => {
    try {
      setLoadingRendezVous(true);
      console.log(`🔄 [TableauBord] Chargement rendez-vous à venir pour userRole: ${userRole}, userName: ${userName}`);
      
      const result = await getRendezVousAVenir(userRole, userName, 10);
      console.log(`📅 [TableauBord] Résultat API rendez-vous:`, result);
      
      if (result.success) {
        console.log(`✅ [TableauBord] ${result.data.length} rendez-vous chargés:`, result.data);
        setVraiesRendezVousAVenir(result.data);
      } else {
        console.error('❌ [TableauBord] Erreur chargement rendez-vous:', result.error);
        // En cas d'erreur, garder les données vides pour utiliser les données statiques
        setVraiesRendezVousAVenir([]);
      }
    } catch (error) {
      console.error('❌ [TableauBord] Erreur chargement rendez-vous à venir:', error);
      setVraiesRendezVousAVenir([]);
    } finally {
      setLoadingRendezVous(false);
    }
  };

  // Fonction pour charger les vraies activités récentes en temps réel
  const chargerActivitesRecentes = async () => {
    try {
      setLoadingActivites(true);
      console.log(`🔄 [TableauBord] Chargement activités récentes pour userRole: ${userRole}, userName: ${userName}`);
      console.log(`🔑 [TableauBord] Token présent: ${!!localStorage.getItem('token')}`);
      
      const result = await getActivitesRecentes(10);
      console.log(`📝 [TableauBord] Résultat API activités:`, result);
      
      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ [TableauBord] ${result.data.length} activités chargées:`, result.data);
        setVraiesActivitesRecentes(result.data);
        setDerniereMAJActivites(result.lastUpdate || new Date().toISOString());
        
        // Mettre à jour les activités statiques avec les vraies données
        if (userRole === 'directeur' || userRole === 'administrateur') {
          setActivitesRecentes(result.data);
        } else if (userRole === 'conseillere') {
          setMesActivitesRecentes(result.data);
        }
      } else {
        console.warn('⚠️ [TableauBord] Aucune activité récente ou erreur API:', result.message || 'Aucune donnée');
        console.log('📊 [TableauBord] Conservation des activités statiques pour l\'affichage');
        // En cas d'erreur, garder les données statiques - NE PAS les vider
        setVraiesActivitesRecentes([]);
        // Les activités statiques restent intactes pour l'affichage
      }
    } catch (error) {
      console.error('❌ [TableauBord] Erreur chargement activités récentes:', error);
      console.error('🔍 [TableauBord] Détails erreur:', error.message, error.stack);
      console.warn('⚠️ [TableauBord] Fallback: conservation des activités statiques');
      setVraiesActivitesRecentes([]);
      // Les activités statiques restent pour l'affichage
    } finally {
      setLoadingActivites(false);
    }
  };

  // Fonction pour charger les consultations effectuées
  const chargerConsultations = async (periodeChoisie = periode) => {
    try {
      setLoadingConsultations(true);
      console.log(`🔄 Chargement consultations pour: ${userName}, période: ${periodeChoisie}`);
      
      // 🔧 CORRECTION: Utiliser d'abord l'ancien système fiable
      const userId = localStorage.getItem('userId');
      const result = await getConsultations(userRole, userId, periodeChoisie, userName);
      
      console.log('📊 [TableauBord] Résultat consultations:', result);
      
      if (result.success) {
        console.log(`✅ Consultations chargées:`, result.data);
        setConsultationsData(result.data);
        
        // Mettre à jour les stats avec les données de consultations
        setStats(prev => ({
          ...prev,
          mesConsultations: result.data.totalConsultations || 0
        }));
      } else {
        console.error('❌ Erreur chargement consultations:', result.error);
        // Fallback avec valeurs par défaut
        setConsultationsData({
          totalConsultations: 0,
          consultationsRecentes: [],
          evolution: '+0%'
        });
        setStats(prev => ({
          ...prev,
          mesConsultations: 0
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement consultations:', error);
      // Fallback avec valeurs par défaut
      setConsultationsData({
        totalConsultations: 0,
        consultationsRecentes: [],
        evolution: '+0%'
      });
      setStats(prev => ({
        ...prev,
        mesConsultations: 0
      }));
    } finally {
      setLoadingConsultations(false);
    }
  };

  // Fonction pour charger les statistiques dynamiques depuis l'API
  const chargerStatistiquesDynamiques = async (nouvellePeriode) => {
    try {
      console.log(`🔄 [TableauBord] Chargement des statistiques GLOBALES (tous utilisateurs) pour la période: ${nouvellePeriode}`);
      
      const result = await statisticsService.getGlobalStatisticsWithFallback(nouvellePeriode);
      
      console.log(`📊 [TableauBord] Statistiques GLOBALES reçues:`, result);
      
      // Calculer les totaux pour affichage dans la console
      const totalLeads = result.leadsParSource ? result.leadsParSource.reduce((sum, item) => sum + item.valeur, 0) : 0;
      const totalRevenus = result.revenusParMois ? result.revenusParMois.reduce((sum, item) => sum + item.valeur, 0) : 0;
      const totalDossiers = result.dossiersParType ? result.dossiersParType.reduce((sum, item) => sum + item.valeur, 0) : 0;
      
      console.log(`🎯 [TableauBord] Résumé statistiques GLOBALES ${nouvellePeriode}:`);
      console.log(`   👥 Total leads (tous utilisateurs): ${totalLeads}`);
      console.log(`   💰 Total revenus (tous utilisateurs): ${totalRevenus.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`);
      console.log(`   📁 Total dossiers (tous utilisateurs): ${totalDossiers}`);
      
      // Mettre à jour les données des graphiques avec les vraies données globales
      setGraphData({
        leadsParSource: result.leadsParSource || [],
        revenusParMois: result.revenusParMois || [],
        dossiersParType: result.dossiersParType || [],
        ventesParConseillere: result.ventesParConseillere || []
      });
      
      console.log(`✅ [TableauBord] Graphiques mis à jour avec les données GLOBALES dynamiques`);
    } catch (error) {
      console.error('❌ [TableauBord] Erreur lors du chargement des statistiques globales:', error);
      
      // En cas d'erreur, utiliser les données statiques comme fallback
      const fallbackData = statisticsService.getFallbackData(nouvellePeriode);
      setGraphData({
        leadsParSource: fallbackData.leadsParSource || [],
        revenusParMois: fallbackData.revenusParMois || [],
        dossiersParType: fallbackData.dossiersParType || [],
        ventesParConseillere: fallbackData.ventesParConseillere || []
      });
      
      console.log(`⚡ [TableauBord] Utilisation des données de fallback`);
    }
  };

  // Fonction pour changer la période des statistiques
  const changerPeriode = async (nouvellePeriode) => {
    setPeriode(nouvellePeriode);
    
    // Charger les statistiques dynamiques pour les graphiques
    await chargerStatistiquesDynamiques(nouvellePeriode);
    
    // Charger les données appropriées selon le rôle
    if (userRole === 'conseillere') {
      chargerMesVentes(nouvellePeriode);
      chargerConsultations(nouvellePeriode);
    } else {
      chargerVraiesVentes(nouvellePeriode);
    }
    
    // Charger aussi les rendez-vous à venir et les activités récentes
    chargerRendezVousAVenir();
    chargerActivitesRecentes();
  };
  
  // Initialiser les données des graphiques au chargement du composant
  useEffect(() => {
    // Charger les statistiques dynamiques pour la période initiale
    chargerStatistiquesDynamiques(periode);
    
    // Charger les bonnes données selon le rôle au démarrage
    if (userRole === 'conseillere') {
      chargerMesVentes(periode);
      chargerConsultations(periode);
    } else {
      chargerVraiesVentes(periode);
    }
    
    // Charger les rendez-vous à venir et les activités récentes
    chargerRendezVousAVenir();
    chargerActivitesRecentes();
  }, [userRole, userName]); // Dépendances pour recharger si le rôle/nom change
  
  // Récupération des statistiques depuis l'API à chaque changement de période
  useEffect(() => {
    currentPeriodeRef.current = periode;
    let isMounted = true;

    const fetchStats = async () => {
      try {
        console.log('🔍 [TableauBord] Récupération stats pour userRole:', userRole, 'période:', periode);
        const res = await getDashboardStats(periode);
        if (!isMounted) return;

        const data = res?.data ?? {};
        console.log('📊 [TableauBord] Données reçues de l\'API:', data);

        // Si la période a changé pendant la requête, on ignore le résultat
        if (currentPeriodeRef.current !== periode) return;

        console.log('✏️ [TableauBord] Mise à jour stats pour userRole:', userRole);
        setStats(prev => ({
          ...prev,
          totalLeads: data.totalLeads ?? 0,
          totalClients: data.totalClients ?? 0,
          // Pour les conseillères, mettre à jour mesLeads et mesClients
          mesLeads: userRole === 'conseillere' ? (data.totalLeads ?? 0) : prev.mesLeads,
          mesClients: userRole === 'conseillere' ? (data.totalClients ?? 0) : prev.mesClients,
          mesDossiers: userRole === 'conseillere' ? (data.dossiersActifs ?? 0) : prev.mesDossiers,
          mesFacturesImpayees: userRole === 'conseillere' ? (data.facturesEnAttente ?? 0) : prev.mesFacturesImpayees,
          dossiersEnCours: data.dossiersActifs ?? 0,
          facturesEnAttente: data.facturesEnAttente ?? 0,
          montantFacturesEnAttente: data.montantFacturesEnAttente ?? 0,
          evolutionLeads: prev.totalLeads ? Math.round(((data.totalLeads ?? 0 - prev.totalLeads) / prev.totalLeads) * 100) : 0,
          evolutionClients: prev.totalClients ? Math.round(((data.totalClients ?? 0 - prev.totalClients) / prev.totalClients) * 100) : 0
        }));
      } catch (err) {
        console.error('Erreur récupération stats:', err);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [periode, userRole]); // Ajouter userRole aux dépendances

  // Fonction pour recharger les statistiques depuis l'API
  const rechargerStatistiques = async () => {
    try {
      console.log('🔄 [TableauBord] Rechargement stats pour userRole:', userRole, 'période:', periode);
      const res = await getDashboardStats(periode);
      const data = res?.data ?? {};
      console.log('📊 [TableauBord] Données rechargées de l\'API:', data);

      setStats(prev => ({
        ...prev,
        totalLeads: data.totalLeads ?? 0,
        totalClients: data.totalClients ?? 0,
        // Pour les conseillères, mettre à jour mesLeads et mesClients
        mesLeads: userRole === 'conseillere' ? (data.totalLeads ?? 0) : prev.mesLeads,
        mesClients: userRole === 'conseillere' ? (data.totalClients ?? 0) : prev.mesClients,
        mesDossiers: userRole === 'conseillere' ? (data.dossiersActifs ?? 0) : prev.mesDossiers,
        mesFacturesImpayees: userRole === 'conseillere' ? (data.facturesEnAttente ?? 0) : prev.mesFacturesImpayees,
        dossiersEnCours: data.dossiersActifs ?? 0,
        facturesEnAttente: data.facturesEnAttente ?? 0,
        montantFacturesEnAttente: data.montantFacturesEnAttente ?? 0,
        evolutionLeads: prev.totalLeads ? Math.round(((data.totalLeads ?? 0 - prev.totalLeads) / prev.totalLeads) * 100) : 0,
        evolutionClients: prev.totalClients ? Math.round(((data.totalClients ?? 0 - prev.totalClients) / prev.totalClients) * 100) : 0
      }));
      
      console.log('[Dashboard] Statistiques rechargées:', data);
    } catch (err) {
      console.error('[Dashboard] Erreur rechargement stats:', err);
    }
  };

  // Écoute des évènements temps réel
  useEffect(() => {
    const socket = connectSocket();

    socket.on('leadCreated', () => {
      console.log('[Dashboard] Lead créé - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('leadUpdated', () => {
      console.log('[Dashboard] Lead mis à jour - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('clientCreated', () => {
      console.log('[Dashboard] Client créé - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('clientUpdated', () => {
      console.log('[Dashboard] Client mis à jour - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('dossierCreated', () => {
      console.log('[Dashboard] Dossier créé - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('dossierUpdated', () => {
      console.log('[Dashboard] Dossier mis à jour - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('factureCreated', () => {
      console.log('[Dashboard] Facture créée - rechargement des activités et ventes');
      chargerActivitesRecentes();
      // 🔴 NOUVEAU : Recharger aussi les ventes pour le dashboard
      if (userRole === 'conseillere') {
        chargerMesVentes(periode);
      } else {
        chargerVraiesVentes(periode);
      }
      rechargerStatistiques();
    });

    socket.on('factureUpdated', () => {
      console.log('[Dashboard] Facture mise à jour - rechargement des activités et ventes');
      chargerActivitesRecentes();
      // 🔴 NOUVEAU : Recharger aussi les ventes pour le dashboard
      if (userRole === 'conseillere') {
        chargerMesVentes(periode);
      } else {
        chargerVraiesVentes(periode);
      }
      rechargerStatistiques();
    });

    socket.on('rendezVousCreated', () => {
      console.log('[Dashboard] Rendez-vous créé - rechargement des activités');
      chargerActivitesRecentes();
      chargerRendezVousAVenir();
    });

    socket.on('leadDeleted', () => {
      console.log('[Dashboard] Lead supprimé - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    socket.on('clientDeleted', () => {
      console.log('[Dashboard] Client supprimé - rechargement des stats et activités');
      rechargerStatistiques();
      chargerActivitesRecentes();
    });

    return () => {
      socket.off('leadCreated');
      socket.off('leadUpdated');
      socket.off('clientCreated');
      socket.off('clientUpdated');
      socket.off('dossierCreated');
      socket.off('dossierUpdated');
      socket.off('factureCreated');
      socket.off('factureUpdated');
      socket.off('rendezVousCreated');
      socket.off('leadDeleted');
      socket.off('clientDeleted');
    };
  }, [periode]);

  // Rafraîchissement automatique des activités récentes toutes les 2 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('🔄 [Dashboard] Rafraîchissement automatique des activités récentes');
      chargerActivitesRecentes();
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [userRole, userName]);
  
  // Simuler un graphique à barres simple avec CSS
  const renderBarChart = (data, maxHeight = 150) => {
    const maxValue = Math.max(...data.map(item => item.valeur));
    
    return (
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-container">
            <div 
              className="bar" 
              style={{ 
                height: `${(item.valeur / maxValue) * maxHeight}px` 
              }}
            >
              <span className="bar-value">{item.valeur}</span>
            </div>
            <div className="bar-label">{item.source || item.mois || item.type || item.conseillere}</div>
          </div>
        ))}
      </div>
    );
  };

  // Fonction pour rediriger vers la page correspondante lors du clic sur un compteur
  const naviguerVers = (destination) => {
    console.log(`Navigation vers: ${destination}`);
    // Cette fonction sera connectée au système de navigation du Dashboard
    if (typeof onNavigate === 'function') {
      onNavigate(destination);
    }
  };

  // Fonction pour récupérer et afficher les informations d'un client ou lead
  const afficherInfosContact = async (contactId, contactNom, contactType = 'client') => {
    try {
      setLoadingClient(true);
      console.log(`🔄 [TableauBord] Récupération des informations du ${contactType} ${contactId} - ${contactNom}`);
      
      // Réinitialiser les états
      setSelectedClient(null);
      setSelectedLead(null);
      setModalType(contactType);
      
      if (contactType === 'lead' || (!contactId && contactType !== 'client')) {
        // C'est un lead ou pas d'ID (donc probablement un lead)
        console.log('🎯 [TableauBord] Recherche dans les leads...');
        
        const allLeadsResponse = await getAllLeads();
        if (allLeadsResponse.success && allLeadsResponse.data && allLeadsResponse.data.leads) {
          const lead = allLeadsResponse.data.leads.find(l => 
            `${l.prenom} ${l.nom}` === contactNom || 
            `${l.nom} ${l.prenom}` === contactNom ||
            (contactId && l.id === parseInt(contactId))
          );
          
          if (lead) {
            setSelectedLead(lead);
            setModalType('lead');
            setShowClientModal(true);
            console.log(`✅ [TableauBord] Lead trouvé:`, lead);
            return;
          }
        }
        
        // Si pas trouvé dans les leads et pas d'ID, chercher dans les clients
        if (!contactId) {
          console.log('🔄 [TableauBord] Lead non trouvé, recherche dans les clients...');
          contactType = 'client';
        }
      }
      
      if (contactType === 'client') {
        if (!contactId) {
          console.warn('⚠️ [TableauBord] Aucun ID fourni, tentative de recherche par nom dans les clients');
          // Si pas d'ID, essayer de trouver le client par nom
          const allClientsResponse = await clientsAPI.getAllClients();
          if (allClientsResponse.success && allClientsResponse.data && allClientsResponse.data.clients) {
            const client = allClientsResponse.data.clients.find(c => 
              `${c.prenom} ${c.nom}` === contactNom || 
              `${c.nom} ${c.prenom}` === contactNom
            );
            
            if (client) {
              setSelectedClient(client);
              setModalType('client');
              setShowClientModal(true);
              console.log(`✅ [TableauBord] Client trouvé par nom:`, client);
              return;
            }
          }
        } else {
          // Récupérer le client par ID
          const response = await clientsAPI.getClientById(contactId);
          
          if (response.success && response.data) {
            setSelectedClient(response.data);
            setModalType('client');
            setShowClientModal(true);
            console.log(`✅ [TableauBord] Informations client récupérées:`, response.data);
            return;
          }
        }
      }
      
      // Si rien n'est trouvé
      console.warn(`⚠️ [TableauBord] Contact "${contactNom}" non trouvé`);
      alert(`Contact "${contactNom}" non trouvé`);
      
    } catch (error) {
      console.error('❌ [TableauBord] Erreur récupération contact:', error);
      alert('Erreur lors de la récupération des informations du contact');
    } finally {
      setLoadingClient(false);
    }
  };

  // Fonction pour fermer le modal client/lead
  const fermerModalClient = () => {
    setShowClientModal(false);
    setSelectedClient(null);
    setSelectedLead(null);
    setModalType('client');
  };
  
  // Composant pour les compteurs principaux
  const StatCard = ({ icon, title, value, subvalue, evolution, onClick, className = '' }) => {
    const getEvolutionClass = () => {
      if (typeof evolution === 'string') { // S'assurer que evolution est une chaîne
        if (evolution.includes('+')) return 'positive';
        if (evolution.includes('-')) return 'negative';
      }
      return 'neutral'; // Retourner neutral si evolution n'est pas une chaîne ou ne contient pas +/-
    };
    
    const getEvolutionSymbol = () => {
      if (typeof evolution === 'string') { // S'assurer que evolution est une chaîne
        if (evolution.includes('+')) return '▲';
        if (evolution.includes('-')) return '▼';
      }
      return '◆'; // Retourner ◆ si evolution n'est pas une chaîne ou ne contient pas +/-
    };
    
    return (
      <div className={`stat-card ${onClick ? 'clickable' : ''} ${className}`} onClick={onClick}>
        <div className="stat-card-header"> {/* Nouveau conteneur pour icône et titre de la carte */}
          <div className={`stat-icon ${icon}-icon`}>{icon}</div>
          <div className="stat-info-title"><h4>{title}</h4></div> {/* Conteneur séparé pour le titre de la carte */}
        </div>
        <div className="stat-info-details"> {/* Conteneur pour la valeur, sous-valeur et évolution */}
          <p className="stat-value">{value}</p>
          {subvalue && <p className="stat-subvalue">{subvalue}</p>}
          {evolution && (
            <p className={`stat-evolution ${getEvolutionClass()}`}>
              {evolution} <span>{getEvolutionSymbol()}</span>
            </p>
          )}
        </div>
      </div>
    );
  };  // Rendu du tableau de bord pour les directeurs et administrateurs
  const renderTableauBordDirecteur = () => {
    return (
      <>
        <div className="stats-grid">
          {/* Compteurs principaux cliquables */}
          <div className="stats-section compteurs-principaux">
            <h3>Vue d'ensemble</h3>
            <div className="stats-cards">
              <StatCard 
                icon="👥" 
                title="Total Clients" 
                value={stats.totalClients} 
                evolution={`${stats.evolutionClients >= 0 ? '+' : ''}${stats.evolutionClients}%`}
                onClick={() => naviguerVers('clients')}
                className="clickable"
              />
              <StatCard 
                icon="👤" 
                title="Total Leads" 
                value={stats.totalLeads} 
                evolution={`${stats.evolutionLeads >= 0 ? '+' : ''}${stats.evolutionLeads}%`}
                onClick={() => naviguerVers('leads')}
                className="clickable"
              />
              <StatCard 
                icon="📁" 
                title="Dossiers Actifs" 
                value={stats.dossiersEnCours} 
                evolution={`+${stats.dossiersEnCours > 0 ? '3%' : '0%'}`}
                onClick={() => naviguerVers('dossiers')}
                className="clickable"
              />
              <StatCard 
                icon="💰" 
                title="Factures Impayées" 
                value={stats.facturesEnAttente} 
                subvalue={formaterMontant(stats.montantFacturesEnAttente)}
                evolution={`+${stats.facturesEnAttente > 0 ? '15%' : '0%'}`}
                onClick={() => naviguerVers('facturation')}
                className="clickable"
              />
            </div>
          </div>
          
          {/* Ventes par conseillère */}
          <div className="stats-section ventes-conseilleres">
            <div className="section-header">
              <h3>Ventes par Conseillère</h3>
              {loadingVentes && <span className="loading-indicator">🔄 Chargement...</span>}
            </div>
            <div className="stats-cards">
              {vraiesVentesConseilleres.length > 0 ? (
                // Afficher les vraies données
                vraiesVentesConseilleres.map((item, index) => (
                  <StatCard 
                    key={index}
                    icon="💵" 
                    title={item.conseillere} 
                    value={`${item.valeur.toFixed(2)} $ TTC`}
                    subvalue={`${item.nombreFactures} facture(s)`}
                    evolution={`${item.evolution >= 0 ? '+' : ''}${item.evolution}%`}
                    onClick={() => naviguerVers('facturation')}
                  />
                ))
              ) : (
                // Afficher les données fictives si pas de vraies données
                stats.ventesParConseillere.map((item, index) => (
                  <StatCard 
                    key={index}
                    icon="💵" 
                    title={item.conseillere} 
                    value={formaterMontant(item.valeur)} 
                    evolution="+7%" 
                    onClick={() => naviguerVers('facturation')}
                  />
                ))
              )}
              <StatCard 
                icon="💵" 
                title="Total Bureau" 
                value={vraiesVentesConseilleres.length > 0 ? 
                  `${vraiesVentesConseilleres.reduce((sum, v) => sum + v.valeur, 0).toFixed(2)} $ TTC` : 
                  formaterMontant(stats.montantFacturesPaye)
                }
                subvalue={vraiesVentesConseilleres.length > 0 ? 
                  `${vraiesVentesConseilleres.reduce((sum, v) => sum + v.nombreFactures, 0)} facture(s)` : 
                  null
                }
                evolution="+7%" 
                onClick={() => naviguerVers('facturation')}
                className="total-bureau"
              />
            </div>
          </div>
        </div>
        
        <div className="bottom-grid">
          {/* Rendez-vous à venir */}
          <div className="rendez-vous-section">
            <div className="section-header">
              <h3>Rendez-vous à Venir</h3>
              {loadingRendezVous && <span className="loading-indicator">🔄 Chargement...</span>}
            </div>
            <div className="rendez-vous-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Conseillère</th>
                  </tr>
                </thead>
                <tbody>
                  {(vraiesRendezVousAVenir.length > 0 ? vraiesRendezVousAVenir : rendezVousAVenir).map(rdv => (
                    <tr key={rdv.id}>
                      <td>
                        <span 
                          className="client-link" 
                          onClick={() => {
                            // Déterminer le type selon les données disponibles
                            const contactType = rdv.client_type || (rdv.client_id ? 'client' : 'lead');
                            const contactId = rdv.client_id;
                            const contactNom = rdv.client || rdv.client_nom;
                            afficherInfosContact(contactId, contactNom, contactType);
                          }}
                          style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'underline' }}
                          title={`Cliquer pour voir les informations du ${rdv.client_type === 'lead' ? 'lead' : 'client'}`}
                        >
                          {loadingClient ? '🔄 Chargement...' : (
                            <span>
                              {rdv.client_type === 'lead' ? '🎯 ' : '👤 '}{rdv.client || rdv.client_nom}
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{rdv.date || rdv.date_rdv}</td>
                      <td>{rdv.type || rdv.type_rdv}</td>
                      <td>{rdv.conseillere || rdv.conseillere_nom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(vraiesRendezVousAVenir.length === 0 && rendezVousAVenir.length === 0) && !loadingRendezVous && (
                <div className="no-data">
                  <p>Aucun rendez-vous à venir</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Activités récentes */}
          <div className="activites-section">
            <div className="section-header">
              <h3>Activités Récentes</h3>
              {loadingActivites && <span className="loading-indicator">🔄 Chargement...</span>}
              {derniereMAJActivites && !loadingActivites && (
                <span className="last-update" title="Dernière mise à jour">
                  🕒 {new Date(derniereMAJActivites).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            <div className="activites-list">
              {(vraiesActivitesRecentes.length > 0 ? vraiesActivitesRecentes : activitesRecentes)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(activite => (
                <div key={activite.id} className="activite-item">
                  <div className="activite-icon">{getIconeActivite(activite.type)}</div>
                  <div className="activite-content">
                    <p className="activite-description">{activite.description}</p>
                    <div className="activite-meta">
                      <span className="activite-user">{activite.utilisateur}</span>
                      <span className="activite-date">{activite.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(vraiesActivitesRecentes.length === 0 && activitesRecentes.length === 0) && !loadingActivites && (
                <div className="no-data">
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Graphiques et statistiques supplémentaires */}
        <div className="charts-grid">
          <div className="chart-section">
            <h3>Leads par Source</h3>
            <div className="filter-buttons">
              <button className={periode === 'jour' ? 'active' : ''} onClick={() => changerPeriode('jour')}>Jour</button>
              <button className={periode === 'semaine' ? 'active' : ''} onClick={() => changerPeriode('semaine')}>Semaine</button>
              <button className={periode === 'mois' ? 'active' : ''} onClick={() => changerPeriode('mois')}>Mois</button>
              <button className={periode === 'annee' ? 'active' : ''} onClick={() => changerPeriode('annee')}>Année</button>
            </div>
            {renderBarChart(graphData.leadsParSource)}
          </div>
          
          <div className="chart-section">
            <h3>Revenus par Mois</h3>
            <div className="filter-buttons">
              <button className={periode === 'jour' ? 'active' : ''} onClick={() => changerPeriode('jour')}>Jour</button>
              <button className={periode === 'semaine' ? 'active' : ''} onClick={() => changerPeriode('semaine')}>Semaine</button>
              <button className={periode === 'mois' ? 'active' : ''} onClick={() => changerPeriode('mois')}>Mois</button>
              <button className={periode === 'annee' ? 'active' : ''} onClick={() => changerPeriode('annee')}>Année</button>
            </div>
            {renderBarChart(graphData.revenusParMois)}
          </div>
          
          <div className="chart-section">
            <h3>Dossiers par Type</h3>
            <div className="filter-buttons">
              <button className={periode === 'jour' ? 'active' : ''} onClick={() => changerPeriode('jour')}>Jour</button>
              <button className={periode === 'semaine' ? 'active' : ''} onClick={() => changerPeriode('semaine')}>Semaine</button>
              <button className={periode === 'mois' ? 'active' : ''} onClick={() => changerPeriode('mois')}>Mois</button>
              <button className={periode === 'annee' ? 'active' : ''} onClick={() => changerPeriode('annee')}>Année</button>
            </div>
            {renderBarChart(graphData.dossiersParType)}
          </div>
        </div>
      </>
    );
  };

  // Rendu du tableau de bord pour les conseillères
  const renderTableauBordConseillere = () => {
    return (
      <>
        <div className="stats-grid">
          {/* Compteurs personnels cliquables */}
          <div className="stats-section">
            <h3>Mes Statistiques</h3>
            <div className="stats-cards">
              <StatCard 
                icon="👥" 
                title="Mes Clients" 
                value={stats.mesClients} 
                evolution="+5%" 
                onClick={() => naviguerVers('clients')}
              />
              <StatCard 
                icon="👤" 
                title="Mes Leads" 
                value={stats.mesLeads} 
                evolution="+3%" 
                onClick={() => naviguerVers('leads')}
              />
              <StatCard 
                icon="📁" 
                title="Mes Dossiers" 
                value={stats.mesDossiers} 
                evolution="+2%" 
                onClick={() => naviguerVers('dossiers')}
              />
              <StatCard 
                icon="💰" 
                title="Factures Impayées" 
                value={stats.mesFacturesImpayees} 
                evolution="+1%" 
                onClick={() => naviguerVers('facturation')}
              />
            </div>
          </div>
          
          {/* Mes ventes réelles */}
          <div className="stats-section">
            <div className="section-header">
              <h3>Mes Ventes</h3>
              {(loadingMesVentes || loadingConsultations) && <span className="loading-indicator">🔄 Chargement...</span>}
            </div>
            <div className="stats-cards">
              <StatCard 
                icon="💰" 
                title="Mon Total TTC" 
                value={`${mesVentesData.monTotalTTC.toFixed(2)} $`}
                subvalue={`${mesVentesData.monNombreFactures} facture(s)`}
                evolution="+12%" 
                onClick={() => naviguerVers('facturation')}
              />
              <StatCard 
                icon="✅" 
                title="Factures Payées" 
                value={mesVentesData.facturesPayees || 0} 
                evolution="+8%" 
                onClick={() => naviguerVers('facturation')}
              />
              <StatCard 
                icon="⏳" 
                title="En Attente" 
                value={mesVentesData.facturesEnAttente || 0} 
                evolution="+5%" 
                onClick={() => naviguerVers('facturation')}
              />
              <StatCard 
                icon="🎯" 
                title="Consultations" 
                value={consultationsData.totalConsultations || 0} 
                evolution={consultationsData.evolution || '+0%'} 
                onClick={() => naviguerVers('leads')}
              />
            </div>
          </div>
        </div>
        
        <div className="bottom-grid">
          {/* Mes rendez-vous à venir */}
          <div className="rendez-vous-section">
            <div className="section-header">
              <h3>Mes Rendez-vous à Venir</h3>
              {loadingRendezVous && <span className="loading-indicator">🔄 Chargement...</span>}
            </div>
            <div className="rendez-vous-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {(vraiesRendezVousAVenir.length > 0 ? vraiesRendezVousAVenir : mesRendezVousAVenir).map(rdv => (
                    <tr key={rdv.id}>
                      <td>
                        <span 
                          className="client-link" 
                          onClick={() => {
                            // Déterminer le type selon les données disponibles
                            const contactType = rdv.client_type || (rdv.client_id ? 'client' : 'lead');
                            const contactId = rdv.client_id;
                            const contactNom = rdv.client || rdv.client_nom;
                            afficherInfosContact(contactId, contactNom, contactType);
                          }}
                          style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'underline' }}
                          title={`Cliquer pour voir les informations du ${rdv.client_type === 'lead' ? 'lead' : 'client'}`}
                        >
                          {loadingClient ? '🔄 Chargement...' : (
                            <span>
                              {rdv.client_type === 'lead' ? '🎯 ' : '👤 '}{rdv.client || rdv.client_nom}
                            </span>
                          )}
                        </span>
                      </td>
                      <td>{rdv.date || rdv.date_rdv}</td>
                      <td>{rdv.type || rdv.type_rdv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(vraiesRendezVousAVenir.length === 0 && mesRendezVousAVenir.length === 0) && !loadingRendezVous && (
                <div className="no-data">
                  <p>Aucun rendez-vous à venir</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mes activités récentes */}
          <div className="activites-section">
            <div className="section-header">
              <h3>Mes Activités Récentes</h3>
              {loadingActivites && <span className="loading-indicator">🔄 Chargement...</span>}
              {derniereMAJActivites && !loadingActivites && (
                <span className="last-update" title="Dernière mise à jour">
                  🕒 {new Date(derniereMAJActivites).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            <div className="activites-list">
              {(vraiesActivitesRecentes.length > 0 ? vraiesActivitesRecentes : mesActivitesRecentes)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(activite => (
                <div key={activite.id} className="activite-item">
                  <div className="activite-icon">{getIconeActivite(activite.type)}</div>
                  <div className="activite-content">
                    <p className="activite-description">{activite.description}</p>
                    <div className="activite-meta">
                      <span className="activite-date">{activite.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(vraiesActivitesRecentes.length === 0 && mesActivitesRecentes.length === 0) && !loadingActivites && (
                <div className="no-data">
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mes factures */}
        <div className="factures-section">
          <div className="section-header">
            <h3>Mes Factures</h3>
            <div className="filter-buttons">
              <button className={periode === 'jour' ? 'active' : ''} onClick={() => changerPeriode('jour')}>Jour</button>
              <button className={periode === 'semaine' ? 'active' : ''} onClick={() => changerPeriode('semaine')}>Semaine</button>
              <button className={periode === 'mois' ? 'active' : ''} onClick={() => changerPeriode('mois')}>Mois</button>
            </div>
          </div>
          <div className="factures-list">
            {mesVentesData.mesFactures && mesVentesData.mesFactures.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Montant TTC</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {mesVentesData.mesFactures.map(facture => (
                    <tr key={facture.id}>
                      <td>{facture.numero}</td>
                      <td>{facture.client}</td>
                      <td>{facture.montantTTC.toFixed(2)} $</td>
                      <td>
                        <span className={`statut-badge ${facture.statut === 'payee' ? 'statut-success' : 'statut-warning'}`}>
                          {facture.statut === 'payee' ? 'Payée' : 'En attente'}
                        </span>
                      </td>
                      <td>{new Date(facture.dateEmission).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>Aucune facture pour cette période</p>
                {loadingMesVentes && <p>🔄 Chargement en cours...</p>}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // Rendu du tableau de bord pour le comptable
  const renderTableauBordComptable = () => {
    return (
      <>
        <div className="stats-grid">
          {/* Compteurs financiers */}
          <div className="stats-section">
            <h3>Aperçu Financier</h3>
            <div className="stats-cards">
              <StatCard 
                icon="💵" 
                title="Ventes du Mois" 
                value={formaterMontant(stats.totalVentes)} 
                evolution="+12%" 
              />
              <StatCard 
                icon="💰" 
                title="Paiements Récents" 
                value={formaterMontant(stats.paiementsRecents)} 
                evolution="+8%" 
              />
              <StatCard 
                icon="📊" 
                title="Factures en Attente" 
                value={stats.facturesEnAttente} 
                subvalue={formaterMontant(stats.montantFacturesEnAttente)}
                evolution="+15%" 
                onClick={() => naviguerVers('facturation')}
              />
              <StatCard 
                icon="💸" 
                title="Charges à Venir" 
                value={stats.chargesAVenir} 
                subvalue={formaterMontant(stats.montantChargesAVenir)}
                evolution="+5%" 
                onClick={() => naviguerVers('charges')}
              />
            </div>
          </div>
        </div>
        
        <div className="bottom-grid">
          {/* Dernières factures */}
          <div className="factures-section">
            <h3>Dernières Factures</h3>
            <div className="factures-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {dernieresFactures.map(facture => (
                    <tr key={facture.id}>
                      <td>{facture.id}</td>
                      <td>{facture.client}</td>
                      <td>{formaterMontant(facture.montant)}</td>
                      <td>{facture.date}</td>
                      <td>
                        <span className={`statut-badge ${facture.statut === 'Payée' ? 'statut-success' : 'statut-warning'}`}>
                          {facture.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Paiements récents */}
          <div className="paiements-section">
            <h3>Paiements Récents</h3>
            <div className="paiements-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Facture</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Méthode</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsRecents.map(paiement => (
                    <tr key={paiement.id}>
                      <td>{paiement.id}</td>
                      <td>{paiement.facture}</td>
                      <td>{paiement.client}</td>
                      <td>{formaterMontant(paiement.montant)}</td>
                      <td>{paiement.date}</td>
                      <td>{paiement.methode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Charges */}
        <div className="charges-section">
          <h3>Charges</h3>
          <div className="charges-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {charges.map(charge => (
                  <tr key={charge.id}>
                    <td>{charge.id}</td>
                    <td>{charge.description}</td>
                    <td>{formaterMontant(charge.montant)}</td>
                    <td>{charge.date}</td>
                    <td>
                      <span className={`statut-badge ${charge.statut === 'Payée' ? 'statut-success' : 'statut-warning'}`}>
                        {charge.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // Rendu du tableau de bord pour la secrétaire
  const renderTableauBordSecretaire = () => {
    return (
      <>
        <div className="stats-grid">
          {/* Compteurs pour la secrétaire */}
          <div className="stats-section">
            <h3>Aperçu du Jour</h3>
            <div className="stats-cards">
              <StatCard 
                icon="📅" 
                title="Rendez-vous Aujourd'hui" 
                value={stats.rendezVousJour} 
                evolution="+2%" 
                onClick={() => naviguerVers('rendez-vous')}
              />
              <StatCard 
                icon="👤" 
                title="Nouveaux Leads" 
                value={stats.nouveauxLeads} 
                evolution="+5%" 
                onClick={() => naviguerVers('leads')}
              />
              <StatCard 
                icon="📋" 
                title="Leads à Traiter" 
                value={stats.leadsATraiter} 
                evolution="+3%" 
                onClick={() => naviguerVers('leads')}
              />
            </div>
          </div>
        </div>
        
        <div className="bottom-grid">
          {/* Rendez-vous du jour */}
          <div className="rendez-vous-section">
            <h3>Rendez-vous du Jour</h3>
            <div className="rendez-vous-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Heure</th>
                    <th>Type</th>
                    <th>Conseillère</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVousJour.map(rdv => (
                    <tr key={rdv.id}>
                      <td>{rdv.client}</td>
                      <td>{rdv.heure}</td>
                      <td>{rdv.type}</td>
                      <td>{rdv.conseillere}</td>
                      <td>
                        <span className={`statut-badge ${rdv.statut === 'Terminé' ? 'statut-success' : rdv.statut === 'En cours' ? 'statut-info' : 'statut-warning'}`}>
                          {rdv.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Nouveaux leads */}
          <div className="leads-section">
            <h3>Nouveaux Leads</h3>
            <div className="leads-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Source</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {nouveauxLeads.map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.nom}</td>
                      <td>{lead.email}</td>
                      <td>{lead.telephone}</td>
                      <td>{lead.source}</td>
                      <td>{lead.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Rendu principal du tableau de bord selon le rôle
  return (
    <div className="tableau-bord-container">
      {/* En-tête avec titre et sélection de période */}
      <div className="header-container">
        <div className="title-container">
          <h1>{titrePage}</h1> {/* Utilisation de l'état titrePage pour un titre dynamique */}
          <span className="vue-globale-badge" title="Les statistiques affichent les données de tous les utilisateurs">
            🌍 Vue Globale
          </span>
        </div>
        <div className="periode-selector">
          <button 
            className={`btn-periode ${periode === 'jour' ? 'active' : ''}`}
            onClick={() => changerPeriode('jour')}
          >
            Jour
          </button>
          <button 
            className={`btn-periode ${periode === 'semaine' ? 'active' : ''}`}
            onClick={() => changerPeriode('semaine')}
          >
            Semaine
          </button>
          <button 
            className={`btn-periode ${periode === 'mois' ? 'active' : ''}`}
            onClick={() => changerPeriode('mois')}
          >
            Mois
          </button>
          <button 
            className={`btn-periode ${periode === 'trimestre' ? 'active' : ''}`}
            onClick={() => changerPeriode('trimestre')}
          >
            Trimestre
          </button>
          <button 
            className={`btn-periode ${periode === 'annee' ? 'active' : ''}`}
            onClick={() => changerPeriode('annee')}
          >
            Année
          </button>
        </div>
      </div>
      
      {userRole === 'administrateur' && renderTableauBordDirecteur()}
      {userRole === 'directeur' && renderTableauBordDirecteur()}
      {userRole === 'conseillere' && renderTableauBordConseillere()}
      {userRole === 'comptable' && renderTableauBordComptable()}
      {userRole === 'secretaire' && renderTableauBordSecretaire()}

      {/* Modal pour afficher les informations du client ou lead */}
      {showClientModal && (selectedClient || selectedLead) && (
        <ClientDetailModal
          client={modalType === 'client' ? selectedClient : null}
          lead={modalType === 'lead' ? selectedLead : null}
          modalType={modalType}
          isOpen={showClientModal}
          onClose={fermerModalClient}
          readOnly={true}
          showAll={true}
        />
      )}
    </div>
  );
}

export default TableauBord;
