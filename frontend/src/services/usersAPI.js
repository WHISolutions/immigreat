// Le fichier api.js est vide, nous utilisons directement fetch
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getUsers = async (token) => {
  const res = await fetch(BASE_URL + '/users', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
  const data = await res.json();
  return data.data || data;
};

// Fonction pour récupérer uniquement les conseillères
export const getConseillers = async () => {
  try {
    const res = await fetch(BASE_URL + '/users/conseillers');
    if (!res.ok) throw new Error('Erreur lors du chargement des conseillères');
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error('Erreur lors de la récupération des conseillères:', error);
    throw error;
  }
};

export const createUser = async (payload, token) => {
  try {
    console.log('🚀 === DÉBUT createUser ===');
    console.log('📝 Payload reçu:', payload);
    console.log('🔑 Token reçu:', token ? `${token.substring(0, 20)}...` : 'AUCUN TOKEN');
    
    // Adapter les champs pour le nouveau backend
    const userData = {
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      telephone: payload.telephone || '',
      mot_de_passe: payload.motDePasse || 'temp123',
      role: payload.role === 'administrateur' ? 'admin' : payload.role,
      permissions: payload.permissions || {}
    };
    
    console.log('📊 Données transformées:', userData);
    console.log('🌐 URL cible:', BASE_URL + '/users');
    
    console.log('🔧 Utilisation de fetch');
    const response = await fetch(BASE_URL + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(userData)
    });
    
    console.log('📡 Réponse fetch:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorData = null;
      let errorMessage = `Erreur ${response.status} - ${response.statusText}`;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('❌ Erreur du serveur:', errorData);
      } catch (parseError) {
        console.error('❌ Impossible de parser l\'erreur:', parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ Résultat final:', result);
    return result;
    
  } catch (error) {
    console.error('❌ === ERREUR GLOBALE createUser ===');
    console.error('Type:', typeof error);
    console.error('Instance of Error:', error instanceof Error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Objet complet:', error);
    
    // Re-lancer l'erreur pour que le composant puisse la capturer
    throw error;
  }
};

export const toggleUserStatus = async (id, actif, token) => {
  const res = await fetch(BASE_URL + `/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ actif })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut');
  }
  return res.json();
};

// Nouvelle fonction pour la connexion
export const loginUser = async (email, mot_de_passe) => {
  const res = await fetch(BASE_URL + '/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, mot_de_passe })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
  return res.json();
};

// Fonction pour obtenir les permissions disponibles
export const getPermissions = async (token) => {
  const res = await fetch(BASE_URL + '/users/permissions', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Erreur lors du chargement des permissions');
  const data = await res.json();
  return data.data || data;
};

// Fonction pour mettre à jour un utilisateur (profil)
export const updateUser = async (id, userData, token) => {
  try {
    console.log('🔄 [API] Mise à jour utilisateur:', { id, userData });
    
    const response = await fetch(BASE_URL + `/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Utilisateur mis à jour avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour utilisateur:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour de l\'utilisateur');
  }
};

// Fonction pour récupérer son propre profil
export const getMyProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    console.log('🔄 [API] Récupération de mon profil...');
    
    const response = await fetch(BASE_URL + '/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Mon profil récupéré avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur récupération profil:', error);
    throw new Error(error.message || 'Erreur lors de la récupération du profil');
  }
};

// Fonction pour mettre à jour son propre profil
export const updateMyProfile = async (userData, token) => {
  try {
    console.log('🔄 [API] Mise à jour de mon profil:', userData);
    
    const response = await fetch(BASE_URL + '/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Mon profil mis à jour avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour profil:', error);
    throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
  }
};

// Fonction pour changer son mot de passe
export const changePassword = async (currentPassword, newPassword, token) => {
  try {
    console.log('🔄 [API] Changement de mot de passe...');
    
    const response = await fetch(BASE_URL + '/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Mot de passe changé avec succès');
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur changement mot de passe:', error);
    throw new Error(error.message || 'Erreur lors du changement de mot de passe');
  }
};

// Fonction pour mettre à jour les permissions d'un utilisateur
export const updateUserPermissions = async (id, permissions, token) => {
  const res = await fetch(BASE_URL + `/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ permissions })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erreur lors de la mise à jour des permissions');
  }
  return res.json();
};

export const resetUserPassword = async (id, token) => {
  const res = await fetch(BASE_URL + `/users/${id}/password-reset`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  if (!res.ok) throw new Error('Erreur reset MDP');
  return res.json();
};

// Fonction pour supprimer un utilisateur
export const deleteUser = async (id, token) => {
  const res = await fetch(BASE_URL + `/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token
    }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
  }
  return res.json();
};

// Fonction pour télécharger une photo de profil
export const uploadProfilePhoto = async (file, token) => {
  try {
    console.log('🔄 [API] Upload photo de profil...');
    
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(BASE_URL + '/users/upload-photo', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
        // Note: pas de Content-Type pour FormData, le navigateur le gère automatiquement
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Photo téléchargée avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur upload photo:', error);
    throw new Error(error.message || 'Erreur lors du téléchargement de la photo');
  }
};

// Fonction pour supprimer sa photo de profil
export const deleteProfilePhoto = async (token) => {
  try {
    console.log('🔄 [API] Suppression photo de profil...');
    
    const response = await fetch(BASE_URL + '/users/delete-photo', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Photo supprimée avec succès');
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur suppression photo:', error);
    throw new Error(error.message || 'Erreur lors de la suppression de la photo');
  }
};

// Fonction pour télécharger une photo de profil pour un utilisateur spécifique (admin)
export const uploadUserPhoto = async (userId, file, token) => {
  try {
    console.log('🔄 [API] Upload photo pour utilisateur:', userId);
    
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch(BASE_URL + `/users/${userId}/upload-photo`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
        // Note: pas de Content-Type pour FormData
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Photo utilisateur téléchargée avec succès:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur upload photo utilisateur:', error);
    throw new Error(error.message || 'Erreur lors du téléchargement de la photo');
  }
};

// Fonction pour supprimer la photo de profil d'un utilisateur spécifique (admin)
export const deleteUserPhoto = async (userId, token) => {
  try {
    console.log('🔄 [API] Suppression photo utilisateur:', userId);
    
    const response = await fetch(BASE_URL + `/users/${userId}/delete-photo`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    console.log('✅ [API] Photo utilisateur supprimée avec succès');
    return data;
  } catch (error) {
    console.error('❌ [API] Erreur suppression photo utilisateur:', error);
    throw new Error(error.message || 'Erreur lors de la suppression de la photo');
  }
};