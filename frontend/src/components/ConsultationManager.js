import React, { useState, useEffect } from 'react';
import { consultationService } from '../services/consultationAPI';
import './ConsultationManager.css';

const ConsultationManager = ({ leadId, conseillerId, onConsultationChange }) => {
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Charger les consultations du lead
  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      const response = await consultationService.getConsultationsByLead(leadId, true);
      setConsultations(response.consultations || []);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Créer une nouvelle consultation
  const handleCreateConsultation = async () => {
    if (!conseillerId) {
      alert('Aucun conseiller sélectionné');
      return;
    }

    try {
      setIsLoading(true);
      const response = await consultationService.createConsultation(
        leadId,
        conseillerId,
        'Consultation effectuée'
      );
      
      if (response.consultation) {
        await loadConsultations();
        if (onConsultationChange) {
          onConsultationChange('created', response.consultation);
        }
        alert('Consultation enregistrée avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la consultation:', error);
      alert('Erreur lors de l\'enregistrement de la consultation');
    } finally {
      setIsLoading(false);
    }
  };

  // Annuler une consultation
  const handleCancelConsultation = async () => {
    if (!selectedConsultation || !cancelReason.trim()) {
      alert('Veuillez saisir une raison d\'annulation');
      return;
    }

    try {
      setIsLoading(true);
      const response = await consultationService.invalidateConsultation(
        selectedConsultation.id,
        cancelReason
      );
      
      if (response.consultation) {
        await loadConsultations();
        if (onConsultationChange) {
          onConsultationChange('cancelled', response.consultation);
        }
        setShowCancelModal(false);
        setSelectedConsultation(null);
        setCancelReason('');
        alert('Consultation annulée avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la consultation:', error);
      alert('Erreur lors de l\'annulation de la consultation');
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir le modal d'annulation
  const openCancelModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowCancelModal(true);
  };

  // Fermer le modal d'annulation
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedConsultation(null);
    setCancelReason('');
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Charger les consultations au montage
  useEffect(() => {
    if (leadId) {
      loadConsultations();
    }
  }, [leadId]);

  return (
    <div className="consultation-manager">
      <div className="consultation-header">
        <h4>Consultations effectuées</h4>
        <button 
          className="btn btn-primary btn-sm"
          onClick={handleCreateConsultation}
          disabled={isLoading || !conseillerId}
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer consultation'}
        </button>
      </div>

      <div className="consultation-list">
        {consultations.length === 0 ? (
          <p className="no-consultations">Aucune consultation enregistrée</p>
        ) : (
          <table className="consultation-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Conseiller</th>
                <th>Statut</th>
                <th>Raison</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((consultation) => (
                <tr key={consultation.id} className={!consultation.isValid ? 'cancelled' : ''}>
                  <td>{formatDate(consultation.createdAt)}</td>
                  <td>{consultation.conseiller?.name || 'N/A'}</td>
                  <td>
                    <span className={`status ${consultation.isValid ? 'valid' : 'invalid'}`}>
                      {consultation.isValid ? 'Valide' : 'Annulée'}
                    </span>
                  </td>
                  <td>{consultation.reason}</td>
                  <td>
                    {consultation.isValid && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => openCancelModal(consultation)}
                        disabled={isLoading}
                      >
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'annulation */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Annuler la consultation</h3>
              <button className="modal-close" onClick={closeCancelModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Vous êtes sur le point d'annuler cette consultation :</p>
              <p><strong>Date :</strong> {selectedConsultation && formatDate(selectedConsultation.createdAt)}</p>
              <p><strong>Conseiller :</strong> {selectedConsultation?.conseiller?.name}</p>
              
              <div className="form-group">
                <label htmlFor="cancelReason">Raison de l'annulation *</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Saisissez la raison de l'annulation..."
                  rows="3"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={closeCancelModal}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleCancelConsultation}
                disabled={isLoading || !cancelReason.trim()}
              >
                {isLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationManager;
