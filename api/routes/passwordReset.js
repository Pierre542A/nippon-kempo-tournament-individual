// routes/passwordReset.js - Nouvelle approche
module.exports = async function (fastify, options) {
    // Route de demande de réinitialisation - inchangée
    fastify.post("/request-password-reset", (req, reply) => {
        return fastify.passwordResetController.requestPasswordReset(req, reply);
    });

    // Route de réinitialisation - inchangée
    fastify.post("/reset-password", (req, reply) => {
        return fastify.passwordResetController.resetPassword(req, reply);
    });

    // NOUVELLE route de vérification - utilise POST avec le token dans le corps
    fastify.post("/verify-reset-token", (req, reply) => {
        return fastify.passwordResetController.verifyResetToken(req, reply);
    });
}