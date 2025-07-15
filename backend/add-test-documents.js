const initializeModels = require('./models');

async function addTestDocuments() {
  try {
    console.log('🔄 Ajout de documents de test...');
    
    // Initialiser les modèles
    const db = initializeModels();
    const { Client, Document } = db;
    
    console.log('✅ Modèles initialisés');
    
    // Récupérer le premier client
    const client = await Client.findOne();
    
    if (!client) {
      console.log('❌ Aucun client trouvé. Créez d\'abord un client.');
      return;
    }
    
    console.log(`📋 Client trouvé: ${client.prenom} ${client.nom} (ID: ${client.id})`);
    
    // Ajouter des documents de test
    const documentsToAdd = [
      {
        client_id: client.id,
        type_document: 'Copie de passeport',
        nom_fichier: `Passeport_${client.prenom}_${client.nom}.pdf`,
        chemin_fichier: `/uploads/clients/${client.id}/passeport.pdf`,
        date_televersement: new Date('2025-01-05')
      },
      {
        client_id: client.id,
        type_document: 'Copie de CIN',
        nom_fichier: `CIN_${client.prenom}_${client.nom}.pdf`,
        chemin_fichier: `/uploads/clients/${client.id}/cin.pdf`,
        date_televersement: new Date('2025-01-08')
      },
      {
        client_id: client.id,
        type_document: 'Photo d\'identité',
        nom_fichier: `Photo_${client.prenom}_${client.nom}.jpg`,
        chemin_fichier: `/uploads/clients/${client.id}/photo.jpg`,
        date_televersement: new Date('2025-01-10')
      },
      {
        client_id: client.id,
        type_document: 'Diplôme universitaire',
        nom_fichier: `Diplome_${client.prenom}_${client.nom}.pdf`,
        chemin_fichier: `/uploads/clients/${client.id}/diplome.pdf`,
        date_televersement: new Date('2025-01-12')
      },
      {
        client_id: client.id,
        type_document: 'Relevé bancaire',
        nom_fichier: `Releve_bancaire_${client.prenom}_${client.nom}.pdf`,
        chemin_fichier: `/uploads/clients/${client.id}/releve_bancaire.pdf`,
        date_televersement: new Date('2025-01-15')
      }
    ];
    
    // Supprimer les anciens documents de test pour ce client
    await Document.destroy({
      where: { client_id: client.id }
    });
    console.log('🗑️ Anciens documents supprimés');
    
    // Créer les nouveaux documents
    const createdDocuments = await Document.bulkCreate(documentsToAdd);
    
    console.log(`✅ ${createdDocuments.length} documents ajoutés au client ${client.prenom} ${client.nom} (ID: ${client.id})`);
    console.log('📁 Documents ajoutés:');
    createdDocuments.forEach(doc => {
      console.log(`  - ${doc.type_document}: ${doc.nom_fichier}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des documents:', error);
    process.exit(1);
  }
}

addTestDocuments(); 