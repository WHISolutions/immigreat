import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../styles/Modal.css';

const ImportExcelModal = ({ isOpen, onClose, onImportSuccess, conseillers = [] }) => {
  const [file, setFile] = useState(null);
  const [leadsPreview, setLeadsPreview] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [error, setError] = useState('');

  // Réinitialiser le state quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setLeadsPreview([]);
      setDistribution({});
      setTotalLeads(0);
      setError('');
      
      // Initialiser la distribution avec les conseillers
      const initialDistribution = {};
      conseillers.forEach(conseiller => {
        initialDistribution[conseiller.nomComplet || conseiller.name || conseiller] = 0;
      });
      setDistribution(initialDistribution);
    }
  }, [isOpen, conseillers]);

  // Gérer la sélection de fichier
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    
    if (!selectedFile) {
      setFile(null);
      setLeadsPreview([]);
      setTotalLeads(0);
      return;
    }

    // Vérifier le format de fichier
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = selectedFile.name.toLowerCase().substr(selectedFile.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExt)) {
      setError('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    setFile(selectedFile);
    
    try {
      // Lire le fichier selon son type
      let leadsData = [];
      
      if (fileExt === '.csv') {
        // Lire CSV
        const text = await selectedFile.text();
        const rows = text.split('\n').filter(row => row.trim());
        if (rows.length < 2) {
          setError('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
          return;
        }
        
        const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const lead = {};
          headers.forEach((header, index) => {
            lead[header] = values[index] || '';
          });
          if (lead[headers[0]]) { // Vérifier que la première colonne n'est pas vide
            leadsData.push(lead);
          }
        }
      } else {
        // Lire Excel
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        leadsData = XLSX.utils.sheet_to_json(worksheet);
      }

      // Normaliser les noms de colonnes
      const columnVariations = {
        'nom': ['nom', 'Nom', 'NOM', 'lastName', 'last_name', 'Last Name'],
        'prenom': ['prenom', 'prénom', 'Prénom', 'PRENOM', 'firstName', 'first_name', 'First Name'],
        'email': ['email', 'Email', 'EMAIL', 'e-mail', 'mail', 'Mail'],
        'telephone': ['telephone', 'téléphone', 'Téléphone', 'TELEPHONE', 'phone', 'tel', 'Phone'],
        'ville': ['ville', 'Ville', 'VILLE', 'city', 'City'],
        'interet': ['interet', 'intérêt', 'Intérêt', 'INTERET', 'interest', 'Interest']
      };

      const normalizedLeads = leadsData.map(row => {
        const normalizedRow = {};
        
        for (const [standardKey, variations] of Object.entries(columnVariations)) {
          for (const variation of variations) {
            if (row[variation] !== undefined && row[variation] !== '') {
              normalizedRow[standardKey] = String(row[variation]).trim();
              break;
            }
          }
        }
        
        return normalizedRow;
      });

      // Filtrer les lignes valides
      const validLeads = normalizedLeads.filter(lead => 
        lead.nom && lead.prenom && lead.email && lead.telephone && lead.ville
      );

      if (validLeads.length === 0) {
        setError('Aucun lead valide trouvé. Vérifiez que les colonnes Nom, Prénom, Email, Téléphone et Ville sont présentes et remplies.');
        return;
      }

      setLeadsPreview(validLeads.slice(0, 5)); // Afficher seulement les 5 premiers
      setTotalLeads(validLeads.length);
      
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setError('Erreur lors de la lecture du fichier. Vérifiez le format.');
    }
  };

  // Gérer les changements de distribution
  const handleDistributionChange = (conseiller, value) => {
    const newValue = parseInt(value) || 0;
    setDistribution(prev => ({
      ...prev,
      [conseiller]: newValue
    }));
  };

  // Calculer le total de la distribution
  const getTotalDistribution = () => {
    return Object.values(distribution).reduce((sum, count) => sum + (parseInt(count) || 0), 0);
  };

  // Valider la distribution
  const isDistributionValid = () => {
    const total = getTotalDistribution();
    return total === totalLeads && totalLeads > 0;
  };

  // Soumettre l'importation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!isDistributionValid()) {
      setError(`Le total de la distribution (${getTotalDistribution()}) doit être égal au nombre de leads (${totalLeads})`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('distribution', JSON.stringify(distribution));

      const response = await axios.post('http://localhost:5000/api/leads/import-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onImportSuccess({
          totalImported: response.data.data.totalImported,
          distribution: response.data.data.distribution,
          errors: response.data.data.errors
        });
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'importation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>Importer des leads depuis Excel</h3>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Sélection de fichier */}
          <div className="form-section">
            <h4>📁 Sélectionner le fichier</h4>
            <div className="form-group">
              <label>Fichier Excel/CSV:</label>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange}
                disabled={isProcessing}
                required 
              />
              <p className="form-help">
                Formats acceptés: .xlsx, .xls, .csv<br/>
                Colonnes requises: Nom, Prénom, Email, Téléphone, Ville
              </p>
            </div>
          </div>

          {/* Section 2: Prévisualisation */}
          {file && leadsPreview.length > 0 && (
            <div className="form-section">
              <h4>👀 Aperçu du fichier ({totalLeads} leads détectés)</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsPreview.map((lead, index) => (
                      <tr key={index}>
                        <td>{lead.nom}</td>
                        <td>{lead.prenom}</td>
                        <td>{lead.email}</td>
                        <td>{lead.telephone}</td>
                        <td>{lead.ville}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalLeads > 5 && (
                  <p className="preview-note">... et {totalLeads - 5} autres leads</p>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Distribution */}
          {file && totalLeads > 0 && (
            <div className="form-section">
              <h4>📊 Distribution des leads ({getTotalDistribution()}/{totalLeads})</h4>
              <div className="distribution-grid">
                {Object.entries(distribution).map(([conseiller, count]) => (
                  <div key={conseiller} className="distribution-item">
                    <label>{conseiller}:</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={totalLeads}
                      value={count}
                      onChange={(e) => handleDistributionChange(conseiller, e.target.value)}
                      disabled={isProcessing}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              
              <div className={`distribution-summary ${isDistributionValid() ? 'valid' : 'invalid'}`}>
                <span>Total distribué: {getTotalDistribution()}</span>
                <span>Total leads: {totalLeads}</span>
                {isDistributionValid() ? (
                  <span className="valid-icon">✅ Distribution correcte</span>
                ) : (
                  <span className="error-icon">❌ Distribution incorrecte</span>
                )}
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!isDistributionValid() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Importation...
                </>
              ) : (
                <>
                  <i className="fas fa-upload"></i> Importer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportExcelModal;
