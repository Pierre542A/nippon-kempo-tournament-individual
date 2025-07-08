// routes/gradeRoutes.js
module.exports = async function (fastify) {
    const GradeController = require('../controllers/GradeController');
    const gradeController = new GradeController(fastify);

    // Route pour récupérer tous les grades
    fastify.get('/grades', {
        schema: {
            tags: ['Grades']
        }
    }, async (req, reply) => {
        return gradeController.getAllGrades(req, reply);
    });
};