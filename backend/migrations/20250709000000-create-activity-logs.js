'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activity_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      utilisateur_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Action effectuée (create_client, update_client, delete_client, create_lead, etc.)'
      },
      entite: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type d\'entité modifiée (Client, Lead, User, etc.)'
      },
      entite_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID de l\'entité modifiée'
      },
      anciennes_valeurs: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Anciennes valeurs au format JSON'
      },
      nouvelles_valeurs: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Nouvelles valeurs au format JSON'
      },
      adresse_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Adresse IP de l\'utilisateur'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User agent du navigateur'
      },
      date_action: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Créer les index
    await queryInterface.addIndex('activity_logs', ['utilisateur_id']);
    await queryInterface.addIndex('activity_logs', ['action']);
    await queryInterface.addIndex('activity_logs', ['entite']);
    await queryInterface.addIndex('activity_logs', ['entite_id']);
    await queryInterface.addIndex('activity_logs', ['date_action']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_logs');
  }
};
