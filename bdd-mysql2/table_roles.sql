SET NAMES 'utf8mb4';

-- Crée une table pour les rôles utilisateurs
CREATE TABLE IF NOT EXISTS roles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
);

-- Insère les rôles de base
INSERT INTO roles (
    name,
    description
) VALUES
('Admin', 'Administrateur avec tous les droits'),
('Gestionnaire', 'Propriétaire d’un club, peut gérer les tournois'),
('Participant', 'Utilisateur connecté, peut s’inscrire aux tournois');