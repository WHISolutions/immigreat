const { sequelize } = require('./config/db.config');
const db = require('./models');

const addTestData = async () => {
  try {
    console.log('🔄 Suppression des données existantes...');
    
    // Supprimer toutes les données existantes
    await db.Client.destroy({ where: {} });
    await db.Lead.destroy({ where: {} });
    
    console.log('✅ Données existantes supprimées');
    console.log('🔄 Ajout de données de test...');
    
    // Ajouter des clients de test
    const clients = await db.Client.bulkCreate([
      {
        nom: 'Dubois',
        prenom: 'Marie',
        email: 'marie.dubois@email.com',
        telephone: '514-123-4567',
        date_naissance: '1990-05-15',
        adresse: '123 Rue Saint-Denis, Montréal, QC',
        nationalite: 'Française',
        type_procedure: 'Permis d\'études',
        statut: 'En cours',
        conseillere: 'Sophie Martin',
        urgence: true,
        numero_dossier: 'CL-2025-001',
        contact_nom: 'Dubois',
        contact_prenom: 'Pierre',
        contact_relation: 'Époux',
        contact_telephone: '514-123-4568',
        contact_email: 'pierre.dubois@email.com'
      },
      {
        nom: 'Chen',
        prenom: 'Wei',
        email: 'wei.chen@email.com',
        telephone: '438-987-6543',
        date_naissance: '1985-11-22',
        adresse: '456 Avenue du Parc, Montréal, QC',
        nationalite: 'Chinoise',
        type_procedure: 'Résidence permanente',
        statut: 'En attente',
        conseillere: 'Marie Tremblay',
        urgence: false,
        numero_dossier: 'CL-2025-002',
        contact_nom: 'Chen',
        contact_prenom: 'Li',
        contact_relation: 'Épouse',
        contact_telephone: '438-987-6544',
        contact_email: 'li.chen@email.com'
      },
      {
        nom: 'Rodriguez',
        prenom: 'Carlos',
        email: 'carlos.rodriguez@email.com',
        telephone: '514-555-7890',
        date_naissance: '1988-03-10',
        adresse: '789 Boulevard René-Lévesque, Montréal, QC',
        nationalite: 'Mexicaine',
        type_procedure: 'Permis de travail',
        statut: 'Terminé',
        conseillere: 'Julie Lefebvre',
        urgence: false,
        numero_dossier: 'CL-2025-003'
      },
      {
        nom: 'Patel',
        prenom: 'Priya',
        email: 'priya.patel@email.com',
        telephone: '450-321-0987',
        date_naissance: '1992-08-18',
        adresse: '321 Rue Sherbrooke, Montréal, QC',
        nationalite: 'Indienne',
        type_procedure: 'Visa visiteur',
        statut: 'En cours',
        conseillere: 'Sophie Martin',
        urgence: true,
        numero_dossier: 'CL-2025-004'
      },
      {
        nom: 'Johnson',
        prenom: 'Emily',
        email: 'emily.johnson@email.com',
        telephone: '514-666-1234',
        date_naissance: '1987-12-05',
        adresse: '654 Rue Sainte-Catherine, Montréal, QC',
        nationalite: 'Américaine',
        type_procedure: 'Investisseur',
        statut: 'En cours',
        conseillere: 'Marie Tremblay',
        urgence: false,
        numero_dossier: 'CL-2025-005'
      }
    ]);
      // Ajouter des leads de test
    const leads = await db.Lead.bulkCreate([
      {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@example.com',
        telephone: '514-111-2222',
        source: 'Site web',
        interet: 'Permis d\'études',
        pays_origine: 'France',
        type_procedure: 'Permis d\'études',
        statut: 'nouveau',
        notes: 'Étudiante en informatique, souhaite étudier à McGill'
      },
      {
        nom: 'Anderson',
        prenom: 'James',
        email: 'james.anderson@example.com',
        telephone: '416-333-4444',
        source: 'LinkedIn',
        interet: 'Permis de travail',
        pays_origine: 'États-Unis',
        type_procedure: 'Permis de travail',
        statut: 'contacte',
        notes: 'Ingénieur logiciel, offre d\'emploi chez Shopify'
      },
      {
        nom: 'Kim',
        prenom: 'Sarah',
        email: 'sarah.kim@example.com',
        telephone: '604-555-6666',
        source: 'Référence',
        interet: 'Résidence permanente',
        pays_origine: 'Corée du Sud',
        type_procedure: 'Résidence permanente',
        statut: 'qualifie',
        notes: 'Programme fédéral des travailleurs qualifiés'
      },
      {
        nom: 'Olsen',
        prenom: 'Lars',
        email: 'lars.olsen@example.com',
        telephone: '403-777-8888',
        source: 'Facebook',
        interet: 'Visa visiteur',
        pays_origine: 'Norvège',
        type_procedure: 'Visa visiteur',
        statut: 'nouveau',
        notes: 'Visite familiale, séjour de 3 mois'
      },
      {
        nom: 'Silva',
        prenom: 'Ana',
        email: 'ana.silva@example.com',
        telephone: '514-999-0000',
        source: 'Site web',
        interet: 'Résidence permanente',
        pays_origine: 'Brésil',
        type_procedure: 'Regroupement familial',
        statut: 'contacte',
        notes: 'Épouse de citoyen canadien'
      }
    ]);
    
    console.log(`✅ ${clients.length} clients de test ajoutés`);
    console.log(`✅ ${leads.length} leads de test ajoutés`);
    console.log('🎉 Données de test ajoutées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données de test:', error);
  } finally {
    await sequelize.close();
  }
};

// Démarrer le script
addTestData();
