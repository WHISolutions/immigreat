'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Factures', 'prestations_details', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON string containing detailed prestations information'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Factures', 'prestations_details');
  }
}; 