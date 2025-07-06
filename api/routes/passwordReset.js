// routes/passwordReset.js
module.exports = async function (fastify, options) {
    fastify.post("/request-password-reset", {
        schema: {
            description: 'Demande de réinitialisation du mot de passe',
            tags: ['Password Reset'],
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.requestPasswordReset(req, reply);
    });

    fastify.post("/reset-password", {
        schema: {
            description: 'Réinitialiser le mot de passe',
            tags: ['Password Reset'],
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.resetPassword(req, reply);
    });

    fastify.post("/verify-reset-token", {
        schema: {
            description: 'Vérification du token de réinitialisation',
            tags: ['Password Reset'],
            response: { 200: { type: 'object' } }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.verifyResetToken(req, reply);
    });
};
