'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversion_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      lead_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      numero_dossier: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      utilisateur: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      date_conversion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Ajouter un index sur lead_id et client_id
    await queryInterface.addIndex('conversion_logs', ['lead_id']);
    await queryInterface.addIndex('conversion_logs', ['client_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversion_logs');
  }
}; 