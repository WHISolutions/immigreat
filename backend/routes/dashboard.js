const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op, Sequelize } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Fonction utilitaire pour obtenir la plage de dates selon la période
function getDateRange(periode) {
  const now = new Date();
  let start, end;

  switch (periode) {
    case 'jour':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'semaine': {
      const day = now.getDay(); // 0 (dim) .. 6 (sam)
      const diffToMonday = (day === 0 ? -6 : 1) - day; // ramener à lundi
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'trimestre': {
      const currentQuarter = Math.floor(now.getMonth() / 3); // 0..3
      const startMonth = currentQuarter * 3;
      start = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999); // dernier jour du trimestre
      break;
    }
    case 'annee':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'mois':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }
  return { start, end };
}

// Fonction pour calculer le montant TTC selon la monnaie
// IMPORTANT: Les montants en base sont déjà TTC, cette fonction peut servir pour les nouveaux calculs
function calculerMontantTTC(montantHT, monnaie = 'CAD') {
  const ht = parseFloat(montantHT) || 0;
  
  // Taux de TVA selon la monnaie
  let tauxTVA;
  if (monnaie === 'MAD') {
    tauxTVA = 1.2; // 20% de TVA pour le Maroc
  } else {
    tauxTVA = 1.15; // 15% de TVA pour le Canada (CAD)
  }
  
  const ttc = ht * tauxTVA;
  return Math.round(ttc * 100) / 100; // Arrondir à 2 décimales
}

// Fonction pour traiter les montants stockés (qui sont déjà TTC)
function obtenirMontantTTC(montantStocke, monnaie = 'CAD') {
  // Les montants en base sont déjà TTC, on les retourne directement
  return Math.round((parseFloat(montantStocke) || 0) * 100) / 100;
}

// GET /api/dashboard/ventes-conseilleres (avec filtrage par utilisateur)
router.get('/ventes-conseilleres', optionalAuth, async (req, res) => {
  const { periode = 'mois' } = req.query;
  const { start, end } = getDateRange(periode);
  const user = req.user;

  try {
    const sequelize = getSequelize();
    const { Facture, User } = sequelize.models;

    console.log(`🔍 Récupération ventes par conseillère pour période: ${periode}`);
    console.log(`📅 Date range: ${start.toISOString()} - ${end.toISOString()}`);
    console.log('👤 Utilisateur connecté (dashboard):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');

    if (!Facture) {
      console.log('⚠️ Modèle Facture non disponible');
      return res.json({
        success: true,
        data: [],
        message: 'Modèle Facture non disponible'
      });
    }

    // D'abord, récupérer TOUTES les conseillères du système
    let toutesLesConseilleres = [];
    if (User) {
      const conseilleres = await User.findAll({
        where: { role: 'conseillere' },
        attributes: ['id', 'nom', 'prenom', 'email']
      });
      
      toutesLesConseilleres = conseilleres.map(c => ({
        id: c.id,
        fullName: `${c.prenom} ${c.nom}`,
        nom: c.nom,
        prenom: c.prenom,
        email: c.email
      }));
      
      console.log(`👥 ${toutesLesConseilleres.length} conseillères trouvées dans le système:`, 
        toutesLesConseilleres.map(c => c.fullName));
    }

    // Construire les conditions de filtrage selon le rôle
    let whereConditions = {
      dateEmission: {
        [Op.between]: [start, end]
      },
      statut: 'payee' // Seulement les factures payées (revenus réels encaissés)
    };

    // Si c'est un conseiller, filtrer pour ne voir que ses propres ventes
    if (user && user.role === 'conseillere') {
      const fullName = `${user.nom} ${user.prenom}`;
      const fullNameInverse = `${user.prenom} ${user.nom}`;
      
      // 🔴 AMÉLIORATION : Logique de correspondance flexible pour les conseillères
      const nomsVariations = [
        fullName,
        fullName.toLowerCase(),
        fullNameInverse,
        fullNameInverse.toLowerCase(),
        user.nom,
        user.nom.toLowerCase(),
        user.prenom,
        user.prenom.toLowerCase()
      ];
      
      whereConditions.validePar = {
        [Op.in]: nomsVariations
      };
      console.log('🔒 Filtrage ventes pour conseillère:', fullName, 'variations:', nomsVariations.length);
    }

    // Récupérer les factures filtrées (inclure tous les statuts valides)
    const factures = await Facture.findAll({
      where: whereConditions,
      attributes: ['id', 'montant', 'validePar', 'client', 'statut', 'dateEmission'],
      order: [['dateEmission', 'DESC']]
    });

    console.log(`📊 ${factures.length} factures trouvées pour la période`);

    // Initialiser les ventes pour TOUTES les conseillères (même si elles n'ont pas de factures)
    const ventesParConseillere = {};
    
    // D'abord, initialiser toutes les conseillères avec des ventes à 0
    // Pour tous les utilisateurs (même non authentifiés), montrer toutes les conseillères
    if (!user || user.role !== 'conseillere') {
      // Pour admin/directeur/non-authentifié, montrer toutes les conseillères
      toutesLesConseilleres.forEach(conseillere => {
        ventesParConseillere[conseillere.fullName] = {
          conseillere: conseillere.fullName,
          totalHT: 0,
          totalTTC: 0,
          nombreFactures: 0,
          facturesPayees: 0,
          facturesEnAttente: 0
        };
        
        // Ajouter aussi les variations de nom possibles
        ventesParConseillere[conseillere.fullName.toLowerCase()] = ventesParConseillere[conseillere.fullName];
        ventesParConseillere[conseillere.nom] = ventesParConseillere[conseillere.fullName];
        ventesParConseillere[conseillere.prenom] = ventesParConseillere[conseillere.fullName];
      });
    }
    
    // Puis, ajouter les ventes réelles depuis les factures
    factures.forEach(facture => {
      const conseillere = facture.validePar || 'Non assigné';
      const montantStocke = parseFloat(facture.montant) || 0;
      const monnaieFacture = facture.monnaie || 'CAD'; // Par défaut CAD si non spécifié
      
      // Les montants en base sont déjà TTC
      const montantTTC = obtenirMontantTTC(montantStocke, monnaieFacture);
      // Calculer le HT à partir du TTC pour la cohérence
      const montantHT = monnaieFacture === 'MAD' ? montantTTC / 1.2 : montantTTC / 1.15;
      
      // Trouver la conseillère correspondante ou créer une nouvelle entrée
      let conseillereCle = conseillere;
      
      // Pour admin/directeur/non-authentifié, essayer de mapper vers le nom complet correct
      if (!user || user.role !== 'conseillere') {
        const conseillereCorrespondante = toutesLesConseilleres.find(c => 
          c.fullName === conseillere || 
          c.fullName.toLowerCase() === conseillere.toLowerCase() ||
          c.nom === conseillere ||
          c.prenom === conseillere
        );
        
        if (conseillereCorrespondante) {
          conseillereCle = conseillereCorrespondante.fullName;
        }
      }
      
      if (!ventesParConseillere[conseillereCle]) {
        ventesParConseillere[conseillereCle] = {
          conseillere: conseillereCle,
          totalHT: 0,
          totalTTC: 0,
          nombreFactures: 0,
          facturesPayees: 0,
          facturesEnAttente: 0
        };
      }
      
      ventesParConseillere[conseillereCle].totalHT += montantHT;
      ventesParConseillere[conseillereCle].totalTTC += montantTTC;
      ventesParConseillere[conseillereCle].nombreFactures += 1;
      
      // Puisque nous filtrons seulement les factures payées, toutes sont payées
      ventesParConseillere[conseillereCle].facturesPayees += 1;
      // facturesEnAttente reste 0 car nous ne récupérons que les factures payées
    });

    // Convertir en array, filtrer les doublons et trier par montant TTC décroissant
    const ventesArray = Object.values(ventesParConseillere)
      .filter((vente, index, array) => {
        // Éliminer les doublons en gardant seulement la première occurrence de chaque conseillère
        return array.findIndex(v => v.conseillere === vente.conseillere) === index;
      })
      .map(vente => ({
        conseillere: vente.conseillere,
        valeur: Math.round(vente.totalTTC * 100) / 100, // Format pour compatibilité frontend
        totalHT: Math.round(vente.totalHT * 100) / 100,
        totalTTC: Math.round(vente.totalTTC * 100) / 100,
        nombreFactures: vente.nombreFactures,
        facturesPayees: vente.facturesPayees,
        facturesEnAttente: vente.facturesEnAttente,
        evolution: Math.round(Math.random() * 20 - 10) // TODO: Calculer la vraie évolution
      }))
      .sort((a, b) => b.valeur - a.valeur);

    console.log(`💰 Ventes calculées:`, ventesArray);

    res.json({
      success: true,
      data: ventesArray,
      periode: periode,
      dateRange: { start, end },
      summary: {
        totalConseilleres: ventesArray.length,
        totalVentesHT: ventesArray.reduce((sum, v) => sum + v.totalHT, 0),
        totalVentesTTC: ventesArray.reduce((sum, v) => sum + v.totalTTC, 0),
        totalFactures: ventesArray.reduce((sum, v) => sum + v.nombreFactures, 0)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération ventes par conseillère:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur récupération ventes conseillères', 
      error: error.message 
    });
  }
});

// GET /api/dashboard/stats (avec filtrage par utilisateur)
router.get('/stats', optionalAuth, async (req, res) => {
  const { periode = 'mois' } = req.query;
  const { start, end } = getDateRange(periode);
  const user = req.user;

  try {
    const sequelize = getSequelize();
    const { Client, Lead, Facture } = sequelize.models;

    console.log('👤 Utilisateur connecté (stats):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');

    const whereDateCreation = (fieldName = 'createdAt') => ({
      [fieldName]: {
        [Op.between]: [start, end]
      }
    });

    // Ajouter le filtrage par conseillère si nécessaire (même logique que /api/leads)
    const addUserFilter = (baseWhere, model = 'default') => {
      if (user && user.role === 'conseillere') {
        const fullName = `${user.prenom} ${user.nom}`;
        
        if (model === 'leads') {
          // Pour les leads, utiliser une logique stricte - SEULEMENT les leads assignés à cette conseillère
          return {
            ...baseWhere,
            [Op.or]: [
              // Leads assignés via conseiller_id (priorité absolue)
              { conseiller_id: user.id },
              // Leads assignés via le nom dans conseillere (exactement le même nom)
              { 
                [Op.and]: [
                  { conseiller_id: { [Op.is]: null } },
                  {
                    [Op.or]: [
                      { conseillere: fullName },
                      { conseillere: fullName.toLowerCase() }
                    ]
                  }
                ]
              }
            ]
          };
        } else if (model === 'clients') {
          // Pour les clients, filtrage strict par conseillère assignée
          return {
            ...baseWhere,
            [Op.or]: [
              { conseillere: fullName },
              { conseillere: fullName.toLowerCase() }
            ]
          };
        }
      }
      return baseWhere;
    };

    // Comptes filtrés par période ET par conseillère si nécessaire
    // MODIFIER: Maintenant tous les totaux sont filtrés par la période sélectionnée
    const totalClients = await Client.count({ 
      where: addUserFilter({
        date_creation: {
          [Op.between]: [start, end]
        }
      }, 'clients')
    });
    const totalLeads = await Lead.count({ 
      where: addUserFilter({
        date_creation: {
          [Op.between]: [start, end]
        }
      }, 'leads')
    });

    // Dossiers actifs (AVEC filtre de date pour les dossiers créés dans la période)
    const dossiersActifs = await Client.count({
      where: addUserFilter({
        date_creation: {
          [Op.between]: [start, end]
        },
        statut: 'En cours'
      }, 'clients')
    });

    console.log(`📊 Stats calculées pour ${user ? user.prenom + ' ' + user.nom : 'tous'} (période: ${periode}):`);
    console.log(`   Leads: ${totalLeads}, Clients: ${totalClients}, Dossiers actifs: ${dossiersActifs}`);
    console.log(`   Période: ${start.toISOString()} - ${end.toISOString()}`);

    // Factures impayées (filtrées par période ET par conseillère si nécessaire)
    let facturesEnAttente = 0;
    let montantFacturesEnAttente = 0;
    if (Facture) {
      let factureWhere = {
        ...whereDateCreation('dateEmission'),  // Filtrer par date d'émission plutôt que createdAt
        statut: {
          [Op.in]: ['brouillon', 'payable'] // 🔴 CORRECTION: Inclure les brouillons dans les factures en attente
        }
      };

      // Pour les conseillères, filtrer les factures par validePar
      if (user && user.role === 'conseillere') {
        const fullName = `${user.nom} ${user.prenom}`;
        factureWhere.validePar = {
          [Op.in]: [
            fullName,
            fullName.toLowerCase(),
            user.nom,
            user.prenom
          ]
        };
      }

      facturesEnAttente = await Facture.count({ where: factureWhere });
      const resultSum = await Facture.sum('montant', { where: factureWhere });
      montantFacturesEnAttente = resultSum || 0;
    }

    res.json({
      success: true,
      data: {
        totalClients,
        totalLeads,
        dossiersActifs,
        facturesEnAttente,
        montantFacturesEnAttente
      }
    });
  } catch (error) {
    console.error('Erreur dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Erreur récupération stats', error: error.message });
  }
});

// GET /api/dashboard/mes-ventes - Récupérer les ventes d'une conseillère spécifique
router.get('/mes-ventes', optionalAuth, async (req, res) => {
  const { periode = 'mois', conseillere } = req.query;
  const { start, end } = getDateRange(periode);
  const user = req.user;

  try {
    const sequelize = getSequelize();
    const { Facture } = sequelize.models;

    console.log('👤 Utilisateur connecté (mes-ventes):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    console.log(`🔍 Récupération mes ventes pour période: ${periode}`);
    console.log(`📅 Date range: ${start.toISOString()} - ${end.toISOString()}`);

    if (!Facture) {
      console.log('⚠️ Modèle Facture non disponible');
      return res.json({
        success: true,
        data: {
          mesFactures: [],
          monTotalTTC: 0,
          monNombreFactures: 0,
          facturesPayees: 0,
          facturesEnAttente: 0
        },
        message: 'Modèle Facture non disponible'
      });
    }

    // Déterminer le nom de la conseillère selon la source
    let nomConseillere = null;
    
    if (user && user.role === 'conseillere') {
      // Si l'utilisateur est une conseillère authentifiée, utiliser ses informations
      nomConseillere = `${user.prenom} ${user.nom}`;
      console.log(`🔒 Conseillère authentifiée: ${nomConseillere} (ID: ${user.id})`);
    } else if (conseillere) {
      // Sinon, utiliser le paramètre fourni (pour les admins qui consultent les données d'une conseillère)
      nomConseillere = conseillere;
      console.log(`🔍 Paramètre conseillere fourni: ${nomConseillere}`);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Impossible de déterminer la conseillère (pas authentifiée et paramètre conseillere manquant)'
      });
    }

    // 🔴 AMÉLIORATION : Logique de correspondance flexible pour les noms
    console.log(`🔍 Recherche factures pour: "${nomConseillere}"`);
    
    // Construire les variations possibles du nom
    const nomsVariations = [
      nomConseillere, // Nom exact
      nomConseillere.toLowerCase(),
      nomConseillere.toUpperCase(),
      // Variations avec prénom/nom inversés si contient un espace
      ...(nomConseillere.includes(' ') ? [
        nomConseillere.split(' ').reverse().join(' '), // Inverser prénom/nom
        nomConseillere.split(' ')[0], // Premier mot seulement
        nomConseillere.split(' ')[1] || '' // Deuxième mot seulement
      ].filter(Boolean) : [])
    ];
    
    console.log(`🎯 Variations testées: ${nomsVariations.join(', ')}`);
    
    // Récupérer les factures de cette conseillère pour la période
    const mesFactures = await Facture.findAll({
      where: {
        dateEmission: {
          [Op.between]: [start, end]
        },
        validePar: {
          [Op.in]: nomsVariations // 🔴 AMÉLIORATION: Recherche avec variations
        },
        statut: {
          [Op.in]: ['brouillon', 'payable', 'payee'] // Inclure les brouillons pour les factures manuelles
        }
      },
      attributes: ['id', 'numero', 'montant', 'client', 'statut', 'dateEmission', 'dateEcheance', 'datePaiement'],
      order: [['dateEmission', 'DESC']]
    });

    console.log(`📊 ${mesFactures.length} factures trouvées pour ${nomConseillere}`);

    // Calculer les totaux
    let monTotalHT = 0;
    let monTotalTTC = 0;
    let facturesPayees = 0;
    let facturesEnAttente = 0;

    const facturesAvecTTC = mesFactures.map(facture => {
      const montantStocke = parseFloat(facture.montant) || 0;
      const monnaieFacture = facture.monnaie || 'CAD'; // Par défaut CAD si non spécifié
      
      // Les montants en base sont déjà TTC
      const montantTTC = obtenirMontantTTC(montantStocke, monnaieFacture);
      // Calculer le HT à partir du TTC pour la cohérence
      const montantHT = monnaieFacture === 'MAD' ? montantTTC / 1.2 : montantTTC / 1.15;
      
      monTotalHT += montantHT;
      monTotalTTC += montantTTC;
      
      if (facture.statut === 'payee') {
        facturesPayees += 1;
      } else {
        facturesEnAttente += 1;
      }
      
      return {
        id: facture.id,
        numero: facture.numero,
        client: facture.client,
        montantHT: Math.round(montantHT * 100) / 100,
        montantTTC: Math.round(montantTTC * 100) / 100,
        statut: facture.statut,
        dateEmission: facture.dateEmission,
        dateEcheance: facture.dateEcheance,
        datePaiement: facture.datePaiement
      };
    });

    const stats = {
      mesFactures: facturesAvecTTC,
      monTotalHT: Math.round(monTotalHT * 100) / 100,
      monTotalTTC: Math.round(monTotalTTC * 100) / 100,
      monNombreFactures: mesFactures.length,
      facturesPayees: facturesPayees,
      facturesEnAttente: facturesEnAttente,
      conseillere: nomConseillere,
      periode: periode
    };

    console.log(`💰 Stats pour ${nomConseillere}:`, {
      totalTTC: stats.monTotalTTC,
      nombreFactures: stats.monNombreFactures,
      payees: facturesPayees,
      enAttente: facturesEnAttente
    });

    res.json({
      success: true,
      data: stats,
      periode: periode,
      dateRange: { start, end }
    });

  } catch (error) {
    console.error('❌ Erreur récupération mes ventes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur récupération mes ventes', 
      error: error.message 
    });
  }
});

// GET /api/dashboard/rendez-vous-a-venir - Récupérer les rendez-vous à venir
router.get('/rendez-vous-a-venir', optionalAuth, async (req, res) => {
  const { limite = 10, conseillere } = req.query;
  const user = req.user;

  try {
    const sequelize = getSequelize();
    
    // Vérifier si le modèle RendezVous existe
    if (!sequelize.models.RendezVous) {
      console.log('⚠️ Modèle RendezVous non disponible');
      return res.json({
        success: true,
        data: [],
        message: 'Modèle RendezVous non disponible'
      });
    }

    const { RendezVous } = sequelize.models;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔍 [Dashboard] Récupération rendez-vous à venir');
    console.log('👤 Utilisateur connecté:', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    console.log('🎯 Paramètres:', { limite, conseillere });

    // Conditions de base - seulement les rendez-vous futurs
    let whereConditions = {
      date_rdv: {
        [Op.gte]: today
      },
      statut: {
        [Op.in]: ['Confirmé', 'En attente']
      }
    };

    // Filtrage par conseillère selon le rôle et les paramètres
    if (user && user.role === 'conseillere') {
      // Pour les conseillères connectées, ne montrer que leurs propres rendez-vous
      const fullName = `${user.prenom} ${user.nom}`;
      whereConditions.conseillere_nom = {
        [Op.in]: [
          fullName,
          fullName.toLowerCase(),
          user.nom,
          user.prenom
        ]
      };
      console.log('🔒 Filtrage pour conseillère:', fullName);
    } else if (conseillere) {
      // Pour les admin/directeurs avec un filtre spécifique par conseillère
      whereConditions.conseillere_nom = conseillere;
      console.log('🔍 Filtrage pour conseillère spécifique:', conseillere);
    }

    // Récupérer les rendez-vous à venir
    const rendezVous = await RendezVous.findAll({
      where: whereConditions,
      attributes: [
        'id',
        'client_id',
        'client_nom',
        'conseillere_nom',
        'date_rdv',
        'heure_debut',
        'heure_fin',
        'type_rdv',
        'statut',
        'notes'
      ],
      order: [
        ['date_rdv', 'ASC'],
        ['heure_debut', 'ASC']
      ],
      limit: parseInt(limite)
    });

    console.log(`📅 ${rendezVous.length} rendez-vous à venir trouvés`);

    // Formater les données pour le frontend
    const rendezVousFormatted = rendezVous.map(rdv => ({
      id: rdv.id,
      client_id: rdv.client_id, // Ajouter l'ID du client pour pouvoir récupérer ses informations
      client: rdv.client_nom,
      client_nom: rdv.client_nom,
      conseillere: rdv.conseillere_nom,
      conseillere_nom: rdv.conseillere_nom,
      date: rdv.date_rdv,
      date_rdv: rdv.date_rdv,
      heureDebut: rdv.heure_debut ? rdv.heure_debut.substring(0, 5) : '',
      heure_debut: rdv.heure_debut,
      heureFin: rdv.heure_fin ? rdv.heure_fin.substring(0, 5) : '',
      heure_fin: rdv.heure_fin,
      type: rdv.type_rdv,
      type_rdv: rdv.type_rdv,
      statut: rdv.statut,
      notes: rdv.notes || ''
    }));

    res.json({
      success: true,
      data: rendezVousFormatted,
      periode: 'prochains_jours',
      summary: {
        totalRendezVous: rendezVousFormatted.length,
        prochainRendezVous: rendezVousFormatted.length > 0 ? rendezVousFormatted[0] : null
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération rendez-vous à venir:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur récupération rendez-vous à venir', 
      error: error.message 
    });
  }
});

// Endpoint pour récupérer les activités récentes en temps réel
router.get('/activites-recentes', authenticate, async (req, res) => {
  try {
    console.log('🔄 [Dashboard] Récupération activités récentes pour utilisateur:', req.user?.role || 'anonyme', req.user?.nom || 'inconnu');
    console.log('🔍 [Dashboard] DEBUG - req.user complet:', JSON.stringify(req.user, null, 2));
    console.log('🔍 [Dashboard] DEBUG - Headers Authorization:', req.headers.authorization ? 'Présent' : 'Absent');
    
    const limit = parseInt(req.query.limit) || 10;
    const userRole = req.user?.role || 'conseillere';
    const userId = req.user?.id;
    const userName = req.user?.nom ? `${req.user.prenom} ${req.user.nom}` : req.user?.username || 'Unknown';
    
    console.log('🎯 [Dashboard] Utilisateur connecté - Rôle:', userRole, 'Nom complet:', userName, 'ID:', userId);
    
    let activites = [];
    
    // Activités récentes des dernières 7 jours
    const dateDepuis = new Date();
    dateDepuis.setDate(dateDepuis.getDate() - 7);
    const dateDepuisStr = dateDepuis.toISOString().split('T')[0];
    
    try {
             // 1. Nouveaux leads créés
       console.log(`🔍 [Dashboard] Recherche leads créés depuis ${dateDepuisStr} pour ${userRole}: ${userName}`);
       const [nouveauxLeads] = await getSequelize().query(`
         SELECT 
           'lead' as type,
           CONCAT('Nouveau lead créé: ', prenom, ' ', nom) as description,
           date_creation as date,
           COALESCE(conseillere, 'Système') as utilisateur,
           id as reference_id
         FROM leads 
         WHERE date_creation >= :dateDepuis
         ${userRole === 'conseillere' ? 'AND (conseillere LIKE CONCAT(\'%\', :userName, \'%\') OR conseillere IS NULL OR conseillere = \'\')' : ''}
         ORDER BY date_creation DESC
         LIMIT :limit
       `, {
         replacements: userRole === 'conseillere' ? 
           { dateDepuis: dateDepuisStr, userName: userName, limit: limit } : 
           { dateDepuis: dateDepuisStr, limit: limit }
       });
      
       console.log(`📊 [Dashboard] ${nouveauxLeads.length} nouveaux leads trouvés`);
       activites = activites.concat(nouveauxLeads.map(lead => ({
         ...lead,
         date: lead.date ? (lead.date instanceof Date ? lead.date.toISOString() : lead.date) : new Date().toISOString()
       })));
      
             // 2. Clients mis à jour récemment
       console.log(`🔍 [Dashboard] Recherche clients modifiés depuis ${dateDepuisStr} pour ${userRole}: ${userName}`);
       const [clientsMisAJour] = await getSequelize().query(`
         SELECT 
           'client' as type,
           CONCAT('Client mis à jour: ', prenom, ' ', nom) as description,
           date_modification as date,
           COALESCE(conseillere, 'Système') as utilisateur,
           id as reference_id
         FROM clients 
         WHERE date_modification >= :dateDepuis
         ${userRole === 'conseillere' ? 'AND (conseillere LIKE CONCAT(\'%\', :userName, \'%\') OR conseillere IS NULL OR conseillere = \'\')' : ''}
         ORDER BY date_modification DESC
         LIMIT :limit
       `, {
         replacements: userRole === 'conseillere' ? 
           { dateDepuis: dateDepuisStr, userName: userName, limit: limit } : 
           { dateDepuis: dateDepuisStr, limit: limit }
       });
      
       console.log(`📊 [Dashboard] ${clientsMisAJour.length} clients mis à jour trouvés`);
       activites = activites.concat(clientsMisAJour.map(client => ({
         ...client,
         date: client.date ? (client.date instanceof Date ? client.date.toISOString() : client.date) : new Date().toISOString()
       })));
      
             // 3. Factures créées récemment
       console.log(`🔍 [Dashboard] Recherche factures créées depuis ${dateDepuisStr} pour ${userRole}: ${userName}`);
       const [facturesCreees] = await getSequelize().query(`
         SELECT 
           'facture' as type,
           CONCAT('Facture créée: ', numero, ' - ', COALESCE(client, 'Client')) as description,
           dateEmission as date,
           COALESCE(validePar, 'Système') as utilisateur,
           id as reference_id
         FROM factures 
         WHERE dateEmission >= :dateDepuis
         ${userRole === 'conseillere' ? 'AND (validePar LIKE CONCAT(\'%\', :userName, \'%\') OR validePar IS NULL OR validePar = \'\')' : ''}
         ORDER BY dateEmission DESC
         LIMIT :limit
       `, {
         replacements: userRole === 'conseillere' ? 
           { dateDepuis: dateDepuisStr, userName: userName, limit: limit } : 
           { dateDepuis: dateDepuisStr, limit: limit }
       });
      
       console.log(`📊 [Dashboard] ${facturesCreees.length} factures créées trouvées`);
       activites = activites.concat(facturesCreees.map(facture => ({
         ...facture,
         date: facture.date ? (facture.date instanceof Date ? facture.date.toISOString() : facture.date) : new Date().toISOString()
       })));
      
             // 4. Factures payées récemment
       const [facturesPayees] = await getSequelize().query(`
         SELECT 
           'facture' as type,
           CONCAT('Facture payée: ', numero, ' - ', COALESCE(client, 'Client')) as description,
           datePaiement as date,
           COALESCE(validePar, 'Système') as utilisateur,
           id as reference_id
         FROM factures 
         WHERE datePaiement >= :dateDepuis AND statut = 'payee'
         ${userRole === 'conseillere' ? 'AND (validePar LIKE CONCAT(\'%\', :userName, \'%\') OR validePar IS NULL OR validePar = \'\')' : ''}
         ORDER BY datePaiement DESC
         LIMIT :limit
       `, {
         replacements: userRole === 'conseillere' ? 
           { dateDepuis: dateDepuisStr, userName: userName, limit: limit } : 
           { dateDepuis: dateDepuisStr, limit: limit }
       });
      
       console.log(`📊 [Dashboard] ${facturesPayees.length} factures payées trouvées`);
       activites = activites.concat(facturesPayees.map(facture => ({
         ...facture,
         date: facture.date ? (facture.date instanceof Date ? facture.date.toISOString() : facture.date) : new Date().toISOString()
       })));
      
             // 5. Rendez-vous récemment créés ou confirmés
       const [rendezVousRecents] = await getSequelize().query(`
         SELECT 
           'rendez-vous' as type,
           CONCAT('Rendez-vous planifié: ', date_rdv, ' - ', type_rdv) as description,
           createdAt as date,
           COALESCE(conseillere_nom, 'Système') as utilisateur,
           id as reference_id
         FROM rendezvous 
         WHERE createdAt >= :dateDepuis
         ${userRole === 'conseillere' ? 'AND (conseillere_nom LIKE CONCAT(\'%\', :userName, \'%\') OR conseillere_nom IS NULL OR conseillere_nom = \'\')' : ''}
         ORDER BY createdAt DESC
         LIMIT :limit
       `, {
         replacements: userRole === 'conseillere' ? 
           { dateDepuis: dateDepuisStr, userName: userName, limit: limit } : 
           { dateDepuis: dateDepuisStr, limit: limit }
       });
      
       console.log(`📊 [Dashboard] ${rendezVousRecents.length} rendez-vous trouvés`);
       activites = activites.concat(rendezVousRecents.map(rdv => ({
         ...rdv,
         date: rdv.date ? (rdv.date instanceof Date ? rdv.date.toISOString() : rdv.date) : new Date().toISOString()
       })));
      
    } catch (error) {
      console.error('❌ [Dashboard] Erreur requêtes activités:', error);
    }
    
    // Trier toutes les activités par date décroissante
    activites.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limiter au nombre demandé
    activites = activites.slice(0, limit);
    
    // Ajouter des IDs uniques et formater
    const activitesFormatees = activites.map((activite, index) => ({
      id: `${activite.type}_${activite.reference_id || index}_${Date.now()}`,
      type: activite.type,
      description: activite.description,
      date: new Date(activite.date).toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      utilisateur: userRole === 'conseillere' && 
                  (activite.utilisateur && activite.utilisateur.toLowerCase().includes(userName.toLowerCase())) ? 
                  'Vous' : activite.utilisateur,
      reference_id: activite.reference_id
    }));
    
    console.log(`✅ [Dashboard] ${activitesFormatees.length} activités récentes trouvées pour ${userRole}: ${userName}`);
    
    res.json({
      success: true,
      data: {
        activites: activitesFormatees,
        lastUpdate: new Date().toISOString(),
        totalFound: activitesFormatees.length
      }
    });
    
  } catch (error) {
    console.error('❌ [Dashboard] Erreur récupération activités récentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des activités récentes',
      error: error.message
    });
  }
});

// GET /api/dashboard/consultations - Récupérer les consultations effectuées
router.get('/consultations', optionalAuth, async (req, res) => {
  const { periode = 'mois', userId, conseillere } = req.query;
  const { start, end } = getDateRange(periode);
  const user = req.user;

  try {
    const sequelize = getSequelize();
    const { Lead, Client, Consultation, User } = sequelize.models;

    console.log(`🔍 Récupération consultations pour période: ${periode}`);
    console.log(`📅 Date range: ${start.toISOString()} - ${end.toISOString()}`);
    console.log('👤 Utilisateur connecté (consultations):', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    console.log('📋 Paramètres reçus:', { userId, conseillere });

    // 🔧 CORRECTION: Utiliser d'abord la nouvelle table Consultation si elle existe
    if (Consultation && User) {
      console.log('✅ Utilisation de la nouvelle table Consultation');
      
      let whereConditions = {
        createdAt: {
          [Op.between]: [start, end]
        },
        isValid: true // Seulement les consultations valides
      };

      // Déterminer l'ID du conseiller à filtrer
      let conseillerId = null;
      
      if (user && user.role === 'conseillere') {
        // Utilisateur authentifié : utiliser son ID
        conseillerId = user.id;
        console.log(`🔒 Filtrage consultations pour conseillère authentifiée: ${user.prenom} ${user.nom} (ID: ${user.id})`);
      } else if (userId) {
        // Paramètre userId fourni explicitement
        conseillerId = parseInt(userId);
        console.log(`🔒 Filtrage consultations pour conseiller ID: ${conseillerId}`);
      } else if (conseillere) {
        // Paramètre conseillere fourni : essayer de trouver l'ID
        const conseillerByName = await User.findOne({
          where: {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
                conseillere
              ),
              { nom: conseillere },
              { prenom: conseillere }
            ]
          }
        });
        
        if (conseillerByName) {
          conseillerId = conseillerByName.id;
          console.log(`🔒 Conseiller trouvé par nom ${conseillere}: ID ${conseillerId}`);
        }
      }

      // Appliquer le filtrage par conseiller
      if (conseillerId) {
        whereConditions.conseillerId = conseillerId;
      }

      // Récupérer les consultations depuis la nouvelle table
      const consultations = await Consultation.findAll({
        where: whereConditions,
        include: [
          { 
            model: Lead, 
            as: 'lead',
            attributes: ['id', 'nom', 'prenom', 'email', 'telephone']
          },
          { 
            model: User, 
            as: 'conseiller',
            attributes: ['id', 'nom', 'prenom', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      console.log(`📊 ${consultations.length} consultations trouvées dans la nouvelle table`);

      // Calculer l'évolution (simulation simple)
      const evolution = consultations.length > 0 ? `+${Math.min(consultations.length * 5, 100)}%` : '+0%';

      const stats = {
        totalConsultations: consultations.length,
        consultationsRecentes: consultations.slice(0, 10).map(c => ({
          id: c.id,
          type: 'consultation',
          nom: c.lead?.nom || 'N/A',
          prenom: c.lead?.prenom || 'N/A',
          email: c.lead?.email || 'N/A',
          telephone: c.lead?.telephone || 'N/A',
          conseillere: `${c.conseiller?.prenom} ${c.conseiller?.nom}`,
          conseiller_id: c.conseillerId,
          notes: c.notes,
          date: c.createdAt
        })),
        evolution: evolution,
        periode: periode
      };

      console.log(`📈 Stats consultations (nouvelle table) pour ${conseillerId ? `conseiller ${conseillerId}` : 'tous'} (période: ${periode}):`, {
        total: stats.totalConsultations,
        evolution: stats.evolution
      });

      return res.json({
        success: true,
        data: stats,
        periode: periode,
        dateRange: { start, end }
      });
    }

    // 🔄 Fallback vers l'ancien système si la nouvelle table n'est pas disponible
    console.log('⚠️ Table Consultation non disponible, utilisation du fallback (statut leads)');
    
    if (!Lead && !Client) {
      console.log('⚠️ Modèles Lead et Client non disponibles');
      return res.json({
        success: true,
        data: {
          totalConsultations: 0,
          consultationsRecentes: [],
          evolution: '+0%'
        },
        message: 'Modèles Lead et Client non disponibles'
      });
    }

    // Construire les conditions de filtrage selon le rôle (ancien système)
    let whereConditions = {
      date_modification: {
        [Op.between]: [start, end]
      },
      statut: 'Consultation effectuée'
    };

    // Déterminer le nom de la conseillère à filtrer
    let nomConseillere = null;
    
    if (user && user.role === 'conseillere') {
      // Utilisateur authentifié : utiliser ses informations
      nomConseillere = `${user.prenom} ${user.nom}`;
      console.log(`🔒 Filtrage consultations pour conseillère authentifiée: ${nomConseillere} (ID: ${user.id})`);
    } else if (conseillere) {
      // Paramètre conseillere fourni explicitement
      nomConseillere = conseillere;
      console.log(`🔒 Filtrage consultations pour conseillère via paramètre: ${nomConseillere}`);
    } else if (userId) {
      // Si userId fourni, essayer de retrouver le nom
      console.log(`🔒 Filtrage consultations pour conseiller ID: ${userId}`);
    }

    // Appliquer le filtrage
    if (nomConseillere) {
      const orConditions = [
        { conseillere: nomConseillere },
        { conseillere: nomConseillere.toLowerCase() }
      ];
      
      // Ajouter conseiller_id seulement si user.id existe
      if (user && user.id) {
        orConditions.push({ conseiller_id: user.id });
      }
      
      whereConditions = {
        ...whereConditions,
        [Op.or]: orConditions
      };
    } else if (userId) {
      whereConditions.conseiller_id = userId;
    }
    // Si aucun filtre spécifique, on retourne toutes les consultations (pour admin/directeur)

    // Récupérer les consultations depuis les leads
    let consultationsLeads = [];
    if (Lead) {
      consultationsLeads = await Lead.findAll({
        where: whereConditions,
        attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'conseillere', 'conseiller_id', 'statut', 'date_modification'],
        order: [['date_modification', 'DESC']]
      });
    }

    console.log(`📊 ${consultationsLeads.length} consultations trouvées dans les leads`);

    // Récupérer les consultations depuis les clients (si applicable)
    let consultationsClients = [];
    if (Client) {
      const clientWhereConditions = {
        ...whereConditions,
        statut_procedure: 'Consultation effectuée' // Adapter selon votre modèle Client
      };
      
      try {
        consultationsClients = await Client.findAll({
          where: clientWhereConditions,
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'conseillere', 'conseiller_id', 'statut_procedure', 'date_modification'],
          order: [['date_modification', 'DESC']]
        });
        console.log(`📊 ${consultationsClients.length} consultations trouvées dans les clients`);
      } catch (error) {
        console.log('ℹ️ Pas de consultations dans les clients (champ statut_procedure non trouvé)');
      }
    }

    // Combiner les résultats
    const toutesConsultations = [
      ...consultationsLeads.map(lead => ({
        id: lead.id,
        type: 'lead',
        nom: lead.nom,
        prenom: lead.prenom,
        email: lead.email,
        telephone: lead.telephone,
        conseillere: lead.conseillere,
        conseiller_id: lead.conseiller_id,
        statut: lead.statut,
        date: lead.date_modification
      })),
      ...consultationsClients.map(client => ({
        id: client.id,
        type: 'client',
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        conseillere: client.conseillere,
        conseiller_id: client.conseiller_id,
        statut: client.statut_procedure,
        date: client.date_modification
      }))
    ];

    // Trier par date décroissante
    toutesConsultations.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`📊 ${toutesConsultations.length} consultations trouvées pour la période`);

    // Calculer l'évolution (simulation simple - dans un vrai projet, comparer avec la période précédente)
    const evolution = toutesConsultations.length > 0 ? `+${Math.min(toutesConsultations.length * 2, 100)}%` : '+0%';

    const stats = {
      totalConsultations: toutesConsultations.length,
      consultationsRecentes: toutesConsultations.slice(0, 10), // Limiter à 10 pour l'affichage
      evolution: evolution,
      periode: periode
    };

    console.log(`📈 Stats consultations pour ${user ? user.prenom + ' ' + user.nom : 'tous'} (période: ${periode}):`, {
      total: stats.totalConsultations,
      evolution: stats.evolution
    });

    res.json({
      success: true,
      data: stats,
      periode: periode,
      dateRange: { start, end }
    });

  } catch (error) {
    console.error('❌ Erreur récupération consultations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur récupération consultations', 
      error: error.message 
    });
  }
});

module.exports = router;