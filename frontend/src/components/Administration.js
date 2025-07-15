import React, { useState } from 'react';

function Administration({ userRole }) {
  const [activeTab, setActiveTab] = useState('users');

  // état local simulé (devrait venir du backend)
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin', email: 'admin@example.com', role: 'administrateur' },
    { id: 2, name: 'Directeur', email: 'directeur@example.com', role: 'directeur' }
  ]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'conseillere' });

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    setUsers(prev => [...prev, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', email: '', role: 'conseillere' });
  };

  const roles = ['administrateur', 'directeur', 'conseillere', 'comptable', 'secretaire'];

  return (
    <div className="administration-container">
      <div className="admin-tabs">
        <button className={activeTab==='users'?'active':''} onClick={()=>setActiveTab('users')}>Utilisateurs</button>
        <button className={activeTab==='roles'?'active':''} onClick={()=>setActiveTab('roles')}>Rôles</button>
      </div>

      {activeTab==='users' && (
        <div className="users-module">
          <h4>Gestion des utilisateurs</h4>
          <table className="admin-table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Rôle</th></tr>
            </thead>
            <tbody>
              {users.map(u=> (
                <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="add-user-form" style={{marginTop:20}}>
            <input placeholder="Nom" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})}/>
            <input placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})}/>
            <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}>
              {roles.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleAddUser}>Ajouter</button>
          </div>
        </div>
      )}

      {activeTab==='roles' && (
        <div className="roles-module">
          <h4>Liste des rôles disponibles</h4>
          <ul>
            {roles.map(r=><li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Administration;
