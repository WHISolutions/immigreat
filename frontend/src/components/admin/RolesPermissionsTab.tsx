import React, { useState } from 'react';

const modules = ['leads', 'clients', 'dossiers', 'facturation', 'rendez-vous', 'charges', 'administration', 'tableau-de-bord'];
const permissions = ['view', 'create', 'update', 'delete', 'export', 'validate', 'sign'];

interface Role {
  id: string;
  name: string;
  perms: Record<string, string[]>; // module -> permissions list
  temporary?: { start: string; end: string } | null;
}

const defaultRoles: Role[] = [
  {
    id: 'administrateur',
    name: 'Administrateur',
    perms: modules.reduce((acc, m) => ({ ...acc, [m]: [...permissions] }), {}),
  },
  {
    id: 'directeur',
    name: 'Directeur',
    perms: modules.reduce((acc, m) => ({ ...acc, [m]: permissions.filter(p=>p!=='delete') }), {}),
  },
  {
    id: 'conseillere',
    name: 'Conseillère',
    perms: { leads: ['view','create','update'], clients: ['view','update'], dossiers: ['view','update'], 'tableau-de-bord': ['view'] },
  },
];

const RolesPermissionsTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [newRoleName, setNewRoleName] = useState('');

  const addRole = () => {
    if (!newRoleName.trim()) return;
    if (roles.some(r=>r.name.toLowerCase()===newRoleName.toLowerCase())) return;
    const newRole: Role = { id: newRoleName.toLowerCase().replace(/\s+/g,'-'), name: newRoleName, perms: {} };
    setRoles([...roles, newRole]);
    setNewRoleName('');
  };

  const togglePerm = (roleId: string, module: string, perm: string) => {
    setRoles(prev => prev.map(r=> {
      if (r.id!==roleId) return r;
      const current = r.perms[module] || [];
      const exists = current.includes(perm);
      const updated = exists ? current.filter(p=>p!==perm) : [...current, perm];
      return { ...r, perms: { ...r.perms, [module]: updated } };
    }));
  };

  const getPermissionLabel = (perm: string) => {
    const labels: Record<string, string> = {
      view: '👀 Voir',
      create: '➕ Créer',
      update: '✏️ Modifier',
      delete: '🗑️ Supprimer',
      export: '📥 Exporter',
      validate: '✅ Valider',
      sign: '✍️ Signer'
    };
    return labels[perm] || perm;
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      leads: '🎯 Leads',
      clients: '👥 Clients', 
      dossiers: '📁 Dossiers',
      facturation: '💰 Facturation',
      'rendez-vous': '📅 Rendez-vous',
      charges: '💸 Charges',
      administration: '⚙️ Administration',
      'tableau-de-bord': '📊 Tableau de bord'
    };
    return labels[module] || module;
  };

  return (
    <div className="users-module">
      <h3>Rôles & Permissions</h3>
      
      {/* Formulaire d'ajout de rôle */}
      <div className="add-user-form" style={{ marginBottom: '2rem' }}>
        <h4>Créer un nouveau rôle</h4>
        <div className="form-row" style={{ gridTemplateColumns: '1fr auto' }}>
          <input 
            className="form-input"
            placeholder="Nom du nouveau rôle *" 
            value={newRoleName} 
            onChange={e => setNewRoleName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addRole()}
          />
          <button 
            className="btn-add-user"
            onClick={addRole}
            disabled={!newRoleName.trim() || roles.some(r=>r.name.toLowerCase()===newRoleName.toLowerCase())}
          >
            ➕ Créer le rôle
          </button>
        </div>
        <small style={{ 
          color: 'var(--admin-gray-500)', 
          marginTop: '0.5rem', 
          display: 'block',
          fontSize: '0.75rem'
        }}>
          💡 Après création, vous pourrez configurer les permissions spécifiques pour ce rôle.
        </small>
      </div>

      {/* Grille des rôles et permissions */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div style={{ 
              background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-hover) 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {role.id === 'administrateur' ? '👑' : 
                 role.id === 'directeur' ? '👔' : 
                 role.id === 'conseillere' ? '💼' : '👤'}
              </span>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                {role.name}
              </h4>
            </div>
            
            <div style={{ padding: '1rem', overflow: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr>
                    <th style={{ 
                      border: '2px solid var(--admin-gray-200)', 
                      padding: '0.75rem',
                      backgroundColor: 'var(--admin-gray-100)',
                      color: 'var(--admin-gray-700)',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>
                      📂 Module
                    </th>
                    {permissions.map(p => (
                      <th key={p} style={{ 
                        border: '2px solid var(--admin-gray-200)', 
                        padding: '0.75rem',
                        backgroundColor: 'var(--admin-gray-100)',
                        color: 'var(--admin-gray-700)',
                        fontWeight: '600',
                        textAlign: 'center',
                        minWidth: '80px'
                      }}>
                        {getPermissionLabel(p)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(m => (
                    <tr key={m}>
                      <td style={{ 
                        border: '1px solid var(--admin-gray-200)', 
                        padding: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 'var(--admin-gray-50)'
                      }}>
                        {getModuleLabel(m)}
                      </td>
                      {permissions.map(p => (
                        <td key={p} style={{ 
                          border: '1px solid var(--admin-gray-200)', 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          backgroundColor: (role.perms[m] || []).includes(p) ? 'rgb(16 185 129 / 0.1)' : 'var(--admin-white)',
                          transition: 'background-color 0.2s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={(role.perms[m] || []).includes(p)} 
                            onChange={() => togglePerm(role.id, m, p)}
                            style={{ 
                              transform: 'scale(1.3)',
                              cursor: 'pointer',
                              accentColor: 'var(--admin-primary)'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RolesPermissionsTab;