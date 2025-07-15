// Fonctions de vérification des permissions pour les factures et contrats
const canCreateFacture = (userRole) => {
  return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
};

const canModifyFacture = (userRole, isValidated) => {
  if (!isValidated) {
    // Avant validation, la conseillère, le directeur et l'administrateur peuvent modifier
    return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
  } else {
    // Après validation, seuls le directeur et l'administrateur peuvent modifier
    return userRole === 'directeur' || userRole === 'administrateur';
  }
};

const canValidateFacture = (userRole) => {
  // Tous les rôles qui peuvent créer une facture peuvent aussi la valider
  return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
};

const canCreateContrat = (userRole) => {
  // Conseillères, directeur et administrateur peuvent créer/générer des contrats
  return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
};

const canUploadSignedContrat = (userRole) => {
  // Conseillères, directeur et administrateur peuvent téléverser des contrats signés
  return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
};

export {
  canCreateFacture,
  canModifyFacture,
  canValidateFacture,
  canCreateContrat,
  canUploadSignedContrat
};
