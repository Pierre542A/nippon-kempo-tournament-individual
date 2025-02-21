// controllers/UserController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../middlewares/sendEmail");
const { checkPermission } = require("../middlewares/permissionHandler");

class UserController {
  constructor(fastify) {
    this.fastify = fastify;
    this.jwtSecret = fastify.jwtSecret;
    this.userService = fastify.userService;
  }

    
  async login(req, reply) {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email);  // Log de debug
  
      if (!email || !password) {
        return reply.status(400).send({
          error: "Adresse email et mot de passe obligatoires."
        });
      }

      console.log('Trying to get user from database...');
      const user = await this.userService.getUserByEmail(email);
      console.log('Database response:', user);
  
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.status(401).send({
          error: "Adresse email ou mot de passe incorrect."
        });
      }
  
      if (user.is_active === 0) {
        await this.userService.reactivateUser(user.id);
  
        const subject = "Votre compte Nippon Kempo Tournament est de retour ! ✨";
        const htmlContent = `
          <p>Bonjour ${user.first_name},<br><br>
          Bonne nouvelle ! Votre compte sur notre plateforme a été réactivé avec succès 🎉.<br><br>
          Vous pouvez dès à présent vous connecter et profiter pleinement de nos services !<br><br>
          Nous sommes ravis de vous retrouver parmi nous 🌟.<br><br>
          Cordialement,<br>
          Votre équipe Nippon Kempo Tournament.
          </p>
        `;
  
        await sendEmail(user.user_email, subject, htmlContent);
      }
  
      const token = jwt.sign(
        { id: user.id, role: user.role_id },
        this.jwtSecret,
        { expiresIn: "24h" }
      );
  
      reply.setCookie("auth_token", token, {
        httpOnly: true,     // Le cookie n'est pas accessible via JavaScript (sécurité)
        secure: false,       // Uniquement HTTPS
        sameSite: "lax",    // "strict" ou "lax"
        path: "/",
        maxAge: 24 * 60 * 60, // 24 heures
      });

      return reply.send({ 
        success: true,
        username: `${user.first_name} ${user.last_name}` // Ajout du username
      });
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno
      });
      return reply.status(500).send({
        error: "Une erreur interne est survenue. Veuillez réessayer plus tard."
      });
    }
  }

  //jusqu'a la c'est ok

  async confirmEmail(request, reply) {
    try {
      const { token } = request.query;
  
      if (!token) {
        return reply.redirect(`/login?error=${encodeURIComponent("Token manquant ou invalide.")}`);
      }
  
      let decoded;
      try {
        decoded = jwt.verify(token, this.jwtSecret);
      } catch (err) {
        return reply.redirect(`/login?error=${encodeURIComponent("Token invalide ou expiré.")}`);
      }
  
      const user = await this.userService.getUserById(decoded.user_id);
  
      if (!user) {
        return reply.redirect(`/login?error=${encodeURIComponent("Utilisateur introuvable.")}`);
      }
  
      let status;
      if (user.user_email_confirmed === 1) {
        status = 'already_confirmed';
      } else {
        await this.userService.confirmUserEmail(user.user_id);
        status = 'confirmed';
      }
  
      const authToken = jwt.sign(
        { user_id: user.user_id, role: user.user_role_id },
        this.jwtSecret,
        { expiresIn: "24h" }
      );
  
      reply.setCookie('auth_token', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge: 24 * 60 * 60
      });
  
      return reply.redirect(`/account?status=${status}`);
  
    } catch (error) {
      return reply.redirect(`/login?error=${encodeURIComponent("Une erreur est survenue.")}`);
    }
  }  

  async resendConfirmationEmail(req, reply) {
    try {
      const userId = req.user.user_id;
      const user = await this.userService.getUserById(userId);
  
      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé.' });
      }
  
      if (user.user_email_confirmed === 1) {
        return reply.status(400).send({ error: 'Votre email est déjà confirmé.' });
      }
  
      const emailConfirmationToken = jwt.sign(
        { user_id: userId },
        this.jwtSecret,
        { expiresIn: "1h" }
      );
  
      const confirmationUrl = `${process.env.APP_URL}/email_confirmation?token=${emailConfirmationToken}`;
      const subject = "Veuillez confirmer votre adresse email 🌱";
      const htmlContent = `
        <p>Bonjour ${user.user_first_name},<br><br>
        Vous avez demandé un nouvel envoi de l'email de confirmation.<br><br>
        Pour confirmer votre adresse email, veuillez cliquer sur le lien ci-dessous :<br><br>
        <a href="${confirmationUrl}" style="color: white; background-color: #4caf50; text-decoration: none; font-weight: bold; border-radius: 5px; padding: 10px;">Confirmer mon adresse email</a><br><br>
        Ce lien expirera dans 1 heure.<br><br>
        Cordialement,<br>
        Votre équipe Sensation CBD
        </p>
      `;
  
      await sendEmail(user.user_email, subject, htmlContent);
  
      return reply.send({ message: 'Email de confirmation renvoyé avec succès.' });
    } catch (error) {
      console.error("Error in resendConfirmationEmail:", error);
      return reply.status(500).send({ error: "Erreur lors de l'envoi de l'email de confirmation" });
    }
  }  

  async getUserById(req, reply) {
    try {
      const user = await this.userService.getUserById(req.user.user_id);

      if (!user) {
        return reply.status(404).send({
          error: "Utilisateur non trouvé"
        });
      }

      return reply.send({ user });
    } catch (error) {
      return reply.status(500).send({
        error: "Erreur lors de la récupération des informations utilisateur"
      });
    }
  }

  async updateUser(req, reply) {
    try {
      const { user_id: requestingUserId, role: userRole } = req.user;
      const targetUserId = req.params.id;

      const permissionResult = checkPermission(requestingUserId, targetUserId, userRole, reply);
      if (!permissionResult) return;

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

      const { user_id: requestingUserId, role: userRole } = req.user;
      const targetUserId = req.params.id;

      const permissionResult = checkPermission(requestingUserId, targetUserId, userRole, reply);
      if (!permissionResult) return;

      const result = await this.userService.deleteUser(
        targetUserId,
        req.body.user_breakage_cause_id
      );
      reply.send(result);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  }
}

module.exports = UserController;