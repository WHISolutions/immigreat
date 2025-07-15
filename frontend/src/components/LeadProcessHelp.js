import React, { useState } from 'react';
import '../styles/LeadProcessHelp.css';

function LeadProcessHelp({ onClose, userRole = 'conseillere' }) {
  const [activeTab, setActiveTab] = useState('process');
  
  return (
    <div className="lead-process-help">
      <div className="lead-process-help-header">
        <h2>Processus de Gestion des Leads</h2>
        <div className="help-tabs">
          <button 
            className={activeTab === 'process' ? 'active' : ''} 
            onClick={() => setActiveTab('process')}
          >
            Processus
          </button>
          <button 
            className={activeTab === 'permissions' ? 'active' : ''} 
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="lead-process-help-content">
        {activeTab === 'process' ? (
          <>
            <p className="lead-intro">
              Le processus de gestion des leads suit plusieurs étapes détaillées ci-dessous. 
              Suivez ce guide pour assurer un traitement efficace et cohérent de tous les leads.
            </p>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">1</div>
                <h3>Création du lead</h3>
              </div>
              <div className="step-content">
                <p>Un nouveau lead peut être créé de trois façons différentes :</p>
                <ul>
                  <li><strong>Via le formulaire du site web</strong> (automatique)</li>
                  <li><strong>Manuellement</strong> par une conseillère ou la secrétaire (ajout individuel)</li>
                  <li><strong>Par import d'un fichier Excel</strong> par le directeur (ajout en masse)</li>
                </ul>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">2</div>
                <h3>Attribution du lead</h3>
              </div>
              <div className="step-content">
                <p>Lorsqu'un nouveau lead est créé, il apparaît avec le statut "Nouveau".</p>
                <ul>
                  <li>L'administrateur reçoit une notification et peut assigner ce lead à une conseillère spécifique.</li>
                  <li>L'administrateur peut assigner les leads individuellement ou par lot (10, 20 leads à la fois).</li>
                  <li>Le directeur peut également dispatcher les leads par nombre aux conseillères et à la secrétaire.</li>
                  <li>La conseillère et la secrétaire reçoivent alors une notification l'informant des nouveaux leads qui leur ont été attribués.</li>
                </ul>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">3</div>
                <h3>Premier contact</h3>
              </div>
              <div className="step-content">
                <p>La conseillère doit contacter le lead par téléphone. Selon le résultat de cet appel, elle met à jour le statut :</p>
                <ul>
                  <li><strong>"Contacté"</strong> si la personne a répondu</li>
                  <li><strong>"À recontacter"</strong> si elle n'a pas répondu ou s'il demande de le rappeler ultérieurement</li>
                  <li><strong>"Pas intéressé"</strong> si le lead ne souhaite pas donner suite</li>
                  <li><strong>"Rendez-vous pris"</strong> si le lead souhaite prendre rendez-vous</li>
                </ul>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">4</div>
                <h3>Prise de rendez-vous</h3>
              </div>
              <div className="step-content">
                <p>Si le lead souhaite prendre rendez-vous, la conseillère change le statut en "Rendez-vous pris" et crée automatiquement un événement dans le calendrier des rendez-vous. Le système enregistre la date, l'heure et le type de rendez-vous (consultation initiale).</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">5</div>
                <h3>Rappel avant rendez-vous</h3>
              </div>
              <div className="step-content">
                <p>La veille du rendez-vous, la conseillère reçoit une notification lui rappelant d'envoyer un SMS de confirmation au lead avec l'adresse et l'heure du rendez-vous.</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">6</div>
                <h3>Consultation</h3>
              </div>
              <div className="step-content">
                <p>Lorsque le lead se présente pour sa consultation :</p>
                <ul>
                  <li>La secrétaire ou la conseillère change le statut en <strong>"Consultation effectuée"</strong> (affiché en vert) si le lead est présent.</li>
                  <li>Si le lead ne se présente pas, le statut devient <strong>"Consultation manquée"</strong> (affiché en rouge).</li>
                </ul>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">7</div>
                <h3>Évaluation post-consultation</h3>
              </div>
              <div className="step-content">
                <p>Après la consultation, la conseillère évalue l'admissibilité du lead aux différentes procédures d'immigration et met à jour son statut en "Qualifié" ou "Non qualifié". Elle peut également ajouter des notes détaillées sur les procédures recommandées.</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">8</div>
                <h3>Conversion en client</h3>
              </div>
              <div className="step-content">
                <p>Si le lead décide de devenir client en payant la première partie des frais, son statut change en "Client" et il est automatiquement ajouté à la liste des clients tout en restant visible dans l'historique des leads.</p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-header">
                <div className="step-number">9</div>
                <h3>Dispatch après consultation</h3>
              </div>
              <div className="step-content">
                <p>Lorsqu'un lead vient sur place pour une consultation gérée par la secrétaire, celle-ci doit obligatoirement le dispatcher à une conseillère après la consultation, car la secrétaire ne doit pas avoir de clients.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="lead-intro">
              Les permissions et droits d'accès sont définis selon le rôle de chaque utilisateur. Consultez cette section pour comprendre les actions disponibles selon votre rôle.
            </p>
            
            <div className="permissions-section">
              <h3 className="role-title">Administrateur</h3>
              <ul className="permissions-list">
                <li><i className="fas fa-check"></i> Accès à tous les leads</li>
                <li><i className="fas fa-check"></i> Filtrage par conseillère</li>
                <li><i className="fas fa-check"></i> Réassignation des leads entre conseillères</li>
                <li><i className="fas fa-check"></i> Modification de tous les champs</li>
                <li><i className="fas fa-check"></i> Import de fichiers Excel</li>
                <li><i className="fas fa-check"></i> Dispatch des leads aux conseillères et à la secrétaire</li>
              </ul>
            </div>
            
            <div className="permissions-section">
              <h3 className="role-title">Directeur</h3>
              <ul className="permissions-list">
                <li><i className="fas fa-check"></i> Accès à tous les leads</li>
                <li><i className="fas fa-check"></i> Filtrage par conseillère</li>
                <li><i className="fas fa-check"></i> Modification de tous les champs</li>
                <li><i className="fas fa-check"></i> Import de fichiers Excel</li>
                <li><i className="fas fa-check"></i> Dispatch des leads aux conseillères et à la secrétaire</li>
                <li><i className="fas fa-times"></i> Réassignation des leads (réservé à l'administrateur)</li>
              </ul>
            </div>
            
            <div className="permissions-section">
              <h3 className="role-title">Secrétaire</h3>
              <ul className="permissions-list">
                <li><i className="fas fa-check"></i> Accès à tous les leads</li>
                <li><i className="fas fa-check"></i> Modification du statut lors de l'arrivée pour consultation</li>
                <li><i className="fas fa-check"></i> Ajout manuel de leads un par un</li>
                <li><i className="fas fa-check"></i> Dispatch obligatoire des leads à une conseillère pour consultation</li>
                <li><i className="fas fa-times"></i> Modification des champs autres que statut et notes</li>
                <li><i className="fas fa-times"></i> Import de fichiers Excel</li>
              </ul>
            </div>
            
            <div className="permissions-section">
              <h3 className="role-title">Conseillère</h3>
              <ul className="permissions-list">
                <li><i className="fas fa-check"></i> Accès uniquement à ses propres leads</li>
                <li><i className="fas fa-check"></i> Modification du statut et des notes</li>
                <li><i className="fas fa-check"></i> Ajout manuel de leads un par un</li>
                <li><i className="fas fa-times"></i> Réassignation des leads</li>
                <li><i className="fas fa-times"></i> Import de fichiers Excel</li>
                <li><i className="fas fa-times"></i> Accès aux leads des autres conseillères</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LeadProcessHelp;
