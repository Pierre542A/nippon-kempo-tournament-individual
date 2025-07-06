// routes/importRoutes.js
const TournamentImportController = require('../controllers/tournamentImportController');

module.exports = async function (fastify) {
  const tournamentImportController = new TournamentImportController(fastify);

  fastify.post('/imports/tournament', {
    schema: {
      description: 'Importer les données d\'un tournoi',
      tags: ['Import'],
      response: { 200: { type: 'object' } }
    }
  }, (req, reply) => tournamentImportController.importTournament(req, reply));
};
