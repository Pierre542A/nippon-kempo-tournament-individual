SET NAMES 'utf8mb4';

-- Table des types de catégories
CREATE TABLE IF NOT EXISTS categorytypes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertion de types de catégories
INSERT INTO categorytypes (
    name
) VALUES
('Junior'),
('Senior'),
('Vétéran');
