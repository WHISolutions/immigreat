/**
 * Tests pour le module de gestion des clients
 * 
 * Ce fichier contient les tests unitaires et d'intégration pour vérifier
 * le bon fonctionnement du module de gestion des clients.
 */

// Importation des dépendances
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Clients from '../frontend/src/components/Clients';
import ClientDetail from '../frontend/src/components/ClientDetail';
import NewClient from '../frontend/src/components/NewClient';

// Mock des données
const mockClients = [
  {
    id: '1',
    nom: 'Martin',
    prenom: 'Antoine',
    email: 'a.martin@email.com',
    telephone: '+33 6 12 34 56 78',
    typeProcedure: 'Visa Visiteur',
    statut: 'En cours',
    dateCreation: '2025-03-15',
    conseillere: 'Sophie Martin'
  },
  {
    id: '2',
    nom: 'Dubois',
    prenom: 'Marie',
    email: 'm.dubois@email.com',
    telephone: '+33 6 98 76 54 32',
    typeProcedure: 'Permis d\'études',
    statut: 'En attente',
    dateCreation: '2025-04-02',
    conseillere: 'Julie Lefebvre'
  }
];

// Mock des fonctions API
jest.mock('../frontend/src/services/api', () => ({
  getClients: jest.fn(() => Promise.resolve(mockClients)),
  getClientById: jest.fn((id) => Promise.resolve(mockClients.find(client => client.id === id))),
  createClient: jest.fn((client) => Promise.resolve({ ...client, id: '3' })),
  updateClient: jest.fn((id, client) => Promise.resolve({ ...client, id })),
  deleteClient: jest.fn((id) => Promise.resolve({ success: true }))
}));

// Tests pour la liste des clients
describe('Clients Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
  });

  test('Affiche le titre de la page', () => {
    expect(screen.getByText('Gestion des Clients')).toBeInTheDocument();
  });

  test('Affiche la barre de recherche', () => {
    expect(screen.getByPlaceholderText('Rechercher un client...')).toBeInTheDocument();
  });

  test('Affiche les filtres', () => {
    expect(screen.getByText('Filtres')).toBeInTheDocument();
    expect(screen.getByText('Type de procédure')).toBeInTheDocument();
    expect(screen.getByText('Statut du dossier')).toBeInTheDocument();
    expect(screen.getByText('Conseillère')).toBeInTheDocument();
  });

  test('Affiche le bouton Nouveau client', () => {
    expect(screen.getByText('Nouveau client')).toBeInTheDocument();
  });

  test('Affiche la liste des clients', async () => {
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.getByText('Marie Dubois')).toBeInTheDocument();
    });
  });

  test('Filtre les clients par recherche', async () => {
    const searchInput = screen.getByPlaceholderText('Rechercher un client...');
    fireEvent.change(searchInput, { target: { value: 'Martin' } });
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.queryByText('Marie Dubois')).not.toBeInTheDocument();
    });
  });

  test('Filtre les clients par type de procédure', async () => {
    const typeSelect = screen.getByLabelText('Type de procédure');
    fireEvent.change(typeSelect, { target: { value: 'Visa Visiteur' } });
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.queryByText('Marie Dubois')).not.toBeInTheDocument();
    });
  });

  test('Filtre les clients par statut', async () => {
    const statutSelect = screen.getByLabelText('Statut du dossier');
    fireEvent.change(statutSelect, { target: { value: 'En attente' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Antoine Martin')).not.toBeInTheDocument();
      expect(screen.getByText('Marie Dubois')).toBeInTheDocument();
    });
  });

  test('Filtre les clients par conseillère', async () => {
    const conseillerSelect = screen.getByLabelText('Conseillère');
    fireEvent.change(conseillerSelect, { target: { value: 'Sophie Martin' } });
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.queryByText('Marie Dubois')).not.toBeInTheDocument();
    });
  });

  test('Navigation vers la page de détail du client', async () => {
    await waitFor(() => {
      const viewButton = screen.getAllByTitle('Voir détails')[0];
      fireEvent.click(viewButton);
      // Vérifier la navigation (mock)
      expect(window.location.pathname).toBe('/clients/1');
    });
  });
});

// Tests pour la page de détail du client
describe('ClientDetail Component', () => {
  beforeEach(() => {
    // Mock useParams pour simuler l'ID du client dans l'URL
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ id: '1' }),
      useNavigate: () => jest.fn()
    }));

    render(
      <BrowserRouter>
        <ClientDetail />
      </BrowserRouter>
    );
  });

  test('Affiche les informations du client', async () => {
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.getByText('Visa Visiteur')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });
  });

  test('Affiche les onglets', async () => {
    await waitFor(() => {
      expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
      expect(screen.getByText('Procédure')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Historique')).toBeInTheDocument();
      expect(screen.getByText('Factures')).toBeInTheDocument();
      expect(screen.getByText('Rendez-vous')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });
  });

  test('Navigation entre les onglets', async () => {
    await waitFor(() => {
      // Cliquer sur l'onglet Documents
      fireEvent.click(screen.getByText('Documents'));
      expect(screen.getByText('Téléverser un nouveau document')).toBeInTheDocument();
      
      // Cliquer sur l'onglet Factures
      fireEvent.click(screen.getByText('Factures'));
      expect(screen.getByText('Nouvelle facture')).toBeInTheDocument();
      
      // Cliquer sur l'onglet Notes
      fireEvent.click(screen.getByText('Notes'));
      expect(screen.getByText('Ajouter une note')).toBeInTheDocument();
    });
  });

  test('Affiche les boutons d\'action', async () => {
    await waitFor(() => {
      expect(screen.getByText('Facture')).toBeInTheDocument();
      expect(screen.getByText('Contrat')).toBeInTheDocument();
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });
  });

  test('Téléversement de document', async () => {
    await waitFor(() => {
      // Aller à l'onglet Documents
      fireEvent.click(screen.getByText('Documents'));
      
      // Remplir le formulaire
      const typeSelect = screen.getByLabelText('Type de document');
      fireEvent.change(typeSelect, { target: { value: 'Passeport' } });
      
      const fileInput = screen.getByLabelText('Fichier');
      const file = new File(['dummy content'], 'passeport.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Soumettre le formulaire
      fireEvent.click(screen.getByText('Téléverser'));
      
      // Vérifier l'alerte (mock)
      expect(window.alert).toHaveBeenCalledWith('Document téléversé: Passeport');
    });
  });

  test('Ajout de note', async () => {
    await waitFor(() => {
      // Aller à l'onglet Notes
      fireEvent.click(screen.getByText('Notes'));
      
      // Remplir le formulaire
      const noteTextarea = screen.getByPlaceholderText('Saisissez votre note ici...');
      fireEvent.change(noteTextarea, { target: { value: 'Nouvelle note de test' } });
      
      // Soumettre le formulaire
      fireEvent.click(screen.getByText('Ajouter'));
      
      // Vérifier que la note est ajoutée
      expect(screen.getByText('Nouvelle note de test')).toBeInTheDocument();
    });
  });
});

// Tests pour la création d'un nouveau client
describe('NewClient Component', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <NewClient />
      </BrowserRouter>
    );
  });

  test('Affiche le titre de la page', () => {
    expect(screen.getByText('Nouveau Client')).toBeInTheDocument();
  });

  test('Affiche les étapes du formulaire', () => {
    expect(screen.getByText('Type de procédure')).toBeInTheDocument();
    expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
    expect(screen.getByText('Informations spécifiques')).toBeInTheDocument();
  });

  test('Navigation entre les étapes du formulaire', () => {
    // Étape 1
    const typeProcedureSelect = screen.getByLabelText('Type de procédure *');
    fireEvent.change(typeProcedureSelect, { target: { value: 'Visa Visiteur' } });
    
    const conseillerSelect = screen.getByLabelText('Conseillère assignée *');
    fireEvent.change(conseillerSelect, { target: { value: 'Sophie Martin' } });
    
    fireEvent.click(screen.getByText('Suivant'));
    
    // Étape 2
    expect(screen.getByText('Informations personnelles')).toBeInTheDocument();
    
    // Remplir les champs obligatoires
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Dupont' } });
    fireEvent.change(screen.getByLabelText('Prénom *'), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText('Date de naissance *'), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'j.dupont@email.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone *'), { target: { value: '+33 6 11 22 33 44' } });
    fireEvent.change(screen.getByLabelText('Nationalité *'), { target: { value: 'Française' } });
    fireEvent.change(screen.getByLabelText('Adresse complète *'), { target: { value: '15 rue de Paris, 75001 Paris' } });
    
    fireEvent.click(screen.getByText('Suivant'));
    
    // Étape 3
    expect(screen.getByText('Informations spécifiques au Visa Visiteur')).toBeInTheDocument();
  });

  test('Soumission du formulaire', () => {
    // Étape 1
    const typeProcedureSelect = screen.getByLabelText('Type de procédure *');
    fireEvent.change(typeProcedureSelect, { target: { value: 'Visa Visiteur' } });
    
    const conseillerSelect = screen.getByLabelText('Conseillère assignée *');
    fireEvent.change(conseillerSelect, { target: { value: 'Sophie Martin' } });
    
    fireEvent.click(screen.getByText('Suivant'));
    
    // Étape 2
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Dupont' } });
    fireEvent.change(screen.getByLabelText('Prénom *'), { target: { value: 'Jean' } });
    fireEvent.change(screen.getByLabelText('Date de naissance *'), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'j.dupont@email.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone *'), { target: { value: '+33 6 11 22 33 44' } });
    fireEvent.change(screen.getByLabelText('Nationalité *'), { target: { value: 'Française' } });
    fireEvent.change(screen.getByLabelText('Adresse complète *'), { target: { value: '15 rue de Paris, 75001 Paris' } });
    
    fireEvent.click(screen.getByText('Suivant'));
    
    // Étape 3
    fireEvent.change(screen.getByLabelText('Fonds disponibles'), { target: { value: '10000 €' } });
    fireEvent.change(screen.getByLabelText('Situation familiale'), { target: { value: 'Célibataire' } });
    
    // Soumettre le formulaire
    fireEvent.click(screen.getByText('Créer le client'));
    
    // Vérifier la console (mock)
    expect(console.log).toHaveBeenCalledWith('Nouveau client créé:', expect.any(Object));
    
    // Vérifier la navigation (mock)
    expect(window.location.pathname).toBe('/clients');
  });

  test('Validation des champs obligatoires', () => {
    // Étape 1
    fireEvent.click(screen.getByText('Suivant'));
    
    // Vérifier que le bouton est désactivé
    expect(screen.getByText('Suivant')).toBeDisabled();
    
    // Remplir les champs obligatoires
    const typeProcedureSelect = screen.getByLabelText('Type de procédure *');
    fireEvent.change(typeProcedureSelect, { target: { value: 'Visa Visiteur' } });
    
    // Vérifier que le bouton est toujours désactivé
    expect(screen.getByText('Suivant')).toBeDisabled();
    
    const conseillerSelect = screen.getByLabelText('Conseillère assignée *');
    fireEvent.change(conseillerSelect, { target: { value: 'Sophie Martin' } });
    
    // Vérifier que le bouton est maintenant activé
    expect(screen.getByText('Suivant')).not.toBeDisabled();
  });

  test('Affichage des champs spécifiques selon le type de procédure', () => {
    // Étape 1
    const typeProcedureSelect = screen.getByLabelText('Type de procédure *');
    
    // Visa Visiteur
    fireEvent.change(typeProcedureSelect, { target: { value: 'Visa Visiteur' } });
    fireEvent.change(screen.getByLabelText('Conseillère assignée *'), { target: { value: 'Sophie Martin' } });
    fireEvent.click(screen.getByText('Suivant'));
    fireEvent.click(screen.getByText('Suivant')); // Passer l'étape 2
    
    expect(screen.getByText('Informations spécifiques au Visa Visiteur')).toBeInTheDocument();
    expect(screen.getByLabelText('Fonds disponibles')).toBeInTheDocument();
    
    // Retour à l'étape 1
    fireEvent.click(screen.getByText('Précédent'));
    fireEvent.click(screen.getByText('Précédent'));
    
    // Permis d'études
    fireEvent.change(typeProcedureSelect, { target: { value: 'Permis d\'études' } });
    fireEvent.click(screen.getByText('Suivant'));
    fireEvent.click(screen.getByText('Suivant')); // Passer l'étape 2
    
    expect(screen.getByText('Informations spécifiques au Permis d\'études')).toBeInTheDocument();
    expect(screen.getByLabelText('Niveau d\'études actuel')).toBeInTheDocument();
  });
});

// Tests de validation des formulaires
describe('Form Validation', () => {
  test('Validation du formulaire de nouveau client', () => {
    render(
      <BrowserRouter>
        <NewClient />
      </BrowserRouter>
    );
    
    // Tester la validation des champs obligatoires
    const submitButton = screen.getByText('Suivant');
    expect(submitButton).toBeDisabled();
    
    // Remplir les champs obligatoires de l'étape 1
    fireEvent.change(screen.getByLabelText('Type de procédure *'), { target: { value: 'Visa Visiteur' } });
    fireEvent.change(screen.getByLabelText('Conseillère assignée *'), { target: { value: 'Sophie Martin' } });
    
    // Vérifier que le bouton est maintenant activé
    expect(submitButton).not.toBeDisabled();
  });

  test('Validation du formulaire de téléversement de document', async () => {
    // Mock useParams pour simuler l'ID du client dans l'URL
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ id: '1' }),
      useNavigate: () => jest.fn()
    }));

    render(
      <BrowserRouter>
        <ClientDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Aller à l'onglet Documents
      fireEvent.click(screen.getByText('Documents'));
      
      // Soumettre le formulaire sans remplir les champs
      fireEvent.click(screen.getByText('Téléverser'));
      
      // Vérifier que la validation HTML5 est déclenchée
      expect(screen.getByLabelText('Type de document')).toBeInvalid();
      expect(screen.getByLabelText('Fichier')).toBeInvalid();
    });
  });
});

// Tests de performance
describe('Performance Tests', () => {
  test('Chargement rapide de la liste des clients', async () => {
    const startTime = performance.now();
    
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Le chargement devrait prendre moins de 1000ms
    expect(loadTime).toBeLessThan(1000);
  });

  test('Filtrage rapide des clients', async () => {
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
    });
    
    const startTime = performance.now();
    
    const searchInput = screen.getByPlaceholderText('Rechercher un client...');
    fireEvent.change(searchInput, { target: { value: 'Martin' } });
    
    await waitFor(() => {
      expect(screen.getByText('Antoine Martin')).toBeInTheDocument();
      expect(screen.queryByText('Marie Dubois')).not.toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const filterTime = endTime - startTime;
    
    // Le filtrage devrait prendre moins de 200ms
    expect(filterTime).toBeLessThan(200);
  });
});

// Tests d'accessibilité
describe('Accessibility Tests', () => {
  test('Les éléments interactifs ont des labels accessibles', async () => {
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Vérifier que les boutons ont des textes ou des aria-labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
      
      // Vérifier que les champs de formulaire ont des labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });
  });

  test('La navigation par clavier est possible', async () => {
    render(
      <BrowserRouter>
        <ClientDetail />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Vérifier que les onglets sont focusables
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveFocus();
        fireEvent.keyDown(tab, { key: 'Tab' });
      });
    });
  });
});

// Tests de responsive design
describe('Responsive Design Tests', () => {
  test('L\'interface s\'adapte aux petits écrans', async () => {
    // Simuler un petit écran
    global.innerWidth = 480;
    global.innerHeight = 800;
    global.dispatchEvent(new Event('resize'));
    
    render(
      <BrowserRouter>
        <Clients />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      // Vérifier que les éléments sont toujours visibles
      expect(screen.getByText('Gestion des Clients')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rechercher un client...')).toBeInTheDocument();
    });
    
    // Restaurer la taille d'écran
    global.innerWidth = 1024;
    global.innerHeight = 768;
    global.dispatchEvent(new Event('resize'));
  });
});
