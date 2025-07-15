'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter le champ client_type
    await queryInterface.addColumn('rendezvous', 'client_type', {
      type: Sequelize.ENUM('client', 'lead'),
      allowNull: false,
      defaultValue: 'client',
      comment: 'Type de contact : client ou lead'
    });

    // Supprimer la contrainte de clé étrangère existante
    try {
      await queryInterface.removeConstraint('rendezvous', 'rendezvous_ibfk_1');
    } catch (error) {
      console.log('Contrainte rendezvous_ibfk_1 n\'existe pas ou déjà supprimée');
    }

    // Modifier la colonne client_id pour permettre NULL sans contrainte de clé étrangère stricte
    await queryInterface.changeColumn('rendezvous', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID du client (NULL pour les leads)'
    });

    // Mettre à jour les enregistrements existants pour définir le type comme 'client'
    await queryInterface.sequelize.query(
      "UPDATE rendezvous SET client_type = 'client' WHERE client_id IS NOT NULL"
    );
  },

  async down(queryInterface, Sequelize) {
    // Remettre la contrainte de clé étrangère
    await queryInterface.changeColumn('rendezvous', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Supprimer la colonne client_type
    await queryInterface.removeColumn('rendezvous', 'client_type');
  }
}; 