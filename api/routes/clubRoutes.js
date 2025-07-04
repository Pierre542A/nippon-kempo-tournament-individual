// routes/clubRoutes.js
const verifyAuth = require('../middlewares/verifyAuth');
const verifyAdmin = require('../middlewares/verifyAdmin');

module.exports = async function (fastify) {
    const ClubController = require('../controllers/ClubController');
    const clubController = new ClubController(fastify);

    // GET /clubs - Liste tous les clubs
    fastify.get('/clubs', {
        schema: {
            description: 'Récupérer la liste de tous les clubs',
            tags: ['Clubs'],
            response: {
                200: {
                    description: 'Liste des clubs',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            city: { type: 'string' },
                            email: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, (req, reply) => clubController.getAllClubs(req, reply));

    // GET /clubs/:id - Détails d'un club
    fastify.get('/clubs/:id', {
        schema: {
            description: 'Récupérer les détails d\'un club',
            tags: ['Clubs'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'ID du club' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'Détails du club',
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        address: { type: 'string' },
                        city: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' }
                    }
                },
                404: { description: 'Club non trouvé' }
            }
        }
    }, (req, reply) => clubController.getClubById(req, reply));

    // GET /clubs/:id/members - Membres d'un club
    fastify.get('/clubs/:id/members', {
        schema: {
            description: 'Récupérer les membres d\'un club',
            tags: ['Clubs'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'ID du club' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'Liste des membres',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            grade: { type: 'string' }
                        }
                    }
                }
            }
        }
    }, (req, reply) => clubController.getMembersByClubId(req, reply));

    // PUT /clubs/:id - Modifier un club (Auth requise)
    fastify.put('/clubs/:id', {
        preHandler: verifyAuth,
        schema: {
            description: 'Modifier un club',
            tags: ['Clubs'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                },
                required: ['id']
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    city: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' }
                }
            },
            response: {
                200: { description: 'Club modifié avec succès' },
                401: { description: 'Non autorisé' },
                404: { description: 'Club non trouvé' }
            }
        }
    }, (req, reply) => clubController.updateClub(req, reply));

    // POST /clubs - Créer un club (Auth requise)
    fastify.post('/clubs', {
        preHandler: verifyAuth,
        schema: {
            description: 'Créer un nouveau club',
            tags: ['Clubs'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Nom du club' },
                    address: { type: 'string' },
                    city: { type: 'string', description: 'Ville du club' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' }
                },
                required: ['name', 'city']
            },
            response: {
                201: { description: 'Club créé avec succès' },
                400: { description: 'Données invalides' },
                401: { description: 'Non autorisé' }
            }
        }
    }, (req, reply) => clubController.createClub(req, reply));
};