'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Factures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero: {
        type: Sequelize.STRING
      },
      client: {
        type: Sequelize.STRING
      },
      montant: {
        type: Sequelize.FLOAT
      },
      statut: {
        type: Sequelize.STRING
      },
      dateEmission: {
        type: Sequelize.DATE
      },
      dateEcheance: {
        type: Sequelize.DATE
      },
      datePaiement: {
        type: Sequelize.DATE
      },
      methodePaiement: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Factures');
  }
};