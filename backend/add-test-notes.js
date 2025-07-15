const { getSequelize } = require('./config/db.config');

async function addTestNotes() {
  try {
    console.log('🔄 Ajout de notes de test...');
    
    const sequelize = getSequelize();
    const Client = sequelize.models.Client;
    
    // Récupérer le premier client
    const client = await Client.findOne();
    
    if (!client) {
      console.log('❌ Aucun client trouvé. Créez d\'abord un client.');
      return;
    }
    
    // Ajouter des notes de test
    const notes = [
      {
        id: 1,
        date: "2025-01-05",
        type: "Suivi",
        auteur: "Marie Tremblay",
        contenu: `Première consultation avec ${client.prenom} ${client.nom}. Dossier ${client.type_procedure} initié. Le client a fourni tous les documents de base requis.`
      },
      {
        id: 2,
        date: "2025-01-08",
        type: "Important",
        auteur: "Sophie Martin",
        contenu: "Vérification des documents soumis. Le passeport expire dans 8 mois, il faudra le renouveler avant la soumission finale."
      },
      {
        id: 3,
        date: "2025-01-12",
        type: "Général",
        auteur: "Julie Lefebvre",
        contenu: "Appel téléphonique avec le client pour faire le point sur l'avancement du dossier. Tout progresse bien selon les délais prévus."
      },
      {
        id: 4,
        date: "2025-01-15",
        type: "Urgent",
        auteur: "Marie Tremblay",
        contenu: "URGENT: Document manquant détecté - Certificat médical requis dans les 48h pour respecter les délais de soumission."
      }
    ];
    
    // Mettre à jour le client avec les notes
    await client.update({ notes: notes });
    
    console.log(`✅ Notes ajoutées au client ${client.prenom} ${client.nom} (ID: ${client.id})`);
    console.log('📋 Notes ajoutées:', notes.length);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des notes:', error);
  }
}

addTestNotes(); 