import React from 'react';
import '../styles/ClientActions.css';
import { canCreateFacture, canModifyFacture, canCreateContrat } from '../utils/PermissionsClient';

function ClientActions({ client, userRole, onFactureClick, onContratClick, onViewClick, onEditClick, onDeleteClick }) {
  // Vérifier si l'utilisateur peut créer/modifier des factures
  const canAccessFacture = canCreateFacture(userRole);
  
  // Vérifier si l'utilisateur peut créer/gérer des contrats
  const canAccessContrat = canCreateContrat(userRole);
  
  return (
    <div className="client-actions">
      {/* Actions principales de gestion client */}
      <button 
        className="btn-action btn-view" 
        onClick={() => onViewClick(client)}
        title="Voir la fiche client"
      >
        <i className="fas fa-eye"></i> Voir
      </button>
      
      <button 
        className="btn-action btn-edit" 
        onClick={() => onEditClick(client)}
        title="Modifier la fiche client"
      >
        <i className="fas fa-edit"></i> Modifier
      </button>
      
      <button 
        className="btn-action btn-delete" 
        onClick={() => onDeleteClick(client)}
        title="Supprimer le client"
      >
        <i className="fas fa-trash"></i> Supprimer
      </button>
      
      {/* Séparateur */}
      <div className="actions-separator"></div>
      
      {/* Actions spécialisées */}
      {canAccessFacture && (
        <button 
          className="btn-action btn-facture" 
          onClick={() => onFactureClick(client)}
          title="Gérer les factures"
        >
          <i className="fas fa-file-invoice-dollar"></i> Facture
        </button>
      )}
      
      {canAccessContrat && (
        <button 
          className="btn-action btn-contrat" 
          onClick={() => onContratClick(client)}
          title="Gérer les contrats"
        >
          <i className="fas fa-file-contract"></i> Contrat
        </button>
      )}
    </div>
  );
}

export default ClientActions;
