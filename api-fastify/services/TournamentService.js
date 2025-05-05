// services/TournamentService.js
class TournamentService {
    constructor(fastify) {
        this.mysql = fastify.mysql;
    }

    async getTournamentById(tournamentId) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT t.id, t.name, t.address, t.start_date, t.end_date, t.status, 
                        t.id_club, c.name AS club_name
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

    async getAllTournaments() {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT t.id, t.name, t.address, t.start_date, t.end_date, t.status, 
                        t.id_club, c.name AS club_name
                 FROM tournaments t
                 LEFT JOIN clubs c ON t.id_club = c.id
                 ORDER BY t.start_date ASC`
            );
            
            return rows;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des tournois: ${error.message}`);
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