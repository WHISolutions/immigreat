const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Route GET pour récupérer les données complètes d'un client pour les rapports
router.get('/client/:id/rapport-donnees', optionalAuth, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    const Document = sequelize.models.Document;
    const RendezVous = sequelize.models.RendezVous;
    const Facture = sequelize.models.Facture;
    const { id } = req.params;

    console.log(`🔄 Récupération des données de rapport pour le client ${id}`);

    // Récupérer le client avec toutes ses données associées
    const client = await Client.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'type_document', 'nom_fichier', 'date_televersement'],
          required: false
        }
      ]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Récupérer les rendez-vous du client
    const rendezVous = await RendezVous.findAll({
      where: {
        [Op.or]: [
          { client_id: id },
          { client_nom: `${client.prenom} ${client.nom}` },
          { client_nom: `${client.nom} ${client.prenom}` }
        ]
      },
      order: [['date_rdv', 'DESC']],
      limit: 20
    });

    // Récupérer les factures du client (si le modèle existe)
    let factures = [];
    try {
      if (sequelize.models.Facture) {
        factures = await Facture.findAll({
          where: {
            [Op.or]: [
              { client: `${client.prenom} ${client.nom}` },
              { client: `${client.nom} ${client.prenom}` }
            ]
          },
          order: [['dateEmission', 'DESC']],
          limit: 10
        });
      }
    } catch (factureError) {
      console.warn('⚠️ Erreur récupération factures (modèle non disponible):', factureError.message);
    }

    // Calculer la progression basée sur le statut et les données
    let progression = 0;
    switch (client.statut) {
      case 'nouveau':
      case 'En attente':
        progression = 15;
        break;
      case 'En cours':
        progression = 60;
        break;
      case 'Terminé':
      case 'Complété':
        progression = 100;
        break;
      case 'Suspendu':
        progression = 30;
        break;
      case 'Annulé':
        progression = 0;
        break;
      default:
        progression = 45;
    }

    // Analyser les documents pour ajuster la progression
    const documentsRecus = client.documents ? client.documents.length : 0;
    if (documentsRecus > 0 && progression < 40) {
      progression = Math.max(progression, 25);
    }
    if (documentsRecus >= 3 && progression < 60) {
      progression = Math.max(progression, 40);
    }

    // Créer les étapes du dossier basées sur les données réelles
    const etapes = [];
    
    // Étape 1: Ouverture du dossier
    const dateCreation = client.date_creation;
    etapes.push({
      nom: 'Ouverture du dossier',
      date: dateCreation ? new Date(dateCreation).toLocaleDateString('fr-CA') : null,
      statut: 'complete',
      description: 'Dossier créé et informations initiales enregistrées'
    });

    // Étape 2: Documents reçus
    if (documentsRecus > 0) {
      const premiereUpload = client.documents.reduce((earliest, doc) => {
        const docDate = new Date(doc.date_televersement);
        return !earliest || docDate < earliest ? docDate : earliest;
      }, null);
      
      etapes.push({
        nom: 'Documents reçus',
        date: premiereUpload ? premiereUpload.toLocaleDateString('fr-CA') : null,
        statut: documentsRecus >= 3 ? 'complete' : 'en_cours',
        description: `${documentsRecus} document(s) reçu(s)`
      });
    } else {
      etapes.push({
        nom: 'Documents en attente',
        date: null,
        statut: 'en_attente',
        description: 'En attente de la réception des documents'
      });
    }

    // Étape 3: Traitement
    if (progression >= 60) {
      etapes.push({
        nom: 'Demande soumise',
        date: client.date_modification ? new Date(client.date_modification).toLocaleDateString('fr-CA') : null,
        statut: progression >= 80 ? 'complete' : 'en_cours',
        description: 'Demande officiellement soumise aux autorités'
      });
    }

    // Étape 4: Traitement en cours
    if (progression >= 80) {
      etapes.push({
        nom: 'Traitement en cours',
        date: null,
        statut: progression === 100 ? 'complete' : 'en_cours',
        description: 'Dossier en cours de traitement par les autorités'
      });
    }

    // Étape 5: Décision finale
    if (progression === 100) {
      etapes.push({
        nom: 'Décision finale',
        date: client.date_modification ? new Date(client.date_modification).toLocaleDateString('fr-CA') : null,
        statut: 'complete',
        description: 'Procédure complétée avec succès'
      });
    } else {
      etapes.push({
        nom: 'Décision finale',
        date: null,
        statut: 'en_attente',
        description: 'En attente de la décision finale'
      });
    }

    // Analyser les finances
    let totalPaye = 0;
    let totalEnAttente = 0;
    let facturesPayees = 0;
    let facturesEnAttente = 0;

    factures.forEach(facture => {
      const montant = parseFloat(facture.montantTTC) || 0;
      if (facture.statut === 'payee' || facture.statut === 'Payée') {
        totalPaye += montant;
        facturesPayees++;
      } else {
        totalEnAttente += montant;
        facturesEnAttente++;
      }
    });

    // Actions requises basées sur les données réelles
    const actionsRequises = [];
    
    // Actions basées sur les documents manquants
    if (documentsRecus < 3) {
      actionsRequises.push({
        titre: 'Compléter les documents',
        description: 'Certains documents sont encore manquants pour votre dossier.',
        echeance: null,
        priorite: 'haute',
        icone: 'fas fa-file-upload'
      });
    }

    // Actions basées sur les factures
    if (facturesEnAttente > 0) {
      actionsRequises.push({
        titre: 'Paiement en attente',
        description: `${facturesEnAttente} facture(s) en attente de paiement.`,
        echeance: null,
        priorite: 'moyenne',
        icone: 'fas fa-credit-card'
      });
    }

    // Actions basées sur les rendez-vous
    const prochainRdv = rendezVous.find(rdv => new Date(rdv.date_rdv) >= new Date());
    if (prochainRdv) {
      actionsRequises.push({
        titre: 'Prochain rendez-vous',
        description: `Rendez-vous prévu le ${new Date(prochainRdv.date_rdv).toLocaleDateString('fr-FR')} à ${prochainRdv.heure_debut}`,
        echeance: prochainRdv.date_rdv,
        priorite: 'moyenne',
        icone: 'fas fa-calendar-check'
      });
    }

    // Prochaines étapes basées sur le statut
    let prochaine_etape = '';
    if (progression < 25) {
      prochaine_etape = 'Collecte et vérification des documents requis';
    } else if (progression < 60) {
      prochaine_etape = 'Préparation et soumission de la demande officielle';
    } else if (progression < 80) {
      prochaine_etape = 'Suivi du traitement par les autorités compétentes';
    } else if (progression < 100) {
      prochaine_etape = 'Finalisation du dossier et communication des résultats';
    } else {
      prochaine_etape = 'Dossier complété';
    }

    const rapportData = {
      // Informations client
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        numero_dossier: client.numero_dossier || `D-${new Date().getFullYear()}-${String(client.id).padStart(3, '0')}`,
        type_procedure: client.type_procedure,
        statut: client.statut,
        date_creation: client.date_creation,
        date_modification: client.date_modification,
        conseillere: client.conseillere,
        notes: client.notes
      },

      // Progression
      progression: {
        pourcentage: progression,
        statut: client.statut,
        etapes: etapes,
        prochaine_etape: prochaine_etape
      },

      // Documents
      documents: {
        total: documentsRecus,
        liste: client.documents || [],
        manquants: Math.max(0, 3 - documentsRecus) // Estimation basique
      },

      // Rendez-vous
      rendez_vous: {
        total: rendezVous.length,
        prochains: rendezVous.filter(rdv => new Date(rdv.date_rdv) >= new Date()),
        historique: rendezVous.filter(rdv => new Date(rdv.date_rdv) < new Date()),
        liste: rendezVous.map(rdv => ({
          id: rdv.id,
          date: rdv.date_rdv,
          heure: rdv.heure_debut,
          type: rdv.type_rdv,
          statut: rdv.statut,
          notes: rdv.notes
        }))
      },

      // Finances
      finances: {
        total_paye: totalPaye,
        total_en_attente: totalEnAttente,
        factures_payees: facturesPayees,
        factures_en_attente: facturesEnAttente,
        liste_factures: factures.map(f => ({
          id: f.id,
          numero: f.numero,
          montant: f.montantTTC,
          statut: f.statut,
          date_emission: f.dateEmission,
          date_paiement: f.datePaiement
        }))
      },

      // Actions requises
      actions_requises: actionsRequises,

      // Métadonnées du rapport
      rapport: {
        date_generation: new Date().toISOString(),
        type: 'avancement',
        version: '1.0'
      }
    };

    console.log(`✅ Données de rapport récupérées pour le client ${client.prenom} ${client.nom}`);

    res.json({
      success: true,
      message: 'Données de rapport récupérées avec succès',
      data: rapportData
    });

  } catch (error) {
    console.error('❌ Erreur récupération données rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de rapport',
      error: error.message
    });
  }
});

module.exports = router;
