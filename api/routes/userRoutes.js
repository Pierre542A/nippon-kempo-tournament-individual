// routes/userRoutes.js
const UserController = require("../controllers/UserController");
const TournamentController = require("../controllers/TournamentController");
const hashPasswordMiddleware = require("../middlewares/hashPassword");
const verifyAuth = require("../middlewares/verifyAuth");
const verifyAdmin = require('../middlewares/verifyAdmin');

module.exports = async function (fastify) {
  const userController = new UserController(fastify);
  const tournamentController = new TournamentController(fastify);
  
  // Routes d'authentification
  fastify.post("/login", {
    schema: {
      description: 'Connexion utilisateur',
      tags: ['Auth'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      },
      response: {
        200: { description: 'Connexion réussie' },
        401: { description: 'Identifiants invalides' }
      }
    }
  }, (req, reply) => userController.login(req, reply));

  fastify.post('/loginadmin', {
    preHandler: verifyAdmin,
    schema: {
      description: 'Connexion administrateur',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }]
    }
  }, (req, reply) => userController.loginAdmin(req, reply));

  fastify.post('/signup', {
    preHandler: hashPasswordMiddleware,
    schema: {
      description: 'Inscription utilisateur',
      tags: ['Auth'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
          club_id: { type: 'integer' }
        },
        required: ['email', 'password', 'name']
      }
    }
  }, (req, reply) => userController.signup(req, reply));

  fastify.get("/me", {
    preHandler: verifyAuth,
    schema: {
      description: 'Profil utilisateur connecté',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }]
    }
  }, (req, reply) => userController.getUserById(req, reply));

  fastify.post("/logout", {
    schema: {
      description: 'Déconnexion utilisateur',
      tags: ['Auth']
    }
  }, (req, reply) => userController.logout(req, reply));
  
  // Routes utilisateurs
  fastify.get("/users/:id/stats", {
    preHandler: verifyAuth,
    schema: {
      description: 'Statistiques d\'un utilisateur',
      tags: ['Utilisateurs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => userController.getUserStats(req, reply));

  fastify.delete("/users/:id/tournament-registration", {
    preHandler: verifyAuth,
    schema: {
      description: 'Annuler inscription à un tournoi',
      tags: ['Utilisateurs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => userController.cancelTournamentRegistration(req, reply));

  fastify.put("/users/:id", {
    preHandler: verifyAuth,
    schema: {
      description: 'Modifier profil utilisateur',
      tags: ['Utilisateurs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => userController.updateUserInfo(req, reply));

  fastify.get("/users/:id/matches", {
    preHandler: verifyAuth,
    schema: {
      description: 'Matchs d\'un utilisateur',
      tags: ['Utilisateurs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => userController.getUserMatches(req, reply));

  fastify.get("/users/:id", {
    preHandler: verifyAuth,
    schema: {
      description: 'Détails d\'un utilisateur',
      tags: ['Utilisateurs'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => userController.getUserDetailsById(req, reply));

  // Routes tournois
  fastify.get("/tournaments", {
    schema: {
      description: 'Liste de tous les tournois',
      tags: ['Tournois'],
      response: {
        200: {
          description: 'Liste des tournois',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              date: { type: 'string', format: 'date' },
              location: { type: 'string' },
              status: { type: 'string' }
            }
          }
        }
      }
    }
  }, (req, reply) => tournamentController.getAllTournaments(req, reply));

  fastify.get("/tournaments/:id", {
    schema: {
      description: 'Détails d\'un tournoi',
      tags: ['Tournois'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.getTournamentById(req, reply));

  fastify.get("/tournaments/:id/categories", {
    schema: {
      description: 'Catégories d\'un tournoi',
      tags: ['Tournois'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.getCategoriesByTournamentId(req, reply));

  fastify.post("/tournaments/:id/register", {
    preHandler: verifyAuth,
    schema: {
      description: 'S\'inscrire à un tournoi',
      tags: ['Tournois'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.registerForTournament(req, reply));

  fastify.get("/tournaments/:id/waiting-participants", {
    schema: {
      description: 'Participants en attente',
      tags: ['Tournois'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.getWaitingParticipants(req, reply));

  fastify.post("/tournaments/:id/close", {
    schema: {
      description: 'Clôturer un tournoi',
      tags: ['Tournois'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.closeTournament(req, reply));

  fastify.get("/clubs/:id/tournaments", {
    schema: {
      description: 'Tournois d\'un club',
      tags: ['Tournois'],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.getTournamentsByClubId(req, reply));

  fastify.put("/tournaments/:id/toggle-active", {
    preHandler: verifyAuth,
    schema: {
      description: 'Activer/désactiver un tournoi',
      tags: ['Tournois'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      }
    }
  }, (req, reply) => tournamentController.toggleTournamentActive(req, reply));

  // Routes administrateur
  fastify.get("/admin/users", {
    preHandler: verifyAuth,
    schema: {
      description: 'Liste des utilisateurs (admin)',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Liste des utilisateurs',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              email: { type: 'string' },
              name: { type: 'string' },
              club: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        401: { description: 'Non autorisé' },
        403: { description: 'Accès interdit (admin requis)' }
      }
    }
  }, (req, reply) => userController.getAllUsers(req, reply));
  
  // Routes de confirmation email - CORRIGÉES
  fastify.get("/email_confirmation", {
    schema: {
      description: 'Confirmer l\'email utilisateur',
      tags: ['Auth'],
      querystring: {
        type: 'object',
        properties: {
          token: { 
            type: 'string', 
            description: 'Token de confirmation reçu par email'
          }
        },
        required: ['token']
      },
      response: {
        200: {
          description: 'Email confirmé avec succès',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          description: 'Token invalide ou manquant',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Utilisateur non trouvé',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (req, reply) => { 
    return userController.confirmEmail(req, reply); 
  });

  fastify.post('/resend_confirmation_email', {
    preHandler: verifyAuth,
    schema: {
      description: 'Renvoyer l\'email de confirmation',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Email de confirmation renvoyé',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Non autorisé - Token manquant ou invalide',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        409: {
          description: 'Email déjà confirmé',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        429: {
          description: 'Trop de demandes',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, (req, reply) => { 
    return userController.resendConfirmationEmail(req, reply); 
  });
};