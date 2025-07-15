import React, { useState, useEffect, useRef } from 'react'; // Ajout de useRef
import '../styles/Dashboard.css';
import '../styles/icons.css';
import Breadcrumb from './Breadcrumb';
import Leads from './Leads';
import Clients from './Clients';
import Dossiers from './Dossiers';
import Facturation from './Facturation';
import RendezVous from './RendezVous';
import Charges from './Charges';
import NotificationDropdown from './notifications/NotificationDropdown';
import AdministrationPanel from './AdministrationPanel';
import TableauBord from './TableauBord';
import Profile from './Profile';
// import ModuleRenderer from './ModuleRenderer'; // Commentez ou supprimez cette ligne
import Procedures from './Procedures';
import ClientEdit from './ClientEdit';
import Rapports from './Rapports'; // Import du nouveau composant Rapports
import GlobalSearch from './GlobalSearch'; // Import du composant de recherche globale
import { useNotifications } from '../contexts/NotificationContext'; // Ajout de l'import
import { getMyProfile } from '../services/usersAPI'; // Import pour récupérer le profil

// Fonction utilitaire pour construire l'URL complète des images
const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === '/default-avatar.png' || imagePath === '/default-avatar.svg') {
    return '/default-avatar.svg'; // Image par défaut locale
  }
  
  // Si l'image commence par /uploads, on ajoute l'URL du backend
  if (imagePath.startsWith('/uploads')) {
    return `http://localhost:5000${imagePath}`;
  }
  
  // Sinon, on retourne tel quel
  return imagePath;
};

function Dashboard({ userRole = 'directeur', userName = 'Utilisateur Test', onLogout }) {
  const [activeModule, setActiveModule] = useState('tableau-bord');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userPhoto, setUserPhoto] = useState('/default-avatar.svg'); // État pour la photo de profil

  // Charger la photo de profil au montage du composant
  useEffect(() => {
    const loadUserPhoto = async () => {
      try {
        const profileData = await getMyProfile();
        if (profileData.success && profileData.data && profileData.data.photo) {
          setUserPhoto(profileData.data.photo);
        }
      } catch (error) {
        console.log('Info: Impossible de charger la photo de profil, utilisation de l\'avatar par défaut');
      }
    };

    loadUserPhoto();
  }, []);

  // Définir les modules accessibles selon le rôle
  const getAccessibleModules = (role) => {
    const modules = {
      'administrateur': ['tableau-bord', 'leads', 'clients', 'dossiers', 'procedures', 'facturation', 'rendez-vous', 'charges', 'administration', 'rapports'],
      'directeur': ['tableau-bord', 'leads', 'clients', 'dossiers', 'procedures', 'facturation', 'rendez-vous', 'charges', 'administration', 'rapports'],
      'conseillere': ['tableau-bord', 'leads', 'clients', 'dossiers', 'procedures', 'facturation', 'rendez-vous'],
      'comptable': ['tableau-bord', 'facturation', 'charges'],
      'secretaire': ['tableau-bord', 'leads', 'clients', 'rendez-vous']
    };
    
    return modules[role] || ['tableau-bord'];
  };
  
  const accessibleModules = getAccessibleModules(userRole);
  
  // État pour l'édition de client
  const [clientToEdit, setClientToEdit] = useState(null);
  
  // Formater le rôle pour l'affichage
  const formaterRole = (role) => {
    const roles = {
      'administrateur': 'Administrateur',
      'directeur': 'Directeur',
      'conseillere': 'Conseillère',
      'comptable': 'Comptable',
      'secretaire': 'Secrétaire'
    };
    return roles[role] || role;
  };
  
  // Gérer le clic sur un module
  const handleModuleClick = (module) => {
    setActiveModule(module);
    // Réinitialiser l'état d'édition de client si on change de module
    if (module !== 'client-edit') {
      setClientToEdit(null);
    }
  };
  
  // Fonction pour naviguer vers un module avec des paramètres optionnels
  const handleNavigateFromSearch = (module, params = {}) => {
    setActiveModule(module);
    
    // Si des paramètres sont fournis, on peut les traiter ici
    // Par exemple, mettre en surbrillance un élément spécifique
    if (params.highlightId) {
      // On peut stocker l'ID à mettre en surbrillance dans l'état
      // ou utiliser localStorage/sessionStorage pour le passer au composant
      sessionStorage.setItem('highlightId', params.highlightId);
    }
  };
  
  // Fonction pour éditer un client
  const handleEditClient = (clientId) => {
    setClientToEdit(clientId);
    setActiveModule('client-edit');
  };
  
  // Basculer l'affichage du menu profil
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Fonction pour mettre à jour la photo de profil depuis le composant Profile
  const updateUserPhoto = (newPhotoUrl) => {
    setUserPhoto(newPhotoUrl);
  };

  // Afficher la page de profil
  const showProfile = () => {
    setActiveModule('profile');
    setShowProfileMenu(false);
  };

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Raccourcis avec Alt
      if (e.altKey) {
        switch (e.key) {
          case 'd': // Alt+D pour le tableau de bord
            if (accessibleModules.includes('tableau-bord')) setActiveModule('tableau-bord');
            break;
          case 'l': // Alt+L pour les leads
            if (accessibleModules.includes('leads')) setActiveModule('leads');
            break;
          case 'c': // Alt+C pour les clients
            if (accessibleModules.includes('clients')) setActiveModule('clients');
            break;
          case 'f': // Alt+F pour la facturation
            if (accessibleModules.includes('facturation')) setActiveModule('facturation');
            break;
          case 'r': // Alt+R pour les rendez-vous
            if (accessibleModules.includes('rendez-vous')) setActiveModule('rendez-vous');
            break;
          case 'p': // Alt+P pour le profil
            showProfile();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accessibleModules]); // Dépendances du useEffect

  // Générer les éléments du fil d'Ariane
  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Accueil', onClick: () => setActiveModule('tableau-bord') }
    ];
    
    switch (activeModule) {
      case 'leads':
        items.push({ label: 'Gestion des leads' });
        break;
      case 'clients':
        items.push({ label: 'Gestion des clients' });
        break;
      case 'dossiers':
        items.push({ label: 'Gestion des dossiers' });
        break;
      case 'procedures':
        items.push({ label: 'Procédures' });
        break;
      case 'facturation':
        items.push({ label: 'Facturation' });
        break;
      case 'rendez-vous':
        items.push({ label: 'Rendez-vous' });
        break;
      case 'charges':
        items.push({ label: 'Gestion des charges' });
        break;
      case 'administration':
        items.push({ label: 'Administration' });
        break;
      case 'rapports':
        items.push({ label: 'Rapports d\'avancement' });
        break;
      case 'profile':
        items.push({ label: 'Mon Profil' });
        break;
      default:
        break;
    }
    
    return items;
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="logo">
          <img src="/assets/logo.png" alt="Logo ImmigExpert" />
          <h1>ImmigExpert</h1>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {accessibleModules.includes('tableau-bord') && (
              <li 
                className={activeModule === 'tableau-bord' ? 'active' : ''}
                onClick={() => handleModuleClick('tableau-bord')}
              >
                <i className="fas fa-chart-line"></i>
                <span>Tableau de bord</span>
              </li>
            )}
            
            {accessibleModules.includes('leads') && (
              <li 
                className={activeModule === 'leads' ? 'active' : ''}
                onClick={() => handleModuleClick('leads')}
              >
                <i className="fas fa-funnel-dollar"></i>
                <span>Leads</span>
              </li>
            )}
            
            {accessibleModules.includes('clients') && (
              <li 
                className={activeModule === 'clients' ? 'active' : ''}
                onClick={() => handleModuleClick('clients')}
              >
                <i className="fas fa-users"></i>
                <span>Clients</span>
              </li>
            )}
            
            {accessibleModules.includes('dossiers') && (
              <li 
                className={activeModule === 'dossiers' ? 'active' : ''}
                onClick={() => handleModuleClick('dossiers')}
              >
                <i className="fas fa-folder-open"></i>
                <span>Dossiers</span>
              </li>
            )}
            
            {accessibleModules.includes('procedures') && (
              <li 
                className={activeModule === 'procedures' ? 'active' : ''}
                onClick={() => handleModuleClick('procedures')}
              >
                <i className="fas fa-tasks"></i>
                <span>Procédures</span>
              </li>
            )}
            
            {accessibleModules.includes('facturation') && (
              <li 
                className={activeModule === 'facturation' ? 'active' : ''}
                onClick={() => handleModuleClick('facturation')}
              >
                <i className="fas fa-file-invoice-dollar"></i>
                <span>Facturation</span>
              </li>
            )}
            
            {accessibleModules.includes('rendez-vous') && (
              <li 
                className={activeModule === 'rendez-vous' ? 'active' : ''}
                onClick={() => handleModuleClick('rendez-vous')}
              >
                <i className="fas fa-calendar-alt"></i>
                <span>Rendez-vous</span>
              </li>
            )}
            
            {accessibleModules.includes('charges') && (
              <li 
                className={activeModule === 'charges' ? 'active' : ''}
                onClick={() => handleModuleClick('charges')}
              >
                <i className="fas fa-money-bill-wave"></i>
                <span>Charges</span>
              </li>
            )}
            
            {accessibleModules.includes('rapports') && (
              <li 
                className={activeModule === 'rapports' ? 'active' : ''}
                onClick={() => handleModuleClick('rapports')}
              >
                <i className="fas fa-file-alt"></i>
                <span>Rapports</span>
              </li>
            )}
            
            {accessibleModules.includes('administration') && (
              <li 
                className={activeModule === 'administration' ? 'active' : ''}
                onClick={() => handleModuleClick('administration')}
              >
                <i className="fas fa-cogs"></i>
                <span>Administration</span>
              </li>
            )}
          </ul>
        </nav>
        
        <div className="user-profile" onClick={toggleProfileMenu}>
          <div className="user-avatar">
            <img src={getImageUrl(userPhoto)} alt="Avatar" />
          </div>
          <div className="user-info">
            <h3>{userName}</h3>
            <p>{formaterRole(userRole)}</p>
          </div>
          <i className={`fas fa-chevron-${showProfileMenu ? 'up' : 'down'}`}></i>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <ul>
                <li onClick={showProfile}>
                  <i className="fas fa-user"></i>
                  <span>Mon Profil</span>
                </li>
                <li onClick={onLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Déconnexion</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-title">
            <h2>
              {activeModule === 'tableau-bord' && 'Tableau de bord'}
              {activeModule === 'leads' && 'Gestion des leads'}
              {activeModule === 'clients' && 'Gestion des clients'}
              {activeModule === 'dossiers' && 'Gestion des dossiers'}
              {activeModule === 'procedures' && 'Procédures'}
              {activeModule === 'facturation' && 'Facturation'}
              {activeModule === 'rendez-vous' && 'Rendez-vous'}
              {activeModule === 'charges' && 'Gestion des charges'}
              {activeModule === 'rapports' && 'Rapports d\'avancement'}
              {activeModule === 'administration' && 'Administration'}
              {activeModule === 'profile' && 'Mon Profil'}
            </h2>
          </div>
          
          <div className="header-actions">
            <NotificationDropdown />
            <div className="messages">
              <span className="icon icon-md icon-interactive">
                <i className="fas fa-envelope"></i>
                <span className="icon-badge">5</span>
              </span>
            </div>
            <div className="search-global">
              <GlobalSearch onNavigate={handleNavigateFromSearch} />
            </div>
            <div className="user-header-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{formaterRole(userRole)}</span>
              <div className="user-avatar-small" onClick={toggleProfileMenu}>
                <img src={getImageUrl(userPhoto)} alt="Avatar" />
                <i className={`fas fa-chevron-${showProfileMenu ? 'up' : 'down'}`}></i>
                
                {showProfileMenu && (
                  <div className="header-profile-dropdown">
                    <ul>
                      <li onClick={showProfile}>
                        <i className="fas fa-user"></i>
                        <span>Mon Profil</span>
                      </li>
                      <li onClick={onLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Déconnexion</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <div className="module-content">
          <div className="breadcrumb-container">
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          {/* Pass userRole to ModuleRenderer if it's used, or directly to components */}
          {/* Assuming ModuleRenderer is not the final step based on current structure, directly passing to Leads for now */}
          {activeModule === 'tableau-bord' && <TableauBord userRole={userRole} userName={userName} onNavigate={handleModuleClick} />}
          {activeModule === 'leads' && <Leads userRole={userRole} />}
          {activeModule === 'clients' && <Clients onEditClient={handleEditClient} userRole={userRole} />}
          {activeModule === 'client-edit' && <ClientEdit id={clientToEdit} onBack={() => setActiveModule('clients')} />}
          {activeModule === 'dossiers' && <Dossiers userRole={userRole} />}
          {activeModule === 'procedures' && <Procedures userRole={userRole} />}
          {activeModule === 'facturation' && <Facturation userRole={userRole} />}
          {activeModule === 'rendez-vous' && <RendezVous userRole={userRole} />}
          {activeModule === 'charges' && <Charges userRole={userRole} />}
          {activeModule === 'rapports' && <Rapports userRole={userRole} />}
          {activeModule === 'administration' && <AdministrationPanel userRole={userRole} />}
          {activeModule === 'profile' && <Profile userRole={userRole} userName={userName} onPhotoUpdate={updateUserPhoto} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
