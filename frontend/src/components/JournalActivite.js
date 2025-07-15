import React, { useState, useEffect } from 'react';
import '../styles/JournalActivite.css';
import io from 'socket.io-client';

const JournalActivite = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    entite: '',
    date_debut: '',
    date_fin: ''
  });
  const [actions, setActions] = useState([]);
  const [entites, setEntites] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exportLoading, setExportLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  // Fonction pour charger les logs
  const loadLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await fetch(`http://localhost:5000/api/logs?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès refusé. Seuls les administrateurs peuvent accéder aux journaux d\'activité.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les actions disponibles
  const loadActions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logs/actions', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setActions(data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des actions:', err);
    }
  };

  // Fonction pour charger les entités disponibles
  const loadEntites = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/logs/entites', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setEntites(data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des entités:', err);
    }
  };

  // Fonction pour exporter les logs en CSV
  const exportLogs = async () => {
    setExportLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/logs/export', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_activite_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadLogs();
    loadActions();
    loadEntites();

    // Initialiser la connexion Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Écouter les nouveaux événements d'activité
    newSocket.on('newActivity', (activity) => {
      console.log('📡 Nouvelle activité reçue:', activity);
      setLastUpdate(new Date());
      
      // Recharger les logs pour afficher la nouvelle activité
      loadLogs(1);
    });

    newSocket.on('activityLogUpdate', (activity) => {
      console.log('📋 Mise à jour des journaux d\'activité:', activity);
      setLastUpdate(new Date());
      
      // Recharger les logs
      loadLogs(1);
    });

    // Nettoyer la connexion au démontage
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Recharger les logs quand les filtres changent
  useEffect(() => {
    loadLogs(1);
  }, [filters]);

  // Fonction pour gérer les changements de filtres
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      action: '',
      entite: '',
      date_debut: '',
      date_fin: ''
    });
  };

  // Fonction pour basculer l'expansion d'une ligne
  const toggleRowExpansion = (logId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fonction pour formater l'action
  const formatAction = (action) => {
    const actionMap = {
      'create_client': 'Création client',
      'update_client': 'Modification client',
      'delete_client': 'Suppression client',
      'create_lead': 'Création lead',
      'update_lead': 'Modification lead',
      'delete_lead': 'Suppression lead',
      'create_user': 'Création utilisateur',
      'update_user': 'Modification utilisateur',
      'delete_user': 'Suppression utilisateur',
      'login': 'Connexion',
      'logout': 'Déconnexion',
      'auto_logout': '🔒 Déconnexion automatique (inactivité)'
    };
    return actionMap[action] || action;
  };

  // Fonction pour afficher les valeurs JSON de manière lisible
  const renderJsonValues = (values) => {
    if (!values || typeof values !== 'object') {
      return <span className="no-data">Aucune donnée</span>;
    }

    return (
      <div className="json-values">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="json-item">
            <span className="json-key">{key}:</span>
            <span className="json-value">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="journal-activite">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des journaux d'activité...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="journal-activite">
        <div className="error-container">
          <h2>📋 Journaux d'activité</h2>
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={() => loadLogs()} className="retry-btn">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-activite">
      <div className="journal-header">
        <h1>📋 Journaux d'activité</h1>
        <p className="journal-description">
          Consultez l'historique complet des actions effectuées dans le système.
        </p>
        <div className="journal-status">
          <span className="last-update">
            🕒 Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
          <span className="realtime-indicator">
            {socket && socket.connected ? '🟢 Temps réel activé' : '🔴 Temps réel désactivé'}
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <h3>🔍 Filtres</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Action:</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">Toutes les actions</option>
              {actions.map(action => (
                <option key={action} value={action}>
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Entité:</label>
            <select
              value={filters.entite}
              onChange={(e) => handleFilterChange('entite', e.target.value)}
            >
              <option value="">Toutes les entités</option>
              {entites.map(entite => (
                <option key={entite} value={entite}>
                  {entite}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date début:</label>
            <input
              type="date"
              value={filters.date_debut}
              onChange={(e) => handleFilterChange('date_debut', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Date fin:</label>
            <input
              type="date"
              value={filters.date_fin}
              onChange={(e) => handleFilterChange('date_fin', e.target.value)}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button onClick={resetFilters} className="reset-filters-btn">
            Réinitialiser les filtres
          </button>
          <button 
            onClick={exportLogs} 
            disabled={exportLoading}
            className="export-btn"
          >
            {exportLoading ? 'Export en cours...' : '📥 Exporter CSV'}
          </button>
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="logs-section">
        <div className="logs-header">
          <h3>📊 Journaux ({pagination.total} entrées)</h3>
          <div className="pagination-info">
            Page {pagination.page} sur {pagination.pages}
          </div>
        </div>

        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>ID</th>
                <th>IP</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr className="log-row">
                    <td className="date-cell">
                      {formatDate(log.date_action)}
                    </td>
                    <td className="user-cell">
                      <div className="user-info">
                        <span className="user-name">
                          {log.utilisateur.prenom} {log.utilisateur.nom}
                        </span>
                        <span className="user-role">
                          ({log.utilisateur.role})
                        </span>
                      </div>
                    </td>
                    <td className="action-cell">
                      <span className={`action-badge action-${log.action.split('_')[0]}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="entite-cell">
                      {log.entite}
                    </td>
                    <td className="id-cell">
                      #{log.entite_id}
                    </td>
                    <td className="ip-cell">
                      {log.adresse_ip || 'N/A'}
                    </td>
                    <td className="details-cell">
                      <button
                        onClick={() => toggleRowExpansion(log.id)}
                        className="details-btn"
                      >
                        {expandedRows.has(log.id) ? '▼' : '▶'} Détails
                      </button>
                    </td>
                  </tr>
                  {expandedRows.has(log.id) && (
                    <tr className="expanded-row">
                      <td colSpan="7">
                        <div className="expanded-content">
                          <div className="values-container">
                            <div className="old-values">
                              <h4>Anciennes valeurs:</h4>
                              {renderJsonValues(log.anciennes_valeurs)}
                            </div>
                            <div className="new-values">
                              <h4>Nouvelles valeurs:</h4>
                              {renderJsonValues(log.nouvelles_valeurs)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            onClick={() => loadLogs(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="pagination-btn"
          >
            ← Précédent
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + Math.max(1, pagination.page - 2);
              return (
                <button
                  key={page}
                  onClick={() => loadLogs(page)}
                  className={`pagination-number ${page === pagination.page ? 'active' : ''}`}
                  disabled={loading}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadLogs(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages || loading}
            className="pagination-btn"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalActivite;
