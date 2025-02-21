SET NAMES 'utf8mb4';

-- Table des tournois
CREATE TABLE IF NOT EXISTS tournaments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_club INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open'
);

-- Insertion de tournois
INSERT INTO tournaments (
    id_club,
    name,
    address,
    start_date,
    end_date,
    status
) VALUES
(1, 'Tournoi National', 'Stade Paris', '2025-06-10 09:00:00', '2025-06-11 18:00:00', 'open'),
(2, 'Tournoi Régional', 'Gymnase Lyon', '2025-07-15 10:00:00', '2025-07-16 19:00:00', 'closed'),
(3, 'Tournoi Nationallllllll', 'Stade Paris', '2025-06-10 09:00:00', '2025-06-11 18:00:00', 'open'),
(4, 'Tournoi Régional', 'Gymnase Lyon', '2025-07-15 10:00:00', '2025-07-16 19:00:00', 'closed');
