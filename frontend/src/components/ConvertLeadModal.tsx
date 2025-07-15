import React, { useState } from 'react';
import './ConvertLeadModal.css';

interface Lead {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  source: string;
  interet: string;
  conseillere?: string;
  statut: string;
}

interface ConvertLeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (leadId: number, utilisateur: string, notes?: string) => Promise<void>;
  currentUser?: string;
}

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConvert,
  currentUser = 'Administrateur'
}) => {
  const [utilisateur, setUtilisateur] = useState(currentUser);
  const [notes, setNotes] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!utilisateur.trim()) {
      alert('Veuillez saisir le nom de l\'utilisateur');
      return;
    }

    setIsConverting(true);
    
    try {
      await onConvert(lead.id, utilisateur.trim(), notes.trim() || undefined);
      onClose();
      // Reset form
      setNotes('');
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      alert('Erreur lors de la conversion du lead');
    } finally {
      setIsConverting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content convert-lead-modal">
        <div className="modal-header">
          <h3>🔄 Convertir le lead en client</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="lead-info">
            <h4>Informations du lead</h4>
            <div className="info-grid">
              <div className="info-item">
                <strong>Nom:</strong> {lead.nom} {lead.prenom}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {lead.email}
              </div>
              <div className="info-item">
                <strong>Téléphone:</strong> {lead.telephone}
              </div>
              <div className="info-item">
                <strong>Intérêt:</strong> {lead.interet}
              </div>
              <div className="info-item">
                <strong>Source:</strong> {lead.source}
              </div>
              {lead.conseillere && (
                <div className="info-item">
                  <strong>Conseillère:</strong> {lead.conseillere}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="conversion-form">
            <div className="form-group">
              <label htmlFor="utilisateur">
                <strong>Utilisateur effectuant la conversion *</strong>
              </label>
              <select
                id="utilisateur"
                value={utilisateur}
                onChange={(e) => setUtilisateur(e.target.value)}
                required
                className="form-control"
              >
                <option value="Administrateur">Administrateur</option>
                <option value="Marie Tremblay">Marie Tremblay</option>
                <option value="Sophie Martin">Sophie Martin</option>
                <option value="Julie Lefebvre">Julie Lefebvre</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                <strong>Notes de conversion (optionnel)</strong>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette conversion..."
                className="form-control"
                rows={3}
              />
            </div>

            <div className="conversion-info">
              <div className="info-box">
                <h5>🎯 Actions qui seront effectuées :</h5>
                <ul>
                  <li>✅ Création d'un nouveau client avec les données du lead</li>
                  <li>🔢 Génération automatique d'un numéro de dossier (CL-2025-XXX)</li>
                  <li>📝 Mise à jour du statut du lead vers "Client"</li>
                  <li>📋 Enregistrement de l'action dans le journal</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isConverting}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isConverting}
          >
            {isConverting ? '🔄 Conversion...' : '🔄 Convertir en client'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertLeadModal; 