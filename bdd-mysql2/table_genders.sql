SET NAMES 'utf8mb4';

-- Table des genres
CREATE TABLE IF NOT EXISTS genders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de genres
INSERT INTO genders (
    name
) VALUES
('Masculin'),
('Féminin'),
('Mixte / Ne pas préciser');
