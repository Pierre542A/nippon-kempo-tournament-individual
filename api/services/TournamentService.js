// services/TournamentService.js
class TournamentService {
    constructor(fastify) {
        this.mysql = fastify.mysql;
    }
    
    async getTournamentsByClubId(clubId, includeInactive = true) {
        try {
            let query = `
      SELECT t.id, t.name, t.address, t.start_date, t.end_date, t.status, 
              t.id_club, c.name AS club_name, t.is_active
        FROM tournaments t
        LEFT JOIN clubs c ON t.id_club = c.id
        WHERE t.id_club = ?`;

            // Si includeInactive est faux, ajouter une condition pour ne récupérer que les tournois actifs
            if (!includeInactive) {
                query += ` AND t.is_active = 1`;
            }

            query += ` ORDER BY t.start_date DESC`;

            const [rows] = await this.mysql.execute(query, [clubId]);

            return rows;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des tournois du club: ${error.message}`);
        }
    }

    async toggleTournamentActive(tournamentId, isActive) {
        try {
            const [result] = await this.mysql.execute(
                `UPDATE tournaments SET is_active = ? WHERE id = ?`,
                [isActive ? 1 : 0, tournamentId]
            );

            return {
                success: result.affectedRows > 0,
                tournamentId,
                is_active: isActive
            };
        } catch (error) {
            throw new Error(`Erreur lors de la modification du statut actif: ${error.message}`);
        }
    }

    async getTournamentById(tournamentId) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT t.id, t.name, t.address, t.start_date, t.end_date, t.status, 
                    t.id_club, c.name AS club_name, t.is_active
             FROM tournaments t
             LEFT JOIN clubs c ON t.id_club = c.id
             WHERE t.id = ?`,
                [tournamentId]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du tournoi: ${error.message}`);
        }
    }

    async getAllTournaments(onlyActive = false) {
        try {
            let query = `
            SELECT t.id, t.name, t.address, t.start_date, t.end_date, t.status, 
                  t.id_club, c.name AS club_name, t.is_active
            FROM tournaments t
            LEFT JOIN clubs c ON t.id_club = c.id
        `;

            // Si onlyActive est true, filtrer uniquement les tournois actifs
            if (onlyActive) {
                query += ` WHERE t.is_active = 1`;
            }

            query += ` ORDER BY t.start_date ASC`;

            const [rows] = await this.mysql.execute(query);

            return rows;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des tournois: ${error.message}`);
        }
    }

    // Ajoutez cette méthode si vous n'avez pas déjà closeTournament
    async closeTournament(tournamentId) {
        try {
            // 1. Mettre à jour le statut du tournoi
            await this.mysql.execute(
                `UPDATE tournaments SET status = 'closed' WHERE id = ?`,
                [tournamentId]
            );

            // 2. Réinitialiser id_tournament_waiting pour les utilisateurs liés à ce tournoi
            const [resetResult] = await this.mysql.execute(
                `UPDATE users SET id_tournament_waiting = NULL WHERE id_tournament_waiting = ?`,
                [tournamentId]
            );

            return {
                success: true,
                tournamentId,
                usersReset: resetResult.affectedRows
            };
        } catch (error) {
            throw new Error(`Erreur lors de la clôture du tournoi: ${error.message}`);
        }
    }

    async getCategoriesByTournamentId(tournamentId) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT c.id, c.name, c.id_grade_minimum, c.id_grade_maximum, 
                        c.id_category_type, ct.name AS category_type_name,
                        g_min.name AS grade_min_name, g_max.name AS grade_max_name
                 FROM categories c
                 LEFT JOIN categorytypes ct ON c.id_category_type = ct.id
                 LEFT JOIN grades g_min ON c.id_grade_minimum = g_min.id
                 LEFT JOIN grades g_max ON c.id_grade_maximum = g_max.id
                 WHERE c.id_tournament = ?`,
                [tournamentId]
            );

            return rows;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des catégories: ${error.message}`);
        }
    }
}

module.exports = TournamentService;