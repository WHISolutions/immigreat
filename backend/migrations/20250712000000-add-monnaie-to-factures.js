'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne monnaie à la table Factures
    await queryInterface.addColumn('Factures', 'monnaie', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'CAD',
      validate: {
        isIn: [['CAD', 'MAD']]
      },
      comment: 'Monnaie de la facture : CAD (Dollar Canadien) ou MAD (Dirham Marocain)'
    });

    // Mettre à jour les factures existantes pour avoir CAD par défaut
    await queryInterface.sequelize.query(
      "UPDATE Factures SET monnaie = 'CAD' WHERE monnaie IS NULL"
    );

    console.log('✅ Migration terminée : Colonne monnaie ajoutée à la table Factures');
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer la colonne monnaie de la table Factures
    await queryInterface.removeColumn('Factures', 'monnaie');
    console.log('⬇️ Migration annulée : Colonne monnaie supprimée de la table Factures');
  }
};
