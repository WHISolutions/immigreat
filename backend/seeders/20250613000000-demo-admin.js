'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Définir les permissions admin complètes
    const adminPermissions = {
      users_create: true,
      users_read: true,
      users_update: true,
      users_delete: true,
      leads_create: true,
      leads_read: true,
      leads_update: true,
      leads_delete: true,
      clients_create: true,
      clients_read: true,
      clients_update: true,
      clients_delete: true,
      documents_create: true,
      documents_read: true,
      documents_update: true,
      documents_delete: true,
      factures_create: true,
      factures_read: true,
      factures_update: true,
      factures_delete: true,
      rapports_read: true,
      administration_access: true
    };

    await queryInterface.bulkInsert('users', [
      {
        nom: 'Admin',
        prenom: 'Système',
        email: 'admin@immigration.ca',
        telephone: '+1-514-555-0001',
        mot_de_passe: hashedPassword,
        role: 'admin',
        permissions: JSON.stringify(adminPermissions),
        actif: true,
        date_creation: new Date(),
        date_modification: new Date()
      },
      {
        nom: 'Tremblay',
        prenom: 'Marie',
        email: 'marie.tremblay@immigration.ca',
        telephone: '+1-514-555-0002',
        mot_de_passe: await bcrypt.hash('conseillere123', 12),
        role: 'conseillere',
        permissions: JSON.stringify({
          leads_create: true,
          leads_read: true,
          leads_update: true,
          leads_delete: false,
          clients_create: true,
          clients_read: true,
          clients_update: true,
          clients_delete: false,
          documents_create: true,
          documents_read: true,
          documents_update: true,
          documents_delete: false,
          factures_read: true,
          rapports_read: true
        }),
        actif: true,
        date_creation: new Date(),
        date_modification: new Date()
      },
      {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@immigration.ca',
        telephone: '+1-514-555-0003',
        mot_de_passe: await bcrypt.hash('conseillere123', 12),
        role: 'conseillere',
        permissions: JSON.stringify({
          leads_create: true,
          leads_read: true,
          leads_update: true,
          leads_delete: false,
          clients_create: true,
          clients_read: true,
          clients_update: true,
          clients_delete: false,
          documents_create: true,
          documents_read: true,
          documents_update: true,
          documents_delete: false,
          factures_read: true,
          rapports_read: true
        }),
        actif: true,
        date_creation: new Date(),
        date_modification: new Date()
      },
      {
        nom: 'Dupont',
        prenom: 'Julie',
        email: 'julie.dupont@immigration.ca',
        telephone: '+1-514-555-0004',
        mot_de_passe: await bcrypt.hash('secretaire123', 12),
        role: 'secretaire',
        permissions: JSON.stringify({
          leads_create: true,
          leads_read: true,
          leads_update: true,
          leads_delete: false,
          clients_create: false,
          clients_read: true,
          clients_update: false,
          clients_delete: false,
          documents_create: true,
          documents_read: true,
          documents_update: false,
          documents_delete: false,
          factures_read: true
        }),
        actif: true,
        date_creation: new Date(),
        date_modification: new Date()
      },
      {
        nom: 'Lavoie',
        prenom: 'Pierre',
        email: 'pierre.lavoie@immigration.ca',
        telephone: '+1-514-555-0005',
        mot_de_passe: await bcrypt.hash('comptable123', 12),
        role: 'comptable',
        permissions: JSON.stringify({
          leads_read: true,
          clients_read: true,
          documents_read: true,
          factures_create: true,
          factures_read: true,
          factures_update: true,
          factures_delete: true,
          rapports_read: true
        }),
        actif: true,
        date_creation: new Date(),
        date_modification: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@immigration.ca',
          'marie.tremblay@immigration.ca',
          'sophie.martin@immigration.ca',
          'julie.dupont@immigration.ca',
          'pierre.lavoie@immigration.ca'
        ]
      }
    }, {});
  }
}; 