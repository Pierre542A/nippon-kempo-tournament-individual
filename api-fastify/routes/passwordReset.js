// routes/passwordReset.js - Nouvelle approche
module.exports = async function (fastify, options) {
    console.log("Enregistrement des routes de réinitialisation de mot de passe");

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
        console.log("Route POST verify-reset-token appelée avec token dans le corps");
        return fastify.passwordResetController.verifyResetToken(req, reply);
    });

    // Test simple pour vérifier si les routes fonctionnent
    fastify.get("/password-reset-ping", (req, reply) => {
        return reply.send({ success: true, message: "Routes de réinitialisation connectées" });
    });
}