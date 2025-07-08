// routes/passwordReset.js - Nouvelle approche
module.exports = async function (fastify, options) {
    // Route de demande de réinitialisation
    fastify.post("/request-password-reset", {
        schema: {
            tags: ['Password Reset'],
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string' }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.requestPasswordReset(req, reply);
    });

    // Route de réinitialisation
    fastify.post("/reset-password", {
        schema: {
            tags: ['Password Reset'],
            body: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                    token: { type: 'string' },
                    password: { type: 'string' }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.resetPassword(req, reply);
    });

    // Route de vérification - utilise POST avec le token dans le corps
    fastify.post("/verify-reset-token", {
        schema: {
            tags: ['Password Reset'],
            body: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.verifyResetToken(req, reply);
    });

    // Test simple pour vérifier si les routes fonctionnent
    fastify.get("/password-reset-ping", {
        schema: {
            tags: ['Password Reset']
        }
    }, (req, reply) => {
        return reply.send({ success: true, message: "Routes de réinitialisation connectées" });
    });
}