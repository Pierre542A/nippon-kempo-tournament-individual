// services/UserService.js
class UserService {
  constructor(fastify) {
    this.mysql = fastify.mysql;
  }

  async getUserByEmail(email) {
    try {
      const [rows] = await this.mysql.execute(
        `SELECT 
          id,
          created_at,
          id_grade,
          id_role,
          id_gender,
          first_name,
          last_name,
          birth_date,
          weight,
          nationality,
          id_club,
          id_tournament_waiting,
          email,
          phone,
          password,
          is_active
        FROM users 
        WHERE email = ?`,
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'utilisateur par email: ${error.message}`);
    }
  }

  async reactivateUser(userId) {
    const [result] = await this.mysql.execute(
      `UPDATE users SET is_active = 1 WHERE id = ?`,
      [userId]
    );
    return result;
  }

  async getUserById(user_id) {
    try {
      const [rows] = await this.mysql.execute(
        `
        SELECT
          u.id,
          u.created_at,
          u.id_grade,
          g.name   AS grade_name,
          u.id_role,
          u.id_gender,
          u.first_name,
          u.last_name,
          u.birth_date,
          u.weight,
          u.nationality,
          u.id_club,
          c.name   AS club_name,
          u.id_tournament_waiting,
          u.email,
          u.phone,
          u.password,
          u.is_active
        FROM users u
        LEFT JOIN grades g ON u.id_grade = g.id
        LEFT JOIN clubs  c ON u.id_club   = c.id
        WHERE u.id = ?
        `,
        [user_id]
      );
      return rows[0];
    } catch (error) {
      console.error('Erreur SQL getUserById :', error);
      throw new Error(`Erreur lors de la récupération de l'utilisateur par ID: ${error.message}`);
    }
  }

  async getUserStats(userId) {
    try {
      const [rows] = await this.mysql.execute(
        `SELECT
          COUNT(DISTINCT id_tournament) AS totalTournaments,
          COUNT(*) AS matches,
          SUM(id_winner = ?) AS victories,
          SUM(id_winner IS NOT NULL AND id_winner <> ?) AS defeats,
          SUM(CASE WHEN id_users_white = ? THEN ippon_white
                ELSE ippon_red END) AS ippon,
          SUM(CASE WHEN id_users_white = ? THEN keikoku_white
                ELSE keikoku_red END) AS keiKoku
        FROM matchs
        WHERE ? IN (id_users_white, id_users_red)`,
        [userId, userId, userId, userId, userId]
      );
      
      // Transformer les valeurs NULL en 0
      const stats = rows[0];
      for (const key in stats) {
        if (stats[key] === null) {
          stats[key] = 0;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Erreur SQL getUserStats :', error);
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      const [existingUser] = await this.mysql.execute(
        `SELECT id FROM users WHERE email = ?`,
        [userData.email]
      );
  
      if (existingUser.length > 0) {
        throw new Error("Cette adresse email est déjà utilisée.");
      }
  
      const [result] = await this.mysql.execute(
        `INSERT INTO users
          (first_name, last_name, email, password, birth_date, weight, phone, nationality, id_gender, id_role, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 3, NOW(), 1)`,
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          userData.user_password,
          userData.birth_date,
          userData.weight,
          userData.phone || '',
          userData.nationality,
          userData.id_gender
        ]
      );
  
      return { id: result.insertId };
    } catch (error) {
      throw new Error('Erreur création utilisateur : ' + error.message);
    }
  }

  async cancelTournamentRegistration(userId) {
    try {
      const [result] = await this.mysql.execute(
        `UPDATE users
         SET id_tournament_waiting = NULL
         WHERE id = ?`,
        [userId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error("Utilisateur non trouvé");
      }
      
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de l'annulation de l'inscription: ${error.message}`);
    }
  }

  async getAllUsers() {
    try {
      const [rows] = await this.mysql.execute(
        `SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.birth_date,
          u.weight,
          u.nationality,
          u.id_grade,
          g.name AS grade_name,
          u.id_role,
          r.name AS role_name,
          u.id_club,
          c.name AS club_name,
          u.id_tournament_waiting,
          u.is_active,
          u.created_at
        FROM users u
        LEFT JOIN grades g ON u.id_grade = g.id
        LEFT JOIN roles r ON u.id_role = r.id
        LEFT JOIN clubs c ON u.id_club = c.id
        ORDER BY u.id`
      );
      
      // Supprimer les mots de passe pour sécurité
      rows.forEach(user => {
        delete user.password;
      });
      
      return rows;
    } catch (error) {
      console.error('Erreur SQL getAllUsers:', error);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }
  
  // Méthode pour mettre à jour les informations d'un utilisateur (utilisée par les admins)
  async updateUserInfo(userId, updateData) {
    try {
      // Vérifier que l'utilisateur existe
      const [userExists] = await this.mysql.execute(
        `SELECT id FROM users WHERE id = ?`,
        [userId]
      );
      
      if (userExists.length === 0) {
        throw new Error("Utilisateur non trouvé");
      }
      
      // Filtrer les champs autorisés
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 
        'birth_date', 'weight', 'nationality', 
        'id_grade', 'id_club', 'id_role', 'is_active', 'id_tournament_waiting'
      ];
      
      const filteredData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      
      // S'il n'y a pas de champs à mettre à jour, retourner
      if (Object.keys(filteredData).length === 0) {
        return { message: "Aucune modification à effectuer" };
      }
      
      // Construire la requête de mise à jour
      const setClause = Object.keys(filteredData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(filteredData), userId];
      
      const [result] = await this.mysql.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        throw new Error("La mise à jour a échoué");
      }
      
      return { 
        success: true,
        message: "Utilisateur mis à jour avec succès",
        updatedFields: Object.keys(filteredData)
      };
    } catch (error) {
      console.error('Erreur SQL updateUserInfo:', error);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    }
  }
  
  //jusqu'a la c'est ok

  async confirmUserEmail(user_id) {
    try {
      const [result] = await this.mysql.execute(
        `UPDATE users 
         SET user_email_confirmed = 1 
         WHERE user_id = ?`,
        [user_id]
      );
      return result;
    } catch (error) {
      throw new Error(`Erreur lors de la confirmation de l'email: ${error.message}`);
    }
  }  

  async updateUser(user_id, data) {
    try {
      const [existingUser] = await this.mysql.execute(
        `SELECT user_id, user_email FROM users WHERE user_id = ?`,
        [user_id]
      );
  
      if (existingUser.length === 0) {
        throw new Error("Utilisateur non trouvé");
      }
  
      const sanitizedData = { ...data };
      const protectedFields = [
        "user_role_id",
        "user_active",
        "user_breakage_cause_id",
        "user_break_date_time",
        "user_email_confirmed",
        "user_id"
      ];
  
      protectedFields.forEach((field) => {
        delete sanitizedData[field];
      });
  
      if (sanitizedData.user_age !== undefined) {
        let userAge = parseInt(sanitizedData.user_age, 10);
        if (isNaN(userAge)) {
          throw new Error("L'âge doit être un nombre");
        }
        if (userAge < 18) {
          throw new Error("Vous devez avoir au moins 18 ans");
        }
        if (userAge > 150) {
          throw new Error(`Félicitations pour vos ${userAge} ans, carrément ! Mais peut-être qu'il y a eu une petite erreur de saisie ?`);
        }
        sanitizedData.user_age = userAge;
      }
  
      if (sanitizedData.user_sex !== undefined) {
        const validSexValues = ["M", "F", "Other"];
        if (!validSexValues.includes(sanitizedData.user_sex)) {
          throw new Error("Le sexe doit être 'M', 'F', ou 'Other'.");
        }
      }
  
      if (sanitizedData.user_email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(sanitizedData.user_email)) {
          throw new Error("L'adresse email n'est pas valide.");
        }
  
        const [emailUser] = await this.mysql.execute(
          `SELECT user_id FROM users WHERE user_email = ? AND user_id != ?`,
          [sanitizedData.user_email, user_id]
        );
  
        if (emailUser.length > 0) {
          throw new Error("Cette adresse email est déjà utilisée par un autre utilisateur.");
        }
  
        if (sanitizedData.user_email !== existingUser[0].user_email) {
          sanitizedData.user_email_confirmed = 0;
        }
      }
  
      if (sanitizedData.user_newsletter !== undefined) {
        sanitizedData.user_newsletter = sanitizedData.user_newsletter ? 1 : 0;
      }
  
      // Mise à jour en base
      const updateQuery = Object.keys(sanitizedData)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(sanitizedData);
  
      const [result] = await this.mysql.execute(
        `UPDATE users SET ${updateQuery} WHERE user_id = ?`,
        [...values, user_id]
      );
  
      if (result.affectedRows === 0) {
        throw new Error("La mise à jour a échoué");
      }
  
      return {
        message: "Utilisateur mis à jour avec succès",
      };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    }
  }

  async deleteUser(user_id, breakageCauseId) {
    try {
      const [user] = await this.mysql.execute(
        `SELECT user_active FROM users WHERE user_id = ?`,
        [user_id]
      );

      if (!user[0]) {
        throw new Error("Utilisateur non trouvé");
      }

      if (user[0].user_active === 0) {
        return { message: "Utilisateur déjà supprimé" };
      }

      const [breakageCause] = await this.mysql.execute(
        `SELECT cause_id FROM user_breakage_causes WHERE cause_id = ?`,
        [breakageCauseId]
      );

      if (!breakageCause[0]) {
        throw new Error("Raison de suppression invalide");
      }

      const [result] = await this.mysql.execute(
        `UPDATE users 
         SET user_active = 0,
             user_breakage_cause_id = ?,
             user_break_date_time = NOW()
         WHERE user_id = ?`,
        [breakageCauseId, user_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Échec de la mise à jour de l'utilisateur");
      }

      return {
        message: "Utilisateur supprimé avec succès",
      };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    }
  }
}

module.exports = UserService;