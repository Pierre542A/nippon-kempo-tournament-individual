SET NAMES 'utf8mb4';

-- Table des clubs
CREATE TABLE IF NOT EXISTS clubs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(55) NOT NULL,
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insertion de clubs
INSERT INTO clubs (
    name,
    email,
    phone,
    address,
    is_active
) VALUES
('Club Paris', 'contact@clubparis.com', '+33123456789', '123 Rue de Paris, France', TRUE),
('Club Lyon', 'contact@clublyon.com', '+33456781234', '45 Avenue de Lyon, France', TRUE),
('Club Marseille', 'contact1@clublyon.com', '+33456781234', '40005 Avenue de Lyon, France', TRUE),
('Club Nancy', 'contact2@clublyon.com', '+33456781234', '45A Avenue dAAe Lyon, France', TRUE),
('Club Mabite', 'contact3@clublyon.com', '+33456781234', '45frrf Avenue de Lyon, France', TRUE);