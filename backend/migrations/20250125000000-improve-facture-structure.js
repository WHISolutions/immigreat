'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter une colonne client_id pour une vraie relation
    await queryInterface.addColumn('Factures', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Ajouter une colonne numero_facture pour suivre la convention demandée
    await queryInterface.addColumn('Factures', 'numero_facture', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    // Ajouter une colonne date_creation
    await queryInterface.addColumn('Factures', 'date_creation', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Ajouter un index sur numero_facture pour les performances
    await queryInterface.addIndex('Factures', ['numero_facture'], {
      name: 'idx_factures_numero_facture',
      unique: true
    });

    // Ajouter un index sur client_id pour les performances
    await queryInterface.addIndex('Factures', ['client_id'], {
      name: 'idx_factures_client_id'
    });

    // Mettre à jour le statut par défaut
    await queryInterface.changeColumn('Factures', 'statut', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'brouillon'
    });

    // Mettre à jour le montant par défaut
    await queryInterface.changeColumn('Factures', 'montant', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les index
    await queryInterface.removeIndex('Factures', 'idx_factures_numero_facture');
    await queryInterface.removeIndex('Factures', 'idx_factures_client_id');

    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('Factures', 'client_id');
    await queryInterface.removeColumn('Factures', 'numero_facture');
    await queryInterface.removeColumn('Factures', 'date_creation');

    // Remettre les colonnes à leur état original
    await queryInterface.changeColumn('Factures', 'statut', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Factures', 'montant', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  }
}; 