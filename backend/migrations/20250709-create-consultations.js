'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Consultations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      conseillerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      isValid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('Consultations', ['leadId']);
    await queryInterface.addIndex('Consultations', ['conseillerId']);
    await queryInterface.addIndex('Consultations', ['isValid']);
    await queryInterface.addIndex('Consultations', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les index d'abord
    await queryInterface.removeIndex('Consultations', ['leadId']);
    await queryInterface.removeIndex('Consultations', ['conseillerId']);
    await queryInterface.removeIndex('Consultations', ['isValid']);
    await queryInterface.removeIndex('Consultations', ['createdAt']);
    
    // Puis supprimer la table
    await queryInterface.dropTable('Consultations');
  }
};
