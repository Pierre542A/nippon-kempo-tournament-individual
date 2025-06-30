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
INSERT INTO users (
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
(3, 3, 2, 'default', 'Martin', 'Martin', '1995-08-22', 60, 'Français', 3, 3, 'participant@participant.com', '+33607080910', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- Participant 1
(3, 3, 1, 'default', 'Lucas', 'Morel', '2000-02-11', 70, 'Français', 3, NULL, 'lucas.morel@email.com', '+33612345678', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- Participant 2
(3, 3, 1, 'default', 'Nicolas', 'Bernard', '1997-06-30', 82, 'Français', 2, NULL, 'nicolas.bernard@email.com', '+33687654321', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE), -- Participant 3
(1, 3, 2, 'default', 'Camille', 'Lemoine', '1998-03-15', 65, 'Français', 2, NULL, 'camille.lemoine@email.com', '+33609876543', '$2a$12$5WAJjOnLci98Af0jVTeAmewYI/42ggf/I6G/Ofuh2wPDc78xI/hX2', TRUE); -- Participant 4