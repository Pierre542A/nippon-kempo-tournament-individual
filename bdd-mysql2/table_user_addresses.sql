SET NAMES 'utf8mb4';

-- Crée une table pour les adresses utilisateurs
CREATE TABLE IF NOT EXISTS user_addresses (
   address_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   address_user_id INT,
   address_creation_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   address_category_id INT NOT NULL,
   address_number VARCHAR(10) NOT NULL,
   address_name VARCHAR(255) NOT NULL,
   address_addition VARCHAR(255),
   address_city VARCHAR(100) NOT NULL,
   address_postal_code VARCHAR(10) NOT NULL,
   address_country VARCHAR(100) NOT NULL
);

-- Insère des données de test dans la table user_addresses
INSERT INTO user_addresses (
   address_user_id,
   address_category_id,
   address_number,
   address_name,
   address_addition,
   address_city,
   address_postal_code,
   address_country
) VALUES
(1, 1, '12', 'Rue de la Paix', 'Apt 4B', 'Paris', '75001', 'France'),
(2, 1, '45', 'Avenue des Champs-Élysées', NULL, 'Paris', '75008', 'France'),
(3, 2, '8', 'Place Bellecour', 'Étage 3', 'Lyon', '69002', 'France'),
(NULL, 3, '23', 'Rue du Commerce', 'Zone Industrielle', 'Genève', '1204', 'Suisse');  -- Exemple d'adresse fournisseur