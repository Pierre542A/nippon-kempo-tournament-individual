// routes/userRoutes.js
const UserController = require("../controllers/UserController");
const TournamentController = require("../controllers/TournamentController");
const hashPasswordMiddleware = require("../middlewares/hashPassword");
const verifyAuth = require("../middlewares/verifyAuth");
const verifyAdmin = require('../middlewares/verifyAdmin');

module.exports = async function (fastify) {
  const userController = new UserController(fastify);
  const tournamentController = new TournamentController(fastify);
  
  // Routes d'authentification
  fastify.post("/login", { schema: { description: 'Connexion utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.login(req, reply));
  fastify.post('/loginadmin', { preHandler: verifyAdmin, schema: { description: 'Connexion administrateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.loginAdmin(req, reply));
  fastify.post('/signup', { preHandler: hashPasswordMiddleware, schema: { description: 'Inscription utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.signup(req, reply));
  fastify.get("/me", { preHandler: verifyAuth, schema: { description: 'Récupérer infos utilisateur connecté', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.getUserById(req, reply));
  fastify.post("/logout", { schema: { description: 'Déconnexion utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.logout(req, reply));

  // Routes utilisateurs
  fastify.get("/users/:id/stats", { preHandler: verifyAuth, schema: { description: 'Statistiques utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.getUserStats(req, reply));
  fastify.delete("/users/:id/tournament-registration", { preHandler: verifyAuth, schema: { description: 'Annuler inscription tournoi', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.cancelTournamentRegistration(req, reply));
  fastify.put("/users/:id", { preHandler: verifyAuth, schema: { description: 'Modifier infos utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.updateUserInfo(req, reply));
  fastify.get("/users/:id/matches", { preHandler: verifyAuth, schema: { description: 'Matchs de l\'utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.getUserMatches(req, reply));
  fastify.get("/users/:id", { preHandler: verifyAuth, schema: { description: 'Détails utilisateur', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.getUserDetailsById(req, reply));

  // Routes tournois
  fastify.get("/tournaments", { schema: { description: 'Lister tous les tournois', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.getAllTournaments(req, reply));
  fastify.get("/tournaments/:id", { schema: { description: 'Détails tournoi par ID', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.getTournamentById(req, reply));
  fastify.get("/tournaments/:id/categories", { schema: { description: 'Catégories d\'un tournoi', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.getCategoriesByTournamentId(req, reply));
  fastify.post("/tournaments/:id/register", { preHandler: verifyAuth, schema: { description: 'Inscription à un tournoi', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.registerForTournament(req, reply));
  fastify.get("/tournaments/:id/waiting-participants", { schema: { description: 'Participants en attente tournoi', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.getWaitingParticipants(req, reply));
  fastify.post("/tournaments/:id/close", { schema: { description: 'Fermer tournoi', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.closeTournament(req, reply));
  fastify.get("/clubs/:id/tournaments", { schema: { description: 'Tournois par club', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.getTournamentsByClubId(req, reply));
  fastify.put("/tournaments/:id/toggle-active", { preHandler: verifyAuth, schema: { description: 'Activer/désactiver tournoi', tags: ['Tournaments'], response: { 200: { type: 'object' } } } }, (req, reply) => tournamentController.toggleTournamentActive(req, reply));

  // Routes administrateur
  fastify.get("/admin/users", { preHandler: verifyAuth, schema: { description: 'Liste utilisateurs admin', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.getAllUsers(req, reply));

  fastify.get("/email_confirmation", { schema: { description: 'Confirmation email', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.confirmEmail(req, reply));
  fastify.post('/resend_confirmation_email', { preHandler: verifyAuth, schema: { description: 'Renvoyer email confirmation', tags: ['Users'], response: { 200: { type: 'object' } } } }, (req, reply) => userController.resendConfirmationEmail(req, reply));
};
