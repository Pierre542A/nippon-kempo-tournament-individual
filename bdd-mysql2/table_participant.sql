SET NAMES 'utf8mb4';

-- Crée une table pour les users
CREATE TABLE IF NOT EXISTS users (
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   id_grade INT,
   id_role INT NOT NULL,
   id_gender INT NOT NULL,
   avatar_seed VARCHAR(100) NOT NULL,
   first_name VARCHAR(50) NOT NULL,
   last_name VARCHAR(50) NOT NULL,
   birth_date DATE NOT NULL,
   weight INT,
   nationality VARCHAR(50) NOT NULL,
   id_club INT,
   id_tournament_waiting INT DEFAULT NULL,
   email VARCHAR(100) NOT NULL UNIQUE,
   phone VARCHAR(50) NOT NULL,
   password VARCHAR(255) NOT NULL,
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
(NULL, 1, 1, 'default', 'Pierre', 'SPREDER', '2003-11-29', NULL, 'Française', NULL, 2, 'admin@admin.com', '+33601020304', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Admin
(2, 2, 1, 'default', 'Pierre2', 'Durand', '1985-09-22', 80, 'Française', 2, NULL, 'b@b.com', '+33605060708', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Gestionnaire (propriétaire de club)
(3, 3, 2, 'default', 'Pierre3', 'Martin', '1995-08-22', 60, 'Française', 3, 3, 'c@c.com', '+33607080910', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 1
(4, 3, 1, 'default', 'Lucas', 'Morel', '2000-02-11', 70, 'Française', 3, NULL, 'lucas.morel@email.com', '+33612345678', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 2
(3, 3, 1, 'default', 'Nicolas', 'Bernard', '1997-06-30', 82, 'Française', 2, NULL, 'nicolas.bernard@email.com', '+33687654321', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 3
(5, 3, 2, 'default', 'Camille', 'Lemoine', '1998-03-15', 65, 'Française', 1, NULL, 'camille.lemoine@email.com', '+33609876543', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE); -- Participant 4