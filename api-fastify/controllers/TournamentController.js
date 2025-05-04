// Créez un fichier controllers/TournamentController.js
class TournamentController {
    constructor(fastify) {
        this.fastify = fastify;
        this.tournamentService = fastify.tournamentService;
    }

    async getTournamentById(req, reply) {
        try {
            const tournamentId = req.params.id;
            const tournament = await this.tournamentService.getTournamentById(tournamentId);

            if (!tournament) {
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }

            return reply.send(tournament);
        } catch (error) {
            console.error('Erreur getTournamentById:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }
}

module.exports = TournamentController;