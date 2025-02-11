SET NAMES 'utf8mb4';

-- Crée une table pour les catégories d'adresses
CREATE TABLE IF NOT EXISTS address_categories (
    category_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

-- Insère des données de test dans la table address_categories
INSERT INTO address_categories (category_name) VALUES
('Adresse de livraison'),
('Adresse de facturation'),
('Adresse de fournisseur');