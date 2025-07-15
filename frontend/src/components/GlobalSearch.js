import React, { useState, useEffect, useRef } from 'react';
import { performGlobalSearch, getAutocompleteSuggestions } from '../services/searchAPI';
import '../styles/GlobalSearch.css';
import '../styles/GlobalSearchWhite.css'; // Import du fichier pour fond blanc pur

function GlobalSearch({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);

  // Fonction pour effectuer une recherche globale
  const performGlobalSearchAction = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await performGlobalSearch(query.trim());
      
      if (data.success) {
        setSearchResults(data.data);
        setShowResults(true);
        console.log('🔍 Résultats de recherche:', data.data);
      } else {
        console.error('❌ Erreur recherche:', data.message);
        setSearchResults(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      setSearchResults(null);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour obtenir l'auto-complétion
  const getAutocompleteAction = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await getAutocompleteSuggestions(query.trim());
      
      if (data.success && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('❌ Erreur autocomplete:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Gérer les changements dans le champ de recherche
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestion(-1);

    // Débounce pour l'autocomplete
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }
    
    autocompleteTimeoutRef.current = setTimeout(() => {
      getAutocompleteAction(value);
    }, 300);

    // Si l'utilisateur efface le champ
    if (!value.trim()) {
      setShowResults(false);
      setShowSuggestions(false);
      setSuggestions([]);
      setSearchResults(null);
    }
  };

  // Gérer la soumission de la recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    performGlobalSearchAction(searchQuery);
  };

  // Gérer les touches du clavier
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
          const selectedText = suggestions[selectedSuggestion].text;
          setSearchQuery(selectedText);
          setShowSuggestions(false);
          performGlobalSearchAction(selectedText);
        } else {
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
      default:
        break;
    }
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    performGlobalSearchAction(suggestion.text);
  };

  // Fermer les suggestions en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (autocompleteTimeoutRef.current) {
        clearTimeout(autocompleteTimeoutRef.current);
      }
    };
  }, []);

  // Fonction pour obtenir l'icône selon le type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'lead': return '🎯';
      case 'client': return '👤';
      case 'dossier': return '📁';
      case 'facture': return '💰';
      case 'conseiller': return '👩‍💼';
      default: return '📄';
    }
  };

  // Fonction pour obtenir la couleur selon le type
  const getTypeColor = (type) => {
    switch (type) {
      case 'lead': return '#2196F3';
      case 'client': return '#4CAF50';
      case 'dossier': return '#FF9800';
      case 'facture': return '#9C27B0';
      case 'conseiller': return '#607D8B';
      default: return '#666';
    }
  };

  // Fonction pour naviguer vers un élément
  const handleItemClick = (item) => {
    setShowResults(false);
    
    if (onNavigate) {
      switch (item.type) {
        case 'lead':
          onNavigate('leads', { highlightId: item.id });
          break;
        case 'client':
          onNavigate('clients', { highlightId: item.id });
          break;
        case 'dossier':
          onNavigate('dossiers', { highlightId: item.id });
          break;
        case 'facture':
          onNavigate('facturation', { highlightId: item.id });
          break;
        case 'conseiller':
          onNavigate('administration', { highlightId: item.id });
          break;
        default:
          break;
      }
    }
  };

  // Calculer le total des résultats
  const getTotalResults = () => {
    if (!searchResults) return 0;
    return (searchResults.leads?.length || 0) +
           (searchResults.clients?.length || 0) +
           (searchResults.dossiers?.length || 0) +
           (searchResults.factures?.length || 0) +
           (searchResults.conseillers?.length || 0);
  };

  return (
    <>
      {/* Barre de recherche */}
      <div className="global-search-container" ref={inputRef}>
        <form onSubmit={handleSearchSubmit} className="global-search-form">
          <i className="fas fa-search global-search-icon"></i>
          <input
            type="text"
            placeholder="Recherche globale..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="global-search-input"
            autoComplete="off"
          />
          {isLoading && (
            <div className="global-search-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          )}
        </form>

        {/* Suggestions d'auto-complétion */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="global-search-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === selectedSuggestion ? 'selected' : ''}`}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="suggestion-icon">
                  {getTypeIcon(suggestion.type)}
                </span>
                <span className="suggestion-text">{suggestion.text}</span>
                <span className="suggestion-type" style={{ color: getTypeColor(suggestion.type) }}>
                  {suggestion.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal des résultats */}
      {showResults && searchResults && (
        <div className="global-search-modal-overlay" onClick={() => setShowResults(false)}>
          <div className="global-search-modal" onClick={(e) => e.stopPropagation()} ref={resultsRef}>
            <div className="global-search-modal-header">
              <div className="modal-title">
                <i className="fas fa-search"></i>
                <span>Résultats de recherche pour "{searchQuery}"</span>
                <span className="results-count">({getTotalResults()} résultat{getTotalResults() > 1 ? 's' : ''})</span>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setShowResults(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="global-search-modal-content">
              {getTotalResults() === 0 ? (
                <div className="no-results">
                  <i className="fas fa-search"></i>
                  <h3>Aucun résultat trouvé</h3>
                  <p>Essayez avec d'autres mots-clés ou vérifiez l'orthographe.</p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {/* Section Leads */}
                  {searchResults.leads && searchResults.leads.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        <span className="section-icon">🎯</span>
                        Leads ({searchResults.leads.length})
                      </h3>
                      <div className="result-items">
                        {searchResults.leads.map((item) => (
                          <div
                            key={`lead-${item.id}`}
                            className="result-item"
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="item-header">
                              <span className="item-icon">{getTypeIcon(item.type)}</span>
                              <span className="item-title">{item.title}</span>
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                            <div className="item-description">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Clients */}
                  {searchResults.clients && searchResults.clients.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        <span className="section-icon">👤</span>
                        Clients ({searchResults.clients.length})
                      </h3>
                      <div className="result-items">
                        {searchResults.clients.map((item) => (
                          <div
                            key={`client-${item.id}`}
                            className="result-item"
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="item-header">
                              <span className="item-icon">{getTypeIcon(item.type)}</span>
                              <span className="item-title">{item.title}</span>
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                            <div className="item-description">{item.description}</div>
                            {item.metadata.numero_dossier && (
                              <div className="item-metadata">
                                📁 Dossier: {item.metadata.numero_dossier}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Dossiers */}
                  {searchResults.dossiers && searchResults.dossiers.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        <span className="section-icon">📁</span>
                        Dossiers ({searchResults.dossiers.length})
                      </h3>
                      <div className="result-items">
                        {searchResults.dossiers.map((item) => (
                          <div
                            key={`dossier-${item.id}`}
                            className="result-item"
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="item-header">
                              <span className="item-icon">{getTypeIcon(item.type)}</span>
                              <span className="item-title">{item.title}</span>
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                            <div className="item-description">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Factures */}
                  {searchResults.factures && searchResults.factures.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        <span className="section-icon">💰</span>
                        Factures ({searchResults.factures.length})
                      </h3>
                      <div className="result-items">
                        {searchResults.factures.map((item) => (
                          <div
                            key={`facture-${item.id}`}
                            className="result-item"
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="item-header">
                              <span className="item-icon">{getTypeIcon(item.type)}</span>
                              <span className="item-title">{item.title}</span>
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                            <div className="item-description">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Conseillères */}
                  {searchResults.conseillers && searchResults.conseillers.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        <span className="section-icon">👩‍💼</span>
                        Conseillères ({searchResults.conseillers.length})
                      </h3>
                      <div className="result-items">
                        {searchResults.conseillers.map((item) => (
                          <div
                            key={`conseiller-${item.id}`}
                            className="result-item"
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="item-header">
                              <span className="item-icon">{getTypeIcon(item.type)}</span>
                              <span className="item-title">{item.title}</span>
                            </div>
                            <div className="item-subtitle">{item.subtitle}</div>
                            <div className="item-description">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalSearch;
