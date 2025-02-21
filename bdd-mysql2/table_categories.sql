SET NAMES 'utf8mb4';

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tournament INT NOT NULL,
    id_grade_minimum INT NOT NULL,
    id_grade_maximum INT NOT NULL,
    id_category_type INT NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Insertion de catégories
INSERT INTO categories (
    id_tournament,
    id_grade_minimum,
    id_grade_maximum,
    id_category_type,
    name
) VALUES
(1, 1, 2, 1, 'Ceinture Blanche - Junior'),
(2, 2, 3, 2, 'Ceinture Noire - Senior');