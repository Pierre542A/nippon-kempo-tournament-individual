SET NAMES 'utf8mb4';

-- Crée la table des matchs
CREATE TABLE IF NOT EXISTS matchs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tournament INT NOT NULL,
    id_users_white INT NOT NULL,
    id_users_red INT NOT NULL,
    id_winner INT DEFAULT NULL, -- NULL si le match n'est pas encore terminé
    ippon_white INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant blanc
    ippon_red INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant rouge
    keikoku_white INT NOT NULL DEFAULT 0, -- Pénalités du combattant blanc
    keikoku_red INT NOT NULL DEFAULT 0 -- Pénalités du combattant rouge
);

-- Insertion de matchs
INSERT INTO matchs (
    id_tournament,
    id_users_white,
    id_users_red,
    id_winner, 
    ippon_white,
    ippon_red,
    keikoku_white,
    keikoku_red
) VALUES
-- Tournoi 1
(1, 1, 2, 1, 2, 0, 1, 0),   -- User 1 (blanc) gagne contre User 2
(1, 3, 1, 1, 0, 2, 0, 1),   -- User 1 (rouge) gagne contre User 3
(1, 1, 4, 4, 0, 2, 1, 0),   -- User 1 (blanc) perd contre User 4

-- Tournoi 2
(2, 1, 5, 1, 3, 1, 0, 2),   -- User 1 (blanc) gagne contre User 5
(2, 6, 1, 6, 2, 1, 0, 1);   -- User 1 (rouge) perd contre User 6