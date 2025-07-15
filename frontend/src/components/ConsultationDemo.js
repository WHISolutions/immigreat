// Démo complète du système de consultations
import React, { useState } from 'react';
import ConsultationManager from './ConsultationManager';
import { consultationService, statsService } from '../services/consultationAPI';

const ConsultationDemo = () => {
  const [leadId, setLeadId] = useState(2);
  const [conseillerId, setConseillerId] = useState(26);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await statsService.getConsultationStats();
      setStats(result.stats || []);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de changement de consultation
  const handleConsultationChange = (action, consultation) => {
    console.log(`Action: ${action}`, consultation);
    // Recharger les stats après chaque action
    loadStats();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Démo du système de consultations</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Configuration de test</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>Lead ID: </label>
          <input 
            type="number" 
            value={leadId} 
            onChange={(e) => setLeadId(Number(e.target.value))}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Conseiller ID: </label>
          <input 
            type="number" 
            value={conseillerId} 
            onChange={(e) => setConseillerId(Number(e.target.value))}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <button onClick={loadStats} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Charger les stats
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Gestionnaire de consultations</h3>
        <ConsultationManager 
          leadId={leadId}
          conseillerId={conseillerId}
          onConsultationChange={handleConsultationChange}
        />
      </div>

      <div>
        <h3>Statistiques des consultations</h3>
        {loading ? (
          <p>Chargement des statistiques...</p>
        ) : (
          <div>
            {stats.length === 0 ? (
              <p>Aucune statistique disponible</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Conseiller</th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Consultations</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stat.conseillerName}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stat.conseillerEmail}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stat.totalConsultations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationDemo;
