// services/PasswordResetService.js
const jwt = require("jsonwebtoken");

class PasswordResetService {
    constructor(fastify) {
        this.mysql = fastify.mysql;
        this.jwtSecret = fastify.jwtSecret;
    }

    // Plus besoin d'initialiser une table séparée
    async initialize() {
        // Vérification simple de la connexion à la base de données
        try {
            await this.mysql.execute("SELECT 1");
            console.log("Connexion à la base de données OK pour le service de réinitialisation de mot de passe");
            return true;
        } catch (error) {
            console.error("Erreur de connexion à la base de données:", error);
            return false;
        }
    }

    // Enregistrer un nouveau token de réinitialisation
    async saveResetToken(userId, token) {
        try {
            // Mise à jour de l'utilisateur avec le nouveau token
            const [result] = await this.mysql.execute(
                `UPDATE users SET reset_token = ? WHERE id = ?`,
                [token, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error("Utilisateur non trouvé");
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du token:", error);
            throw error;
        }
    }

    // Vérifier si un token est valide
    async verifyToken(token) {
        try {
            // Vérifier si le token existe et est associé à un utilisateur
            console.log("Vérification du token dans la base de données:", token.substring(0, 10) + "...");
            const [rows] = await this.mysql.execute(
                `SELECT id FROM users WHERE reset_token = ? AND is_active = TRUE`,
                [token]
            );

            console.log("Résultat de la requête SQL:", rows);

            if (rows.length === 0) {
                console.log("Token non trouvé dans la base de données");
                return false;
            }

            // Vérifier la validité du JWT
            try {
                console.log("Vérification de la validité JWT avec le secret");
                const decoded = jwt.verify(token, this.jwtSecret);
                console.log("Token décodé:", decoded);
                const isValid = decoded.purpose === "password_reset";
                console.log("Le token est valide pour la réinitialisation:", isValid);
                return isValid;
            } catch (jwtError) {
                console.error("Erreur JWT détaillée:", jwtError.name, jwtError.message);
                return false;
            }
        } catch (error) {
            console.error("Erreur générale de vérification du token:", error);
            return false;
        }
    }

    // Récupérer les données utilisateur associées à un token
    async getUserByToken(token) {
        try {
            const [rows] = await this.mysql.execute(
                `SELECT id FROM users WHERE reset_token = ? AND is_active = TRUE`,
                [token]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            console.error("Erreur lors de la récupération des données de l'utilisateur par token:", error);
            return null;
        }
    }

    // Invalider un token après utilisation
    async invalidateToken(token) {
        try {
            await this.mysql.execute(
                `UPDATE users SET reset_token = NULL WHERE reset_token = ?`,
                [token]
            );
        } catch (error) {
            console.error("Erreur lors de l'invalidation du token:", error);
            throw error;
        }
    }

    // Invalider tous les tokens expirés
    async cleanupExpiredTokens() {
        try {
            // Pour les tokens expirés, nous devons les vérifier un par un
            // car l'expiration est gérée dans le JWT lui-même
            const [users] = await this.mysql.execute(
                `SELECT id, reset_token FROM users WHERE reset_token IS NOT NULL`
            );

            let expiredCount = 0;

            for (const user of users) {
                try {
                    // Vérifier si le token est expiré
                    jwt.verify(user.reset_token, this.jwtSecret);
                } catch (jwtError) {
                    // Le token est expiré ou invalide, le supprimer
                    await this.mysql.execute(
                        `UPDATE users SET reset_token = NULL WHERE id = ?`,
                        [user.id]
                    );
                    expiredCount++;
                }
            }

            return expiredCount;
        } catch (error) {
            console.error("Erreur lors du nettoyage des tokens expirés:", error);
            throw error;
        }
    }
}

module.exports = PasswordResetService;