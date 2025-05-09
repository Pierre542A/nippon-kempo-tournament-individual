// controllers/ClubController.js
class ClubController {
    constructor(fastify) {
        this.fastify = fastify;
        this.mysql = fastify.mysql;
    }

    async createClub(req, reply) {
        if (!req.user || req.user.role !== 1) {
            return reply.code(403).send({ error: 'Accès réservé aux administrateurs' });
        }

        const {
            name, email, phone,
            street, postal_code, city, website,
            is_active = true
        } = req.body;

        try {
            // Vérification des champs obligatoires
            if (!name || !email || !phone || !street || !postal_code || !city) {
                return reply.code(400).send({
                    error: 'Tous les champs obligatoires doivent être renseignés'
                });
            }

            // Insertion dans la base de données - SANS référence à created_at
            const [result] = await this.mysql.execute(
                `INSERT INTO clubs (
                    name, email, phone, street, postal_code, city,
                    website, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, street, postal_code, city, website || null, !!is_active]
            );

            // Réponse avec l'ID du nouveau club
            reply.code(201).send({
                success: true,
                club_id: result.insertId,
                message: 'Club créé avec succès'
            });
        } catch (err) {
            console.error('[createClub]', err);

            // Message d'erreur plus descriptif
            let errorMessage = 'Erreur lors de la création du club';

            // Si c'est une erreur SQL spécifique
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                errorMessage = 'Structure de la table clubs incorrecte. Veuillez contacter l\'administrateur.';
            } else if (err.sqlMessage) {
                errorMessage = err.sqlMessage;
            }

            reply.code(500).send({ error: errorMessage });
        }
    }

    /* ──────────────────────────── READ ALL ─────────────────────────── */
    async getAllClubs(req, reply) {
        try {
            // Récupérer le paramètre de filtre de statut (is_active) s'il existe
            const showAll = req.query.show_all === 'true';

            // Construire la requête SQL en fonction du filtre
            let sql = `
            SELECT id, name, email, phone,
                  street, postal_code, city, website,
                  is_active
            FROM clubs
        `;

            // Ajouter la condition uniquement si nous ne voulons pas tous les clubs
            if (!showAll) {
                sql += ` WHERE is_active = 1`;
            }

            // Ajouter l'ordre de tri
            sql += ` ORDER BY name`;

            const [rows] = await this.mysql.execute(sql);
            reply.send({ success: true, clubs: rows });
        } catch (err) {
            console.error('[getAllClubs]', err);
            reply.code(500).send({ error: 'Erreur interne.' });
        }
    }

    /* ──────────────────────────── READ ONE ─────────────────────────── */
    async getClubById(req, reply) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT id, name, email, phone,
                street, postal_code, city, website,
                is_active
           FROM clubs
          WHERE id = ?`,
                [req.params.id]
            );
            if (!rows.length) return reply.code(404).send({ error: 'Club non trouvé' });
            reply.send({ club: rows[0] });
        } catch (err) {
            console.error('[getClubById]', err);
            reply.code(500).send({ error: 'Erreur interne.' });
        }
    }

    /* ──────────────────────────── UPDATE / DISABLE ─────────────────── */
    async updateClub(req, reply) {
        console.log('req.body:', JSON.stringify(req.body, null, 2)); // Log pour debug

        try {
            // Récupérer les données actuelles du club
            const [currentClub] = await this.mysql.execute(
                `SELECT name, email, phone, street, postal_code, city, website, is_active
             FROM clubs
             WHERE id = ?`,
                [req.params.id]
            );

            if (!currentClub.length) {
                return reply.code(404).send({ error: 'Club non trouvé' });
            }

            // Fusionner les données existantes avec les nouvelles données
            const clubData = {
                ...currentClub[0],
                ...req.body
            };

            // Vérifications pour la désactivation du club
            if (clubData.is_active === false) {
                // 1. Vérifier qu'il n'y a plus de joueurs rattachés au club
                const [players] = await this.mysql.execute(
                    `SELECT COUNT(*) as count 
                 FROM users 
                 WHERE id_club = ? AND id_role = 3`,
                    [req.params.id]
                );

                if (players[0].count > 0) {
                    return reply.code(409).send({
                        error: 'Impossible de supprimer ce club car des joueurs y sont encore rattachés.'
                    });
                }

                // 2. Vérifier qu'il ne reste qu'un seul administrateur ou gestionnaire
                const [admins] = await this.mysql.execute(
                    `SELECT COUNT(*) as count 
                 FROM users 
                 WHERE id_club = ? AND id_role IN (1, 2)`,
                    [req.params.id]
                );

                if (admins[0].count > 1) {
                    return reply.code(409).send({
                        error: 'Impossible de supprimer ce club car il reste plus d\'un administrateur ou gestionnaire.'
                    });
                }

                // 3. Vérifier que l'utilisateur actuel est le dernier admin/gestionnaire
                if (admins[0].count === 1 && req.user && req.user.id) {
                    const [currentUser] = await this.mysql.execute(
                        `SELECT COUNT(*) as isLastAdmin 
                     FROM users 
                     WHERE id = ? AND id_club = ? AND id_role IN (1, 2)`,
                        [req.user.id, req.params.id]
                    );

                    const isLastAdmin = currentUser[0] && currentUser[0].isLastAdmin ?
                        parseInt(currentUser[0].isLastAdmin, 10) : 0;

                    if (isLastAdmin !== 1) {
                        return reply.code(403).send({
                            error: 'Seul le dernier administrateur ou gestionnaire du club peut le supprimer.'
                        });
                    }
                }
            }

            // Préparation des paramètres avec les données fusionnées
            const params = [
                clubData.name,
                clubData.email,
                clubData.phone,
                clubData.street,
                clubData.postal_code,
                clubData.city,
                clubData.website,
                clubData.is_active !== undefined ? !!clubData.is_active : true,
                req.params.id
            ];

            console.log('SQL parameters:', params); // Log pour debug

            // Effectuer la mise à jour
            await this.mysql.execute(
                `UPDATE clubs SET
              name        = ?, 
              email       = ?, 
              phone       = ?,
              street      = ?, 
              postal_code = ?, 
              city        = ?,
              website     = ?, 
              is_active   = ?
            WHERE id = ?`,
                params
            );

            reply.send({ success: true });
        } catch (err) {
            console.error('[updateClub]', err);
            reply.code(500).send({ error: 'Erreur lors de la mise à jour du club.' });
        }
    }

    /* ──────────────────────────── MEMBERS ──────────────────────────── */
    async getMembersByClubId(req, reply) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT
         u.id, u.first_name, u.last_name, u.email, u.phone, u.birth_date,
         u.id_gender, u.weight, u.nationality, u.id_grade, g.name AS grade_name,
         u.is_active, u.avatar_seed, u.created_at, u.id_role,
         c.name AS club_name
       FROM users u
       LEFT JOIN grades g ON u.id_grade = g.id
       LEFT JOIN clubs c ON u.id_club = c.id
       WHERE u.id_club = ?`,
                [req.params.id]
            );
            reply.send({ users: rows });
        } catch (err) {
            console.error('[getMembersByClubId]', err);
            reply.code(500).send({ error: 'Erreur interne' });
        }
    }
}

module.exports = ClubController;