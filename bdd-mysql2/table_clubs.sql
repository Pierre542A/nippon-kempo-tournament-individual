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
INSERT INTO clubs (
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