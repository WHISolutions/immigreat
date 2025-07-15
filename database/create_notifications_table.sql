-- Migration pour créer la table notifications
-- Ce script doit être exécuté dans votre base de données

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'Type de notification: lead_assigned, payment_received, appointment_reminder, etc.',
    titre VARCHAR(255) NOT NULL COMMENT 'Titre de la notification',
    message TEXT NOT NULL COMMENT 'Contenu de la notification',
    priorite ENUM('basse', 'normale', 'haute', 'urgente') DEFAULT 'normale',
    lue BOOLEAN DEFAULT FALSE COMMENT 'Indique si la notification a été lue',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_lecture TIMESTAMP NULL COMMENT 'Date de lecture de la notification',
    date_expiration TIMESTAMP NULL COMMENT 'Date d\'expiration de la notification',
    donnees_metier JSON NULL COMMENT 'Données supplémentaires liées à la notification',
    entite_type VARCHAR(50) NULL COMMENT 'Type d\'entité liée (Lead, Client, Facture, etc.)',
    entite_id INT NULL COMMENT 'ID de l\'entité liée',
    cree_par_id INT NULL COMMENT 'ID de l\'utilisateur qui a déclenché la notification',
    lien_redirection VARCHAR(500) NULL COMMENT 'URL de redirection pour cette notification',
    
    INDEX idx_utilisateur_id (utilisateur_id),
    INDEX idx_type (type),
    INDEX idx_lue (lue),
    INDEX idx_date_creation (date_creation),
    INDEX idx_priorite (priorite),
    
    FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cree_par_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insérer quelques notifications de test pour les premiers utilisateurs
-- Note: Vous devrez ajuster les IDs des utilisateurs selon votre base de données

-- Exemple pour l'utilisateur avec ID 1 (admin)
INSERT INTO notifications (utilisateur_id, type, titre, message, priorite, donnees_metier, lien_redirection) VALUES
(1, 'system', 'Système de notifications activé', 'Le système de notifications en temps réel est maintenant opérationnel !', 'normale', '{"version": "1.0"}', '/'),
(1, 'lead_assigned', 'Nouveau lead assigné', 'Vous avez reçu un nouveau lead : Test Client', 'haute', '{"lead_name": "Test Client", "lead_email": "test@client.com"}', '/leads'),
(1, 'payment_received', 'Paiement reçu', 'Paiement de 1500 MAD reçu pour la facture TEST-001', 'normale', '{"amount": 1500, "currency": "MAD", "invoice": "TEST-001"}', '/facturation');

-- Pour SQLite, utilisez cette version alternative:
/*
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    lue BOOLEAN DEFAULT 0,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_lecture DATETIME NULL,
    date_expiration DATETIME NULL,
    donnees_metier TEXT NULL,
    entite_type VARCHAR(50) NULL,
    entite_id INTEGER NULL,
    cree_par_id INTEGER NULL,
    lien_redirection VARCHAR(500) NULL,
    
    FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cree_par_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur_id ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_lue ON notifications(lue);
CREATE INDEX IF NOT EXISTS idx_notifications_date_creation ON notifications(date_creation);
*/
