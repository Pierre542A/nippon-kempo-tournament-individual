SET NAMES 'utf8mb4';

-- Crée une table pour les rôles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
   role_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insère des données de test dans la table user_roles
INSERT INTO user_roles (role_name) VALUES
('SuperAdmin'),
('Admin'), 
('Employé L&T'),
('Employé M&C'),
('Client');
