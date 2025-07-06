// routes/gradeRoutes.js
module.exports = async function (fastify) {
  const GradeController = require('../controllers/GradeController');
  const gradeController = new GradeController(fastify);

  fastify.get('/grades', {
    schema: {
      description: 'Obtenir tous les grades',
      tags: ['Grades'],
      response: { 200: { type: 'object' } }
    }
  }, (req, reply) => gradeController.getAllGrades(req, reply));
};
