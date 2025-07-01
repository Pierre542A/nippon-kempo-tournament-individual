// controllers/PasswordResetController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../middlewares/sendEmail");

class PasswordResetController {
    constructor(fastify) {
        this.fastify = fastify;
        this.jwtSecret = fastify.jwtSecret;
        this.userService = fastify.userService;
        this.passwordResetService = fastify.passwordResetService;
    }

    async requestPasswordReset(req, reply) {
        try {
            const { email } = req.body;

            // Vérifier si l'email existe
            const user = await this.userService.getUserByEmail(email);

            // Si l'utilisateur n'existe pas, on renvoie quand même un succès pour des raisons de sécurité
            // (pour ne pas révéler quels emails sont enregistrés)
            if (!user || !user.is_active) {
                return reply.send({
                    success: true,
                    message: "Si cet email existe dans notre base de données, un lien de réinitialisation a été envoyé."
                });
            }

            // Générer un token JWT avec une durée de validité limitée (1h)
            const resetToken = jwt.sign(
                {
                    userId: user.id,
                    purpose: "password_reset"
                },
                this.jwtSecret,
                { expiresIn: "1h" }
            );

            // Enregistrer le token dans le champ reset_token de l'utilisateur
            await this.passwordResetService.saveResetToken(user.id, resetToken);

            // Construire l'URL de réinitialisation
            const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

            // Envoyer l'email avec le lien de réinitialisation
            const emailSubject = "Réinitialisation de votre mot de passe";
            const emailContent = `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.first_name},</p>
        <p>Vous avez demandé une réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <p><a href="${resetUrl}" style="display: inline-block; background-color: #4285F4; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold;">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
        <p>Cordialement,<br>L'équipe Nippon Kempo Tournament</p>
      `;

            await sendEmail(email, emailSubject, emailContent);

            return reply.send({
                success: true,
                message: "Si cet email existe dans notre base de données, un lien de réinitialisation a été envoyé."
            });
        } catch (error) {
            console.error("Erreur lors de la demande de réinitialisation:", error);
            return reply.code(500).send({
                success: false,
                error: "Une erreur est survenue lors de la demande de réinitialisation."
            });
        }
    }

    async verifyResetToken(req, reply) {
        try {
            // Récupérer le token depuis le corps au lieu des paramètres
            const token = req.body?.token || req.params?.token;

            if (!token) {
                return reply.code(400).send({
                    success: false,
                    error: "Token manquant"
                });
            }

            // Le reste de la méthode reste inchangé
            const isValid = await this.passwordResetService.verifyToken(token);

            if (!isValid) {
                return reply.code(400).send({
                    success: false,
                    error: "Ce lien de réinitialisation est invalide ou a expiré."
                });
            }

            return reply.send({
                success: true,
                message: "Token valide"
            });
        } catch (error) {
            console.error("Erreur lors de la vérification du token:", error);
            return reply.code(500).send({
                success: false,
                error: "Une erreur est survenue lors de la vérification du token."
            });
        }
    }

    async resetPassword(req, reply) {
        try {
            const { token, password } = req.body;

            // Vérifier si le mot de passe respecte les critères
            if (password.length < 8) {
                return reply.code(400).send({
                    success: false,
                    error: "Le mot de passe doit contenir au moins 8 caractères."
                });
            }

            // Vérifier la validité du token et récupérer l'utilisateur associé
            const isValid = await this.passwordResetService.verifyToken(token);
            if (!isValid) {
                return reply.code(400).send({
                    success: false,
                    error: "Ce lien de réinitialisation est invalide ou a expiré."
                });
            }

            // Récupérer l'ID utilisateur à partir du token
            const userData = await this.passwordResetService.getUserByToken(token);
            if (!userData) {
                return reply.code(400).send({
                    success: false,
                    error: "Utilisateur introuvable."
                });
            }

            // Vérifier si l'utilisateur existe
            const user = await this.userService.getUserById(userData.id);
            if (!user || !user.is_active) {
                return reply.code(400).send({
                    success: false,
                    error: "Utilisateur introuvable ou compte désactivé."
                });
            }

            // Hashage du nouveau mot de passe
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Mise à jour du mot de passe
            await this.userService.updateUserInfo(user.id, { password: hashedPassword });

            // Invalider le token de réinitialisation
            await this.passwordResetService.invalidateToken(token);

            return reply.send({
                success: true,
                message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
            });
        } catch (error) {
            console.error("Erreur lors de la réinitialisation du mot de passe:", error);
            return reply.code(500).send({
                success: false,
                error: "Une erreur est survenue lors de la réinitialisation du mot de passe."
            });
        }
    }
}

module.exports = PasswordResetController;