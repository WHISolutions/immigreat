import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConvertLeadModal from './ConvertLeadModal';
import { convertLeadToClient } from '../services/leadsAPI';
import '../styles/TableSorting.css';

interface Lead {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  source: string;
  interet: string;
  conseillere?: string;
  notes?: string;
  statut: string;
  date_creation: string;
}

interface Props {
  refreshTrigger?: number;
}

type SortField = 'nom' | 'conseillere' | 'date_creation' | 'source' | 'statut' | 'interet';
type SortOrder = 'asc' | 'desc';

const LeadsList: React.FC<Props> = ({ refreshTrigger }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // États pour le tri
  const [sortField, setSortField] = useState<SortField>('date_creation');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      // Récupérer le token pour l'authentification
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get('http://localhost:5000/api/leads', {
        headers
      });
      
      if (response.data.success) {
        setLeads(response.data.data.leads);
        setError('');
      } else {
        setError('Erreur lors du chargement des leads');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Impossible de charger les leads. Vérifiez que le serveur backend fonctionne.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertLead = async (leadId: number, utilisateur: string, notes?: string) => {
    try {
      const response = await convertLeadToClient(leadId, utilisateur, notes);
      
      if (response.success) {
        // Actualiser la liste des leads
        await fetchLeads();
        
        // Afficher un message de succès
        alert(`✅ Lead converti avec succès!\n\nNuméro de dossier: ${response.data.numeroDossier}\nClient créé: ${response.data.client.nom} ${response.data.client.prenom}`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la conversion:', error);
      alert(`❌ Erreur lors de la conversion: ${error.message}`);
      throw error;
    }
  };

  const openConvertModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
    setActiveDropdown(null);
  };

  const closeConvertModal = () => {
    setSelectedLead(null);
    setIsConvertModalOpen(false);
  };

  const toggleDropdown = (leadId: number) => {
    setActiveDropdown(activeDropdown === leadId ? null : leadId);
  };

  // Fonction de tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si on clique sur la même colonne, inverser l'ordre
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si on clique sur une nouvelle colonne, définir le tri croissant par défaut
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Fonction pour trier les leads
  const getSortedLeads = () => {
    const sortedLeads = [...leads].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'nom':
          aValue = `${a.prenom} ${a.nom}`.toLowerCase();
          bValue = `${b.prenom} ${b.nom}`.toLowerCase();
          break;
        case 'conseillere':
          aValue = (a.conseillere || '').toLowerCase();
          bValue = (b.conseillere || '').toLowerCase();
          break;
        case 'date_creation':
          aValue = new Date(a.date_creation).getTime();
          bValue = new Date(b.date_creation).getTime();
          break;
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        case 'statut':
          aValue = a.statut.toLowerCase();
          bValue = b.statut.toLowerCase();
          break;
        case 'interet':
          aValue = a.interet.toLowerCase();
          bValue = b.interet.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedLeads;
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Chargement des leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8d7da', 
        color: '#721c24', 
        border: '1px solid #f5c6cb', 
        borderRadius: '4px',
        margin: '20px 0'
      }}>
        <strong>Erreur:</strong> {error}
        <br />
        <button 
          onClick={fetchLeads}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const sortedLeads = getSortedLeads();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>
          Liste des leads ({leads.length})
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Sélecteur de vue */}
          <div style={{ display: 'flex', backgroundColor: '#f8f9fa', borderRadius: '6px', padding: '4px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#007bff' : 'transparent',
                color: viewMode === 'table' ? 'white' : '#6c757d',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              📊 Tableau
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? '#007bff' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#6c757d',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              🔲 Grille
            </button>
          </div>
          
          <button 
            onClick={fetchLeads}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3>Aucun lead trouvé</h3>
          <p>Créez votre premier lead en utilisant le formulaire ci-dessus.</p>
        </div>
      ) : viewMode === 'table' ? (
        // Vue tableau avec tri
        <div style={{ 
          backgroundColor: 'white', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th 
                    onClick={() => handleSort('nom')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f8f9fa',
                      zIndex: 10
                    }}
                  >
                    Nom complet {getSortIcon('nom')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #dee2e6',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#495057'
                  }}>
                    Contact
                  </th>
                  <th 
                    onClick={() => handleSort('source')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}
                  >
                    Source {getSortIcon('source')}
                  </th>
                  <th 
                    onClick={() => handleSort('interet')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}
                  >
                    Intérêt {getSortIcon('interet')}
                  </th>
                  <th 
                    onClick={() => handleSort('conseillere')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}
                  >
                    Conseillère {getSortIcon('conseillere')}
                  </th>
                  <th 
                    onClick={() => handleSort('statut')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}
                  >
                    Statut {getSortIcon('statut')}
                  </th>
                  <th 
                    onClick={() => handleSort('date_creation')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}
                  >
                    Date création {getSortIcon('date_creation')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'center', 
                    borderBottom: '2px solid #dee2e6',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#495057'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead, index) => (
                  <tr 
                    key={lead.id}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                    }}
                  >
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {lead.prenom} {lead.nom}
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                        📧 <a href={`mailto:${lead.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                          {lead.email}
                        </a>
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        📞 <a href={`tel:${lead.telephone}`} style={{ color: '#28a745', textDecoration: 'none' }}>
                          {lead.telephone}
                        </a>
                      </div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      <span style={{ 
                        backgroundColor: '#e9ecef', 
                        color: '#495057', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {lead.source}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      {lead.interet}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      {lead.conseillere || '-'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                      <span style={{
                        backgroundColor: lead.statut === 'Nouveau' ? '#28a745' : 
                                       lead.statut === 'Client' ? '#007bff' : '#6c757d',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {lead.statut}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef', fontSize: '13px' }}>
                      {new Date(lead.date_creation).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef', textAlign: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(lead.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            color: '#6c757d',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.color = '#495057';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6c757d';
                          }}
                        >
                          ⋮
                        </button>
                        
                        {activeDropdown === lead.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            backgroundColor: 'white',
                            border: '1px solid #e9ecef',
                            borderRadius: '4px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                            zIndex: 1000,
                            minWidth: '180px'
                          }}>
                            {lead.statut !== 'Client' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openConvertModal(lead);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 15px',
                                  border: 'none',
                                  background: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#495057',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                🔄 Convertir en client
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Fonctionnalité d\'édition à venir');
                                setActiveDropdown(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 15px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#495057',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              ✏️ Modifier
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Vue grille (existante)
        <div style={{ 
          display: 'grid', 
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
        }}>
          {sortedLeads.map((lead) => (
            <div
              key={lead.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>
                  {lead.prenom} {lead.nom}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    backgroundColor: lead.statut === 'Nouveau' ? '#28a745' : 
                                   lead.statut === 'Client' ? '#007bff' : '#6c757d',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {lead.statut}
                  </span>
                  
                  {/* Menu d'actions */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(lead.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: '#6c757d',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.color = '#495057';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6c757d';
                      }}
                    >
                      ⋮
                    </button>
                    
                    {/* Dropdown menu */}
                    {activeDropdown === lead.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        backgroundColor: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        minWidth: '180px'
                      }}>
                        {lead.statut !== 'Client' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openConvertModal(lead);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 15px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#495057',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            🔄 Convertir en client
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Fonctionnalité d\'édition à venir');
                            setActiveDropdown(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: 'none',
                            background: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#495057',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#495057' }}>📧 Email:</strong>
                  <span style={{ marginLeft: '8px', color: '#007bff' }}>
                    <a href={`mailto:${lead.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                      {lead.email}
                    </a>
                  </span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#495057' }}>📞 Téléphone:</strong>
                  <span style={{ marginLeft: '8px' }}>
                    <a href={`tel:${lead.telephone}`} style={{ color: '#28a745', textDecoration: 'none' }}>
                      {lead.telephone}
                    </a>
                  </span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#495057' }}>📊 Source:</strong>
                  <span style={{ marginLeft: '8px' }}>{lead.source}</span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#495057' }}>🎯 Intérêt:</strong>
                  <span style={{ marginLeft: '8px' }}>{lead.interet}</span>
                </div>
                
                {lead.conseillere && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#495057' }}>👩‍💼 Conseillère:</strong>
                    <span style={{ marginLeft: '8px' }}>{lead.conseillere}</span>
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#495057' }}>📅 Date de création:</strong>
                  <span style={{ marginLeft: '8px' }}>
                    {new Date(lead.date_creation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {lead.notes && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <strong style={{ color: '#495057' }}>📝 Notes:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', lineHeight: '1.4' }}>
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de conversion */}
      {selectedLead && (
        <ConvertLeadModal
          lead={selectedLead}
          isOpen={isConvertModalOpen}
          onClose={closeConvertModal}
          onConvert={handleConvertLead}
          currentUser="Administrateur"
        />
      )}
    </div>
  );
};

export default LeadsList;