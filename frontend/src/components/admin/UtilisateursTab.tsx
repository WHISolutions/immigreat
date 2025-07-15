import React, { useEffect, useState } from 'react';
import { getUsers, createUser, toggleUserStatus, getPermissions, updateUserPermissions, resetUserPassword, deleteUser, updateUser, uploadProfilePhoto, uploadUserPhoto } from '../../services/usersAPI';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  permissions: Record<string, boolean>;
  actif: boolean;
  derniere_connexion?: string;
  date_creation: string;
  created_by?: number;
  photo?: string;
}

interface Permissions {
  [category: string]: string[];
}

const UtilisateursTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('nom');
  const [sortAsc, setSortAsc] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Formulaire ajout utilisateur
  const [form, setForm] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '',
    role: 'conseillere', 
    motDePasse: '',
    permissions: {} as Record<string, boolean>
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newUserPhoto, setNewUserPhoto] = useState<File | null>(null);
  const [newUserPhotoPreview, setNewUserPhotoPreview] = useState<string | null>(null);
  const roles = ['admin', 'conseillere', 'comptable', 'secretaire'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [usersData, permissionsData] = await Promise.all([
        getUsers(token || ''),
        getPermissions(token || '')
      ]);
      setUsers(usersData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('La photo doit faire moins de 5MB');
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        alert('Format de fichier non supporté. Utilisez JPG, PNG ou GIF.');
        return;
      }

      setNewUserPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewUserPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (u: User) => {
    const term = searchTerm.toLowerCase();
    return (
      u.nom.toLowerCase().includes(term) ||
      u.prenom.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  };

  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedFilteredUsers = [...users]
    .filter(handleSearch)
    .sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleAddUser = async () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim()) {
      alert('Veuillez remplir tous les champs obligatoires (nom, prénom, email)');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Erreur d\'authentification: Vous devez être connecté pour créer un utilisateur.\n\nVeuillez vous connecter d\'abord.');
        return;
      }
      
      console.log('📝 Création utilisateur...');
      console.log('🔑 Token présent:', token ? 'Oui' : 'Non');
      
      const userData = {
        ...form,
        motDePasse: form.motDePasse.trim() || 'temp123'
      };
      
      console.log('📄 Données utilisateur:', userData);
      
      // 1. Créer l'utilisateur d'abord
      const response = await createUser(userData, token);
      console.log('✅ Utilisateur créé:', response);
      
      // 2. Si une photo a été sélectionnée, la télécharger
      if (newUserPhoto && response.user?.id) {
        try {
          console.log('📸 Upload de la photo pour le nouvel utilisateur...');
          await uploadProfilePhoto(newUserPhoto, token);
          console.log('✅ Photo téléchargée avec succès');
        } catch (photoError) {
          console.error('❌ Erreur upload photo:', photoError);
          const errorMessage = photoError instanceof Error ? photoError.message : String(photoError);
          alert(`⚠️ Utilisateur créé avec succès, mais erreur lors du téléchargement de la photo: ${errorMessage}`);
        }
      }
      
      alert('✅ Utilisateur créé avec succès !');
      setForm({ 
        nom: '', 
        prenom: '', 
        email: '', 
        telephone: '',
        role: 'conseillere', 
        motDePasse: '',
        permissions: {}
      });
      setNewUserPhoto(null);
      setNewUserPhotoPreview(null);
      fetchData();
      
    } catch (err) {
      console.error('❌ Erreur détaillée:', err);
      
      let errorMessage = 'Erreur inconnue lors de la création de l\'utilisateur';
      
      if (err instanceof Error) {
        // Cas 1: Erreur réseau ou serveur
        if (err.message.includes('401')) {
          errorMessage = '🔐 Erreur d\'authentification: Token invalide ou expiré.\n\nVeuillez vous reconnecter.';
        } else if (err.message.includes('403')) {
          errorMessage = '🚫 Erreur de permissions: Vous n\'avez pas les droits pour créer des utilisateurs.';
        } else if (err.message.includes('400')) {
          errorMessage = '📝 Erreur de données: Vérifiez que tous les champs sont correctement remplis.';
        } else if (err.message.includes('Cette adresse email est déjà utilisée')) {
          errorMessage = '📧 Cette adresse email est déjà utilisée par un autre utilisateur.';
        } else {
          errorMessage = `❌ Erreur: ${err.message}`;
        }
      } else {
        errorMessage = `❌ Erreur: ${String(err)}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleToggleStatus = async (id: string, actif: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await toggleUserStatus(id, !actif, token || '');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (user: User) => {
    // Empêcher la suppression de son propre compte
    const currentUserId = localStorage.getItem('userId'); // Si vous stockez l'ID utilisateur
    if (user.id === currentUserId) {
      alert('❌ Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }

    // Confirmation de suppression
    const confirmation = window.confirm(
      `⚠️ ATTENTION - Suppression définitive\n\n` +
      `Êtes-vous sûr de vouloir supprimer l'utilisateur ?\n\n` +
      `• Nom: ${user.prenom} ${user.nom}\n` +
      `• Email: ${user.email}\n` +
      `• Rôle: ${formatRole(user.role)}\n\n` +
      `Cette action est IRRÉVERSIBLE !`
    );

    if (!confirmation) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      await deleteUser(user.id, token);
      
      alert(`✅ Utilisateur "${user.prenom} ${user.nom}" supprimé avec succès.`);
      fetchData(); // Rafraîchir la liste

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      
      let errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMessage = '🚫 Vous n\'avez pas les permissions pour supprimer cet utilisateur.';
        } else if (error.message.includes('404')) {
          errorMessage = '❓ Utilisateur introuvable (peut-être déjà supprimé).';
        } else if (error.message.includes('400')) {
          errorMessage = '⚠️ Impossible de supprimer cet utilisateur (contraintes système).';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    
    console.log('🔍 DEBUG - handleUpdateUser appelé');
    console.log('🔍 DEBUG - editingUser:', editingUser);
    console.log('🔍 DEBUG - userData reçu:', userData);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Token d\'authentification manquant. Veuillez vous reconnecter.');
        return;
      }

      console.log('🔄 Mise à jour utilisateur:', editingUser.id, userData);
      console.log('🔍 DEBUG - Token présent:', token ? 'Oui' : 'Non');
      console.log('🔍 DEBUG - Appel updateUser avec:', {
        id: editingUser.id,
        data: userData,
        token: token ? 'Présent' : 'Absent'
      });
      
      await updateUser(editingUser.id, userData, token);
      
      alert(`✅ Utilisateur "${userData.prenom} ${userData.nom}" mis à jour avec succès.`);
      setShowEditModal(false);
      setEditingUser(null);
      fetchData(); // Rafraîchir la liste

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      console.error('❌ Erreur complète:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Erreur lors de la mise à jour de l\'utilisateur';
      if (error instanceof Error) {
        console.error('❌ Message d\'erreur:', error.message);
        console.error('❌ Stack d\'erreur:', error.stack);
        
        if (error.message.includes('403')) {
          errorMessage = '🚫 Vous n\'avez pas les permissions pour modifier cet utilisateur.';
        } else if (error.message.includes('404')) {
          errorMessage = '❓ Utilisateur introuvable.';
        } else if (error.message.includes('400')) {
          errorMessage = '📝 Données invalides. Vérifiez les informations saisies.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleUpdatePermissions = async (userPermissions: Record<string, boolean>) => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      await updateUserPermissions(selectedUser.id, userPermissions, token || '');
      setShowPermissionsModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField === field) {
      return sortAsc ? ' ▲' : ' ▼';
    }
    return '';
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return null;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score <= 2) return { level: 'weak', text: 'Faible', color: 'var(--admin-danger)' };
    if (score <= 3) return { level: 'medium', text: 'Moyen', color: 'var(--admin-warning)' };
    return { level: 'strong', text: 'Fort', color: 'var(--admin-success)' };
  };

  const formatRole = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrateur',
      conseillere: 'Conseillère',
      comptable: 'Comptable',
      secretaire: 'Secrétaire'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="users-module">
      <h3>Gestion des utilisateurs</h3>
      
      {/* Barre de recherche */}
      <div className="search-container">
        <input
          className="search-input"
          placeholder="🔍 Rechercher un utilisateur par nom, prénom, email ou rôle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : (
        <div className="utilisateurs-table-container">
          <table className="utilisateurs-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('nom')}>
                  Nom{getSortIcon('nom')}
                </th>
                <th onClick={() => handleSort('prenom')}>
                  Prénom{getSortIcon('prenom')}
                </th>
                <th onClick={() => handleSort('email')}>
                  Email{getSortIcon('email')}
                </th>
                <th onClick={() => handleSort('role')}>
                  Rôle{getSortIcon('role')}
                </th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-gray-500)' }}>
                    {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur disponible.'}
                  </td>
                </tr>
              ) : (
                sortedFilteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '600' }}>{u.nom}</td>
                    <td>{u.prenom}</td>
                    <td>{u.email}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        backgroundColor: 'var(--admin-gray-100)',
                        color: 'var(--admin-gray-700)',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {formatRole(u.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.actif ? 'active' : 'inactive'}`}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      {u.derniere_connexion 
                        ? new Date(u.derniere_connexion).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Jamais connecté'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className={`btn-toggle-status ${!u.actif ? 'inactive' : ''}`}
                          onClick={() => handleToggleStatus(u.id, u.actif)}
                          title={u.actif ? 'Désactiver l\'utilisateur' : 'Réactiver l\'utilisateur'}
                        >
                          {u.actif ? '🔒 Désactiver' : '🔓 Réactiver'}
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => handleOpenEditUser(u)}
                          title="Modifier les informations de l'utilisateur"
                          style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            marginLeft: '0.25rem'
                          }}
                        >
                          ✏️ Éditer
                        </button>
                        <button 
                          className="btn-edit" 
                          onClick={() => handleOpenPermissions(u)}
                          title="Gérer les permissions"
                        >
                          🔐 Permissions
                        </button>
                        <button 
                          className="btn-reset" 
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            if (!token) return alert('Pas de token');
                            try {
                              const res = await resetUserPassword(u.id, token);
                              alert(`Nouveau mot de passe: ${res.newPassword}`);
                            } catch (e) {
                              alert('Erreur reset MDP');
                            }
                          }}
                          title="Réinitialiser le mot de passe"
                        >
                          🔄 Reset MDP
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDeleteUser(u)}
                          title="Supprimer définitivement l'utilisateur"
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            marginLeft: '0.25rem'
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire d'ajout d'utilisateur */}
      <div className="add-user-form">
        <h4>Ajouter un nouvel utilisateur</h4>
        <div className="form-row">
          <input 
            className="form-input"
            placeholder="Nom *" 
            value={form.nom} 
            onChange={e => setForm({...form, nom: e.target.value})}
          />
          <input 
            className="form-input"
            placeholder="Prénom *" 
            value={form.prenom} 
            onChange={e => setForm({...form, prenom: e.target.value})}
          />
          <input 
            className="form-input"
            placeholder="Email *" 
            type="email"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})}
          />
          <input 
            className="form-input"
            placeholder="Téléphone" 
            type="tel"
            value={form.telephone} 
            onChange={e => setForm({...form, telephone: e.target.value})}
          />
          <div className="password-field-container">
            <input 
              className="form-input"
              placeholder="Mot de passe (optionnel)" 
              type={showPassword ? 'text' : 'password'}
              value={form.motDePasse} 
              onChange={e => setForm({...form, motDePasse: e.target.value})}
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        {/* Sélecteur de rôle centré en dessous de l'email */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '1rem',
          marginBottom: '1rem'
        }}>
          <select 
            className="form-select"
            value={form.role} 
            onChange={e => setForm({...form, role: e.target.value})}
            style={{ 
              width: 'auto',
              minWidth: '200px',
              textAlign: 'center'
            }}
          >
            {roles.map(r => (
              <option key={r} value={r}>{formatRole(r)}</option>
            ))}
          </select>
        </div>
        
        {/* Messages d'aide et indicateur de force du mot de passe */}
        <div style={{ marginTop: '1rem' }}>
          {form.motDePasse && (
            <div 
              className="password-strength"
              style={{ 
                color: getPasswordStrength(form.motDePasse)?.color,
                marginBottom: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'var(--admin-gray-50)',
                borderRadius: '0.5rem',
                border: `2px solid ${getPasswordStrength(form.motDePasse)?.color}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span style={{ fontWeight: '600' }}>
                Force du mot de passe: {getPasswordStrength(form.motDePasse)?.text}
              </span>
              {getPasswordStrength(form.motDePasse)?.level === 'weak' && (
                <span style={{ 
                  color: 'var(--admin-gray-600)', 
                  fontSize: '0.8rem',
                  fontStyle: 'italic'
                }}>
                  → Recommandé: 8+ caractères, majuscules, chiffres, symboles
                </span>
              )}
            </div>
          )}
          
          <small style={{ 
            color: 'var(--admin-gray-500)', 
            display: 'block',
            fontSize: '0.75rem'
          }}>
            💡 {form.motDePasse.trim() 
              ? 'Le mot de passe saisi sera utilisé pour cet utilisateur.' 
              : 'Si aucun mot de passe n\'est fourni, un mot de passe temporaire sera généré et envoyé par email.'
            }
          </small>
          
          {/* Bouton d'ajout en bas */}
          <div style={{ 
            marginTop: '1rem', 
            display: 'flex', 
            justifyContent: 'center'
          }}>
            <button 
              className="btn-add-user"
              onClick={handleAddUser}
              disabled={!form.nom.trim() || !form.prenom.trim() || !form.email.trim()}
              style={{ 
                fontSize: '1rem',
                padding: '0.875rem 2rem',
                minWidth: '200px'
              }}
            >
              ➕ Ajouter l'utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Modal de gestion des permissions */}
      {showPermissionsModal && selectedUser && (
        <PermissionsModal
          user={selectedUser}
          permissions={permissions}
          onSave={handleUpdatePermissions}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Modal d'édition d'utilisateur */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          formatRole={formatRole}
          roles={roles}
        />
      )}
    </div>
  );
};

// Composant modal pour gérer les permissions
const PermissionsModal: React.FC<{
  user: User;
  permissions: Permissions;
  onSave: (permissions: Record<string, boolean>) => void;
  onClose: () => void;
}> = ({ user, permissions, onSave, onClose }) => {
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>(
    user.permissions || {}
  );

  const handlePermissionChange = (permission: string, value: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handleSave = () => {
    onSave(userPermissions);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3>Permissions pour {user.prenom} {user.nom}</h3>
        <p style={{ color: 'var(--admin-gray-600)', marginBottom: '1.5rem' }}>
          Rôle: {user.role} | Email: {user.email}
        </p>

        <div style={{ marginBottom: '2rem' }}>
          {Object.entries(permissions).map(([category, permissionList]) => (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                textTransform: 'capitalize', 
                color: 'var(--admin-primary)',
                marginBottom: '0.5rem'
              }}>
                {category}
              </h4>
              <div style={{ paddingLeft: '1rem' }}>
                {permissionList.map(permission => (
                  <label key={permission} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={userPermissions[permission] || false}
                      onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end' 
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--admin-gray-300)',
              backgroundColor: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--admin-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant modal pour éditer un utilisateur
const EditUserModal: React.FC<{
  user: User;
  onSave: (userData: Partial<User>) => void;
  onClose: () => void;
  formatRole: (role: string) => string;
  roles: string[];
}> = ({ user, onSave, onClose, formatRole, roles }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone || '',
    role: user.role
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 DEBUG - Début handleSubmit');
    console.log('🔍 DEBUG - FormData:', formData);
    console.log('🔍 DEBUG - SelectedPhoto:', selectedPhoto);
    console.log('🔍 DEBUG - User ID:', user.id);
    
    // Validation basique
    if (!formData.nom?.trim() || !formData.prenom?.trim() || !formData.email?.trim()) {
      alert('❌ Veuillez remplir tous les champs obligatoires (nom, prénom, email)');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('❌ Veuillez saisir une adresse email valide');
      return;
    }

    try {
      let updatedData = { ...formData };
      console.log('🔍 DEBUG - UpdatedData avant photo:', updatedData);

      // Si une photo a été sélectionnée, la télécharger d'abord
      if (selectedPhoto) {
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Token manquant');
          
          console.log('📸 Upload de la photo pour l\'utilisateur...', user.id);
          const photoResponse = await uploadUserPhoto(user.id, selectedPhoto, token);
          updatedData.photo = photoResponse.photoUrl || photoResponse.data?.photoUrl;
          console.log('✅ Photo téléchargée:', updatedData.photo);
        } catch (photoError) {
          console.error('❌ Erreur upload photo:', photoError);
          const errorMessage = photoError instanceof Error ? photoError.message : String(photoError);
          alert(`⚠️ Erreur lors du téléchargement de la photo: ${errorMessage}\n\nLes autres modifications seront quand même sauvegardées.`);
        }
      }

      console.log('🔍 DEBUG - UpdatedData final:', updatedData);
      console.log('🔍 DEBUG - Appel onSave avec:', updatedData);
      
      onSave(updatedData);
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`❌ Erreur: ${errorMessage}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3>Modifier l'utilisateur</h3>
        <p style={{ color: 'var(--admin-gray-600)', marginBottom: '1.5rem' }}>
          ID: {user.id} | Statut: {user.actif ? 'Actif' : 'Inactif'}
        </p>

        {/* Section photo de profil */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Photo de profil
          </label>
          <div style={{ 
            display: 'inline-block', 
            position: 'relative',
            marginBottom: '0.5rem'
          }}>
            <img
              src={photoPreview || user.photo || '/default-avatar.png'}
              alt="Photo de profil"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--admin-gray-300)'
              }}
            />
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              id="photo-input"
            />
            <label
              htmlFor="photo-input"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              📸 Changer la photo
            </label>
            {selectedPhoto && (
              <span style={{ 
                marginLeft: '0.5rem', 
                fontSize: '0.8rem', 
                color: 'var(--admin-gray-600)' 
              }}>
                ✅ Nouvelle photo sélectionnée
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Nom *
            </label>
            <input
              type="text"
              value={formData.nom || ''}
              onChange={(e) => handleChange('nom', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--admin-gray-300)',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Prénom *
            </label>
            <input
              type="text"
              value={formData.prenom || ''}
              onChange={(e) => handleChange('prenom', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--admin-gray-300)',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--admin-gray-300)',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone || ''}
              onChange={(e) => handleChange('telephone', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--admin-gray-300)',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Rôle
            </label>
            <select
              value={formData.role || ''}
              onChange={(e) => handleChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--admin-gray-300)',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end' 
          }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--admin-gray-300)',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button 
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UtilisateursTab;