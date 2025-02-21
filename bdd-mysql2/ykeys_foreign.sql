SET NAMES 'utf8mb4';

-- Clés étrangères pour la table participant
ALTER TABLE participant
    ADD CONSTRAINT fk_participant_grade FOREIGN KEY (id_grade) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_participant_role FOREIGN KEY (id_role) 
        REFERENCES roles(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_participant_gender FOREIGN KEY (id_gender) 
        REFERENCES genders(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_participant_club FOREIGN KEY (id_club) 
        REFERENCES clubs(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_participant_tournaments FOREIGN KEY (id_tournament_waiting) 
        REFERENCES tournaments(id) ON DELETE SET NULL;

-- Clés étrangères pour la table matchs
ALTER TABLE matchs
    ADD CONSTRAINT fk_match_participant_white FOREIGN KEY (id_participant_white) 
        REFERENCES participant(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_match_participant_red FOREIGN KEY (id_participant_red) 
        REFERENCES participant(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_match_winner FOREIGN KEY (id_winner) 
        REFERENCES participant(id) ON DELETE SET NULL;

-- Clé étrangère pour la table tournaments
ALTER TABLE tournaments
    ADD CONSTRAINT fk_tournament_club FOREIGN KEY (id_club) 
        REFERENCES clubs(id) ON DELETE RESTRICT;

-- Clés étrangères pour la table catégories
ALTER TABLE categories
    ADD CONSTRAINT fk_category_tournaments FOREIGN KEY (id_tournament) 
        REFERENCES tournaments(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_grade_min FOREIGN KEY (id_grade_minimum) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_grade_max FOREIGN KEY (id_grade_maximum) 
        REFERENCES grades(id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_category_type FOREIGN KEY (id_category_type) 
        REFERENCES categorytypes(id) ON DELETE RESTRICT;
