import React, { useState, useEffect } from 'react';
import { performGlobalSearch } from '../services/searchAPI';

/**
 * Composant d'exemple montrant comment utiliser la recherche globale
 * dans d'autres parties de l'application
 */
function SearchExample() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Exemple de recherche automatique quand le composant se monte
  useEffect(() => {
    const searchForRecentItems = async () => {
      try {
        setLoading(true);
        const searchResults = await performGlobalSearch('recent');
        setResults(searchResults.data);
      } catch (error) {
        console.error('Erreur recherche initiale:', error);
      } finally {
        setLoading(false);
      }
    };

    searchForRecentItems();
  }, []);

  // Fonction pour effectuer une recherche personnalisée
  const handleCustomSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const searchResults = await performGlobalSearch(query);
      setResults(searchResults.data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Exemple d'utilisation de la recherche globale</h2>
      
      {/* Recherche personnalisée */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
          />
          <button
            onClick={handleCustomSearch}
            disabled={loading || !query.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>

      {/* Affichage des résultats */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Recherche en cours...</p>
        </div>
      )}

      {results && !loading && (
        <div>
          <h3>Résultats de recherche</h3>
          
          {/* Leads */}
          {results.leads && results.leads.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#2196F3' }}>🎯 Leads ({results.leads.length})</h4>
              {results.leads.map((lead, index) => (
                <div key={index} style={{
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  backgroundColor: '#f8f9ff'
                }}>
                  <strong>{lead.title}</strong><br />
                  <small>{lead.subtitle}</small><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{lead.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Clients */}
          {results.clients && results.clients.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#4CAF50' }}>👤 Clients ({results.clients.length})</h4>
              {results.clients.map((client, index) => (
                <div key={index} style={{
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  backgroundColor: '#f8fff8'
                }}>
                  <strong>{client.title}</strong><br />
                  <small>{client.subtitle}</small><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{client.description}</span>
                  {client.metadata.numero_dossier && (
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                      📁 Dossier: {client.metadata.numero_dossier}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dossiers */}
          {results.dossiers && results.dossiers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#FF9800' }}>📁 Dossiers ({results.dossiers.length})</h4>
              {results.dossiers.map((dossier, index) => (
                <div key={index} style={{
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  backgroundColor: '#fffaf0'
                }}>
                  <strong>{dossier.title}</strong><br />
                  <small>{dossier.subtitle}</small><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{dossier.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Factures */}
          {results.factures && results.factures.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#9C27B0' }}>💰 Factures ({results.factures.length})</h4>
              {results.factures.map((facture, index) => (
                <div key={index} style={{
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  backgroundColor: '#fdf8ff'
                }}>
                  <strong>{facture.title}</strong><br />
                  <small>{facture.subtitle}</small><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{facture.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Conseillers */}
          {results.conseillers && results.conseillers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#607D8B' }}>👩‍💼 Conseillères ({results.conseillers.length})</h4>
              {results.conseillers.map((conseiller, index) => (
                <div key={index} style={{
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  backgroundColor: '#f8f9fb'
                }}>
                  <strong>{conseiller.title}</strong><br />
                  <small>{conseiller.subtitle}</small><br />
                  <span style={{ fontSize: '12px', color: '#666' }}>{conseiller.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {(!results.leads || results.leads.length === 0) &&
           (!results.clients || results.clients.length === 0) &&
           (!results.dossiers || results.dossiers.length === 0) &&
           (!results.factures || results.factures.length === 0) &&
           (!results.conseillers || results.conseillers.length === 0) && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>Aucun résultat trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Code d'exemple */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Code d'exemple :</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
{`// Import du service
import { performGlobalSearch } from '../services/searchAPI';

// Utilisation dans un composant
const handleSearch = async (query) => {
  try {
    const results = await performGlobalSearch(query);
    if (results.success) {
      console.log('Résultats:', results.data);
      // Traiter les résultats...
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Appel de la fonction
handleSearch('marie');`}
        </pre>
      </div>
    </div>
  );
}

export default SearchExample;
