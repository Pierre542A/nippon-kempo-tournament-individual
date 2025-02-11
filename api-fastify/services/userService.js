// services/UserService.js
class UserService {
  constructor(fastify) {
    this.mysql = fastify.mysql;
  }

  async createUser(data) {
    if (!data.user_last_name ||
        !data.user_first_name ||
        !data.user_age ||
        !data.user_sex ||
        !data.user_email ||
        !data.user_password) {
      throw new Error("Tous les champs sont obligatoires.");
    }

    let userAge = parseInt(data.user_age, 10);
    if (isNaN(userAge)) {
      throw new Error("L'âge doit être un nombre");
    }
    if (userAge < 18) {
      throw new Error("Vous devez avoir au moins 18 ans");
    }
    if (userAge > 150) {
      throw new Error(`Félicitations pour vos ${userAge} ans, carrément ! Mais peut-être qu'il y a eu une petite erreur de saisie ?`);
    }

    const validSexValues = ["M", "F", "Other"];
    if (!validSexValues.includes(data.user_sex)) {
      throw new Error("Le sexe doit être 'M', 'F', ou 'Other'.");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.user_email)) {
      throw new Error("L'adresse email n'est pas valide.");
    }

    const [existingUsers] = await this.mysql.execute(
      "SELECT user_id FROM users WHERE user_email = ?",
      [data.user_email]
    );
    if (existingUsers.length > 0) {
      throw new Error("L'adresse email est déjà utilisée.");
    }

    try {
      const insertData = {
        user_last_name: data.user_last_name,
        user_first_name: data.user_first_name,
        user_age: data.user_age,
        user_sex: data.user_sex,
        user_email: data.user_email,
        user_password: data.user_password,
        user_email_confirmed: 0,
        user_newsletter: data.user_newsletter ?? 0,
        user_role_id: 5,
        user_active: 1,
        user_source_traffic_id: data.user_source_traffic_id || null,
      };

      const fields = Object.keys(insertData).join(", ");
      const placeholders = Object.keys(insertData).map(() => "?").join(", ");
      const values = Object.values(insertData);

      const [result] = await this.mysql.execute(
        `INSERT INTO users (${fields}) VALUES (${placeholders})`,
        values
      );

      return {
        message: "Utilisateur créé avec succès.",
        userId: result.insertId,
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'insertion en base de données: ${error.message}`);
    }
  }

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

  async reactivateUser(user_id) {
    const [result] = await this.mysql.execute(
      `UPDATE users SET user_active = 1 WHERE user_id = ?`,
      [user_id]
    );
    return result;
  }  

  async getUserByEmail(email) {
    try {
      const [rows] = await this.mysql.execute(
        `SELECT 
          user_id,
          user_password,
          user_email,
          user_active,
          user_first_name,
          user_role_id
        FROM users 
        WHERE user_email = ?`,
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'utilisateur par email: ${error.message}`);
    }
  }

  async getUserById(user_id) {
    try {
      const [rows] = await this.mysql.execute(
        `SELECT 
          user_id,
          user_first_name,
          user_last_name,
          user_age,
          user_sex,
          user_email,
          user_email_confirmed,
          user_newsletter,
          user_role_id,
          user_password,
          user_active  
        FROM users 
        WHERE user_id = ?`,
        [user_id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'utilisateur par ID: ${error.message}`);
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