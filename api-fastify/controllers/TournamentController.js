// controllers/TournamentController.js
class TournamentController {
    constructor(fastify) {
        this.fastify = fastify;
        this.tournamentService = fastify.tournamentService;
        this.userService = fastify.userService;
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

    // Ajoutez ce code dans la méthode getAllTournaments
    async getAllTournaments(req, reply) {
        try {
            // Par défaut, on ne récupère que les tournois actifs pour les utilisateurs normaux
            const onlyActive = req.query.onlyActive !== 'false'; // Par défaut true, sauf si explicitement false

            // Si l'utilisateur est un manager ou admin, on lui permet de voir les tournois inactifs
            const isManagerOrAdmin = req.user && (req.user.role === 1 || req.user.role === 2);
            const filterActive = isManagerOrAdmin ? onlyActive : true;

            const tournaments = await this.tournamentService.getAllTournaments(filterActive);
            return reply.send(tournaments);
        } catch (error) {
            console.error('Erreur getAllTournaments:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }

    // Nouvelle méthode pour récupérer les tournois d'un club
    async getTournamentsByClubId(req, reply) {
        try {
            const clubId = req.params.id;

            // Vérifier que le club existe
            const [clubResult] = await this.fastify.mysql.execute(
                `SELECT id FROM clubs WHERE id = ?`,
                [clubId]
            );

            if (clubResult.length === 0) {
                return reply.code(404).send({ error: "Club non trouvé" });
            }

            // Déterminer si on doit inclure les tournois inactifs
            // Les managers (rôle 2) et admins (rôle 1) peuvent voir les tournois inactifs
            const isManagerOrAdmin = req.user && (req.user.role === 1 || req.user.role === 2);

            // Passez includeInactive = true pour les managers/admins, false pour les autres
            const tournaments = await this.tournamentService.getTournamentsByClubId(clubId, isManagerOrAdmin);
            return reply.send({ tournaments });
        } catch (error) {
            console.error('Erreur getTournamentsByClubId:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }

    // Nouvelle méthode pour activer/désactiver un tournoi
    async toggleTournamentActive(req, reply) {
        try {
            const tournamentId = req.params.id;
            const { is_active } = req.body;

            // Vérifier si le tournoi existe
            const tournament = await this.tournamentService.getTournamentById(tournamentId);

            if (!tournament) {
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }

            const result = await this.tournamentService.toggleTournamentActive(tournamentId, is_active);

            return reply.send({
                success: true,
                message: `Le tournoi a été ${is_active ? 'activé' : 'désactivé'} avec succès`,
                tournament: result
            });
        } catch (error) {
            console.error('Erreur toggleTournamentActive:', error);
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
            // Étape 1: Valider les entrées
            const userId = req.user.id;

            const tournamentId = parseInt(req.params.id, 10);

            if (isNaN(tournamentId)) {
                return reply.code(400).send({ error: "Identifiant de tournoi invalide" });
            }

            // Étape 2: Vérifier si le tournoi existe
            let tournament;
            try {
                tournament = await this.tournamentService.getTournamentById(tournamentId);
            } catch (err) {
                console.error("Erreur lors de la recherche du tournoi:", err);
                return reply.code(500).send({ error: "Erreur lors de la vérification du tournoi" });
            }

            if (!tournament) {
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }

            if (tournament.status === 'closed') {
                return reply.code(400).send({ error: "Les inscriptions pour ce tournoi sont fermées" });
            }

            // Étape 3: Vérifier si l'utilisateur a déjà une inscription
            let user;
            try {
                user = await this.userService.getUserById(userId);
            } catch (err) {
                console.error("Erreur lors de la récupération de l'utilisateur:", err);
                return reply.code(500).send({ error: "Erreur lors de la vérification du statut d'utilisateur" });
            }

            if (!user) {
                return reply.code(404).send({ error: "Utilisateur non trouvé" });
            }

            if (user.id_tournament_waiting) {
                return reply.code(400).send({
                    error: "Une inscription est déjà en cours. Pour l'annuler, allez dans votre page profil et 'Tournoi en attente d'inscription > Se désinscrire'"
                });
            }

            // Version simplifiée: pas de vérification des catégories pour l'instant
            // Cela peut être une source d'erreur

            // Étape 4: Enregistrer l'inscription
            try {
                await this.userService.updateUserInfo(userId, {
                    id_tournament_waiting: tournamentId
                });
            } catch (err) {
                console.error("Erreur lors de l'enregistrement de l'inscription:", err);
                return reply.code(500).send({
                    error: "Erreur lors de l'enregistrement de l'inscription"
                });
            }

            // Étape 5: Retourner une réponse de succès
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

    async getWaitingParticipants(req, reply) {
        try {
            const tournamentId = req.params.id;

            // Vérifier que le tournoi existe
            const tournament = await this.tournamentService.getTournamentById(tournamentId);

            if (!tournament) {
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }

            // Récupérer les participants en attente via le service utilisateur
            const waitingParticipants = await this.userService.getWaitingParticipantsByTournament(tournamentId);

            return reply.send(waitingParticipants);
        } catch (error) {
            console.error('Erreur getWaitingParticipants:', error);
            return reply.code(500).send({ error: "Erreur interne serveur: " + error.message });
        }
    }

    async startTournament(tournamentId) {
        try {
            // 1. Mettre à jour le statut du tournoi
            await this.mysql.execute(
                `UPDATE tournaments SET status = 'in_progress' WHERE id = ?`,
                [tournamentId]
            );

            // 2. Réinitialiser id_tournament_waiting pour les utilisateurs liés à ce tournoi
            const [resetResult] = await this.mysql.execute(
                `UPDATE users SET id_tournament_waiting = NULL WHERE id_tournament_waiting = ?`,
                [tournamentId]
            );

            return { success: true, tournamentId, usersReset: resetResult.affectedRows };
        } catch (error) {
            console.error(`Erreur lors du démarrage du tournoi ${tournamentId}:`, error);
            throw new Error(`Erreur lors du démarrage du tournoi: ${error.message}`);
        }
    }

    // Ajout d'une méthode pour clôturer un tournoi
    async closeTournament(req, reply) {
        try {
            const tournamentId = req.params.id;

            // Vérifier si le tournoi existe
            const tournament = await this.tournamentService.getTournamentById(tournamentId);

            if (!tournament) {
                return reply.code(404).send({ error: "Tournoi non trouvé" });
            }

            const result = await this.tournamentService.closeTournament(tournamentId);

            return reply.send({
                success: true,
                message: `Tournoi clôturé avec succès. ${result.usersReset} participants(s) en attente réinitialisé(s).`
            });
        } catch (error) {
            console.error('Erreur closeTournament:', error);
            return reply.code(500).send({ error: "Erreur interne serveur" });
        }
    }
}

module.exports = TournamentController;