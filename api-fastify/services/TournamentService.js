// Créez un fichier services/TournamentService.js
class TournamentService {
    constructor(fastify) {
        this.mysql = fastify.mysql;
    }

    async getTournamentById(tournamentId) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT id, name, address, start_date, end_date, status
           FROM tournaments
           WHERE id = ?`,
                [tournamentId]
            );
            return rows[0];
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du tournoi: ${error.message}`);
        }
    }
}

module.exports = TournamentService;