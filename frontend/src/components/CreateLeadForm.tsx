import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getConseillers, formatConseillerOptions } from '../services/conseillerAPI';
import { createLead } from '../services/leadsAPI';

interface LeadFormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  source: string;
  interet: string;
  conseillere: string;
  notes: string;
}

interface Props {
  onLeadCreated?: () => void;
}

const CreateLeadForm: React.FC<Props> = ({ onLeadCreated }) => {
  const [formData, setFormData] = useState<LeadFormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    source: '',
    interet: '',
    conseillere: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [conseillerOptions, setConseillerOptions] = useState([
    { value: '', label: 'Aucune conseillère assignée' }
  ]);
  const [isLoadingConseillers, setIsLoadingConseillers] = useState(true);

  const sourceOptions = [
    { value: '', label: 'Sélectionner une source' },
    { value: 'Site web', label: 'Site web' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Référence', label: 'Référence' },
    { value: 'Autre', label: 'Autre' }
  ];

  const interetOptions = [
    { value: '', label: 'Sélectionner un intérêt' },
    { value: 'Permis d\'études', label: 'Permis d\'études' },
    { value: 'Permis de travail', label: 'Permis de travail' },
    { value: 'Résidence permanente', label: 'Résidence permanente' },
    { value: 'Visa visiteur', label: 'Visa visiteur' },
    { value: 'Citoyenneté', label: 'Citoyenneté' },
    { value: 'Autre', label: 'Autre' }
  ];

  // Charger les conseillers depuis l'API
  useEffect(() => {
    const loadConseillers = async () => {
      try {
        setIsLoadingConseillers(true);
        const result = await getConseillers();
        
        if (result.success && result.data) {
          const options = formatConseillerOptions(result.data);
          setConseillerOptions(options);
        } else {
          // En cas d'erreur, utiliser la liste par défaut
          const defaultOptions = formatConseillerOptions(result.data);
          setConseillerOptions(defaultOptions);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conseillers:', error);
        // Liste de secours
        setConseillerOptions([
          { value: '', label: 'Aucune conseillère assignée' },
          { value: 'wafaa chaouby', label: 'wafaa chaouby' },
          { value: 'hame amni', label: 'hame amni' },
          { value: 'sanaa sami', label: 'sanaa sami' }
        ]);
      } finally {
        setIsLoadingConseillers(false);
      }
    };

    loadConseillers();
  }, []);

  // Préremplir automatiquement le champ conseillère avec l'utilisateur connecté
  useEffect(() => {
    // Attendre que les conseillers soient chargés et que le champ ne soit pas déjà rempli
    if (!isLoadingConseillers && conseillerOptions.length > 1 && !formData.conseillere) {
      const userName = localStorage.getItem('userName');
      console.log('👤 Utilisateur connecté récupéré (CreateLeadForm):', userName);
      console.log('📋 Options de conseillers disponibles:', conseillerOptions);
      
      if (userName) {
        // Chercher l'utilisateur connecté dans la liste des conseillers
        const userOption = conseillerOptions.find(option => 
          option.value && (
            option.value.toLowerCase().includes(userName.toLowerCase()) ||
            userName.toLowerCase().includes(option.value.toLowerCase())
          )
        );
        
        if (userOption) {
          console.log('✅ Préremplissage du champ conseillère (CreateLeadForm) avec:', userOption.value);
          setFormData(prev => ({
            ...prev,
            conseillere: userOption.value
          }));
        } else {
          console.log('⚠️ Utilisateur connecté non trouvé dans les options de conseillers:', {
            userName,
            conseillerOptions: conseillerOptions.map(opt => opt.value),
            recherchePartielle: conseillerOptions.filter(opt => 
              opt.value && (
                opt.value.toLowerCase().includes(userName.toLowerCase()) || 
                userName.toLowerCase().includes(opt.value.toLowerCase())
              )
            )
          });
        }
      } else {
        console.log('⚠️ Aucun utilisateur connecté trouvé dans localStorage (CreateLeadForm)');
      }
    }
  }, [isLoadingConseillers, conseillerOptions, formData.conseillere]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Fonction pour réinitialiser intelligemment le formulaire (préserve la conseillère)
  const resetFormulaire = () => {
    const userName = localStorage.getItem('userName');
    let conseillerePreremplie = '';
    
    // Garder la conseillère préremplie si elle correspond à l'utilisateur connecté
    if (userName && conseillerOptions.length > 1) {
      const userOption = conseillerOptions.find(option => 
        option.value && (
          option.value.toLowerCase().includes(userName.toLowerCase()) ||
          userName.toLowerCase().includes(option.value.toLowerCase())
        )
      );
      if (userOption) {
        conseillerePreremplie = userOption.value;
      }
    }
    
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      source: '',
      interet: '',
      conseillere: conseillerePreremplie,
      notes: ''
    });
    
    console.log('🔄 Formulaire réinitialisé (CreateLeadForm) avec conseillère préremplie:', conseillerePreremplie);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone || !formData.source || !formData.interet) {
      setMessage('Veuillez remplir tous les champs requis');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await createLead(formData);
      
      if (response.success) {
        setMessage('Lead créé avec succès !');
        // Réinitialiser le formulaire avec préremplissage de la conseillère
        resetFormulaire();
        
        if (onLeadCreated) {
          onLeadCreated();
        }
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage(error.message || 'Erreur lors de la création du lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Créer un nouveau lead</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          borderRadius: '4px', 
          backgroundColor: message.includes('succès') ? '#d4edda' : '#f8d7da',
          color: message.includes('succès') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('succès') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nom <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Prénom <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Téléphone <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Source <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            >
              {sourceOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Intérêt <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="interet"
              value={formData.interet}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              required
            >
              {interetOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Conseillère {isLoadingConseillers && <span style={{ fontSize: '12px', color: '#666' }}>(Chargement...)</span>}
          </label>
          <select
            name="conseillere"
            value={formData.conseillere}
            onChange={handleChange}
            disabled={isLoadingConseillers}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: isLoadingConseillers ? '#f5f5f5' : 'white',
              cursor: isLoadingConseillers ? 'wait' : 'pointer'
            }}
          >
            {conseillerOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            placeholder="Notes additionnelles..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#95a5a6' : '#3498db',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Création...' : 'Créer le lead'}
        </button>
      </form>
    </div>
  );
};

export default CreateLeadForm;