SET NAMES 'utf8mb4';

-- Clés étrangères pour la table users
ALTER TABLE users
    ADD CONSTRAINT fk_user_breakage FOREIGN KEY (user_breakage_cause_id) 
        REFERENCES user_breakage_causes(cause_id),
    ADD CONSTRAINT fk_user_source_traffic FOREIGN KEY (user_source_traffic_id) 
        REFERENCES source_traffics(origin_id),
    ADD CONSTRAINT fk_user_role FOREIGN KEY (user_role_id) 
        REFERENCES user_roles(role_id);

-- Clés étrangères pour la table user_addresses
ALTER TABLE user_addresses
    ADD CONSTRAINT fk_address_category FOREIGN KEY (address_category_id) 
        REFERENCES address_categories(category_id);