// routes/passwordReset.js
module.exports = async function (fastify, options) {
    
    // POST /request-password-reset - Demander une réinitialisation
    fastify.post("/request-password-reset", {
        schema: {
            description: 'Demander la réinitialisation du mot de passe',
            summary: 'Demande de réinitialisation',
            tags: ['Reset Password'],
            body: {
                type: 'object',
                properties: {
                    email: { 
                        type: 'string', 
                        format: 'email',
                        description: 'Email de l\'utilisateur'
                    }
                },
                required: ['email']
            },
            response: {
                200: {
                    description: 'Demande de réinitialisation envoyée',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Email invalide',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                429: {
                    description: 'Trop de tentatives',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.requestPasswordReset(req, reply);
    });

    // POST /reset-password - Réinitialiser le mot de passe
    fastify.post("/reset-password", {
        schema: {
            description: 'Réinitialiser le mot de passe avec un token valide',
            summary: 'Réinitialisation du mot de passe',
            tags: ['Reset Password'],
            body: {
                type: 'object',
                properties: {
                    token: { 
                        type: 'string',
                        description: 'Token de réinitialisation reçu par email'
                    },
                    new_password: { 
                        type: 'string',
                        minLength: 8,
                        description: 'Nouveau mot de passe (minimum 8 caractères)'
                    },
                    confirm_password: {
                        type: 'string',
                        description: 'Confirmation du nouveau mot de passe'
                    }
                },
                required: ['token', 'new_password', 'confirm_password']
            },
            response: {
                200: {
                    description: 'Mot de passe réinitialisé avec succès',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                },
                400: {
                    description: 'Données invalides ou mots de passe non concordants',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                401: {
                    description: 'Token invalide ou expiré',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.resetPassword(req, reply);
    });

    // POST /verify-reset-token - Vérifier un token de réinitialisation
    fastify.post("/verify-reset-token", {
        schema: {
            description: 'Vérifier la validité d\'un token de réinitialisation',
            summary: 'Vérification de token',
            tags: ['Reset Password'],
            body: {
                type: 'object',
                properties: {
                    token: { 
                        type: 'string',
                        description: 'Token à vérifier'
                    }
                },
                required: ['token']
            },
            response: {
                200: {
                    description: 'Token valide',
                    type: 'object',
                    properties: {
                        valid: { type: 'boolean' },
                        message: { type: 'string' },
                        expires_at: { 
                            type: 'string', 
                            format: 'date-time',
                            description: 'Date d\'expiration du token'
                        }
                    }
                },
                400: {
                    description: 'Token manquant',
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                401: {
                    description: 'Token invalide ou expiré',
                    type: 'object',
                    properties: {
                        valid: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, (req, reply) => {
        return fastify.passwordResetController.verifyResetToken(req, reply);
    });

    // GET /password-reset-ping - Test de connexion des routes
    fastify.get("/password-reset-ping", {
        schema: {
            description: 'Test de fonctionnement des routes de réinitialisation',
            summary: 'Test de connexion',
            tags: ['Reset Password'],
            response: {
                200: {
                    description: 'Routes fonctionnelles',
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }, (req, reply) => {
        return reply.send({ 
            success: true, 
            message: "Routes de réinitialisation connectées",
            timestamp: new Date().toISOString()
        });
    });
};