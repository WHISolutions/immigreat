const { initializeDatabase } = require('./config/db.config');

async function ajouterDonneesTestRapport() {
  try {
    console.log('🧪 Ajout de données de test pour les rapports...');
    
    // Initialiser la base et les modèles
    const sequelize = await initializeDatabase();
    console.log('✅ Base de données initialisée');

    const Client = sequelize.models.Client;
    const Document = sequelize.models.Document;
    const RendezVous = sequelize.models.RendezVous;
    const Facture = sequelize.models.Facture;

    // Récupérer le premier client
    const client = await Client.findOne();
    if (!client) {
      console.log('❌ Aucun client trouvé. Créez d\'abord des clients.');
      return;
    }

    console.log(`📋 Ajout de données pour ${client.prenom} ${client.nom} (ID: ${client.id})`);

    // 1. Ajouter des rendez-vous réalistes
    const rendezVousData = [
      {
        client_nom: `${client.prenom} ${client.nom}`,
        client_id: client.id,
        conseillere_nom: client.conseillere || 'Sophie Martin',
        date_rdv: '2025-01-10',
        heure_debut: '09:00',
        heure_fin: '10:00',
        type_rdv: 'Consultation initiale',
        statut: 'Complété',
        notes: 'Première consultation pour évaluer le dossier'
      },
      {
        client_nom: `${client.prenom} ${client.nom}`,
        client_id: client.id,
        conseillere_nom: client.conseillere || 'Sophie Martin',
        date_rdv: '2025-02-15',
        heure_debut: '14:00',
        heure_fin: '15:00',
        type_rdv: 'Suivi documents',
        statut: 'Complété',
        notes: 'Révision des documents fournis'
      },
      {
        client_nom: `${client.prenom} ${client.nom}`,
        client_id: client.id,
        conseillere_nom: client.conseillere || 'Sophie Martin',
        date_rdv: '2025-03-20',
        heure_debut: '10:30',
        heure_fin: '11:30',
        type_rdv: 'Suivi progression',
        statut: 'Confirmé',
        notes: 'Point sur l\'avancement du dossier'
      }
    ];

    // Supprimer anciens rendez-vous de test
    await RendezVous.destroy({
      where: { client_id: client.id }
    });

    // Créer nouveaux rendez-vous
    for (const rdvData of rendezVousData) {
      await RendezVous.create(rdvData);
    }
    console.log(`✅ ${rendezVousData.length} rendez-vous ajoutés`);

    // 2. Ajouter des factures réalistes (si le modèle existe)
    try {
      if (Facture) {
        const facturesData = [
          {
            numero: `F-2025-${String(client.id).padStart(3, '0')}-001`,
            client: `${client.prenom} ${client.nom}`,
            montantHT: 500.00,
            montantTTC: 575.00,
            statut: 'payee',
            dateEmission: '2025-01-15',
            datePaiement: '2025-01-20',
            description: 'Frais de consultation initiale'
          },
          {
            numero: `F-2025-${String(client.id).padStart(3, '0')}-002`,
            client: `${client.prenom} ${client.nom}`,
            montantHT: 2000.00,
            montantTTC: 2300.00,
            statut: 'payee',
            dateEmission: '2025-02-01',
            datePaiement: '2025-02-05',
            description: 'Frais de dossier - Phase 1'
          },
          {
            numero: `F-2025-${String(client.id).padStart(3, '0')}-003`,
            client: `${client.prenom} ${client.nom}`,
            montantHT: 1500.00,
            montantTTC: 1725.00,
            statut: 'en_attente',
            dateEmission: '2025-03-01',
            description: 'Frais de dossier - Phase 2'
          }
        ];

        // Supprimer anciennes factures de test
        await Facture.destroy({
          where: { 
            client: `${client.prenom} ${client.nom}`
          }
        });

        // Créer nouvelles factures
        for (const factureData of facturesData) {
          await Facture.create(factureData);
        }
        console.log(`✅ ${facturesData.length} factures ajoutées`);
      }
    } catch (factureError) {
      console.warn('⚠️ Modèle Facture non disponible, factures non ajoutées');
    }

    // 3. Mettre à jour le statut du client pour une progression réaliste
    await client.update({
      statut: 'En cours',
      type_procedure: client.type_procedure || 'Résidence permanente - Travailleur qualifié',
      notes: 'Dossier en cours de traitement. Documents reçus et première phase payée.'
    });
    console.log('✅ Statut client mis à jour');

    console.log('🎉 Données de test ajoutées avec succès !');
    console.log('');
    console.log('📊 Résumé pour les rapports :');
    console.log(`   👤 Client: ${client.prenom} ${client.nom}`);
    console.log(`   📁 Documents: ${client.documents ? client.documents.length : 'Existants'}`);
    console.log(`   📅 Rendez-vous: ${rendezVousData.length} ajoutés`);
    console.log(`   💰 Factures: Ajoutées si modèle disponible`);
    console.log(`   📈 Statut: ${client.statut} → En cours`);
    console.log('');
    console.log('🔍 Testez maintenant les rapports dans l\'interface !');

  } catch (error) {
    console.error('❌ Erreur ajout données test:', error);
  }
  
  process.exit(0);
}

ajouterDonneesTestRapport();
