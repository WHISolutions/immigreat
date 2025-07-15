import React, { useState } from 'react';
import CreateLeadForm from './CreateLeadForm';
import LeadsList from './LeadsList';
import ConversionHistory from './ConversionHistory';

const LeadManagement: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'leads' | 'history'>('leads');

  const handleLeadCreated = () => {
    // Déclencher un rafraîchissement de la liste des leads
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      padding: '20px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#2c3e50', 
            fontSize: '2.5rem', 
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            🎯 Gestion des Leads
          </h1>
          <p style={{ 
            color: '#6c757d', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Créez et gérez vos prospects d'immigration. Convertissez vos leads en clients et suivez l'historique des conversions.
          </p>
        </div>

        {/* Onglets de navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '30px',
          borderBottom: '2px solid #dee2e6'
        }}>
          <button
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              color: activeTab === 'leads' ? '#007bff' : '#6c757d',
              borderBottom: activeTab === 'leads' ? '2px solid #007bff' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            📋 Gestion des Leads
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              color: activeTab === 'history' ? '#007bff' : '#6c757d',
              borderBottom: activeTab === 'history' ? '2px solid #007bff' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            🔄 Historique des Conversions
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'leads' ? (
          <>
            {/* Formulaire de création */}
            <div style={{ marginBottom: '40px' }}>
              <CreateLeadForm onLeadCreated={handleLeadCreated} />
            </div>

            {/* Ligne de séparation */}
            <div style={{ 
              borderTop: '2px solid #dee2e6', 
              margin: '40px 0',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#f8f9fa',
                padding: '0 20px',
                color: '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                LEADS EXISTANTS
              </div>
            </div>

            {/* Liste des leads */}
            <div>
              <LeadsList refreshTrigger={refreshTrigger} />
            </div>
          </>
        ) : (
          /* Historique des conversions */
          <ConversionHistory />
        )}
      </div>
    </div>
  );
};

export default LeadManagement;