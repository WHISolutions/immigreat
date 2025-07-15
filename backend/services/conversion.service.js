const { getSequelize } = require('../config/db.config');

class ConversionService {
  
  /**
   * Génère un numéro de dossier unique au format CL-AAAA-NNN
   */
  static async generateDossierNumber() {
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    
    const currentYear = new Date().getFullYear();
    const prefix = `CL-${currentYear}-`;
    
    // Trouver le dernier numéro de dossier de l'année
    const lastClient = await Client.findOne({
      where: {
        numero_dossier: {
          [sequelize.Sequelize.Op.like]: `${prefix}%`
        }
      },
      order: [['numero_dossier', 'DESC']]
    });
    
    let nextNumber = 1;
    if (lastClient && lastClient.numero_dossier) {
      const lastNumber = parseInt(lastClient.numero_dossier.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
  
  /**
   * Convertit un lead en client
   */
  static async convertLeadToClient(leadId, utilisateur, notes = null) {
    const sequelize = getSequelize();
    const Lead = sequelize.models.Lead;
    const Client = sequelize.models.Client;
    const ConversionLog = sequelize.models.ConversionLog;
    
    // Démarrer une transaction
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Récupérer le lead
      const lead = await Lead.findByPk(leadId, { transaction });
      if (!lead) {
        throw new Error('Lead non trouvé');
      }
      
      // Vérifier si le lead n'est pas déjà converti
      if (lead.statut === 'Client') {
        throw new Error('Ce lead a déjà été converti en client');
      }
      
      // 2. Générer un numéro de dossier unique
      const numeroDossier = await this.generateDossierNumber();
      
      // 3. Créer le client avec les données du lead
      const clientData = {
        nom: lead.nom,
        prenom: lead.prenom,
        email: lead.email,
        telephone: lead.telephone,
        type_procedure: lead.interet,
        conseillere: lead.conseillere,
        statut: 'En cours',
        numero_dossier: numeroDossier,
        informations_specifiques: {
          source_lead: lead.source,
          notes_lead: lead.notes,
          date_creation_lead: lead.date_creation
        }
      };
      
      const newClient = await Client.create(clientData, { transaction });
      
      // 4. Mettre à jour le statut du lead
      await lead.update({ 
        statut: 'Client',
        date_modification: new Date()
      }, { transaction });
      
      // 5. Enregistrer la conversion dans le journal
      await ConversionLog.create({
        lead_id: leadId,
        client_id: newClient.id,
        numero_dossier: numeroDossier,
        utilisateur: utilisateur,
        notes: notes,
        date_conversion: new Date()
      }, { transaction });
      
      /*
       * ──────────────────────────────────────────────────────────────
       *  Création automatique d'une facture brouillon pour le client
       * ──────────────────────────────────────────────────────────────
       */
      const Facture = sequelize.models.Facture;
      let newFacture = null;
      if (Facture) {
        try {
          const today = new Date();
          const year = today.getFullYear();
          // Chercher le dernier numéro de facture de l'année courante
          const lastInvoice = await Facture.findOne({
            where: { numero_facture: { [sequelize.Sequelize.Op.like]: `F${year}-%` } },
            order: [['createdAt', 'DESC']],
            transaction
          });

          let nextNumber = 1;
          if (lastInvoice && lastInvoice.numero_facture) {
            const lastNum = parseInt(lastInvoice.numero_facture.split('-')[1]);
            nextNumber = isNaN(lastNum) ? 1 : lastNum + 1;
            
            // 🔴 CORRECTION : Gérer le cas où on dépasse 999
            if (nextNumber > 999) {
              console.warn(`⚠️  Numéro de facture dépasserait 999 (${nextNumber}). Recherche d'un numéro disponible...`);
              
              // Chercher le premier numéro disponible entre 1 et 999
              const existingNumbers = await Facture.findAll({
                where: { numero_facture: { [sequelize.Sequelize.Op.like]: `F${year}-%` } },
                attributes: ['numero_facture'],
                transaction
              });
              
              const usedNumbers = existingNumbers.map(f => parseInt(f.numero_facture.split('-')[1])).filter(n => !isNaN(n));
              
              nextNumber = 1;
              while (usedNumbers.includes(nextNumber) && nextNumber <= 999) {
                nextNumber++;
              }
              
              if (nextNumber > 999) {
                throw new Error(`Impossible de générer un numéro de facture : tous les numéros de F${year}-001 à F${year}-999 sont utilisés`);
              }
            }
          }

          const numero_facture = `F${year}-${String(nextNumber).padStart(3, '0')}`;

          // Déterminer qui crée la facture lors de la conversion
          const createdBy = utilisateur || newClient.conseillere || 'Système';
          console.log('👤 Facture automatique (conversion) créée par:', createdBy);

          newFacture = await Facture.create({
            numero_facture,
            client_id: newClient.id,
            date_creation: today,
            montant: 0,
            statut: 'brouillon',
            validePar: createdBy, // 🔑 CORRECTION : Assigner la facture à la bonne personne
            dateValidation: today,

            // Ancien système (compatibilité)
            numero: numero_facture,
            client: `${newClient.nom} ${newClient.prenom}`,
            dateEmission: today,
            dateEcheance: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
            description: `Facture automatique (conversion lead) - ${newClient.type_procedure}`
          }, { transaction });

          console.log('🧾 Facture brouillon (conversion) créée:', newFacture.numero_facture);
        } catch (factErr) {
          console.error('⚠️  Erreur création facture lors conversion lead ➜ client:', factErr);
          // Ne pas interrompre la conversion ; la transaction continue
        }
      } else {
        console.warn('⚠️  Modèle Facture non disponible lors conversion lead ➜ client');
      }
      
      // Valider la transaction
      await transaction.commit();
      
      return {
        success: true,
        client: newClient,
        lead: lead,
        numeroDossier: numeroDossier
      };
      
    } catch (error) {
      // Annuler la transaction en cas d'erreur
      await transaction.rollback();
      throw error;
    }
  }
  
  /**
   * Récupère l'historique des conversions
   */
  static async getConversionHistory(limit = 50) {
    const sequelize = getSequelize();
    const ConversionLog = sequelize.models.ConversionLog;
    const Lead = sequelize.models.Lead;
    const Client = sequelize.models.Client;
    
    const conversions = await ConversionLog.findAll({
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['nom', 'prenom', 'email']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['nom', 'prenom', 'numero_dossier']
        }
      ],
      order: [['date_conversion', 'DESC']],
      limit: limit
    });
    
    return conversions;
  }
}

module.exports = ConversionService; 