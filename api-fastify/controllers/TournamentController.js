// controllers/TournamentController.js
class TournamentController {
    constructor(fastify) {
        this.fastify = fastify;
        this.tournamentService = fastify.tournamentService;
        this.userService = fastify.userService;
        console.log("TournamentController initialisé avec services:", 
            !!this.tournamentService, !!this.userService);
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

    async getAllTournaments(req, reply) {
        try {
            const tournaments = await this.tournamentService.getAllTournaments();
            return reply.send(tournaments);
        } catch (error) {
            console.error('Erreur getAllTournaments:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }

    async getCategoriesByTournamentId(req, reply) {
        try {
            const tournamentId = req.params.id;
            const categories = await this.tournamentService.getCategoriesByTournamentId(tournamentId);
            
            return reply.send(categories);
        } catch (error) {
            console.error('Erreur getCategoriesByTournamentId:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }

    async registerForTournament(req, reply) {
        try {
            console.log("Début registerForTournament", new Date().toISOString());
            console.log("Paramètres:", JSON.stringify(req.params));
            console.log("User:", req.user ? JSON.stringify({id: req.user.id, role: req.user.role}) : "undefined");
            
            // Étape 1: Valider les entrées
            const userId = req.user.id;
            console.log("userId:", userId);
            
            const tournamentId = parseInt(req.params.id, 10);
            console.log("tournamentId:", tournamentId);
            
            if (isNaN(tournamentId)) {
                console.log("ID de tournoi invalide");
                return reply.code(400).send({ error: "Identifiant de tournoi invalide" });
            }
            
            // Étape 2: Vérifier si le tournoi existe
            console.log("Vérification de l'existence du tournoi");
            let tournament;
            try {
                tournament = await this.tournamentService.getTournamentById(tournamentId);
                console.log("Tournoi trouvé:", tournament ? "oui" : "non");
            } catch (err) {
                console.error("Erreur lors de la recherche du tournoi:", err);
                return reply.code(500).send({ error: "Erreur lors de la vérification du tournoi" });
            }
            
            if (!tournament) {
                console.log("Tournoi non trouvé");
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }
            
            if (tournament.status === 'closed') {
                console.log("Tournoi fermé aux inscriptions");
                return reply.code(400).send({ error: "Les inscriptions pour ce tournoi sont fermées" });
            }
            
            // Étape 3: Vérifier si l'utilisateur a déjà une inscription
            console.log("Vérification du statut d'inscription de l'utilisateur");
            let user;
            try {
                user = await this.userService.getUserById(userId);
                console.log("Utilisateur trouvé:", user ? "oui" : "non");
                if (user) {
                    console.log("Inscription en attente:", user.id_tournament_waiting ? "oui (tournoi " + user.id_tournament_waiting + ")" : "non");
                }
            } catch (err) {
                console.error("Erreur lors de la récupération de l'utilisateur:", err);
                return reply.code(500).send({ error: "Erreur lors de la vérification du statut d'utilisateur" });
            }
            
            if (!user) {
                console.log("Utilisateur non trouvé");
                return reply.code(404).send({ error: "Utilisateur non trouvé" });
            }
            
            if (user.id_tournament_waiting) {
                console.log("L'utilisateur a déjà une inscription en attente");
                return reply.code(400).send({ 
                    error: "Une inscription est déjà en cours. Pour l'annuler, allez dans votre page profil et 'Tournoi en attente d'inscription > Se désinscrire'"
                });
            }
            
            // Version simplifiée: pas de vérification des catégories pour l'instant
            // Cela peut être une source d'erreur
            
            // Étape 4: Enregistrer l'inscription
            console.log("Enregistrement de l'inscription");
            try {
                await this.userService.updateUserInfo(userId, { 
                    id_tournament_waiting: tournamentId 
                });
                console.log("Inscription enregistrée avec succès");
            } catch (err) {
                console.error("Erreur lors de l'enregistrement de l'inscription:", err);
                return reply.code(500).send({ 
                    error: "Erreur lors de l'enregistrement de l'inscription" 
                });
            }
            
            // Étape 5: Retourner une réponse de succès
            console.log("Fin registerForTournament - succès");
            return reply.send({
                success: true,
                message: "Inscription au tournoi enregistrée avec succès"
            });
        } catch (error) {
            console.error('Erreur globale registerForTournament:', error);
            console.error('Stack:', error.stack);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }
}

module.exports = TournamentController;