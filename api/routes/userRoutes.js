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
  fastify.post("/login", (req, reply) => userController.login(req, reply));
  fastify.post('/loginadmin', { preHandler: verifyAdmin }, (req, reply) => userController.loginAdmin(req, reply));
  fastify.post('/signup', { preHandler: hashPasswordMiddleware }, (req, reply) => userController.signup(req, reply));
  fastify.get("/me", { preHandler: verifyAuth }, (req, reply) => userController.getUserById(req, reply));
  fastify.post("/logout", (req, reply) => userController.logout(req, reply));
  
  // Routes utilisateurs
  fastify.get("/users/:id/stats", { preHandler: verifyAuth }, (req, reply) => userController.getUserStats(req, reply));
  fastify.delete("/users/:id/tournament-registration", { preHandler: verifyAuth }, (req, reply) => userController.cancelTournamentRegistration(req, reply));
  fastify.put("/users/:id", { preHandler: verifyAuth }, (req, reply) => userController.updateUserInfo(req, reply));
  fastify.get("/users/:id/matches", { preHandler: verifyAuth }, (req, reply) => userController.getUserMatches(req, reply));
  fastify.get("/users/:id", { preHandler: verifyAuth }, (req, reply) => userController.getUserDetailsById(req, reply));

  // Routes tournois
  fastify.get("/tournaments", (req, reply) => tournamentController.getAllTournaments(req, reply));
  fastify.get("/tournaments/:id", (req, reply) => tournamentController.getTournamentById(req, reply));
  fastify.get("/tournaments/:id/categories", (req, reply) => tournamentController.getCategoriesByTournamentId(req, reply));
  fastify.post("/tournaments/:id/register", { preHandler: verifyAuth }, (req, reply) => tournamentController.registerForTournament(req, reply));
  fastify.get("/tournaments/:id/waiting-participants", (req, reply) => tournamentController.getWaitingParticipants(req, reply));
  fastify.post("/tournaments/:id/close", (req, reply) => tournamentController.closeTournament(req, reply));

  fastify.get("/clubs/:id/tournaments", (req, reply) => tournamentController.getTournamentsByClubId(req, reply));
  fastify.put("/tournaments/:id/toggle-active", { preHandler: verifyAuth }, (req, reply) => tournamentController.toggleTournamentActive(req, reply));


  // Routes administrateur
  fastify.get("/admin/users", { preHandler: verifyAuth }, (req, reply) => userController.getAllUsers(req, reply));
  
  //jusqu'a la c'est ok
   
  fastify.get("/email_confirmation", async (req, reply) => { return userController.confirmEmail(req, reply); });
  fastify.post('/resend_confirmation_email', { preHandler: verifyAuth }, (req, reply) => { return userController.resendConfirmationEmail(req, reply); });
};