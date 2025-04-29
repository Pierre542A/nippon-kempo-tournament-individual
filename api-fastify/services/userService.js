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
        WHERE id = ?`,
        [user_id]
      );
      return rows[0];
    } catch (error) {
      console.error('Erreur SQL getUserById :', error);
      throw new Error(`Erreur lors de la récupération de l'utilisateur par ID: ${error.message}`);
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