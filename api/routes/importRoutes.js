// routes/importRoutes.js
const TournamentImportController = require('../controllers/tournamentImportController');

module.exports = async function (fastify) {
  // Créer une instance du contrôleur
  const tournamentImportController = new TournamentImportController(fastify);
  
  // Enregistrer la route
  fastify.post('/imports/tournament', {
    schema: {
      tags: ['Import'],
      body: {
        type: 'object',
        required: ['tournament', 'participants'],
        properties: {
          tournament: { 
            type: 'object',
            properties: {
              name: { type: 'string' },
              start_date: { type: 'string' },
              end_date: { type: 'string' },
              address: { type: 'string' },
              id_club: { type: 'integer' },
              started: { type: 'boolean' }
            }
          },
          participants: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                birth_date: { type: 'string' },
                email: { type: 'string' },
                weight: { type: 'integer' },
                id_gender: { type: 'integer' },
                id_grade: { type: 'integer' }
              }
            }
          },
          categories: { 
            type: 'array',
            items: { type: 'object' }
          },
          matches: { 
            type: 'array',
            items: { type: 'object' }
          },
          importType: { type: 'string' }
        }
      }
    }
  }, (req, reply) => {
    return tournamentImportController.importTournament(req, reply);
  });
};