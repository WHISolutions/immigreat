const express = require('express');
const router = express.Router();
const initializeModels = require('../models');
const { Op } = require('sequelize');

// Utilitaires pour calculer les dates selon la période
const getDateRange = (periode) => {
  const now = new Date();
  let startDate, endDate;

  switch (periode) {
    case 'jour':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    
    case 'semaine':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      startDate = startOfWeek;
      endDate = endOfWeek;
      break;
    
    case 'mois':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    
    case 'annee':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    
    default:
      // Par défaut : mois actuel
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// Endpoint pour récupérer les leads par source selon la période
router.get('/leads-par-source/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    const { startDate, endDate } = getDateRange(periode);
    
    const db = initializeModels();
    const { Lead } = db;

    // Requête pour compter les leads par source dans la période
    const leadsParSource = await Lead.findAll({
      attributes: [
        'source',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
      ],
      where: {
        date_creation: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['source'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });

    // Formater les résultats
    const formattedData = leadsParSource.map(item => ({
      source: item.source || 'Non défini',
      valeur: parseInt(item.dataValues.valeur) || 0
    }));

    // S'assurer qu'on a toujours les principales sources, même avec 0
    const sources = ['Site Web', 'Référence', 'Réseaux Sociaux', 'Publicité', 'Autre'];
    const result = sources.map(source => {
      const found = formattedData.find(item => item.source === source);
      return {
        source,
        valeur: found ? found.valeur : 0
      };
    });

    // Ajouter les autres sources non prédéfinies
    formattedData.forEach(item => {
      if (!sources.includes(item.source)) {
        result.push(item);
      }
    });

    res.json({
      success: true,
      data: result,
      periode,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des leads par source:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Endpoint pour récupérer les revenus par période
router.get('/revenus-par-periode/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    
    const db = initializeModels();
    const { Facture } = db;

    if (!Facture) {
      return res.status(500).json({
        success: false,
        error: 'Modèle Facture non disponible'
      });
    }

    let groupBy, selectFormat, orderBy;
    const now = new Date();

    switch (periode) {
      case 'jour':
        // Par heure pour le jour actuel
        groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%H');
        selectFormat = '%H:00';
        orderBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%H');
        break;
      
      case 'semaine':
        // Par jour pour la semaine actuelle
        groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m-%d');
        selectFormat = '%a';
        orderBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m-%d');
        break;
      
      case 'mois':
        // Par semaine pour le mois actuel
        groupBy = db.sequelize.fn('WEEK', db.sequelize.col('dateEmission'));
        selectFormat = 'Sem %u';
        orderBy = db.sequelize.fn('WEEK', db.sequelize.col('dateEmission'));
        break;
      
      case 'annee':
        // Par mois pour l'année actuelle
        groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
        selectFormat = '%b';
        orderBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
        break;
      
      default:
        groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
        selectFormat = '%b';
        orderBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
    }

    const { startDate, endDate } = getDateRange(periode);

    // Requête pour les revenus par période (SEULEMENT factures payées)
    const revenus = await Facture.findAll({
      attributes: [
        [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), selectFormat), 'mois'],
        [db.sequelize.fn('SUM', db.sequelize.col('montant')), 'valeur']
      ],
      where: {
        dateEmission: {
          [Op.between]: [startDate, endDate]
        },
        statut: 'payee' // Seulement les factures payées (revenus réels) - minuscule comme en BDD
      },
      group: [groupBy],
      order: [[orderBy, 'ASC']]
    });

    const formattedData = revenus.map(item => ({
      mois: item.dataValues.mois || 'N/A',
      valeur: parseFloat(item.dataValues.valeur) || 0
    }));

    res.json({
      success: true,
      data: formattedData,
      periode,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des revenus:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Endpoint pour récupérer les dossiers par type selon la période
router.get('/dossiers-par-type/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    const { startDate, endDate } = getDateRange(periode);
    
    const db = initializeModels();
    const { Client } = db;

    // Pour les dossiers, on utilise la table des clients qui ont un type_procedure
    const dossiersParType = await Client.findAll({
      attributes: [
        'type_procedure',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
      ],
      where: {
        date_creation: {
          [Op.between]: [startDate, endDate]
        },
        type_procedure: {
          [Op.ne]: null
        }
      },
      group: ['type_procedure'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });

    // Formater les résultats
    const formattedData = dossiersParType.map(item => ({
      type: item.type_procedure || 'Non défini',
      valeur: parseInt(item.dataValues.valeur) || 0
    }));

    // S'assurer qu'on a toujours les principaux types, même avec 0
    const types = [
      'Permis d\'études',
      'Permis de travail', 
      'Résidence permanente',
      'Visa visiteur',
      'Citoyenneté'
    ];
    
    const result = types.map(type => {
      const found = formattedData.find(item => item.type === type);
      return {
        type,
        valeur: found ? found.valeur : 0
      };
    });

    // Ajouter les autres types non prédéfinis
    formattedData.forEach(item => {
      if (!types.includes(item.type)) {
        result.push(item);
      }
    });

    res.json({
      success: true,
      data: result,
      periode,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers par type:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Endpoint pour récupérer toutes les statistiques en une seule requête
router.get('/all/:periode', async (req, res) => {
  try {
    const { periode } = req.params;

    // Récupérer toutes les statistiques en parallèle
    const [leadsResponse, revenusResponse, dossiersResponse] = await Promise.allSettled([
      // Simuler les appels internes
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Lead } = db;

          const leadsParSource = await Lead.findAll({
            attributes: [
              'source',
              [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
            ],
            where: {
              date_creation: {
                [Op.between]: [startDate, endDate]
              }
            },
            group: ['source'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
          });

          const formattedData = leadsParSource.map(item => ({
            source: item.source || 'Non défini',
            valeur: parseInt(item.dataValues.valeur) || 0
          }));

          const sources = ['Site Web', 'Référence', 'Réseaux Sociaux', 'Publicité', 'Autre'];
          const result = sources.map(source => {
            const found = formattedData.find(item => item.source === source);
            return { source, valeur: found ? found.valeur : 0 };
          });

          formattedData.forEach(item => {
            if (!sources.includes(item.source)) {
              result.push(item);
            }
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      }),
      
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Facture } = db;

          if (!Facture) {
            resolve([]);
            return;
          }

          let groupBy, selectFormat;
          switch (periode) {
            case 'jour':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%H');
              selectFormat = '%H:00';
              break;
            case 'semaine':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m-%d');
              selectFormat = '%a';
              break;
            case 'mois':
              groupBy = db.sequelize.fn('WEEK', db.sequelize.col('dateEmission'));
              selectFormat = 'Sem %u';
              break;
            case 'annee':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
              selectFormat = '%b';
              break;
            default:
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
              selectFormat = '%b';
          }

          const revenus = await Facture.findAll({
            attributes: [
              [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), selectFormat), 'mois'],
              [db.sequelize.fn('SUM', db.sequelize.col('montant')), 'valeur']
            ],
            where: {
              dateEmission: {
                [Op.between]: [startDate, endDate]
              },
              statut: {
                [Op.ne]: 'brouillon'
              }
            },
            group: [groupBy],
            order: [[groupBy, 'ASC']]
          });

          const formattedData = revenus.map(item => ({
            mois: item.dataValues.mois || 'N/A',
            valeur: parseFloat(item.dataValues.valeur) || 0
          }));

          resolve(formattedData);
        } catch (error) {
          reject(error);
        }
      }),
      
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Client } = db;

          const dossiersParType = await Client.findAll({
            attributes: [
              'type_procedure',
              [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
            ],
            where: {
              date_creation: {
                [Op.between]: [startDate, endDate]
              },
              type_procedure: {
                [Op.ne]: null
              }
            },
            group: ['type_procedure'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
          });

          const formattedData = dossiersParType.map(item => ({
            type: item.type_procedure || 'Non défini',
            valeur: parseInt(item.dataValues.valeur) || 0
          }));

          const types = [
            'Permis d\'études',
            'Permis de travail', 
            'Résidence permanente',
            'Visa visiteur',
            'Citoyenneté'
          ];
          
          const result = types.map(type => {
            const found = formattedData.find(item => item.type === type);
            return { type, valeur: found ? found.valeur : 0 };
          });

          formattedData.forEach(item => {
            if (!types.includes(item.type)) {
              result.push(item);
            }
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
    ]);

    const response = {
      success: true,
      data: {
        leadsParSource: leadsResponse.status === 'fulfilled' ? leadsResponse.value : [],
        revenusParMois: revenusResponse.status === 'fulfilled' ? revenusResponse.value : [],
        dossiersParType: dossiersResponse.status === 'fulfilled' ? dossiersResponse.value : []
      },
      periode,
      errors: []
    };

    // Ajouter les erreurs s'il y en a
    if (leadsResponse.status === 'rejected') {
      response.errors.push({ type: 'leads', error: leadsResponse.reason.message });
    }
    if (revenusResponse.status === 'rejected') {
      response.errors.push({ type: 'revenus', error: revenusResponse.reason.message });
    }
    if (dossiersResponse.status === 'rejected') {
      response.errors.push({ type: 'dossiers', error: dossiersResponse.reason.message });
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Endpoint pour récupérer toutes les statistiques globales (tous utilisateurs) en une seule requête
router.get('/global/:periode', async (req, res) => {
  try {
    const { periode } = req.params;

    console.log(`🌍 [Statistics] Récupération des statistiques GLOBALES pour tous les utilisateurs - période: ${periode}`);

    // Récupérer toutes les statistiques en parallèle SANS aucun filtre utilisateur
    const [leadsResponse, revenusResponse, dossiersResponse] = await Promise.allSettled([
      // Leads par source - TOUS les leads
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Lead } = db;

          console.log(`📊 [Statistics] Récupération leads GLOBAUX du ${startDate.toISOString()} au ${endDate.toISOString()}`);

          const leadsParSource = await Lead.findAll({
            attributes: [
              'source',
              [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
            ],
            where: {
              date_creation: {
                [Op.between]: [startDate, endDate]
              }
            },
            group: ['source'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
          });

          const formattedData = leadsParSource.map(item => ({
            source: item.source || 'Non défini',
            valeur: parseInt(item.dataValues.valeur) || 0
          }));

          console.log(`✅ [Statistics] ${leadsParSource.length} sources de leads trouvées:`, formattedData);

          const sources = ['Site Web', 'Référence', 'Réseaux Sociaux', 'Publicité', 'Autre'];
          const result = sources.map(source => {
            const found = formattedData.find(item => item.source === source);
            return { source, valeur: found ? found.valeur : 0 };
          });

          formattedData.forEach(item => {
            if (!sources.includes(item.source)) {
              result.push(item);
            }
          });

          resolve(result);
        } catch (error) {
          console.error('❌ [Statistics] Erreur leads globaux:', error);
          reject(error);
        }
      }),
      
      // Revenus par période - TOUTES les factures
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Facture } = db;

          if (!Facture) {
            console.warn('⚠️ [Statistics] Modèle Facture non disponible');
            resolve([]);
            return;
          }

          console.log(`💰 [Statistics] Récupération revenus GLOBAUX du ${startDate.toISOString()} au ${endDate.toISOString()}`);

          let groupBy, selectFormat;
          switch (periode) {
            case 'jour':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%H');
              selectFormat = '%H:00';
              break;
            case 'semaine':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m-%d');
              selectFormat = '%a';
              break;
            case 'mois':
              groupBy = db.sequelize.fn('WEEK', db.sequelize.col('dateEmission'));
              selectFormat = 'Sem %u';
              break;
            case 'annee':
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
              selectFormat = '%b';
              break;
            default:
              groupBy = db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), '%Y-%m');
              selectFormat = '%b';
          }

          const revenus = await Facture.findAll({
            attributes: [
              [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('dateEmission'), selectFormat), 'mois'],
              [db.sequelize.fn('SUM', db.sequelize.col('montant')), 'valeur']
            ],
            where: {
              dateEmission: {
                [Op.between]: [startDate, endDate]
              },
              statut: {
                [Op.ne]: 'brouillon'
              }
            },
            group: [groupBy],
            order: [[groupBy, 'ASC']]
          });

          const formattedData = revenus.map(item => ({
            mois: item.dataValues.mois || 'N/A',
            valeur: parseFloat(item.dataValues.valeur) || 0
          }));

          console.log(`✅ [Statistics] ${revenus.length} périodes de revenus trouvées:`, formattedData);

          resolve(formattedData);
        } catch (error) {
          console.error('❌ [Statistics] Erreur revenus globaux:', error);
          reject(error);
        }
      }),
      
      // Dossiers par type - TOUS les dossiers
      new Promise(async (resolve, reject) => {
        try {
          const { startDate, endDate } = getDateRange(periode);
          const db = initializeModels();
          const { Client } = db;

          console.log(`📁 [Statistics] Récupération dossiers GLOBAUX du ${startDate.toISOString()} au ${endDate.toISOString()}`);

          const dossiersParType = await Client.findAll({
            attributes: [
              'type_procedure',
              [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'valeur']
            ],
            where: {
              date_creation: {
                [Op.between]: [startDate, endDate]
              },
              type_procedure: {
                [Op.ne]: null
              }
            },
            group: ['type_procedure'],
            order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
          });

          const formattedData = dossiersParType.map(item => ({
            type: item.type_procedure || 'Non défini',
            valeur: parseInt(item.dataValues.valeur) || 0
          }));

          console.log(`✅ [Statistics] ${dossiersParType.length} types de dossiers trouvés:`, formattedData);

          const types = [
            'Permis d\'études',
            'Permis de travail', 
            'Résidence permanente',
            'Visa visiteur',
            'Citoyenneté'
          ];
          
          const result = types.map(type => {
            const found = formattedData.find(item => item.type === type);
            return { type, valeur: found ? found.valeur : 0 };
          });

          formattedData.forEach(item => {
            if (!types.includes(item.type)) {
              result.push(item);
            }
          });

          resolve(result);
        } catch (error) {
          console.error('❌ [Statistics] Erreur dossiers globaux:', error);
          reject(error);
        }
      })
    ]);

    const response = {
      success: true,
      global: true, // Indicateur que ce sont des statistiques globales
      data: {
        leadsParSource: leadsResponse.status === 'fulfilled' ? leadsResponse.value : [],
        revenusParMois: revenusResponse.status === 'fulfilled' ? revenusResponse.value : [],
        dossiersParType: dossiersResponse.status === 'fulfilled' ? dossiersResponse.value : []
      },
      periode,
      errors: []
    };

    // Ajouter les erreurs s'il y en a
    if (leadsResponse.status === 'rejected') {
      response.errors.push({ type: 'leads', error: leadsResponse.reason.message });
      console.error('❌ [Statistics] Erreur leads globaux:', leadsResponse.reason);
    }
    if (revenusResponse.status === 'rejected') {
      response.errors.push({ type: 'revenus', error: revenusResponse.reason.message });
      console.error('❌ [Statistics] Erreur revenus globaux:', revenusResponse.reason);
    }
    if (dossiersResponse.status === 'rejected') {
      response.errors.push({ type: 'dossiers', error: dossiersResponse.reason.message });
      console.error('❌ [Statistics] Erreur dossiers globaux:', dossiersResponse.reason);
    }

    // Log du résumé final
    const totalLeads = response.data.leadsParSource.reduce((sum, item) => sum + item.valeur, 0);
    const totalRevenus = response.data.revenusParMois.reduce((sum, item) => sum + item.valeur, 0);
    const totalDossiers = response.data.dossiersParType.reduce((sum, item) => sum + item.valeur, 0);

    console.log(`🎯 [Statistics] Statistiques GLOBALES pour ${periode}:`);
    console.log(`   📊 Total leads: ${totalLeads}`);
    console.log(`   💰 Total revenus: ${totalRevenus}`);
    console.log(`   📁 Total dossiers: ${totalDossiers}`);
    console.log(`   ❌ Erreurs: ${response.errors.length}`);

    res.json(response);
  } catch (error) {
    console.error('❌ [Statistics] Erreur lors de la récupération des statistiques globales:', error);
    res.status(500).json({ 
      success: false, 
      global: true,
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

module.exports = router;
