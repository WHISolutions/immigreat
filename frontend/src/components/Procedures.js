import React, { useState } from 'react';
import '../styles/Procedures.css';

function Procedures() {
  const [procedures, setProcedures] = useState([
    {
      id: 1,
      titre: "Permis d'études",
      description: "Procédure pour les demandes de permis d'études au Canada",
      etapes: [
        "Obtention de la lettre d'acceptation d'un établissement d'enseignement désigné",
        "Preuve de moyens financiers suffisants",
        "Vérification de l'admissibilité",
        "Soumission de la demande en ligne",
        "Fourniture des données biométriques",
        "Attente de la décision"
      ],
      documents: [
        "Lettre d'acceptation",
        "Preuve de fonds",
        "Passeport valide",
        "Photos conformes aux normes",
        "Formulaires remplis"
      ],
      delai: "8 à 12 semaines"
    },
    {
      id: 2,
      titre: "Résidence permanente - Entrée express",
      description: "Procédure pour les demandes de résidence permanente via le système Entrée express",
      etapes: [
        "Création d'un profil Entrée express",
        "Obtention d'un score SCG",
        "Réception d'une invitation à présenter une demande",
        "Soumission de la demande complète",
        "Examen médical",
        "Vérification des antécédents",
        "Décision finale"
      ],
      documents: [
        "Résultats de tests linguistiques",
        "Évaluation des diplômes",
        "Preuve d'expérience professionnelle",
        "Passeport valide",
        "Certificat de police"
      ],
      delai: "6 à 8 mois"
    },
    {
      id: 3,
      titre: "Visa de visiteur",
      description: "Procédure pour les demandes de visa de visiteur temporaire au Canada",
      etapes: [
        "Vérification de l'admissibilité",
        "Rassemblement des documents requis",
        "Soumission de la demande en ligne",
        "Fourniture des données biométriques",
        "Entrevue (si nécessaire)",
        "Décision"
      ],
      documents: [
        "Formulaire de demande",
        "Passeport valide",
        "Photos conformes aux normes",
        "Preuve de liens avec le pays d'origine",
        "Preuve de moyens financiers",
        "Itinéraire de voyage"
      ],
      delai: "3 à 5 semaines"
    },
    {
      id: 4,
      titre: "Permis de travail",
      description: "Procédure pour les demandes de permis de travail au Canada",
      etapes: [
        "Obtention d'une offre d'emploi",
        "Obtention de l'EIMT (si nécessaire)",
        "Vérification de l'admissibilité",
        "Soumission de la demande en ligne",
        "Fourniture des données biométriques",
        "Décision"
      ],
      documents: [
        "Offre d'emploi",
        "EIMT ou dispense",
        "Preuve de qualifications",
        "Passeport valide",
        "Photos conformes aux normes"
      ],
      delai: "4 à 16 semaines"
    }
  ]);

  const [procedureActive, setProcedureActive] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleProcedureClick = (id) => {
    setProcedureActive(procedureActive === id ? null : id);
  };

  const filteredProcedures = procedures.filter(procedure =>
    procedure.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    procedure.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="procedures-container">
      <div className="procedures-header">
        <div className="search-procedures">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Rechercher une procédure..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="procedures-list">
        {filteredProcedures.map(procedure => (
          <div 
            key={procedure.id} 
            className={`procedure-card ${procedureActive === procedure.id ? 'active' : ''}`}
            onClick={() => handleProcedureClick(procedure.id)}
          >
            <div className="procedure-header">
              <h3>{procedure.titre}</h3>
              <span className="procedure-toggle">
                <i className={`fas fa-chevron-${procedureActive === procedure.id ? 'up' : 'down'}`}></i>
              </span>
            </div>
            
            <div className="procedure-summary">
              <p>{procedure.description}</p>
              <span className="procedure-delay">
                <i className="fas fa-clock"></i> Délai: {procedure.delai}
              </span>
            </div>
            
            {procedureActive === procedure.id && (
              <div className="procedure-details">
                <div className="procedure-section">
                  <h4><i className="fas fa-tasks"></i> Étapes</h4>
                  <ol className="procedure-steps">
                    {procedure.etapes.map((etape, index) => (
                      <li key={index}>{etape}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="procedure-section">
                  <h4><i className="fas fa-file-alt"></i> Documents requis</h4>
                  <ul className="procedure-documents">
                    {procedure.documents.map((document, index) => (
                      <li key={index}>{document}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="procedure-actions">
                  <button className="btn btn-primary">
                    <i className="fas fa-download"></i> Télécharger la procédure
                  </button>
                  <button className="btn btn-secondary">
                    <i className="fas fa-print"></i> Imprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Procedures;
