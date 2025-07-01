// controllers/GradeController.js
class GradeController {
    constructor(fastify) {
        this.fastify = fastify;
        this.mysql = fastify.mysql;
    }

    async getAllGrades(req, reply) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT id, name FROM grades ORDER BY id`
            );

            return reply.send({
                success: true,
                grades: rows
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des grades:', error);
            return reply.code(500).send({
                error: 'Erreur lors de la récupération des grades.'
            });
        }
    }
}

module.exports = GradeController;