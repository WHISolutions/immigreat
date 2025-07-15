import React from 'react';
import LeadManagement from './components/LeadManagement';

function LeadTestApp() {
  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            margin: '0',
            fontSize: '2.5rem',
            fontWeight: 'bold'
          }}>
            🚀 Test API Backend Express.js + Sequelize
          </h1>
          <p style={{ 
            margin: '10px 0 0 0',
            fontSize: '1.1rem',
            opacity: 0.9
          }}>
            Formulaire de création de leads connecté à MySQL/SQLite
          </p>
        </div>
        
        <div style={{ padding: '30px' }}>
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
              📋 Statut de l'API
            </h3>
            <p style={{ margin: '0', color: '#424242' }}>
              ✅ Serveur backend: <strong>http://localhost:5000</strong><br/>
              ✅ Base de données: <strong>SQLite (avec support MySQL)</strong><br/>
              ✅ Endpoints: <strong>GET/POST /api/leads</strong>
            </p>
          </div>
          
          <LeadManagement />
        </div>
      </div>
    </div>
  );
}

export default LeadTestApp;
