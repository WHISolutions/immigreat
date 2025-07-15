import React, { useState } from 'react';

// Importer les styles
import '../styles/Administration.css';

// Importer le module Utilisateurs réellement implémenté
import UtilisateursTab from './admin/UtilisateursTab';
import RolesPermissionsTab from './admin/RolesPermissionsTab';

// Importer le composant Journaux d'activité
import JournalActivite from './JournalActivite';

interface AdministrationPanelProps {
  userRole?: string;
}

const allowedRoles = ['administrateur', 'directeur'];

// Sous-composants d'attente pour les onglets pas encore implémentés
const ParametresSystemeTab = () => (
  <div className="users-module">
    <h3>⚙️ Paramètres Système</h3>
    <div style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      border: '2px dashed #cbd5e1',
      borderRadius: '8px',
      padding: '3rem',
      textAlign: 'center',
      color: '#64748b'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <h4 style={{ color: '#334155', marginBottom: '0.5rem' }}>Module en développement</h4>
      <p>Paramètres généraux, configuration facturation, paramètres email, etc.</p>
      <small style={{ color: '#94a3b8' }}>Cette fonctionnalité sera bientôt disponible</small>
    </div>
  </div>
);

const ModelesTab = () => (
  <div className="users-module">
    <h3>📄 Modèles de documents</h3>
    <div style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      border: '2px dashed #cbd5e1',
      borderRadius: '8px',
      padding: '3rem',
      textAlign: 'center',
      color: '#64748b'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
      <h4 style={{ color: '#334155', marginBottom: '0.5rem' }}>Module en développement</h4>
      <p>Gestion des modèles de contrats, factures, emails automatiques, etc.</p>
      <small style={{ color: '#94a3b8' }}>Cette fonctionnalité sera bientôt disponible</small>
    </div>
  </div>
);

const JournauxActiviteTab = () => <JournalActivite />;

const tabComponents: Record<string, React.FC> = {
  utilisateurs: UtilisateursTab,
  roles: RolesPermissionsTab,
  parametres: ParametresSystemeTab,
  modeles: ModelesTab,
  journaux: JournauxActiviteTab,
};

const AdministrationPanel: React.FC<AdministrationPanelProps> = ({ userRole }) => {
  // Hooks avant toute condition
  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'roles' | 'parametres' | 'modeles' | 'journaux'>('utilisateurs');

  // Vérification du rôle (après les hooks pour éviter appel conditionnel)
  if (userRole && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas l'autorisation de consulter cette page.</p>
      </div>
    );
  }
  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="administration-container">
      <h2>Administration</h2>

      {/* Navigation des onglets */}
      <div className="admin-tabs">
        <button className={activeTab==='utilisateurs'? 'active': ''} onClick={()=>setActiveTab('utilisateurs')}>
          👥 Utilisateurs
        </button>
        <button className={activeTab==='roles'? 'active': ''} onClick={()=>setActiveTab('roles')}>
          🔐 Rôles & Permissions
        </button>
        <button className={activeTab==='parametres'? 'active': ''} onClick={()=>setActiveTab('parametres')}>
          ⚙️ Paramètres Système
        </button>
        <button className={activeTab==='modeles'? 'active': ''} onClick={()=>setActiveTab('modeles')}>
          📄 Modèles
        </button>
        <button className={activeTab==='journaux'? 'active': ''} onClick={()=>setActiveTab('journaux')}>
          📊 Journaux d'activité
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="tab-content-wrapper">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdministrationPanel; 