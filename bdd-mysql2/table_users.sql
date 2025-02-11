SET NAMES 'utf8mb4';

-- Crée une table pour les utilisateurs
CREATE TABLE IF NOT EXISTS users (
   user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
   user_creation_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
   user_last_name VARCHAR(100) NOT NULL,
   user_first_name VARCHAR(100) NOT NULL,
   user_age INT NOT NULL,
   user_sex ENUM('M', 'F', 'Other') NOT NULL,
   user_email VARCHAR(255) NOT NULL UNIQUE,
   user_email_confirmed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: accepté 0: refusé' CHECK (user_email_confirmed IN (0, 1)),
   user_password VARCHAR(255) NOT NULL,
   user_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1: actif 0: supprimé' CHECK (user_active IN (0, 1)),
   user_breakage_cause_id INT,
   user_break_date_time DATETIME,
   user_newsletter TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: accepté 0: refusé' CHECK (user_newsletter IN (0, 1)),
   user_source_traffic_id INT DEFAULT NULL,
   user_role_id INT NOT NULL DEFAULT 5
);

-- Insère des données de test dans la table users
INSERT INTO users (
   user_last_name,
   user_first_name,
   user_age,
   user_sex,
   user_email,
   user_email_confirmed,
   user_password,
   user_active,
   user_newsletter,
   user_source_traffic_id,
   user_role_id
) VALUES
('Super', 'Admin', 25, 'M', 'jean.dupont@email.com', 1, '$2a$15$hSzC1GPz2PULjUMfPl8vP.yVMDttyt7wReLXMmViBDjqTcsnWvY56', 1, 1, 2, 1),    -- Super Admin avec newsletter
('Juste', 'Admin', 25, 'M', 'jean.dupont2@email.com', 1, '$2a$15$hSzC1GPz2PULjUMfPl8vP.yVMDttyt7wReLXMmViBDjqTcsnWvY56', 1, 1, NULL, 2), -- Juste Admin sans source de trafic
('Employé', 'L&T', 32, 'F', 'sophie.martin@email.com', 1, '$2a$15$hSzC1GPz2PULjUMfPl8vP.yVMDttyt7wReLXMmViBDjqTcsnWvY56', 1, 0, NULL, 4), -- Employé sans adresse ni source de trafic
('Employé', 'M&C', 45, 'M', 'pierre.dubois@email.com', 1, '$2a$15$hSzC1GPz2PULjUMfPl8vP.yVMDttyt7wReLXMmViBDjqTcsnWvY56', 0, 0, 4, 5); -- Client avec adresse et source de trafic
