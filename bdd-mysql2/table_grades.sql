SET NAMES 'utf8mb4';

-- Table des grades
CREATE TABLE IF NOT EXISTS grades (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de grades
INSERT INTO grades (
    name
) VALUES
('Ceinture Blanche'),
('Ceinture Noire'),
('Ceinture Rouge');
