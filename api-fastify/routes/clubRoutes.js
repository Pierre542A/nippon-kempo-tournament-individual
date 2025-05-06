// routes/clubRoutes.js
module.exports = async function (fastify) {
    const ClubController = require('../controllers/ClubController');
    const clubController = new ClubController(fastify);

    // Route pour récupérer tous les clubs
    fastify.get('/clubs', async (req, reply) => {
        return clubController.getAllClubs(req, reply);
    });
};