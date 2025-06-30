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
INSERT INTO tournaments (
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
