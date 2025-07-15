import React, { useState, useEffect, useRef } from 'react';
import clientsAPI from '../services/clientsAPI';
import '../styles/Facturation.css'; // Utiliser les mêmes styles

function ClientAutocomplete({ 
  value, 
  onSelect, 
  placeholder = "Rechercher un client...", 
  className = "",
  required = false 
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Debounce pour éviter trop de requêtes
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // Effet pour rechercher les clients
  useEffect(() => {
    if (inputValue.trim().length >= 2) {
      // Nettoyer le timeout précédent
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Créer un nouveau timeout
      const newTimeout = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Extraire le terme de recherche (supprimer le formatage si présent)
          let searchTerm = inputValue.trim();
          
          // Si le texte contient des parenthèses, extraire seulement la partie avant
          const parenIndex = searchTerm.indexOf('(');
          if (parenIndex !== -1) {
            searchTerm = searchTerm.substring(0, parenIndex).trim();
          }
          
          const response = await clientsAPI.searchClients(searchTerm);
          if (response.success) {
            setSuggestions(response.data.clients || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Erreur lors de la recherche de clients:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300); // Attendre 300ms après la dernière frappe
      
      setSearchTimeout(newTimeout);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedClientId(null);
    }
    
    // Cleanup
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [inputValue]);
  
  // Gérer la sélection d'un client
  const handleClientSelect = (client) => {
    const displayText = `${client.prenom} ${client.nom} (${client.telephone})`;
    setInputValue(displayText);
    setSelectedClientId(client.id);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Notifier le parent
    if (onSelect) {
      onSelect({
        clientId: client.id,
        displayText: displayText,
        client: client
      });
    }
  };
  
  // Gérer les changements dans l'input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Si l'utilisateur efface le champ, réinitialiser
    if (!value.trim()) {
      setSelectedClientId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      if (onSelect) {
        onSelect({ clientId: null, displayText: '', client: null });
      }
    } else {
      // Si l'utilisateur tape quelque chose de différent du texte formaté d'un client sélectionné,
      // réinitialiser la sélection pour permettre une nouvelle recherche
      if (selectedClientId) {
        setSelectedClientId(null);
        if (onSelect) {
          onSelect({ clientId: null, displayText: value, client: null });
        }
      }
    }
  };
  
  // Gérer la navigation au clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  // Fermer les suggestions en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="client-autocomplete-container" style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`form-control ${className}`}
        required={required}
        autoComplete="off"
      />
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="autocomplete-loading" style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: '#666'
        }}>
          Recherche...
        </div>
      )}
      
      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="autocomplete-suggestions"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {suggestions.map((client) => (
            <div
              key={client.id}
              className="autocomplete-suggestion-item"
              style={{
                padding: '10px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleClientSelect(client)}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {client.prenom} {client.nom}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                📞 {client.telephone}
              </div>
              {client.email && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  ✉️ {client.email}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Message si aucun résultat */}
      {showSuggestions && !isLoading && suggestions.length === 0 && inputValue.trim().length >= 2 && (
        <div 
          className="autocomplete-no-results"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          Aucun client trouvé pour "{inputValue.indexOf('(') !== -1 ? inputValue.substring(0, inputValue.indexOf('(')).trim() : inputValue}"
        </div>
      )}
    </div>
  );
}

export default ClientAutocomplete;
