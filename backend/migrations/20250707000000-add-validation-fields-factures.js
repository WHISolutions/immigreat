'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Ajout des champs de validation aux factures...');
    
    try {
      // Ajouter le champ validePar
      await queryInterface.addColumn('Factures', 'validePar', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Utilisateur qui a validé/créé la facture'
      });
      
      // Ajouter le champ dateValidation
      await queryInterface.addColumn('Factures', 'dateValidation', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de validation/création de la facture'
      });
      
      console.log('✅ Champs de validation ajoutés avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout des champs:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Suppression des champs de validation...');
    
    try {
      await queryInterface.removeColumn('Factures', 'validePar');
      await queryInterface.removeColumn('Factures', 'dateValidation');
      
      console.log('✅ Champs de validation supprimés');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }
}; 