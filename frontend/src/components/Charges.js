import React, { useState } from 'react';
import '../styles/Charges.css';

function Charges() {
  const [charges, setCharges] = useState([
    { 
      id: 1, 
      description: 'Loyer bureau principal', 
      montant: 2500.00, 
      categorie: 'Loyer', 
      frequence: 'Mensuel', 
      dateEcheance: '2025-05-01', 
      statut: 'Payée',
      datePaiement: '2025-04-28',
      methodePaiement: 'Virement bancaire'
    },
    { 
      id: 2, 
      description: 'Électricité', 
      montant: 350.00, 
      categorie: 'Services', 
      frequence: 'Mensuel', 
      dateEcheance: '2025-05-15', 
      statut: 'En attente',
      datePaiement: null,
      methodePaiement: null
    },
    { 
      id: 3, 
      description: 'Internet et téléphonie', 
      montant: 180.00, 
      categorie: 'Services', 
      frequence: 'Mensuel', 
      dateEcheance: '2025-05-10', 
      statut: 'Payée',
      datePaiement: '2025-05-08',
      methodePaiement: 'Carte de crédit'
    },
    { 
      id: 4, 
      description: 'Assurance professionnelle', 
      montant: 1200.00, 
      categorie: 'Assurance', 
      frequence: 'Trimestriel', 
      dateEcheance: '2025-06-30', 
      statut: 'En attente',
      datePaiement: null,
      methodePaiement: null
    },
    { 
      id: 5, 
      description: 'Fournitures de bureau', 
      montant: 450.00, 
      categorie: 'Fournitures', 
      frequence: 'Ponctuel', 
      dateEcheance: '2025-05-05', 
      statut: 'Payée',
      datePaiement: '2025-05-05',
      methodePaiement: 'Carte de crédit'
    }
  ]);
  
  const [filtres, setFiltres] = useState({
    categorie: '',
    statut: '',
    periode: ''
  });
  
  const [nouvelleCharge, setNouvelleCharge] = useState({
    description: '',
    montant: '',
    categorie: '',
    frequence: 'Mensuel',
    dateEcheance: '',
    notes: ''
  });
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [chargeDetails, setChargeDetails] = useState(null);
  
  // Options pour les filtres et le formulaire
  const categorieOptions = ['Loyer', 'Services', 'Assurance', 'Fournitures', 'Salaires', 'Marketing', 'Autre'];
  const statutOptions = ['Payée', 'En attente', 'En retard'];
  const frequenceOptions = ['Mensuel', 'Trimestriel', 'Annuel', 'Ponctuel'];
  const periodeOptions = ['Tous', 'Ce mois', 'Mois précédent', 'Ce trimestre', 'Cette année'];
  const methodePaiementOptions = ['Carte de crédit', 'Virement bancaire', 'Chèque', 'Espèces', 'Prélèvement automatique'];
  
  // Filtrer les charges
  const chargesFiltrees = charges.filter(charge => {
    return (
      (filtres.categorie === '' || charge.categorie === filtres.categorie) &&
      (filtres.statut === '' || charge.statut === filtres.statut) &&
      (filtres.periode === '' || filtrerParPeriode(charge.dateEcheance, filtres.periode))
    );
  });
  
  // Filtrer par période
  const filtrerParPeriode = (dateEcheance, periode) => {
    const date = new Date(dateEcheance);
    const maintenant = new Date();
    
    switch(periode) {
      case 'Ce mois':
        return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
      case 'Mois précédent':
        const moisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1);
        return date.getMonth() === moisPrecedent.getMonth() && date.getFullYear() === moisPrecedent.getFullYear();
      case 'Ce trimestre':
        const trimestre = Math.floor(maintenant.getMonth() / 3);
        const trimestreDate = Math.floor(date.getMonth() / 3);
        return trimestreDate === trimestre && date.getFullYear() === maintenant.getFullYear();
      case 'Cette année':
        return date.getFullYear() === maintenant.getFullYear();
      default:
        return true;
    }
  };
  
  // Gérer les changements de filtres
  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    setFiltres({
      ...filtres,
      [name]: value
    });
  };
  
  // Réinitialiser les filtres
  const resetFiltres = () => {
    setFiltres({
      categorie: '',
      statut: '',
      periode: ''
    });
  };
  
  // Gérer les changements dans le formulaire de nouvelle charge
  const handleNouvelleChargeChange = (e) => {
    const { name, value } = e.target;
    setNouvelleCharge({
      ...nouvelleCharge,
      [name]: value
    });
  };
  
  // Ajouter une nouvelle charge
  const ajouterCharge = (e) => {
    e.preventDefault();
    
    const newCharge = {
      id: charges.length + 1,
      ...nouvelleCharge,
      statut: 'En attente',
      datePaiement: null,
      methodePaiement: null
    };
    
    setCharges([...charges, newCharge]);
    setNouvelleCharge({
      description: '',
      montant: '',
      categorie: '',
      frequence: 'Mensuel',
      dateEcheance: '',
      notes: ''
    });
    setShowModal(false);
  };
  
  // Voir les détails d'une charge
  const voirDetails = (charge) => {
    setChargeDetails(charge);
    setShowDetailsModal(true);
  };
  
  // Changer le statut d'une charge
  const changerStatut = (id, nouveauStatut, methodePaiement = null) => {
    const updatedCharges = charges.map(charge => {
      if (charge.id === id) {
        return { 
          ...charge, 
          statut: nouveauStatut,
          datePaiement: nouveauStatut === 'Payée' ? new Date().toISOString().split('T')[0] : charge.datePaiement,
          methodePaiement: nouveauStatut === 'Payée' ? methodePaiement : charge.methodePaiement
        };
      }
      return charge;
    });
    setCharges(updatedCharges);
    
    if (chargeDetails && chargeDetails.id === id) {
      setChargeDetails({
        ...chargeDetails,
        statut: nouveauStatut,
        datePaiement: nouveauStatut === 'Payée' ? new Date().toISOString().split('T')[0] : chargeDetails.datePaiement,
        methodePaiement: nouveauStatut === 'Payée' ? methodePaiement : chargeDetails.methodePaiement
      });
    }
  };
  
  // Formater le montant en devise
  const formaterMontant = (montant) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(montant);
  };
  
  // Calculer les statistiques
  const calculerStatistiques = () => {
    const totalCharges = charges.length;
    const totalMontant = charges.reduce((sum, charge) => sum + parseFloat(charge.montant), 0);
    const totalPayees = charges.filter(charge => charge.statut === 'Payée').length;
    const montantPaye = charges
      .filter(charge => charge.statut === 'Payée')
      .reduce((sum, charge) => sum + parseFloat(charge.montant), 0);
    const montantEnAttente = charges
      .filter(charge => charge.statut === 'En attente')
      .reduce((sum, charge) => sum + parseFloat(charge.montant), 0);
    
    return {
      totalCharges,
      totalMontant: formaterMontant(totalMontant),
      totalPayees,
      montantPaye: formaterMontant(montantPaye),
      montantEnAttente: formaterMontant(montantEnAttente)
    };
  };
  
  // Calculer les charges par catégorie
  const calculerChargesParCategorie = () => {
    const chargesParCategorie = {};
    
    charges.forEach(charge => {
      if (!chargesParCategorie[charge.categorie]) {
        chargesParCategorie[charge.categorie] = 0;
      }
      chargesParCategorie[charge.categorie] += parseFloat(charge.montant);
    });
    
    return Object.entries(chargesParCategorie).map(([categorie, montant]) => ({
      categorie,
      montant,
      montantFormate: formaterMontant(montant)
    }));
  };
  
  const stats = calculerStatistiques();
  const chargesParCategorie = calculerChargesParCategorie();
  
  return (
    <div className="charges-container">
      <div className="charges-header">
        <h2>Gestion des Charges</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Nouvelle Charge
        </button>
      </div>
      
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total des charges</h3>
          <p className="stat-value">{stats.totalCharges}</p>
        </div>
        <div className="stat-card">
          <h3>Montant total</h3>
          <p className="stat-value">{stats.totalMontant}</p>
        </div>
        <div className="stat-card">
          <h3>Charges payées</h3>
          <p className="stat-value">{stats.totalPayees}</p>
        </div>
        <div className="stat-card">
          <h3>Montant payé</h3>
          <p className="stat-value">{stats.montantPaye}</p>
        </div>
        <div className="stat-card">
          <h3>Montant en attente</h3>
          <p className="stat-value stat-alert">{stats.montantEnAttente}</p>
        </div>
      </div>
      
      <div className="repartition-container">
        <h3>Répartition des charges par catégorie</h3>
        <div className="categories-grid">
          {chargesParCategorie.map((item, index) => (
            <div key={index} className="categorie-card">
              <div className="categorie-icon">
                {item.categorie === 'Loyer' && '🏢'}
                {item.categorie === 'Services' && '⚡'}
                {item.categorie === 'Assurance' && '🛡️'}
                {item.categorie === 'Fournitures' && '📦'}
                {item.categorie === 'Salaires' && '👥'}
                {item.categorie === 'Marketing' && '📣'}
                {item.categorie === 'Autre' && '📋'}
              </div>
              <div className="categorie-info">
                <h4>{item.categorie}</h4>
                <p>{item.montantFormate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="filtres-container">
        <div className="filtre-group">
          <label>Catégorie:</label>
          <select 
            name="categorie" 
            value={filtres.categorie} 
            onChange={handleFiltreChange}
          >
            <option value="">Toutes</option>
            {categorieOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-group">
          <label>Statut:</label>
          <select 
            name="statut" 
            value={filtres.statut} 
            onChange={handleFiltreChange}
          >
            <option value="">Tous</option>
            {statutOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="filtre-group">
          <label>Période:</label>
          <select 
            name="periode" 
            value={filtres.periode} 
            onChange={handleFiltreChange}
          >
            <option value="">Toutes</option>
            {periodeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <button className="btn-secondary" onClick={resetFiltres}>
          Réinitialiser
        </button>
      </div>
      
      <div className="charges-table-container">
        <table className="charges-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Montant</th>
              <th>Catégorie</th>
              <th>Fréquence</th>
              <th>Date d'échéance</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chargesFiltrees.map(charge => (
              <tr key={charge.id}>
                <td>{charge.description}</td>
                <td>{formaterMontant(charge.montant)}</td>
                <td>{charge.categorie}</td>
                <td>{charge.frequence}</td>
                <td>{charge.dateEcheance}</td>
                <td>
                  <span className={`statut-badge statut-${charge.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                    {charge.statut}
                  </span>
                </td>
                <td>
                  <div className="actions-dropdown">
                    <button className="btn-action">Actions</button>
                    <div className="dropdown-content">
                      <button onClick={() => voirDetails(charge)}>Voir détails</button>
                      {charge.statut !== 'Payée' && (
                        <button onClick={() => voirDetails(charge)}>Marquer comme payée</button>
                      )}
                      {charge.statut !== 'En retard' && charge.statut !== 'Payée' && (
                        <button onClick={() => changerStatut(charge.id, 'En retard')}>Marquer en retard</button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Ajouter une nouvelle charge</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={ajouterCharge}>
              <div className="form-row">
                <div className="form-group">
                  <label>Description:</label>
                  <input 
                    type="text" 
                    name="description" 
                    value={nouvelleCharge.description} 
                    onChange={handleNouvelleChargeChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Montant (CAD):</label>
                  <input 
                    type="number" 
                    name="montant" 
                    value={nouvelleCharge.montant} 
                    onChange={handleNouvelleChargeChange} 
                    step="0.01"
                    min="0"
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Catégorie:</label>
                  <select 
                    name="categorie" 
                    value={nouvelleCharge.categorie} 
                    onChange={handleNouvelleChargeChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {categorieOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fréquence:</label>
                  <select 
                    name="frequence" 
                    value={nouvelleCharge.frequence} 
                    onChange={handleNouvelleChargeChange}
                    required
                  >
                    {frequenceOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date d'échéance:</label>
                  <input 
                    type="date" 
                    name="dateEcheance" 
                    value={nouvelleCharge.dateEcheance} 
                    onChange={handleNouvelleChargeChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Notes (optionnel):</label>
                  <input 
                    type="text" 
                    name="notes" 
                    value={nouvelleCharge.notes} 
                    onChange={handleNouvelleChargeChange} 
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showDetailsModal && chargeDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails de la charge</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="charge-details">
              <div className="charge-info">
                <h4>Informations générales</h4>
                <p><strong>Description:</strong> {chargeDetails.description}</p>
                <p><strong>Montant:</strong> {formaterMontant(chargeDetails.montant)}</p>
                <p><strong>Catégorie:</strong> {chargeDetails.categorie}</p>
                <p><strong>Fréquence:</strong> {chargeDetails.frequence}</p>
                <p><strong>Date d'échéance:</strong> {chargeDetails.dateEcheance}</p>
                <p><strong>Statut:</strong> 
                  <span className={`statut-badge statut-${chargeDetails.statut.toLowerCase().replace(/\s+/g, '-')}`}>
                    {chargeDetails.statut}
                  </span>
                </p>
                {chargeDetails.datePaiement && (
                  <p><strong>Date de paiement:</strong> {chargeDetails.datePaiement}</p>
                )}
                {chargeDetails.methodePaiement && (
                  <p><strong>Méthode de paiement:</strong> {chargeDetails.methodePaiement}</p>
                )}
                {chargeDetails.notes && (
                  <p><strong>Notes:</strong> {chargeDetails.notes}</p>
                )}
              </div>
              
              {chargeDetails.statut !== 'Payée' && (
                <div className="charge-actions">
                  <h4>Actions</h4>
                  <div className="paiement-form">
                    <h5>Marquer comme payée</h5>
                    <div className="form-group">
                      <label>Méthode de paiement:</label>
                      <select 
                        id="methodePaiement" 
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            changerStatut(chargeDetails.id, 'Payée', e.target.value);
                          }
                        }}
                      >
                        <option value="">Sélectionner</option>
                        {methodePaiementOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="other-actions">
                      {chargeDetails.statut !== 'En retard' && (
                        <button 
                          className="btn-secondary" 
                          onClick={() => changerStatut(chargeDetails.id, 'En retard')}
                        >
                          Marquer en retard
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Charges;
