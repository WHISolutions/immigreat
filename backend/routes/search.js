const express = require('express');
const router = express.Router();
const { getSequelize } = require('../config/db.config');
const { Op } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Route de recherche globale
router.get('/global', optionalAuth, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { query } = req.query;
    const user = req.user;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          leads: [],
          clients: [],
          dossiers: [],
          factures: [],
          conseillers: []
        },
        total: 0
      });
    }
    
    const searchTerm = query.trim();
    console.log('🔍 Recherche globale:', searchTerm, 'par utilisateur:', user ? `${user.nom} ${user.prenom} (${user.role})` : 'Non authentifié');
    
    let results = {
      leads: [],
      clients: [],
      dossiers: [],
      factures: [],
      conseillers: []
    };
    
    // 1. Recherche dans les LEADS
    try {
      const Lead = sequelize.models.Lead;
      if (Lead) {
        let leadWhereConditions = {
          [Op.or]: [
            { nom: { [Op.like]: `%${searchTerm}%` } },
            { prenom: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } },
            { telephone: { [Op.like]: `%${searchTerm}%` } },
            sequelize.where(
              sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
              { [Op.like]: `%${searchTerm}%` }
            )
          ]
        };
        
        // Filtrage par rôle pour les leads
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          leadWhereConditions = {
            [Op.and]: [
              leadWhereConditions,
              {
                [Op.or]: [
                  { conseiller_id: user.id },
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() },
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          };
        }
        
        const leads = await Lead.findAll({
          where: leadWhereConditions,
          limit: 10,
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'statut', 'source'],
          order: [['created_at', 'DESC']]
        });
        
        results.leads = leads.map(lead => ({
          id: lead.id,
          type: 'lead',
          title: `${lead.prenom} ${lead.nom}`,
          subtitle: lead.email,
          description: `📞 ${lead.telephone} • ${lead.statut}`,
          metadata: {
            source: lead.source,
            statut: lead.statut
          }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche leads:', error.message);
    }
    
    // 2. Recherche dans les CLIENTS
    try {
      const Client = sequelize.models.Client;
      if (Client) {
        let clientWhereConditions = {
          [Op.or]: [
            { nom: { [Op.like]: `%${searchTerm}%` } },
            { prenom: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } },
            { telephone: { [Op.like]: `%${searchTerm}%` } },
            { numero_dossier: { [Op.like]: `%${searchTerm}%` } },
            sequelize.where(
              sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
              { [Op.like]: `%${searchTerm}%` }
            )
          ]
        };
        
        // Filtrage par rôle pour les clients
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          clientWhereConditions = {
            [Op.and]: [
              clientWhereConditions,
              {
                [Op.or]: [
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() },
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          };
        }
        
        const clients = await Client.findAll({
          where: clientWhereConditions,
          limit: 10,
          attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'statut', 'type_procedure', 'numero_dossier'],
          order: [['date_creation', 'DESC']]
        });
        
        results.clients = clients.map(client => ({
          id: client.id,
          type: 'client',
          title: `${client.prenom} ${client.nom}`,
          subtitle: client.email,
          description: `📞 ${client.telephone} • ${client.type_procedure}`,
          metadata: {
            numero_dossier: client.numero_dossier,
            statut: client.statut,
            type_procedure: client.type_procedure
          }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche clients:', error.message);
    }
    
    // 3. Recherche dans les FACTURES
    try {
      const Facture = sequelize.models.Facture;
      if (Facture) {
        let factureWhereConditions = {
          [Op.or]: [
            { numero_facture: { [Op.like]: `%${searchTerm}%` } },
            { numero: { [Op.like]: `%${searchTerm}%` } },
            { client: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        };
        
        // Filtrage par rôle pour les factures
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          factureWhereConditions = {
            [Op.and]: [
              factureWhereConditions,
              {
                [Op.or]: [
                  { validePar: fullName },
                  { validePar: fullName.toLowerCase() },
                  { validePar: user.prenom },
                  { validePar: user.nom }
                ]
              }
            ]
          };
        }
        
        const factures = await Facture.findAll({
          where: factureWhereConditions,
          limit: 10,
          attributes: ['id', 'numero_facture', 'numero', 'client', 'montant', 'monnaie', 'statut', 'dateEcheance'],
          order: [['createdAt', 'DESC']]
        });
        
        results.factures = factures.map(facture => ({
          id: facture.id,
          type: 'facture',
          title: `Facture ${facture.numero_facture || facture.numero}`,
          subtitle: facture.client,
          description: `💰 ${facture.montant} ${facture.monnaie} • ${facture.statut}`,
          metadata: {
            numero: facture.numero_facture || facture.numero,
            montant: facture.montant,
            monnaie: facture.monnaie,
            statut: facture.statut,
            dateEcheance: facture.dateEcheance
          }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche factures:', error.message);
    }
    
    // 4. Recherche dans les DOSSIERS (via clients avec numéro de dossier)
    try {
      const Client = sequelize.models.Client;
      if (Client) {
        let dossierWhereConditions = {
          [Op.and]: [
            { numero_dossier: { [Op.not]: null } },
            { numero_dossier: { [Op.ne]: '' } },
            {
              [Op.or]: [
                { numero_dossier: { [Op.like]: `%${searchTerm}%` } },
                { nom: { [Op.like]: `%${searchTerm}%` } },
                { prenom: { [Op.like]: `%${searchTerm}%` } },
                { type_procedure: { [Op.like]: `%${searchTerm}%` } }
              ]
            }
          ]
        };
        
        // Filtrage par rôle pour les dossiers
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          dossierWhereConditions = {
            [Op.and]: [
              dossierWhereConditions,
              {
                [Op.or]: [
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() },
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          };
        }
        
        const dossiers = await Client.findAll({
          where: dossierWhereConditions,
          limit: 10,
          attributes: ['id', 'nom', 'prenom', 'numero_dossier', 'type_procedure', 'statut', 'etape_actuelle'],
          order: [['date_creation', 'DESC']]
        });
        
        results.dossiers = dossiers.map(dossier => ({
          id: dossier.id,
          type: 'dossier',
          title: `Dossier ${dossier.numero_dossier}`,
          subtitle: `${dossier.prenom} ${dossier.nom}`,
          description: `📁 ${dossier.type_procedure} • ${dossier.statut}`,
          metadata: {
            numero_dossier: dossier.numero_dossier,
            type_procedure: dossier.type_procedure,
            statut: dossier.statut,
            etape_actuelle: dossier.etape_actuelle
          }
        }));
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche dossiers:', error.message);
    }
    
    // 5. Recherche dans les CONSEILLERS (seulement pour admin/directeur)
    try {
      if (user && (user.role === 'administrateur' || user.role === 'directeur')) {
        const User = sequelize.models.User;
        if (User) {
          const conseillers = await User.findAll({
            where: {
              [Op.and]: [
                { role: 'conseillere' },
                {
                  [Op.or]: [
                    { nom: { [Op.like]: `%${searchTerm}%` } },
                    { prenom: { [Op.like]: `%${searchTerm}%` } },
                    { email: { [Op.like]: `%${searchTerm}%` } },
                    sequelize.where(
                      sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
                      { [Op.like]: `%${searchTerm}%` }
                    )
                  ]
                }
              ]
            },
            limit: 10,
            attributes: ['id', 'nom', 'prenom', 'email', 'role', 'derniere_connexion'],
            order: [['derniere_connexion', 'DESC']]
          });
          
          results.conseillers = conseillers.map(conseiller => ({
            id: conseiller.id,
            type: 'conseiller',
            title: `${conseiller.prenom} ${conseiller.nom}`,
            subtitle: conseiller.email,
            description: `👩‍💼 Conseillère • Dernière connexion: ${conseiller.derniere_connexion ? new Date(conseiller.derniere_connexion).toLocaleDateString() : 'Jamais'}`,
            metadata: {
              role: conseiller.role,
              derniere_connexion: conseiller.derniere_connexion
            }
          }));
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur recherche conseillers:', error.message);
    }
    
    const total = results.leads.length + results.clients.length + results.dossiers.length + results.factures.length + results.conseillers.length;
    
    console.log(`✅ Recherche globale terminée: ${total} résultats trouvés`);
    console.log(`   - Leads: ${results.leads.length}`);
    console.log(`   - Clients: ${results.clients.length}`);
    console.log(`   - Dossiers: ${results.dossiers.length}`);
    console.log(`   - Factures: ${results.factures.length}`);
    console.log(`   - Conseillers: ${results.conseillers.length}`);
    
    res.json({
      success: true,
      data: results,
      total,
      query: searchTerm
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche globale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    });
  }
});

// Route pour l'auto-complétion rapide
router.get('/autocomplete', optionalAuth, async (req, res) => {
  try {
    const sequelize = getSequelize();
    const { query } = req.query;
    const user = req.user;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }
    
    const searchTerm = query.trim();
    let suggestions = [];
    
    // Recherche rapide dans les noms de clients et leads
    try {
      const Client = sequelize.models.Client;
      const Lead = sequelize.models.Lead;
      
      if (Client) {
        let clientWhere = {
          [Op.or]: [
            { nom: { [Op.like]: `%${searchTerm}%` } },
            { prenom: { [Op.like]: `%${searchTerm}%` } },
            sequelize.where(
              sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
              { [Op.like]: `%${searchTerm}%` }
            )
          ]
        };
        
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          clientWhere = {
            [Op.and]: [
              clientWhere,
              {
                [Op.or]: [
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() },
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          };
        }
        
        const clients = await Client.findAll({
          where: clientWhere,
          limit: 5,
          attributes: ['nom', 'prenom'],
          order: [['date_creation', 'DESC']]
        });
        
        suggestions.push(...clients.map(client => ({
          text: `${client.prenom} ${client.nom}`,
          type: 'client'
        })));
      }
      
      if (Lead) {
        let leadWhere = {
          [Op.or]: [
            { nom: { [Op.like]: `%${searchTerm}%` } },
            { prenom: { [Op.like]: `%${searchTerm}%` } },
            sequelize.where(
              sequelize.fn('CONCAT', sequelize.col('prenom'), ' ', sequelize.col('nom')),
              { [Op.like]: `%${searchTerm}%` }
            )
          ]
        };
        
        if (user && user.role === 'conseillere') {
          const fullName = `${user.prenom} ${user.nom}`;
          leadWhere = {
            [Op.and]: [
              leadWhere,
              {
                [Op.or]: [
                  { conseiller_id: user.id },
                  { conseillere: fullName },
                  { conseillere: fullName.toLowerCase() },
                  { conseillere: { [Op.is]: null } },
                  { conseillere: '' }
                ]
              }
            ]
          };
        }
        
        const leads = await Lead.findAll({
          where: leadWhere,
          limit: 5,
          attributes: ['nom', 'prenom'],
          order: [['created_at', 'DESC']]
        });
        
        suggestions.push(...leads.map(lead => ({
          text: `${lead.prenom} ${lead.nom}`,
          type: 'lead'
        })));
      }
    } catch (error) {
      console.warn('⚠️ Erreur autocomplete:', error.message);
    }
    
    // Limiter à 10 suggestions et supprimer les doublons
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 10);
    
    res.json({
      success: true,
      suggestions: uniqueSuggestions
    });
    
  } catch (error) {
    console.error('❌ Erreur autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'autocomplete',
      error: error.message
    });
  }
});

module.exports = router;
