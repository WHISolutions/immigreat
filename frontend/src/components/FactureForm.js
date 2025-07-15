import React, { useState, useEffect } from 'react';
import '../styles/FactureForm.css';

// Fonction helper pour obtenir le symbole de la monnaie
const getSymboleMonnaie = (monnaie) => {
  return monnaie === 'MAD' ? 'DH' : '$';
};

// Fonction helper pour calculer le taux de TVA selon la monnaie
const getTauxTVA = (monnaie) => {
  return monnaie === 'CAD' ? 1.14975 : 1.2; // CAD: 14,975%, MAD: 20%
};

// Fonction helper pour obtenir le pourcentage de TVA
const getPourcentageTVA = (monnaie) => {
  return monnaie === 'CAD' ? '14,975%' : '20%';
};

function FactureForm({ client, userRole, onSave, onCancel, existingFacture = null }) {
  // Récupérer le nom de l'utilisateur connecté
  const userName = localStorage.getItem('userName') || userRole;
  // État initial de la facture
  const initialFacture = existingFacture
    ? {
        ...existingFacture,
        monnaie: existingFacture.monnaie || 'MAD', // 🔴 NOUVEAU : Monnaie par défaut MAD
        prestations: (existingFacture.prestations && Array.isArray(existingFacture.prestations) && existingFacture.prestations.length > 0)
          ? existingFacture.prestations
          : [{ description: '', montant: 0 }],
        montantHT: existingFacture?.montantHT ?? 0,
        tva: existingFacture?.tva ?? 0,
        montantTTC: existingFacture?.montantTTC ?? 0,
        transactions: existingFacture?.transactions ?? []
      }
    : {
        id: Date.now(),
        clientId: client?.id ?? Date.now(),
        numero: `F-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        montantHT: 0,
        tva: 0,
        montantTTC: 0,
        monnaie: 'MAD', // 🔴 NOUVEAU : Monnaie par défaut MAD
        description: '',
        prestations: [{ description: '', montant: 0 }],
        statut: 'brouillon', // brouillon, payable, payée
        dateValidation: null,
        datePaiement: null,
        validePar: '',
        transactions: []
      };

  const [facture, setFacture] = useState(initialFacture);
  
  // 🔥 RECALCULER LES MONTANTS AU CHARGEMENT D'UNE FACTURE EXISTANTE
  useEffect(() => {
    if (existingFacture && existingFacture.prestations) {
      console.log('🔥 Recalcul des montants au chargement de la facture existante');
      
      // Calculer à partir des prestations TTC
      const montantTTC = existingFacture.prestations.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
      const montantTTCFinal = Math.round(montantTTC * 100) / 100;
      const tauxTVA = getTauxTVA(existingFacture.monnaie || 'MAD');
      const montantHTFinal = Math.round((montantTTCFinal / tauxTVA) * 100) / 100;
      const tva = Math.round((montantTTCFinal - montantHTFinal) * 100) / 100;
      
      console.log(`🔥 Recalcul: TTC=${montantTTCFinal}, HT=${montantHTFinal}, TVA=${tva}`);
      
      // Mettre à jour uniquement si les calculs sont différents
      if (existingFacture.montantHT !== montantHTFinal || existingFacture.montantTTC !== montantTTCFinal) {
        setFacture(prev => ({
          ...prev,
          montantHT: montantHTFinal,
          tva: tva,
          montantTTC: montantTTCFinal
        }));
      }
    }
  }, [existingFacture]);

  // État pour suivre si la facture est en cours de modification
  const [isEditing, setIsEditing] = useState(!existingFacture || existingFacture.statut === 'brouillon');
  
  // Vérifier si l'utilisateur peut modifier la facture
  const canModify = () => {
    if (facture.statut === 'brouillon') {
      return userRole === 'conseillere' || userRole === 'directeur' || userRole === 'administrateur';
    } else {
      return userRole === 'directeur' || userRole === 'administrateur';
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFacture({
      ...facture,
      [name]: value
    });
  };

  // Ajouter une prestation
  const addPrestation = () => {
    setFacture({
      ...facture,
      prestations: [...facture.prestations, { description: '', montant: 0 }]
    });
  };

  // Modifier une prestation
  const handlePrestationChange = (index, field, value) => {
    console.log(`🔧 Modification prestation ${index}, ${field}:`, value);
    
    const updatedPrestations = [...(facture.prestations || [])];
    updatedPrestations[index][field] = field === 'montant' ? parseFloat(value) || 0 : value;
    
    // 🔴 CALCUL COHERENT DES MONTANTS (TTC saisi, calcul HT et TVA)
    const montantTTC = updatedPrestations.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
    
    // Calculer selon la monnaie de la facture
    const tauxTVA = getTauxTVA(facture.monnaie || 'MAD');
    const pourcentageTVA = getPourcentageTVA(facture.monnaie || 'MAD');
    const montantTTCFinal = Math.round(montantTTC * 100) / 100;
    const montantHTFinal = Math.round((montantTTCFinal / tauxTVA) * 100) / 100; // HT = TTC / taux
    const tva = Math.round((montantTTCFinal - montantHTFinal) * 100) / 100; // TVA = TTC - HT
    
    console.log(`💰 === CALCULS PRESTATIONS (TTC → HT) ===`);
    console.log(`💰 Monnaie: ${facture.monnaie || 'MAD'} (TVA ${pourcentageTVA})`);
    console.log(`💰 Montant TTC saisi: ${montantTTCFinal}`);
    console.log(`💰 Montant HT calculé: ${montantHTFinal}`);
    console.log(`💰 TVA (${pourcentageTVA}) calculée: ${tva}`);
    
    setFacture({
      ...facture,
      prestations: updatedPrestations,
      montantHT: montantHTFinal,
      tva: tva,
      montantTTC: montantTTCFinal
    });
  };

  // Supprimer une prestation
  const removePrestation = (index) => {
    const updatedPrestations = (facture.prestations || []).filter((_, i) => i !== index);
    
    // 🔴 CALCUL AVEC TTC COMME BASE selon la monnaie
    const montantTTC = updatedPrestations.reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0);
    
    // Calculer HT à partir du TTC selon la monnaie
    const tauxTVA = getTauxTVA(facture.monnaie || 'MAD');
    const pourcentageTVA = getPourcentageTVA(facture.monnaie || 'MAD');
    const montantHTFinal = Math.round((montantTTC / tauxTVA) * 100) / 100;
    const tva = Math.round((montantTTC - montantHTFinal) * 100) / 100;
    
    console.log(`💰 === CALCULS SUPPRESSION (TTC BASE) ===`);
    console.log(`💰 Monnaie: ${facture.monnaie || 'MAD'} (TVA ${pourcentageTVA})`);
    console.log(`💰 Montant TTC: ${montantTTC}`);
    console.log(`💰 Montant HT calculé: ${montantHTFinal}`);
    console.log(`💰 TVA calculée: ${tva}`);
    
    setFacture({
      ...facture,
      prestations: updatedPrestations,
      montantHT: montantHTFinal,
      tva: tva,
      montantTTC: montantTTC
    });
  };

  // Valider la facture
  const validateFacture = () => {
    console.log('✅ Validation facture - Facture actuelle:', facture);
    
    const validatedFacture = {
      ...facture,
      statut: 'payable',
      dateValidation: new Date().toISOString(),
      validePar: userName, // Utiliser le nom de l'utilisateur connecté
      transactions: [
        ...(facture.transactions || []),
        {
          date: new Date().toISOString(),
          action: 'validation',
          utilisateur: userName, // Utiliser le nom de l'utilisateur connecté
          details: 'Facture finalisée'
        }
      ]
    };
    
    console.log('✅ Facture validée à sauvegarder:', validatedFacture);
    setFacture(validatedFacture);
    setIsEditing(false);
    onSave(validatedFacture);
  };

  // Enregistrer la facture comme brouillon
  const saveDraft = () => {
    console.log('💾 Sauvegarde brouillon - Facture actuelle:', facture);
    
    const updatedFacture = {
      ...facture,
      transactions: [
        ...(facture.transactions || []),
        {
          date: new Date().toISOString(),
          action: 'sauvegarde',
          utilisateur: userName, // Utiliser le nom de l'utilisateur connecté
          details: 'Facture sauvegardée comme brouillon'
        }
      ]
    };
    
    console.log('💾 Facture à sauvegarder:', updatedFacture);
    setFacture(updatedFacture);
    onSave(updatedFacture);
  };

  // Modifier une facture finalisée (uniquement directeur et administrateur)
  const editValidatedFacture = () => {
    if (userRole === 'directeur' || userRole === 'administrateur') {
      setIsEditing(true);
      
      // Ajouter une transaction pour tracer la modification
      setFacture({
        ...facture,
        transactions: [
          ...(facture.transactions || []),
          {
            date: new Date().toISOString(),
            action: 'modification',
            utilisateur: userName,
            details: 'Modification d\'une facture finalisée'
          }
        ]
      });
    }
  };

  return (
    <div className="facture-form-container">
      <h2>{existingFacture ? 'Modifier la facture' : 'Nouvelle facture'}</h2>
      
      <div className="facture-header">
        <div className="facture-info">
          <div className="form-group">
            <label>Numéro de facture</label>
            <input 
              type="text" 
              name="numero" 
              value={facture.numero} 
              readOnly 
            />
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={facture.date} 
              onChange={handleChange} 
              disabled={!isEditing || !canModify()} 
            />
          </div>
        </div>
        
        <div className="client-info">
          <h3>Client</h3>
          <p>{client?.prenom} {client?.nom}</p>
          <p>{client?.email}</p>
          <p>{client?.telephone}</p>
          {client?.numeroDossier && <p>Dossier: {client.numeroDossier}</p>}
        </div>
        
        <div className="monnaie-section">
          <div className="form-group">
            <label>Monnaie</label>
            <select 
              name="monnaie" 
              value={facture.monnaie || 'MAD'} 
              onChange={handleChange} 
              disabled={!isEditing || !canModify()}
            >
              <option value="MAD">MAD (Dirham Marocain)</option>
              <option value="CAD">CAD (Dollar Canadien)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="prestations-section">
        <h3>Prestations</h3>
        
        {(facture.prestations || []).map((prestation, index) => (
          <div key={index} className="prestation-item">
            <div className="form-group">
              <label>Description</label>
              <input 
                type="text" 
                value={prestation.description} 
                onChange={(e) => handlePrestationChange(index, 'description', e.target.value)} 
                disabled={!isEditing || !canModify()} 
              />
            </div>
            
            <div className="form-group">
              <label>Montant TTC</label>
              <input 
                type="number" 
                value={prestation.montant} 
                onChange={(e) => handlePrestationChange(index, 'montant', e.target.value)} 
                disabled={!isEditing || !canModify()} 
              />
            </div>
            
            {isEditing && canModify() && (facture.prestations || []).length > 1 && (
              <button 
                type="button" 
                className="btn-remove" 
                onClick={() => removePrestation(index)}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        ))}
        
        {isEditing && canModify() && (
          <button 
            type="button" 
            className="btn-add" 
            onClick={addPrestation}
          >
            <i className="fas fa-plus"></i> Ajouter une prestation
          </button>
        )}
      </div>
      
      <div className="facture-totals">
        <div className="total-item">
          <span>Montant HT:</span>
          <span>{(facture.montantHT || 0).toFixed(2)} {getSymboleMonnaie(facture.monnaie)}</span>
        </div>
        
        <div className="total-item">
          <span>TVA ({getPourcentageTVA(facture.monnaie || 'MAD')}):</span>
          <span>{(facture.tva || 0).toFixed(2)} {getSymboleMonnaie(facture.monnaie)}</span>
        </div>
        
        <div className="total-item total-ttc">
          <span>Montant TTC:</span>
          <span>{(facture.montantTTC || 0).toFixed(2)} {getSymboleMonnaie(facture.monnaie)}</span>
        </div>
      </div>
      
      <div className="form-group">
        <label>Description / Notes</label>
        <textarea 
          name="description" 
          value={facture.description} 
          onChange={handleChange} 
          disabled={!isEditing || !canModify()} 
        />
      </div>
      
      <div className="facture-status">
        <div className="status-badge">
          Statut: <span className={`status-${facture.statut}`}>{facture.statut}</span>
        </div>
        
        {facture.dateValidation && (
          <div className="validation-info">
            Finalisée le {new Date(facture.dateValidation).toLocaleDateString()} par {facture.validePar}
          </div>
        )}
      </div>
      
      <div className="form-actions">
        {isEditing && canModify() ? (
          <>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Annuler
            </button>
            <button type="button" className="btn-secondary" onClick={saveDraft}>
              Enregistrer brouillon
            </button>
            <button type="button" className="btn-primary" onClick={validateFacture}>
              Finaliser
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Fermer
            </button>
            {facture.statut !== 'brouillon' && (userRole === 'directeur' || userRole === 'administrateur') && (
              <button type="button" className="btn-primary" onClick={editValidatedFacture}>
                Modifier
              </button>
            )}
          </>
        )}
      </div>
      
      {(facture.transactions || []).length > 0 && (
        <div className="transactions-history">
          <h3>Historique des transactions</h3>
          <ul>
            {(facture.transactions || []).map((transaction, index) => (
              <li key={index}>
                {new Date(transaction.date).toLocaleString()} - {transaction.action} par {transaction.utilisateur} - {transaction.details}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FactureForm;
