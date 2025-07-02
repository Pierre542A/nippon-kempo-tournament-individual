// controllers/UserController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../middlewares/sendEmail");

class UserController {
  constructor(fastify) {
    this.fastify = fastify;
    this.jwtSecret = fastify.jwtSecret;
    this.userService = fastify.userService;
  }

  // controllers/UserController.js
  async login(req, reply) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Adresse email et mot de passe obligatoires.' });
      }

      // Récupération utilisateur
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return reply.code(401).send({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      // Vérification si compte actif
      if (!user.is_active) {
        return reply.code(403).send({
          error: 'Compte supprimé ou désactivé. Connexion impossible, contactez l\'administrateur.'
        });
      }

      // Vérification du mot de passe
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return reply.code(401).send({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      // Génération du JWT
      const token = jwt.sign(
        {
          id: user.id,
          role: user.id_role
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Configuration du cookie
      reply.setCookie('auth_token_nippon', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // ✅ Dynamique
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // ✅ Cross-domain en prod
        path: '/',
        maxAge: 24 * 60 * 60
      });

      // Réponse
      return reply.send({
        success: true,
        user: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      });

    } catch (err) {
      console.error('Login error:', err);
      return reply.code(500).send({ error: 'Erreur interne.' });
    }
  }

  async loginAdmin(req, reply) {
    try {
      const user = req.userFromDb // injecté par verifyAdminLogin

      const token = jwt.sign({
        id: user.id,
        role: user.id_role // Ajout du rôle dans le token
      }, this.jwtSecret, { expiresIn: '24h' })

      // Dans login(), signup(), et loginAdmin()
      reply.setCookie('auth_token_nippon', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // ✅ Dynamique
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // ✅ Cross-domain en prod
        path: '/',
        maxAge: 24 * 60 * 60
      });

      return reply.send({
        success: true,
        user: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      })
    } catch (err) {
      console.error('Erreur login admin :', err)
      return reply.code(500).send({ error: 'Erreur serveur.' })
    }
  }

  async getUserById(req, reply) {
    try {
      const user = await this.userService.getUserById(req.user.id);
      if (!user) return reply.status(404).send({ error: "Utilisateur non trouvé" });

      // Récupérer les statistiques de l'utilisateur
      const stats = await this.userService.getUserStats(user.id);

      delete user.password; // pour sécurité
      reply.send({ user, stats });
    } catch (error) {
      console.error('Erreur getUserById:', error);
      reply.status(500).send({ error: "Erreur interne serveur." });
    }
  }

  async getUserDetailsById(req, reply) {
    try {
      const userId = req.params.id;

      // Vérifiez si l'utilisateur est admin ou demande ses propres informations
      if (userId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        return reply.code(404).send({ error: "Utilisateur non trouvé" });
      }

      // Supprimer le mot de passe pour des raisons de sécurité
      delete user.password;

      return reply.send({ user });
    } catch (error) {
      console.error('Erreur getUserDetailsById:', error);
      return reply.code(500).send({ error: "Erreur interne du serveur" });
    }
  }

  async getUserStats(req, reply) {
    try {
      const userId = req.params.id || req.user.id;

      // Vérifier que l'utilisateur agit sur son propre compte ou est admin
      if (userId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      // Vérifier si l'utilisateur existe
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return reply.status(404).send({ error: "Utilisateur non trouvé" });
      }

      const stats = await this.userService.getUserStats(userId);
      reply.send({ stats });
    } catch (error) {
      console.error('Erreur getUserStats :', error);
      reply.status(500).send({ error: "Erreur interne serveur." });
    }
  }

  logout(_req, reply) {
    reply.clearCookie('auth_token_nippon', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // ✅ Même config
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'  // ✅ Même config
    });
    return reply.send({ success: true });
  }

  async signup(req, reply) {
    try {
      const userData = req.body;

      // Vérifications supplémentaires (normalement gérées par le middleware hashPassword)
      if (!userData.password || userData.password.length < 8) {
        return reply.code(400).send({
          error: 'Le mot de passe doit contenir au moins 8 caractères.'
        });
      }

      // Formater la date de naissance pour n'avoir que la date (sans heure)
      if (userData.birth_date) {
        // Si la date contient une heure, la supprimer
        userData.birth_date = userData.birth_date.split(' ')[0];
      }

      // Crée l'utilisateur avec le mdp déjà hashé par le middleware
      try {
        const newUser = await this.userService.createUser(userData);

        // Recherche de l'utilisateur complet pour obtenir id_role
        const user = await this.userService.getUserById(newUser.id);

        // Connecte automatiquement l'utilisateur après création
        const token = jwt.sign(
          {
            id: newUser.id,
            role: user.id_role
          },
          this.jwtSecret,
          { expiresIn: '24h' }
        );

        // Dans login(), signup(), et loginAdmin()
        reply.setCookie('auth_token_nippon', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',  // ✅ Dynamique
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // ✅ Cross-domain en prod
          path: '/',
          maxAge: 24 * 60 * 60
        });

        // Réponse avec infos utilisateur nécessaires au front
        reply.send({
          success: true,
          user: {
            firstName: userData.first_name,
            lastName: userData.last_name,
          }
        });
      } catch (createError) {
        // Si l'erreur concerne un email déjà utilisé, on renvoie une erreur 400
        if (createError.message.includes('email est déjà utilisée')) {
          return reply.code(400).send({ error: createError.message });
        }
        // Sinon on remonte l'erreur
        throw createError;
      }
    } catch (error) {
      console.error('🛑 Signup error:', error.message);
      reply.status(500).send({ error: error.message });
    }
  }

  async cancelTournamentRegistration(req, reply) {
    try {
      const userId = req.params.id;

      // Vérifier que l'utilisateur agit sur son propre compte ou est admin
      if (userId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      // Vérifier que l'utilisateur a bien un tournoi en attente
      const user = await this.userService.getUserById(userId);
      if (!user || !user.id_tournament_waiting) {
        return reply.code(400).send({ error: "Aucune inscription en attente pour cet utilisateur" });
      }

      // Annuler l'inscription
      await this.userService.cancelTournamentRegistration(userId);

      return reply.send({
        success: true,
        message: "Désinscription effectuée avec succès"
      });
    } catch (error) {
      console.error('Erreur cancelTournamentRegistration:', error);
      return reply.code(500).send({ error: "Erreur interne serveur" });
    }
  }

  // Endpoint pour modifier les informations utilisateur (pour admin)
  async updateUserInfo(req, reply) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Vérifier que l'utilisateur est admin ou agit sur son propre compte
      if (userId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      // Vérifier si l'utilisateur existe
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return reply.code(404).send({ error: "Utilisateur non trouvé" });
      }

      // Vérification du mot de passe si modification demandée
      if (updateData.password && updateData.current_password) {
        const isPasswordValid = await bcrypt.compare(updateData.current_password, user.password);
        if (!isPasswordValid) {
          return reply.code(400).send({ error: "Mot de passe actuel incorrect" });
        }

        // Hasher le nouveau mot de passe
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);

        // Supprimer le mot de passe actuel des données à mettre à jour
        delete updateData.current_password;
        delete updateData.confirmPassword;
      }

      // Formater la date de naissance (si présente) pour n'avoir que la date (sans heure)
      if (updateData.birth_date) {
        // Si la date contient une heure, la supprimer
        updateData.birth_date = updateData.birth_date.split(' ')[0];
      }

      try {
        // Effectuer la mise à jour
        const result = await this.userService.updateUserInfo(userId, updateData);
        
        return reply.send({
          success: true,
          message: "Information utilisateur mise à jour avec succès"
        });
      } catch (updateError) {
        // Log de l'erreur pour debug
        console.error('Erreur spécifique updateUserInfo:', updateError);

        if (updateError.message.includes('email est déjà utilisée')) {
          return reply.code(409).send({ error: updateError.message });
        }

        throw updateError;
      }
    } catch (error) {
      console.error('Erreur générale updateUserInfo:', error);
      return reply.code(500).send({
        error: error.message || "Erreur interne serveur"
      });
    }
  }

  // Ajouter dans la classe UserController
  async getUserMatches(req, reply) {
    try {
      const userId = req.params.id;

      // Vérifier que l'utilisateur est admin ou agit sur son propre compte
      if (userId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      // Vérifier si l'utilisateur existe
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return reply.code(404).send({ error: "Utilisateur non trouvé" });
      }

      // Utiliser le service de matches pour récupérer les données
      const matchService = this.fastify.matchService;
      const matches = await matchService.getMatchesByUserId(userId);

      return reply.send(matches);
    } catch (error) {
      console.error('Erreur getUserMatches:', error);
      return reply.code(500).send({ error: "Erreur interne serveur" });
    }
  }

  //jusqu'a la c'est ok

  async deleteUser(req, reply) {
    try {
      if (!req.body.user_breakage_cause_id) {
        return reply.status(400).send({
          error: "La raison de la suppression est obligatoire."
        });
      }

      const targetUserId = req.params.id;

      // Vérifier que l'utilisateur est admin ou agit sur son propre compte
      if (targetUserId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      const result = await this.userService.deleteUser(
        targetUserId,
        req.body.user_breakage_cause_id
      );
      reply.send(result);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  }

  // Méthode pour que les admins puissent récupérer la liste des utilisateurs
  async getAllUsers(req, reply) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé - Accès réservé aux administrateurs" });
      }

      const users = await this.userService.getAllUsers();
      reply.send({ users });
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      reply.status(500).send({ error: "Erreur interne serveur" });
    }
  }
}

module.exports = UserController;