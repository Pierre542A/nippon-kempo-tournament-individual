// routes/importRoutes.js
const TournamentImportController = require('../controllers/tournamentImportController');

module.exports = async function (fastify) {
  // Créer une instance du contrôleur
  const tournamentImportController = new TournamentImportController(fastify);
  
  // Enregistrer la route
  fastify.post('/imports/tournament', (req, reply) => {
    return tournamentImportController.importTournament(req, reply);
  });
};