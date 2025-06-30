SET NAMES 'utf8mb4';

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tournament INT NOT NULL,
    id_grade_minimum INT NOT NULL,
    id_grade_maximum INT NOT NULL,
    id_category_type INT NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Insertion de catégories
INSERT IGNORE INTO categories (
    id_tournament,
    id_grade_minimum,
    id_grade_maximum,
    id_category_type,
    name
) VALUES
(1, 1, 2, 1, 'Ceinture Blanche - Junior'),
(2, 2, 3, 2, 'Ceinture Noire - Senior');
SET NAMES 'utf8mb4';

-- Table des types de catégories
CREATE TABLE IF NOT EXISTS categorytypes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de types de catégories
INSERT IGNORE INTO categorytypes (
    name
) VALUES
('Junior'),
('Senior'),
('Vétéran');
SET NAMES 'utf8mb4';

-- Table des clubs
CREATE TABLE IF NOT EXISTS clubs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(55)  NOT NULL,
    street VARCHAR(150) NOT NULL,
    postal_code VARCHAR(15)  NOT NULL,
    city VARCHAR(100) NOT NULL,
    website VARCHAR(120) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insertion de clubs
INSERT IGNORE INTO clubs (
    name,
    email,
    phone,
    street,
    postal_code,
    city,
    website,
    is_active
) VALUES
('Club Paris', 'contact@clubparis.com', '+33123456789', '123 Rue de Paris', '75001', 'Paris', 'https://paris-dojo.fr', TRUE),
('Club Lyon', 'contact@clublyon.com', '+33456781234', '45 Avenue de Lyon', '69003', 'Lyon', 'https://lyon-dojo.fr', TRUE),
('Club Marseille', 'contact@clubmars.com', '+33491881234', '12 Bd de la Mer', '13007', 'Marseille', 'https://marseille-dojo.fr', TRUE),
('Club Nancy', 'contact@clubnancy.com', '+33383551234', '8 Rue Stanislas', '54000', 'Nancy', 'https://nancy-dojo.fr', TRUE),
('Club Nantes', 'contact@clubnantes.com', '+33240401234', '5 Quai de la Fosse', '44000', 'Nantes', 'https://nantes-dojo.fr', TRUE);
SET NAMES 'utf8mb4';

-- Table des genres
CREATE TABLE IF NOT EXISTS genders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de genres
INSERT IGNORE INTO genders (
    name
) VALUES
('Masculin'),
('Féminin'),
('Mixte / Ne pas préciser');
SET NAMES 'utf8mb4';

-- Table des grades
CREATE TABLE IF NOT EXISTS grades (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de grades
INSERT IGNORE INTO grades (
    name
) VALUES
('Ceinture Blanche'),
('Ceinture Blanche-Jaune'),
('Ceinture Jaune'),
('Ceinture Jaune-Orange'),
('Ceinture Orange'),
('Ceinture Orange-Verte'),
('Ceinture Verte'),
('Ceinture Verte-Bleue'),
('Ceinture Bleue'),
('Ceinture Bleue-Marron'),
('Ceinture Marron'),
('Ceinture Noire 1ere Dan'),
('Ceinture Noire 2eme Dan'),
('Ceinture Noire 3eme Dan'),
('Ceinture Noire 4eme Dan'),
('Ceinture Noire 5eme Dan'),
('Ceinture Noire 6eme Dan');
SET NAMES 'utf8mb4';

-- Crée la table des matchs
CREATE TABLE IF NOT EXISTS matchs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tournament INT NOT NULL,
    id_users_white INT NOT NULL,
    id_users_red INT NOT NULL,
    id_winner INT DEFAULT NULL, -- NULL si le match n'est pas encore terminé
    ippon_white INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant blanc
    ippon_red INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant rouge
    keikoku_white INT NOT NULL DEFAULT 0, -- Pénalités du combattant blanc
    keikoku_red INT NOT NULL DEFAULT 0 -- Pénalités du combattant rouge
);

-- Insertion de matchs
INSERT IGNORE INTO matchs (
    id_tournament,
    id_users_white,
    id_users_red,
    id_winner, 
    ippon_white,
    ippon_red,
    keikoku_white,
    keikoku_red
) VALUES
-- Tournoi 1
(1, 1, 2, 1, 2, 0, 1, 0),   -- User 1 (blanc) gagne contre User 2
(1, 3, 1, 1, 0, 2, 0, 1),   -- User 1 (rouge) gagne contre User 3
(1, 1, 4, 4, 0, 2, 1, 0),   -- User 1 (blanc) perd contre User 4

-- Tournoi 2
(2, 1, 5, 1, 3, 1, 0, 2),   -- User 1 (blanc) gagne contre User 5
(2, 6, 1, 6, 2, 1, 0, 1);   -- User 1 (rouge) perd contre User 6
SET NAMES 'utf8mb4';

-- Crée une table pour les users
CREATE TABLE IF NOT EXISTS users (
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   id_grade INT,
   id_role INT NOT NULL,
   id_gender INT,
   avatar_seed VARCHAR(100) NOT NULL,
   first_name VARCHAR(50) NOT NULL,
   last_name VARCHAR(50) NOT NULL,
   birth_date DATE NOT NULL,
   weight INT,
   nationality VARCHAR(50),
   id_club INT,
   id_tournament_waiting INT DEFAULT NULL,
   email VARCHAR(100) NOT NULL UNIQUE,
   phone VARCHAR(50),
   password VARCHAR(255),
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   reset_token VARCHAR(255) DEFAULT NULL
);

-- Insère des données de test
INSERT IGNORE INTO users (
   id_grade,
   id_role,
   id_gender,
   avatar_seed,
   first_name,
   last_name,
   birth_date,
   weight,
   nationality,
   id_club,
   id_tournament_waiting,
   email,
   phone,
   password,
   is_active
) VALUES
(NULL, 1, 1, 'default', 'Pierre', 'SPREDER', '2003-11-29', NULL, 'Français', NULL, 2, 'admin@admin.com', '+33601020304', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- Admin
(2, 2, 1, 'default', 'Théo', 'Durand', '1985-09-22', 80, 'Français', 1, NULL, 'gestionnaire@gestionnaire.com', '+33605060708', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- Gestionnaire
(3, 3, 2, 'default', 'Martin', 'Martin', '1995-08-22', 60, 'Français', 3, 3, 'users@users.com', '+33607080910', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- users 1
(3, 3, 1, 'default', 'Lucas', 'Morel', '2000-02-11', 70, 'Français', 3, NULL, 'lucas.morel@email.com', '+33612345678', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- users 2
(3, 3, 1, 'default', 'Nicolas', 'Bernard', '1997-06-30', 82, 'Français', 2, NULL, 'nicolas.bernard@email.com', '+33687654321', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- users 3
(1, 3, 2, 'default', 'Camille', 'Lemoine', '1998-03-15', 65, 'Français', 2, NULL, 'camille.lemoine@email.com', '+33609876543', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE); -- users 4
SET NAMES 'utf8mb4';

-- Crée une table pour les rôles utilisateurs
CREATE TABLE IF NOT EXISTS roles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
);

-- Insère les rôles de base
INSERT IGNORE INTO roles (
    name,
    description
) VALUES
('Admin', 'Administrateur avec tous les droits'),
('Gestionnaire', 'Propriétaire d’un club, peut gérer les tournois'),
('users', 'Utilisateur connecté, peut s’inscrire aux tournois');
SET NAMES 'utf8mb4';

-- Table des tournois
CREATE TABLE IF NOT EXISTS tournaments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_club INT,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(50),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insertion de tournois
INSERT IGNORE INTO tournaments (
    id_club,
    name,
    address,
    start_date,
    end_date,
    status,
    is_active
) VALUES
(1, 'Tournoi National1', 'Stade Paris 1', '2025-06-10 09:00:00', '2025-06-11 18:00:00', 'open', TRUE),
(2, 'Tournoi Régional1', 'Gymnase Lyon 1', '2025-07-15 10:00:00', '2025-07-16 19:00:00', 'closed', TRUE),
(3, 'Tournoi National2', 'Stade Paris 2', '2025-06-10 09:00:00', '2025-06-11 18:00:00', 'open', TRUE),
(4, 'Tournoi Régional2', 'Gymnase Lyon 2', '2025-07-15 10:00:00', '2025-07-16 19:00:00', 'closed', TRUE);
SET NAMES 'utf8mb4';

-- Clés étrangères pour la table users
ALTER TABLE users
    ADD CONSTRAINT fk_users_grade FOREIGN KEY (id_grade) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_users_role FOREIGN KEY (id_role) 
        REFERENCES roles(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_users_gender FOREIGN KEY (id_gender) 
        REFERENCES genders(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_users_club FOREIGN KEY (id_club) 
        REFERENCES clubs(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_users_tournaments FOREIGN KEY (id_tournament_waiting) 
        REFERENCES tournaments(id) ON DELETE SET NULL;

-- Clés étrangères pour la table matchs
ALTER TABLE matchs
    ADD CONSTRAINT fk_match_tournament FOREIGN KEY (id_tournament)
        REFERENCES tournaments(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_match_users_white FOREIGN KEY (id_users_white) 
        REFERENCES users(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_match_users_red FOREIGN KEY (id_users_red) 
        REFERENCES users(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_match_winner FOREIGN KEY (id_winner) 
        REFERENCES users(id) ON DELETE SET NULL;

-- Clé étrangère pour la table tournaments
ALTER TABLE tournaments
    ADD CONSTRAINT fk_tournament_club FOREIGN KEY (id_club) 
        REFERENCES clubs(id) ON DELETE RESTRICT;

-- Clés étrangères pour la table catégories
ALTER TABLE categories
    ADD CONSTRAINT fk_category_tournaments FOREIGN KEY (id_tournament) 
        REFERENCES tournaments(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_grade_min FOREIGN KEY (id_grade_minimum) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_grade_max FOREIGN KEY (id_grade_maximum) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_type FOREIGN KEY (id_category_type) 
        REFERENCES categorytypes(id) ON DELETE RESTRICT;
