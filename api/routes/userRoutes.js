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
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, (req, reply) => userController.login(req, reply));

  fastify.post('/loginadmin', {
    schema: {
      tags: ['Auth']
    },
    preHandler: verifyAdmin
  }, (req, reply) => userController.loginAdmin(req, reply));

  fastify.post('/signup', {
    schema: {
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name', 'birth_date'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          birth_date: { type: 'string' },
          phone: { type: 'string' },
          nationality: { type: 'string' },
          weight: { type: 'integer' },
          id_grade: { type: 'integer' },
          id_gender: { type: 'integer' },
          id_club: { type: 'integer' }
        }
      }
    },
    preHandler: hashPasswordMiddleware
  }, (req, reply) => userController.signup(req, reply));

  fastify.get("/me", {
    schema: {
      tags: ['Users']
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.getUserById(req, reply));

  fastify.post("/logout", {
    schema: {
      tags: ['Auth']
    }
  }, (req, reply) => userController.logout(req, reply));
  
  // Routes utilisateurs
  fastify.get("/users/:id/stats", {
    schema: {
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.getUserStats(req, reply));

  fastify.delete("/users/:id/tournament-registration", {
    schema: {
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.cancelTournamentRegistration(req, reply));

  fastify.put("/users/:id", {
    schema: {
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          phone: { type: 'string' },
          nationality: { type: 'string' },
          weight: { type: 'integer' },
          id_grade: { type: 'integer' },
          id_gender: { type: 'integer' },
          id_club: { type: 'integer' },
          password: { type: 'string' },
          current_password: { type: 'string' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.updateUserInfo(req, reply));

  fastify.get("/users/:id/matches", {
    schema: {
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.getUserMatches(req, reply));

  fastify.get("/users/:id", {
    schema: {
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.getUserDetailsById(req, reply));

  // Routes tournois
  fastify.get("/tournaments", {
    schema: {
      tags: ['Tournaments']
    }
  }, (req, reply) => tournamentController.getAllTournaments(req, reply));

  fastify.get("/tournaments/:id", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, (req, reply) => tournamentController.getTournamentById(req, reply));

  fastify.get("/tournaments/:id/categories", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, (req, reply) => tournamentController.getCategoriesByTournamentId(req, reply));

  fastify.post("/tournaments/:id/register", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => tournamentController.registerForTournament(req, reply));

  fastify.get("/tournaments/:id/waiting-participants", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, (req, reply) => tournamentController.getWaitingParticipants(req, reply));

  fastify.post("/tournaments/:id/close", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, (req, reply) => tournamentController.closeTournament(req, reply));

  fastify.get("/clubs/:id/tournaments", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    }
  }, (req, reply) => tournamentController.getTournamentsByClubId(req, reply));

  fastify.put("/tournaments/:id/toggle-active", {
    schema: {
      tags: ['Tournaments'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      }
    },
    preHandler: verifyAuth
  }, (req, reply) => tournamentController.toggleTournamentActive(req, reply));

  // Routes administrateur
  fastify.get("/admin/users", {
    schema: {
      tags: ['Admin']
    },
    preHandler: verifyAuth
  }, (req, reply) => userController.getAllUsers(req, reply));
  
  fastify.get("/email_confirmation", {
    schema: {
      tags: ['Auth'],
      querystring: {
        type: 'object',
        properties: {
          token: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    return userController.confirmEmail(req, reply);
  });

  fastify.post('/resend_confirmation_email', {
    schema: {
      tags: ['Auth']
    },
    preHandler: verifyAuth
  }, (req, reply) => {
    return userController.resendConfirmationEmail(req, reply);
  });
};