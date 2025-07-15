import React from 'react';
import Leads from './Leads';
import Clients from './Clients';
import Dossiers from './Dossiers';
import Facturation from './Facturation';
import RendezVous from './RendezVous';
import Charges from './Charges';
import AdministrationPanel from './AdministrationPanel';
import TableauBord from './TableauBord';

function ModuleRenderer({ activeModule, userRole }) {
  // Rendre le module approprié en fonction du module actif
  switch (activeModule) {
    case 'leads':
      return <Leads userRole={userRole} />;
    case 'clients':
      return <Clients />;
    case 'dossiers':
      return <Dossiers />;
    case 'facturation':
      return <Facturation />;
    case 'rendez-vous':
      return <RendezVous />;
    case 'charges':
      return <Charges />;
    case 'administration':
      return <AdministrationPanel userRole={userRole} />;
    case 'tableau-de-bord':
      return <TableauBord />;
    default:
      return (
        <div className="welcome-screen">
          <h2>Bienvenue sur votre tableau de bord</h2>
          <p>Sélectionnez un module dans le menu pour commencer</p>
        </div>
      );
  }
}

export default ModuleRenderer;
