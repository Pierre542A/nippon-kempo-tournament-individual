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
