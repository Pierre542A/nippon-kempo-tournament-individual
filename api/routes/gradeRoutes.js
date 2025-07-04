// routes/gradeRoutes.js
module.exports = async function (fastify) {
    const GradeController = require('../controllers/GradeController');
    const gradeController = new GradeController(fastify);

    // GET /grades - Récupérer tous les grades
    fastify.get('/grades', {
        schema: {
            description: 'Récupérer la liste de tous les grades disponibles dans le système',
            summary: 'Liste des grades',
            tags: ['Grades'],
            response: {
                200: {
                    description: 'Liste des grades récupérée avec succès',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { 
                                type: 'integer', 
                                description: 'Identifiant unique du grade'
                            },
                            name: { 
                                type: 'string', 
                                description: 'Nom du grade'
                            },
                            level: { 
                                type: 'integer', 
                                description: 'Niveau du grade (ordre croissant)'
                            },
                            color: { 
                                type: 'string', 
                                description: 'Couleur de la ceinture'
                            },
                            description: { 
                                type: 'string', 
                                description: 'Description détaillée du grade'
                            },
                            minimum_age: {
                                type: 'integer',
                                description: 'Âge minimum requis pour ce grade'
                            },
                            required_hours: {
                                type: 'integer',
                                description: 'Nombre d\'heures de pratique requises'
                            }
                        }
                    }
                },
                500: {
                    description: 'Erreur serveur interne',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (req, reply) => {
        return gradeController.getAllGrades(req, reply);
    });
};