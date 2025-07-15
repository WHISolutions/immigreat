import React, { useState, useEffect } from 'react';
import { getConversionHistory } from '../services/leadsAPI';
import './ConversionHistory.css';

interface ConversionLog {
  id: number;
  lead_id: number;
  client_id: number;
  numero_dossier: string;
  utilisateur: string;
  date_conversion: string;
  notes?: string;
  lead: {
    nom: string;
    prenom: string;
    email: string;
  };
  client: {
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
}

const ConversionHistory: React.FC = () => {
  const [conversions, setConversions] = useState<ConversionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversions = async () => {
    try {
      setIsLoading(true);
      const response = await getConversionHistory(100);
      
      if (response.success) {
        setConversions(response.data.conversions);
        setError('');
      } else {
        setError('Erreur lors du chargement de l\'historique');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Impossible de charger l\'historique des conversions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, []);

  if (isLoading) {
    return (
      <div className="conversion-history-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversion-history-container">
        <div className="error">
          <h3>❌ Erreur</h3>
          <p>{error}</p>
          <button onClick={fetchConversions} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversion-history-container">
      <div className="header">
        <h2>📋 Historique des conversions</h2>
        <p>Historique des leads convertis en clients</p>
        <button onClick={fetchConversions} className="refresh-button">
          🔄 Actualiser
        </button>
      </div>

      {conversions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔄</div>
          <h3>Aucune conversion trouvée</h3>
          <p>Les conversions de leads en clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="conversions-grid">
          {conversions.map((conversion) => (
            <div key={conversion.id} className="conversion-card">
              <div className="conversion-header">
                <div className="conversion-info">
                  <h4>{conversion.lead.prenom} {conversion.lead.nom}</h4>
                  <span className="conversion-date">
                    {new Date(conversion.date_conversion).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="dossier-number">
                  {conversion.numero_dossier}
                </div>
              </div>

              <div className="conversion-details">
                <div className="detail-item">
                  <strong>👤 Utilisateur:</strong>
                  <span>{conversion.utilisateur}</span>
                </div>
                
                <div className="detail-item">
                  <strong>📧 Email du lead:</strong>
                  <span>{conversion.lead.email}</span>
                </div>
                
                <div className="detail-item">
                  <strong>🎯 Client créé:</strong>
                  <span>{conversion.client.nom} {conversion.client.prenom}</span>
                </div>

                {conversion.notes && (
                  <div className="conversion-notes">
                    <strong>📝 Notes:</strong>
                    <p>{conversion.notes}</p>
                  </div>
                )}
              </div>

              <div className="conversion-footer">
                <div className="status-badge">
                  ✅ Converti
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stats">
        <div className="stat-item">
          <span className="stat-number">{conversions.length}</span>
          <span className="stat-label">Conversions totales</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {conversions.filter(c => 
              new Date(c.date_conversion).getMonth() === new Date().getMonth()
            ).length}
          </span>
          <span className="stat-label">Ce mois</span>
        </div>
      </div>
    </div>
  );
};

export default ConversionHistory; 