SET NAMES 'utf8mb4';

-- Crée une table pour les users
CREATE TABLE IF NOT EXISTS users (
   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   id_grade INT NOT NULL,
   id_role INT NOT NULL,
   id_gender INT NOT NULL,
   first_name VARCHAR(50) NOT NULL,
   last_name VARCHAR(50) NOT NULL,
   birth_date DATETIME NOT NULL,
   weight INT NOT NULL,
   nationality VARCHAR(50) NOT NULL,
   id_club INT NOT NULL,
   id_tournament_waiting INT DEFAULT NULL,
   email VARCHAR(100) NOT NULL UNIQUE,
   phone VARCHAR(50) NOT NULL,
   password VARCHAR(255) NOT NULL,
   is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insère des données de test
INSERT INTO users (
   id_grade,
   id_role,
   id_gender,
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
(1, 1, 1, 'Pierre', 'SPREDER', '1990-05-14 08:30:00', 75, 'Française', 1, NULL, 'spreder.pierre@gmail.com', '+33601020304', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Admin
(2, 2, 1, 'Pierre2', 'Durand', '1985-09-22 14:00:00', 80, 'Française', 2, NULL, 'b@b.com', '+33605060708', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Gestionnaire (propriétaire de club)
(3, 3, 2, 'Pierre3', 'Martin', '1995-08-22 09:45:00', 60, 'Française', 3, 3, 'c@c.com', '+33607080910', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 1
(4, 3, 1, 'Lucas', 'Morel', '2000-02-11 17:10:00', 70, 'Française', 3, NULL, 'lucas.morel@email.com', '+33612345678', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 2
(3, 3, 1, 'Nicolas', 'Bernard', '1997-06-30 11:15:00', 82, 'Française', 2, NULL, 'nicolas.bernard@email.com', '+33687654321', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE), -- Participant 3
(5, 3, 2, 'Camille', 'Lemoine', '1998-03-15 20:45:00', 65, 'Française', 1, NULL, 'camille.lemoine@email.com', '+33609876543', '$2a$12$mqyiJMR.A8YICwyXT8z39OVFB27mRhGLDrwtqIqpzQAQ2D.a.zJQa', TRUE); -- Participant 4