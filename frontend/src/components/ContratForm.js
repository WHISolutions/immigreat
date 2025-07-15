import React, { useState, useRef } from 'react';
import '../styles/ContratForm.css';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function ContratForm({ client, userRole, onSave, onCancel, existingContrat = null }) {
  // État initial du contrat
  const [contrat, setContrat] = useState(existingContrat || {
    id: Date.now(),
    clientId: client.id,
    numero: `C-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    typeProcedure: client.typeProcedure || '',
    description: '',
    montant: 0,
    statut: 'non_signe', // non_signe, signe, archive
    dateSignature: null,
    fichierContrat: null,
    fichierSigne: null
  });

  // État pour le téléversement de fichier
  const [selectedFile, setSelectedFile] = useState(null);
  
  // État pour l'affichage du contrat généré
  const [contratGenere, setContratGenere] = useState(false);
  
  // Référence pour le contenu du contrat
  const contratContentRef = useRef(null);
  
  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setContrat({
      ...contrat,
      [name]: value
    });
  };

  // Gérer le téléversement du contrat signé
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Générer le contrat
  const generateContrat = () => {
    // Simulation d'une génération de PDF avec délai pour meilleure UX
    const generatingMessage = document.createElement('div');
    generatingMessage.className = 'generating-message';
    generatingMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération du contrat en cours...';
    document.body.appendChild(generatingMessage);
    
    setTimeout(() => {
      document.body.removeChild(generatingMessage);
      
      const generatedContrat = {
        ...contrat,
        fichierContrat: "contrat_genere.pdf", // Simulé
        statut: 'non_signe'
      };
      
      setContrat(generatedContrat);
      setContratGenere(true);
    }, 1500);
  };

  // Téléverser le contrat signé
  const uploadSignedContrat = () => {
    if (!selectedFile) {
      alert("Veuillez sélectionner un fichier");
      return;
    }
    
    // Dans une application réelle, cela téléverserait le fichier
    const signedContrat = {
      ...contrat,
      fichierSigne: selectedFile.name, // Simulé
      statut: 'signe',
      dateSignature: new Date().toISOString()
    };
    
    setContrat(signedContrat);
    onSave(signedContrat);
  };
  
  // Télécharger le contrat en PDF
  const downloadContratPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(16);
    doc.text("Contrat de services : Programme des Travailleurs Autonomes du Gouvernement du Québec", 15, 20, { maxWidth: 180 });
    
    // Informations d'en-tête
    doc.setFontSize(10);
    doc.text(`No de membre du CRIC : 123456`, 15, 30);
    doc.text(`No de dossier Client : ${client.numeroDossier || "_________"}`, 120, 30);
    doc.text(`Ce contrat de services est établi le ${new Date().toLocaleDateString('fr-CA')}`, 15, 40);
    
    // Informations du client
    doc.setFontSize(12);
    doc.text("Entre", 15, 50);
    doc.text(`(le « Client ») ${client.prenom} ${client.nom}`, 15, 60);
    doc.setFontSize(10);
    doc.text(`Adresse : ${client.adresse || "___________________"}`, 15, 70);
    doc.text(`Téléphone : ${client.telephone}`, 15, 75);
    doc.text(`Courriel : ${client.email}`, 15, 80);
    
    // Informations du CRIC
    doc.setFontSize(12);
    doc.text("Et", 15, 90);
    doc.text("(le « CRIC ») YassineImmigration Inc.", 15, 100);
    doc.setFontSize(10);
    doc.text("No de membre du CRIC : 123456", 15, 110);
    doc.text("Adresse : 1234 Avenue des Consultants, Montréal, QC, Canada", 15, 115);
    doc.text("Téléphone : +1 (514) 123-4567", 15, 120);
    doc.text("Courriel : contact@yassineimmigration.ca", 15, 125);
    
    // Représentant
    doc.text("Agissant par l'entremise de son représentant dûment autorisé, Yassine El jamali (le « CRIC »),", 15, 135);
    
    // Attendus
    doc.setFontSize(10);
    doc.text("ATTENDU QUE le CRIC et le Client souhaitent conclure une entente par écrit qui contient les conditions convenues en vertu desquelles le CRIC fournira ses services au Client;", 15, 145, { maxWidth: 180 });
    doc.text("ATTENDU QUE le CRIC est un membre du Conseil de réglementation des consultants en immigration du Canada (le « Conseil »), l'organisme de réglementation canadien des consultants en immigration;", 15, 155, { maxWidth: 180 });
    
    // Accord
    doc.setFontSize(12);
    doc.text("LES PARTIES CONVIENNENT DE CE QUI SUIT :", 15, 170);
    
    // Ajouter une nouvelle page pour le reste du contrat
    doc.addPage();
    
    // Définitions
    doc.setFontSize(12);
    doc.text("1. Définitions", 15, 20);
    doc.setFontSize(10);
    doc.text("En plus des termes définis aux présentes, les termes « Client », « Conseil », « Débours » et « CRIC » ont également le sens définit dans le Règlement régissant le contrat de service professionnel du Conseil.", 15, 30, { maxWidth: 180 });
    
    // Objet
    doc.setFontSize(12);
    doc.text("Objet :", 15, 45);
    doc.setFontSize(10);
    doc.text(`Ce contrat de services a pour objet de définir les modalités et conditions dans lesquelles YassineImmigration Inc. s'engage à fournir à ${client.prenom} ${client.nom} des services de consultation en immigration dans le cadre du Programme des Travailleurs Autonomes du Québec.`, 15, 55, { maxWidth: 180 });
    
    // Services fournis
    doc.setFontSize(12);
    doc.text("2. Services fournis", 15, 70);
    doc.setFontSize(10);
    doc.text(`YassineImmigration Inc. représentera ${client.prenom} ${client.nom} auprès des autorités québécoises pour le Programme des Travailleurs Autonomes.`, 15, 80, { maxWidth: 180 });
    doc.text("Les services incluent :", 15, 90);
    doc.text("• La préparation et la soumission des formulaires requis.", 20, 100);
    doc.text("• La représentation auprès des autorités compétentes.", 20, 105);
    doc.text("• Les conseils liés à ce type de dossier.", 20, 110);
    doc.text("• Tous les autres services usuels associés à ce type de dossier.", 20, 115);
    doc.text("Les services du CRIC seront fournis en Français.", 15, 125);
    
    // Ajouter plus de pages et de contenu selon le modèle fourni
    // ...
    
    // Signatures
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Signatures :", 15, 200);
    doc.text("EN FOI DE QUOI ce contrat de services a été dûment signé par les parties (le CRIC et le client) à la date indiquée au début du présent contrat.", 15, 210, { maxWidth: 180 });
    
    doc.text("___________________", 30, 230);
    doc.text("Nom complet et signature", 30, 240);
    doc.text("Client", 30, 250);
    
    doc.text("___________________", 130, 230);
    doc.text("Nom complet et signature", 130, 240);
    doc.text("CRIC", 130, 250);
    
    doc.text("___________________", 30, 270);
    doc.text("Date de la signature", 30, 280);
    
    doc.text("___________________", 130, 270);
    doc.text("Date de la signature", 130, 280);
    
    // Enregistrer le PDF
    doc.save(`contrat_${client.prenom}_${client.nom}.pdf`);
  };
  
  // Prévisualiser le contrat
  const previewContrat = () => {
    return (
      <div className="contrat-preview" ref={contratContentRef}>
        <h2>Contrat de services : Programme des Travailleurs Autonomes du Gouvernement du Québec</h2>
        
        <div className="contrat-header-info">
          <p><strong>No de membre du CRIC :</strong> 123456</p>
          <p><strong>No de dossier Client :</strong> {client.numeroDossier || "_________"}</p>
          <p><strong>Ce contrat de services est établi le</strong> {new Date().toLocaleDateString('fr-CA')}</p>
        </div>
        
        <div className="contrat-parties">
          <h3>Entre</h3>
          <p><strong>(le « Client »)</strong> {client.prenom} {client.nom}</p>
          <p><strong>Adresse :</strong> {client.adresse || "___________________"}</p>
          <p><strong>Téléphone :</strong> {client.telephone}</p>
          <p><strong>Courriel :</strong> {client.email}</p>
          
          <h3>Et</h3>
          <p><strong>(le « CRIC »)</strong> YassineImmigration Inc.</p>
          <p><strong>No de membre du CRIC :</strong> 123456</p>
          <p><strong>Adresse :</strong> 1234 Avenue des Consultants, Montréal, QC, Canada</p>
          <p><strong>Téléphone :</strong> +1 (514) 123-4567</p>
          <p><strong>Courriel :</strong> contact@yassineimmigration.ca</p>
        </div>
        
        <p>Agissant par l'entremise de son représentant dûment autorisé, Yassine El jamali (le « CRIC »),</p>
        
        <div className="contrat-attendus">
          <p>ATTENDU QUE le CRIC et le Client souhaitent conclure une entente par écrit qui contient les conditions convenues en vertu desquelles le CRIC fournira ses services au Client;</p>
          <p>ATTENDU QUE le CRIC est un membre du Conseil de réglementation des consultants en immigration du Canada (le « Conseil »), l'organisme de réglementation canadien des consultants en immigration;</p>
        </div>
        
        <h3>LES PARTIES CONVIENNENT DE CE QUI SUIT :</h3>
        
        <div className="contrat-section">
          <h4>1. Définitions</h4>
          <p>En plus des termes définis aux présentes, les termes « Client », « Conseil », « Débours » et « CRIC » ont également le sens définit dans le Règlement régissant le contrat de service professionnel du Conseil.</p>
        </div>
        
        <div className="contrat-section">
          <h4>Objet :</h4>
          <p>Ce contrat de services a pour objet de définir les modalités et conditions dans lesquelles YassineImmigration Inc. s'engage à fournir à {client.prenom} {client.nom} des services de consultation en immigration dans le cadre du Programme des Travailleurs Autonomes du Québec.</p>
        </div>
        
        <div className="contrat-section">
          <h4>2. Services fournis</h4>
          <p>YassineImmigration Inc. représentera {client.prenom} {client.nom} auprès des autorités québécoises pour le Programme des Travailleurs Autonomes.</p>
          <p>Les services incluent :</p>
          <ul>
            <li>La préparation et la soumission des formulaires requis.</li>
            <li>La représentation auprès des autorités compétentes.</li>
            <li>Les conseils liés à ce type de dossier.</li>
            <li>Tous les autres services usuels associés à ce type de dossier.</li>
          </ul>
          <p>Les services du CRIC seront fournis en Français.</p>
        </div>
        
        {/* Ajouter plus de sections selon le modèle fourni */}
        
        <div className="contrat-signatures">
          <h4>Signatures :</h4>
          <p>EN FOI DE QUOI ce contrat de services a été dûment signé par les parties (le CRIC et le client) à la date indiquée au début du présent contrat.</p>
          
          <div className="signature-block">
            <div className="signature-line">
              <p>___________________</p>
              <p>Nom complet et signature</p>
              <p>Client</p>
            </div>
            
            <div className="signature-line">
              <p>___________________</p>
              <p>Nom complet et signature</p>
              <p>CRIC</p>
            </div>
          </div>
          
          <div className="signature-block">
            <div className="signature-line">
              <p>___________________</p>
              <p>Date de la signature</p>
            </div>
            
            <div className="signature-line">
              <p>___________________</p>
              <p>Date de la signature</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="contrat-form-container">
      {!contratGenere ? (
        <>
          <h2>{existingContrat ? 'Détails du contrat' : 'Nouveau contrat'}</h2>
          
          <div className="contrat-header">
            <div className="contrat-info">
              <div className="form-group">
                <label>Numéro de contrat</label>
                <input 
                  type="text" 
                  name="numero" 
                  value={contrat.numero} 
                  readOnly 
                />
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date" 
                  value={contrat.date} 
                  onChange={handleChange} 
                  disabled={contrat.statut === 'signe'} 
                />
              </div>
            </div>
            
            <div className="client-info">
              <h3>Client</h3>
              <p>{client.prenom} {client.nom}</p>
              <p>{client.email}</p>
              <p>{client.telephone}</p>
              <p>Dossier: {client.numeroDossier}</p>
            </div>
          </div>
          
          <div className="form-group">
            <label>Type de procédure</label>
            <select 
              name="typeProcedure" 
              value={contrat.typeProcedure} 
              onChange={handleChange}
              disabled={contrat.statut === 'signe'}
            >
              <option value="">Sélectionner</option>
              <option value="Permis d'études">Permis d'études</option>
              <option value="Permis de travail">Permis de travail</option>
              <option value="Résidence permanente">Résidence permanente</option>
              <option value="Visa visiteur">Visa visiteur</option>
              <option value="Citoyenneté">Citoyenneté</option>
              <option value="Programme des Travailleurs Autonomes">Programme des Travailleurs Autonomes</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Montant total</label>
            <input 
              type="number" 
              name="montant" 
              value={contrat.montant} 
              onChange={handleChange} 
              disabled={contrat.statut === 'signe'} 
            />
          </div>
          
          <div className="form-group">
            <label>Description / Détails</label>
            <textarea 
              name="description" 
              value={contrat.description} 
              onChange={handleChange} 
              disabled={contrat.statut === 'signe'} 
            />
          </div>
          
          <div className="contrat-status">
            <div className="status-badge">
              Statut: <span className={`status-${contrat.statut}`}>
                {contrat.statut === 'non_signe' ? 'Non signé' : 
                 contrat.statut === 'signe' ? 'Signé' : 'Archivé'}
              </span>
            </div>
            
            {contrat.dateSignature && (
              <div className="signature-info">
                Signé le {new Date(contrat.dateSignature).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            {contrat.statut === 'non_signe' ? (
              <>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Annuler
                </button>
                
                {!contrat.fichierContrat && (
                  <button type="button" className="btn-primary" onClick={generateContrat}>
                    Générer le contrat
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Fermer
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="contrat-preview-container">
          <h2>Contrat généré</h2>
          
          <div className="preview-actions">
            <button type="button" className="btn-primary" onClick={downloadContratPDF}>
              <i className="fas fa-download"></i> Télécharger en PDF
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              <i className="fas fa-print"></i> Imprimer
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Fermer
            </button>
          </div>
          
          <div className="preview-content">
            {previewContrat()}
          </div>
          
          <div className="upload-section">
            <h3>Téléverser le contrat signé</h3>
            <p>Après impression et signature du contrat, veuillez scanner le document signé et le téléverser ci-dessous :</p>
            <div className="upload-controls">
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={handleFileChange} 
              />
              <button 
                type="button" 
                className="btn-primary" 
                onClick={uploadSignedContrat}
                disabled={!selectedFile}
              >
                Téléverser le contrat signé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContratForm;
