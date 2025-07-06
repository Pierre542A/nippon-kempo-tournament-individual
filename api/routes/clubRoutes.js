// routes/clubRoutes.js
const verifyAuth = require('../middlewares/verifyAuth');

module.exports = async function (fastify) {
    const ClubController = require('../controllers/ClubController');
    const clubController = new ClubController(fastify);

    fastify.get('/clubs', {
        schema: {
            description: 'Obtenir la liste des clubs',
            tags: ['Clubs'],
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => clubController.getAllClubs(req, reply));

    fastify.get('/clubs/:id', {
        schema: {
            description: 'Obtenir un club par ID',
            tags: ['Clubs'],
            params: { type: 'object', properties: { id: { type: 'number' } } },
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => clubController.getClubById(req, reply));

    fastify.get('/clubs/:id/members', {
        schema: {
            description: 'Obtenir les membres d’un club',
            tags: ['Clubs'],
            params: { type: 'object', properties: { id: { type: 'number' } } },
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => clubController.getMembersByClubId(req, reply));

    fastify.put('/clubs/:id', {
        preHandler: verifyAuth,
        schema: {
            description: 'Mettre à jour un club',
            tags: ['Clubs'],
            params: { type: 'object', properties: { id: { type: 'number' } } },
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => clubController.updateClub(req, reply));

    fastify.post('/clubs', {
        preHandler: verifyAuth,
        schema: {
            description: 'Créer un nouveau club',
            tags: ['Clubs'],
            response: { 201: { type: 'object' } }
        }
    }, (req, reply) => clubController.createClub(req, reply));
};
