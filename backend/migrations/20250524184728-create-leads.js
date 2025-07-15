'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nom: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      prenom: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      telephone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      source: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      interet: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      conseillere: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      statut: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Nouveau'
      },
      date_creation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('leads');
  }
};
