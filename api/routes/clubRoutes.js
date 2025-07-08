// routes/clubRoutes.js
const verifyAuth = require('../middlewares/verifyAuth');
const verifyAdmin = require('../middlewares/verifyAdmin');

module.exports = async function (fastify) {
    const ClubController = require('../controllers/ClubController');
    const clubController = new ClubController(fastify);

    fastify.get('/clubs', {
        schema: {
            tags: ['Clubs']
        }
    }, (req, reply) => clubController.getAllClubs(req, reply));

    fastify.get('/clubs/:id', {
        schema: {
            tags: ['Clubs'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            }
        }
    }, (req, reply) => clubController.getClubById(req, reply));

    fastify.get('/clubs/:id/members', {
        schema: {
            tags: ['Clubs'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            }
        }
    }, (req, reply) => clubController.getMembersByClubId(req, reply));

    fastify.put('/clubs/:id', {
        schema: {
            tags: ['Clubs'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    street: { type: 'string' },
                    postal_code: { type: 'string' },
                    city: { type: 'string' },
                    website: { type: 'string' },
                    is_active: { type: 'boolean' }
                }
            }
        },
        preHandler: verifyAuth
    }, (req, reply) => clubController.updateClub(req, reply));

    fastify.post('/clubs', {
        schema: {
            tags: ['Clubs'],
            body: {
                type: 'object',
                required: ['name', 'email', 'phone', 'street', 'postal_code', 'city'],
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    street: { type: 'string' },
                    postal_code: { type: 'string' },
                    city: { type: 'string' },
                    website: { type: 'string' },
                    is_active: { type: 'boolean' }
                }
            }
        },
        preHandler: verifyAuth
    }, (req, reply) => clubController.createClub(req, reply));
};