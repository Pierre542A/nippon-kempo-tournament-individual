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

      /* ─────── 1. Récupération utilisateur ─────── */
      const user = await this.userService.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.code(401).send({ error: 'Adresse email ou mot de passe incorrect.' });
      }

      /* ─────── 2. Ré‑activation éventuelle ─────── */
      if (!user.is_active) {
        await this.userService.reactivateUser(user.id);

        await sendEmail(
          user.email,
          'Votre compte Nippon Kempo Tournament est de retour ! ✨',
          `<p>Bonjour ${user.first_name},<br><br>
        Votre compte vient d'être ré‑activé.<br>
        Vous pouvez de nouveau vous connecter.<br><br>
        À bientôt !<br>Nippon Kempo Tournament</p>`
        );
      }

      /* ─────── 3. Génération du JWT ─────── */
      const token = jwt.sign(
        {
          id: user.id,
          role: user.id_role // Ajout du rôle dans le token
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      reply.setCookie('auth_token_nippon', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60
      });


      /* ─────── 4. Réponse attendue par le front ─────── */
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

      reply.setCookie('auth_token_nippon', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60
      })

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
      sameSite: 'lax',
      secure: false
    });
    return reply.send({ success: true });
  }

  async signup(req, reply) {
    try {
      const userData = req.body;

      // Crée l'utilisateur avec le mdp déjà hashé par le middleware
      const newUser = await this.userService.createUser(userData);

      // Recherche de l'utilisateur complet pour obtenir id_role
      const user = await this.userService.getUserById(newUser.id);

      // Connecte automatiquement l'utilisateur après création
      const token = jwt.sign(
        { 
          id: newUser.id,
          role: user.id_role // Ajout du rôle dans le token 
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      reply.setCookie('auth_token_nippon', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
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
    } catch (error) {
      console.error('🛑 Signup error:', error);      // <-- log complet
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

      // Effectuer la mise à jour
      await this.userService.updateUserInfo(userId, updateData);
      
      return reply.send({
        success: true,
        message: "Information utilisateur mise à jour avec succès"
      });
    } catch (error) {
      console.error('Erreur updateUserInfo:', error);
      return reply.code(500).send({ error: "Erreur interne serveur" });
    }
  }

  //jusqu'a la c'est ok

  async updateUser(req, reply) {
    try {
      const targetUserId = req.params.id;

      // Vérifier que l'utilisateur est admin ou agit sur son propre compte
      if (targetUserId != req.user.id && req.user.role !== 1) {
        return reply.code(403).send({ error: "Non autorisé" });
      }

      const targetUser = await this.userService.getUserById(targetUserId);
      if (!targetUser) {
        return reply.status(404).send({ error: "Utilisateur non trouvé" });
      }

      // On crée une copie des données pour ne pas modifier l'original
      const updateData = { ...req.body };

      // Si changement de mot de passe
      if (updateData.user_password) {
        if (!updateData.current_password) {
          return reply.status(400).send({
            error: "Le mot de passe actuel est requis pour changer le mot de passe."
          });
        }

        const isValid = await bcrypt.compare(
          updateData.current_password,
          targetUser.user_password
        );

        if (!isValid) {
          return reply.status(400).send({ error: "Mot de passe actuel incorrect" });
        }

        // On supprime le current_password car ce n'est pas une colonne de la DB
        delete updateData.current_password;
      }

      // On effectue la mise à jour avant d'envoyer les notifications
      const result = await this.userService.updateUser(targetUserId, updateData);

      // Gestion des notifications après la mise à jour réussie
      const emailChange = updateData.user_email && updateData.user_email !== targetUser.user_email;
      const notificationEmail = emailChange ? updateData.user_email : targetUser.user_email;

      // Si le mot de passe a été changé, envoi de la notification
      if (updateData.user_password) {
        const pwdSubject = "Votre mot de passe a été modifié";
        const pwdContent = `
        <p>Bonjour ${targetUser.user_first_name},<br><br>
        Votre mot de passe a été modifié avec succès.<br><br>
        Si vous n'êtes pas à l'origine de ce changement, veuillez réinitialiser votre mot de passe immédiatement.<br><br>
        Cordialement,<br>
        Votre équipe Sensation CBD
        </p>`;

        await sendEmail(notificationEmail, pwdSubject, pwdContent);
      }

      // Si l'email a été changé, envoi du mail de confirmation
      if (emailChange) {
        const emailConfirmationToken = jwt.sign(
          { user_id: targetUserId },
          this.jwtSecret,
          { expiresIn: "1h" }
        );

        const confirmationUrl = `${process.env.APP_URL}/email_confirmation?token=${emailConfirmationToken}`;
        const emailSubject = "Veuillez confirmer votre nouvelle adresse email 🌱";
        const emailContent = `
        <p>Bonjour ${targetUser.user_first_name},<br><br>
        Vous avez récemment modifié votre adresse email. Pour confirmer cette modification, veuillez cliquer sur le lien ci-dessous :<br><br>
        <a href="${confirmationUrl}" style="color: white; background-color: #4caf50; text-decoration: none; font-weight: bold; border-radius: 5px; padding: 10px;">Confirmer mon adresse email</a><br><br>
        <i>(Pour votre sécurité, ce lien expirera dans 1 heure.)</i><br><br>
        Si vous n'êtes pas à l'origine de cette demande, veuillez nous contacter immédiatement.<br><br>
        Cordialement,<br>
        Votre équipe Sensation CBD
        </p>`;

        await sendEmail(notificationEmail, emailSubject, emailContent);
      }

      reply.send(result);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  }

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