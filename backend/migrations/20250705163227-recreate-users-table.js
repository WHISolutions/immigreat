'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la table existe et la supprimer si nécessaire
    try {
      await queryInterface.describeTable('users');
      await queryInterface.dropTable('users');
      console.log('Table users supprimée');
    } catch (error) {
      console.log('Table users n\'existe pas, création...');
    }

    // Créer la table users avec toutes les colonnes
    await queryInterface.createTable('users', {
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
        allowNull: true
      },
      mot_de_passe: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'conseillere', 'secretaire', 'comptable'),
        allowNull: false,
        defaultValue: 'secretaire'
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      actif: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      derniere_connexion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      token_reset: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      token_reset_expire: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Ajouter des index pour optimiser les performances
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['actif']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
