SET NAMES 'utf8mb4';

-- Crée la table des matchs
CREATE TABLE IF NOT EXISTS matchs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_users_white INT NOT NULL,
    id_users_red INT NOT NULL,
    id_winner INT DEFAULT NULL, -- NULL si le match n'est pas encore terminé
    ippon_white INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant blanc
    ippon_red INT NOT NULL DEFAULT 0, -- Nombre de ippon du combattant rouge
    keikoku_white INT NOT NULL DEFAULT 0, -- Pénalités du combattant blanc
    keikoku_red INT NOT NULL DEFAULT 0 -- Pénalités du combattant rouge
);

INSERT INTO matchs (
    id_users_white,
    id_users_red,
    id_winner, 
    ippon_white,
    ippon_red,
    keikoku_white,
    keikoku_red
) VALUES
(3, 4, 3, 2, 1, 0, 1), -- Sophie (Blanc) gagne contre Lucas (Rouge)
(5, 6, 5, 1, 0, 0, 2), -- Nicolas (Blanc) gagne contre Camille (Rouge)
(2, 4, 2, 2, 0, 0, 1); -- Jean (Admin) arbitre, Pierre (Gestionnaire) gagne contre Lucas
