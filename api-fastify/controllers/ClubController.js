// controllers/ClubController.js
class ClubController {
    constructor(fastify) {
        this.fastify = fastify;
        this.mysql = fastify.mysql;
    }

    async getAllClubs(req, reply) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT id, name, email, phone, address 
                FROM clubs 
                WHERE is_active = 1
                ORDER BY name`
            );

            return reply.send({
                success: true,
                clubs: rows
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des clubs:', error);
            return reply.code(500).send({
                error: 'Erreur lors de la récupération des clubs.'
            });
        }
    }
}

module.exports = ClubController;