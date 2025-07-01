// routes/clubRoutes.js
const verifyAuth = require('../middlewares/verifyAuth');
const verifyAdmin = require('../middlewares/verifyAdmin');

module.exports = async function (fastify) {
    const ClubController = require('../controllers/ClubController');
    const clubController = new ClubController(fastify);

    fastify.get('/clubs', (req, reply) => clubController.getAllClubs(req, reply));
    fastify.get('/clubs/:id', (req, reply) => clubController.getClubById(req, reply));
    fastify.get('/clubs/:id/members', (req, reply) => clubController.getMembersByClubId(req, reply));
    fastify.put('/clubs/:id', { preHandler: verifyAuth }, (req, reply) => clubController.updateClub(req, reply));
    fastify.post('/clubs', { preHandler: verifyAuth }, (req, reply) => clubController.createClub(req, reply));
};
