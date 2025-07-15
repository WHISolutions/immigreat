import React, { useState, useEffect } from 'react';
import { updateMyProfile, changePassword, uploadProfilePhoto, deleteProfilePhoto, getMyProfile } from '../services/usersAPI';
import '../styles/Profile.css';

// Fonction utilitaire pour construire l'URL complète des images
const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === '/default-avatar.png') {
    return '/default-avatar.png'; // Image par défaut locale
  }
  
  // Si l'image commence par /uploads, on ajoute l'URL du backend
  if (imagePath.startsWith('/uploads')) {
    return `http://localhost:5000${imagePath}`;
  }
  
  // Sinon, on retourne tel quel
  return imagePath;
};

function Profile({ userRole, userName, onPhotoUpdate }) { // Ajout de la prop onPhotoUpdate
  // État pour les informations du profil
  const [profile, setProfile] = useState({
    photo: '/default-avatar.png',
    nom: '', // Initialiser avec une chaîne vide
    prenom: '', // Initialiser avec une chaîne vide
    role: '', // Initialiser avec une chaîne vide
    email: '', // Initialiser avec une chaîne vide
    telephone: '',
    bureau: '',
    username: '',
    statut: 'actif'
  });

  // Effet pour mettre à jour le profil avec les props
  useEffect(() => {
    // Charger le profil réel depuis l'API
    const loadProfile = async () => {
      try {
        console.log('🔄 Chargement du profil depuis l\'API...');
        const profileData = await getMyProfile();
        
        console.log('📥 Profil reçu de l\'API:', profileData);
        
        if (profileData.success && profileData.data) {
          setProfile(prevProfile => ({
            ...prevProfile,
            ...profileData.data,
            role: profileData.data.role || userRole || 'N/A',
            username: `${profileData.data.prenom} ${profileData.data.nom}` || userName || 'N/A'
          }));
        } else {
          // Fallback vers les données simulées si l'API échoue
          console.log('⚠️ Fallback vers données simulées');
          const userDetails = {
            nom: userName ? userName.split(' ').slice(1).join(' ') : 'N/A',
            prenom: userName ? userName.split(' ')[0] : 'N/A',
            email: `${userName ? userName.toLowerCase().replace(' ', '.') : 'utilisateur'}@example.com`,
          };

          setProfile(prevProfile => ({
            ...prevProfile,
            ...userDetails,
            role: userRole || 'N/A',
            username: userName || 'N/A'
          }));
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du profil:', error);
        // Fallback vers les données simulées en cas d'erreur
        const userDetails = {
          nom: userName ? userName.split(' ').slice(1).join(' ') : 'N/A',
          prenom: userName ? userName.split(' ')[0] : 'N/A', 
          email: `${userName ? userName.toLowerCase().replace(' ', '.') : 'utilisateur'}@example.com`,
        };

        setProfile(prevProfile => ({
          ...prevProfile,
          ...userDetails,
          role: userRole || 'N/A',
          username: userName || 'N/A'
        }));
      }
    };

    loadProfile();
  }, [userRole, userName]);

  // État pour le mode édition
  const [editMode, setEditMode] = useState(false);
  
  // État pour le changement de mot de passe
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // État pour le téléchargement de photo
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Effet pour créer une URL de prévisualisation lorsqu'un fichier est sélectionné
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Nettoyer l'URL lors du démontage
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);
  
  // Gérer les changements dans le formulaire de profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    // Empêcher la modification du rôle directement depuis le formulaire
    if (name === 'role') return;
    setProfile({
      ...profile,
      [name]: value
    });
  };
  
  // Gérer les changements dans le formulaire de mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  // Gérer la sélection de fichier pour la photo de profil
  const handleFileSelect = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }
    
    const file = e.target.files[0];
    setSelectedFile(file);
  };
  
  // Sauvegarder les modifications du profil
  const saveProfile = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Sauvegarde du profil en cours...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }

      // 1. D'abord, télécharger la photo si une nouvelle a été sélectionnée
      let photoUrl = profile.photo;
      if (selectedFile) {
        try {
          console.log('📸 Upload de la nouvelle photo...', {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type
          });
          const photoResponse = await uploadProfilePhoto(selectedFile, token);
          photoUrl = photoResponse.photoUrl || photoResponse.data?.photoUrl;
          console.log('✅ Photo téléchargée, URL:', photoUrl);
          console.log('📋 Réponse complète upload:', photoResponse);
        } catch (photoError) {
          console.error('❌ Erreur upload photo:', photoError);
          alert(`⚠️ Erreur lors du téléchargement de la photo: ${photoError.message}\n\nLes autres modifications du profil seront quand même sauvegardées.`);
        }
      } else {
        console.log('ℹ️ Aucune photo sélectionnée pour l\'upload');
      }

      // 2. Ensuite, mettre à jour les informations du profil
      const updateData = {
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        telephone: profile.telephone,
        bureau: profile.bureau,
        photo: photoUrl || profile.photo // Toujours inclure la photo (nouvelle ou ancienne)
      };

      console.log('📝 Données à sauvegarder:', updateData);

      // Appeler l'API pour mettre à jour le profil
      const response = await updateMyProfile(updateData, token);
      
      console.log('✅ Profil mis à jour avec succès:', response);

      // Nettoyer les états temporaires
      setSelectedFile(null);

      alert("✅ Profil mis à jour avec succès !");
      setEditMode(false);

      // Recharger les données du profil depuis le serveur
      // pour s'assurer que l'affichage est synchronisé avec la base de données
      console.log('🔄 Rechargement des données du profil depuis le serveur...');
      try {
        const updatedProfileData = await getMyProfile(token);
        console.log('📋 Données rechargées:', updatedProfileData);
        const newProfile = updatedProfileData.data || updatedProfileData;
        setProfile(newProfile);
        
        // Mettre à jour la photo dans le Dashboard si la callback existe
        if (onPhotoUpdate && newProfile.photo) {
          onPhotoUpdate(newProfile.photo);
        }
      } catch (reloadError) {
        console.error('❌ Erreur lors du rechargement:', reloadError);
        // Fallback: mettre à jour avec les données locales
        setProfile(prevProfile => ({
          ...prevProfile,
          ...updateData
        }));
        
        // Mettre à jour la photo dans le Dashboard même en cas de fallback
        if (onPhotoUpdate && updateData.photo) {
          onPhotoUpdate(updateData.photo);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du profil:', error);
      
      let errorMessage = 'Erreur lors de la sauvegarde du profil';
      if (error.message.includes('401')) {
        errorMessage = '🔐 Session expirée. Veuillez vous reconnecter.';
      } else if (error.message.includes('403')) {
        errorMessage = '🚫 Vous n\'avez pas les permissions pour modifier ce profil.';
      } else if (error.message.includes('400')) {
        errorMessage = '📝 Données invalides. Vérifiez les informations saisies.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Supprimer la photo de profil
  const removeProfilePhoto = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }

    try {
      console.log('🔄 Suppression de la photo de profil...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }

      await deleteProfilePhoto(token);
      
      // Mettre à jour l'état local
      setProfile(prevProfile => ({
        ...prevProfile,
        photo: '/default-avatar.png'
      }));

      // Mettre à jour la photo dans le Dashboard
      if (onPhotoUpdate) {
        onPhotoUpdate('/default-avatar.png');
      }

      // Nettoyer les états temporaires
      setSelectedFile(null);

      console.log('✅ Photo supprimée avec succès');
      alert("✅ Photo de profil supprimée avec succès !");
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la photo:', error);
      
      let errorMessage = 'Erreur lors de la suppression de la photo';
      if (error.message.includes('401')) {
        errorMessage = '🔐 Session expirée. Veuillez vous reconnecter.';
      } else if (error.message.includes('403')) {
        errorMessage = '🚫 Vous n\'avez pas les permissions pour supprimer cette photo.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Changer le mot de passe
  const changeUserPassword = async (e) => {
    e.preventDefault();
    
    // Vérifier que les mots de passe correspondent
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    // Vérifier la longueur du nouveau mot de passe
    if (passwordData.newPassword.length < 6) {
      alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      console.log('🔄 Changement de mot de passe en cours...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ Erreur d\'authentification. Veuillez vous reconnecter.');
        return;
      }

      // Appeler l'API pour changer le mot de passe
      await changePassword(passwordData.currentPassword, passwordData.newPassword, token);
      
      console.log('✅ Mot de passe changé avec succès');
      alert("✅ Mot de passe changé avec succès !");
      
      // Réinitialiser le formulaire
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordChange(false);

    } catch (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error);
      
      let errorMessage = 'Erreur lors du changement de mot de passe';
      if (error.message.includes('401')) {
        errorMessage = '🔐 Mot de passe actuel incorrect ou session expirée.';
      } else if (error.message.includes('403')) {
        errorMessage = '🚫 Vous n\'avez pas les permissions pour changer ce mot de passe.';
      } else if (error.message.includes('400')) {
        errorMessage = '📝 Données invalides. Vérifiez les mots de passe saisis.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };
  
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
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Mon Profil</h2>
        {!editMode && (
          <button className="btn-primary" onClick={() => setEditMode(true)}>
            Modifier le profil
          </button>
        )}
      </div>
      
      <div className="profile-content">
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            <img 
              src={previewUrl || getImageUrl(profile.photo)} 
              alt="Photo de profil" 
              className="profile-photo" 
            />
            {editMode && (
              <div className="photo-upload-overlay">
                <label htmlFor="photo-upload" className="photo-upload-label">
                  <span>Changer la photo</span>
                </label>
                <input 
                  type="file" 
                  id="photo-upload" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="photo-upload-input" 
                />
                {profile.photo !== '/default-avatar.png' && (
                  <button 
                    type="button"
                    onClick={removeProfilePhoto}
                    className="photo-remove-btn"
                    title="Supprimer la photo de profil"
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      zIndex: 10
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="profile-name-role">
            <h3>{profile.prenom} {profile.nom}</h3>
            {/* Afficher le rôle formaté à partir de profile.role */}
            <span className="profile-role">{formaterRole(profile.role)}</span>
            <span className={`profile-status status-${profile.statut}`}>
              {profile.statut === 'actif' ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        
        {editMode ? (
          <form onSubmit={saveProfile} className="profile-form">
            <div className="profile-section">
              <h3>Informations de base</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom:</label>
                  <input 
                    type="text" 
                    name="prenom" 
                    value={profile.prenom} 
                    onChange={handleProfileChange} 
                    readOnly // Rendre le prénom non modifiable
                  />
                </div>
                <div className="form-group">
                  <label>Nom:</label>
                  <input 
                    type="text" 
                    name="nom" 
                    value={profile.nom} 
                    onChange={handleProfileChange} 
                    readOnly // Rendre le nom non modifiable
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email:</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={profile.email} 
                    onChange={handleProfileChange} 
                    required 
                    readOnly // Rendre l'email non modifiable
                  />
                </div>
                <div className="form-group">
                  <label>Rôle:</label>
                  <input 
                    type="text" 
                    name="role" 
                    value={formaterRole(profile.role)} // Afficher le rôle formaté
                    readOnly // Rendre le rôle non modifiable
                  />
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Coordonnées</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input 
                    type="tel" 
                    name="telephone" 
                    value={profile.telephone} 
                    onChange={handleProfileChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Bureau:</label>
                  <input 
                    type="text" 
                    name="bureau" 
                    value={profile.bureau} 
                    onChange={handleProfileChange} 
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>
                Annuler
              </button>
              <button type="submit" className="btn-primary">
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-section">
              <h3>Informations de base</h3>
              <div className="profile-info-row">
                <div className="profile-info-label">Prénom:</div>
                <div className="profile-info-value">{profile.prenom}</div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Nom:</div>
                <div className="profile-info-value">{profile.nom}</div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Rôle:</div>
                <div className="profile-info-value">{formaterRole(profile.role)}</div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Coordonnées</h3>
              <div className="profile-info-row">
                <div className="profile-info-label">Email professionnel:</div>
                <div className="profile-info-value">{profile.email}</div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Téléphone:</div>
                <div className="profile-info-value">{profile.telephone}</div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Bureau:</div>
                <div className="profile-info-value">{profile.bureau}</div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Accès au système</h3>
              <div className="profile-info-row">
                <div className="profile-info-label">Nom d'utilisateur:</div>
                <div className="profile-info-value">{profile.username}</div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Mot de passe:</div>
                <div className="profile-info-value">
                  ••••••••
                  <button 
                    className="btn-link" 
                    onClick={() => setShowPasswordChange(true)}
                  >
                    Changer le mot de passe
                  </button>
                </div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-label">Statut:</div>
                <div className="profile-info-value">
                  <span className={`status-badge status-${profile.statut}`}>
                    {profile.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showPasswordChange && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Changer le mot de passe</h3>
              <button className="close-btn" onClick={() => setShowPasswordChange(false)}>×</button>
            </div>
            <form onSubmit={changeUserPassword}>
              <div className="form-group">
                <label>Mot de passe actuel:</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwordData.currentPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nouveau mot de passe:</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwordData.newPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Confirmer le nouveau mot de passe:</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordData.confirmPassword} 
                  onChange={handlePasswordChange} 
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordChange(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
