// routes/importRoutes.js
const TournamentImportController = require('../controllers/tournamentImportController');

module.exports = async function (fastify) {
  const tournamentImportController = new TournamentImportController(fastify);
  
  // POST /imports/tournament - Importer des données de tournoi
  fastify.post('/imports/tournament', {
    schema: {
      description: 'Importer des données de tournoi depuis un fichier ou des données JSON',
      summary: 'Import de tournoi',
      tags: ['Import'],
      consumes: ['application/json', 'multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          tournament_data: {
            type: 'object',
            description: 'Données du tournoi à importer',
            properties: {
              name: { 
                type: 'string', 
                description: 'Nom du tournoi'
              },
              date: { 
                type: 'string', 
                format: 'date',
                description: 'Date du tournoi'
              },
              location: { 
                type: 'string', 
                description: 'Lieu du tournoi'
              },
              categories: {
                type: 'array',
                description: 'Catégories du tournoi',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    min_weight: { type: 'number' },
                    max_weight: { type: 'number' },
                    min_age: { type: 'integer' },
                    max_age: { type: 'integer' }
                  }
                }
              },
              participants: {
                type: 'array',
                description: 'Liste des participants',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    club: { type: 'string' },
                    category: { type: 'string' },
                    weight: { type: 'number' },
                    grade: { type: 'string' }
                  }
                }
              }
            }
          },
          import_options: {
            type: 'object',
            description: 'Options d\'importation',
            properties: {
              overwrite_existing: {
                type: 'boolean',
                default: false,
                description: 'Écraser les données existantes si le tournoi existe déjà'
              },
              validate_participants: {
                type: 'boolean',
                default: true,
                description: 'Valider les participants avant import'
              },
              create_missing_clubs: {
                type: 'boolean',
                default: false,
                description: 'Créer automatiquement les clubs manquants'
              }
            }
          }
        },
        required: ['tournament_data']
      },
      response: {
        200: {
          description: 'Import réussi',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            tournament_id: { type: 'integer' },
            imported_data: {
              type: 'object',
              properties: {
                participants_imported: { type: 'integer' },
                categories_created: { type: 'integer' },
                clubs_created: { type: 'integer' },
                warnings: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        400: {
          description: 'Données d\'import invalides',
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        409: {
          description: 'Conflit - Tournoi existe déjà',
          type: 'object',
          properties: {
            error: { type: 'string' },
            existing_tournament_id: { type: 'integer' }
          }
        },
        500: {
          description: 'Erreur serveur lors de l\'import',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, (req, reply) => {
    return tournamentImportController.importTournament(req, reply);
  });
};