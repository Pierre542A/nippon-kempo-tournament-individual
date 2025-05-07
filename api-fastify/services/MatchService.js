// services/MatchService.js
class MatchService {
    constructor(fastify) {
      this.mysql = fastify.mysql;
    }
  
    async getMatchesByUserId(userId) {
      try {
        const [rows] = await this.mysql.execute(
          `SELECT 
            m.id,
            t.name AS tournament_name,
            t.start_date,
            t.end_date,
            NULL AS placement, -- Utiliser NULL comme valeur par défaut
            CASE 
              WHEN m.id_users_white = ? THEN CONCAT(u_red.first_name, ' ', u_red.last_name)
              ELSE CONCAT(u_white.first_name, ' ', u_white.last_name)
            END AS opponent_name,
            CASE 
              WHEN m.id_users_white = ? THEN m.ippon_white
              ELSE m.ippon_red
            END AS ippon,
            CASE 
              WHEN m.id_users_white = ? THEN m.keikoku_white
              ELSE m.keikoku_red
            END AS keikoku
          FROM matchs m
          JOIN tournaments t ON m.id_tournament = t.id
          JOIN users u_white ON m.id_users_white = u_white.id
          JOIN users u_red ON m.id_users_red = u_red.id
          WHERE ? IN (m.id_users_white, m.id_users_red)
          ORDER BY t.start_date DESC`,
          [userId, userId, userId, userId]
        );
        
        return { matches: rows };
      } catch (error) {
        console.error('Erreur SQL getMatchesByUserId:', error);
        throw new Error(`Erreur lors de la récupération des matches: ${error.message}`);
      }
    }
  }
  
  module.exports = MatchService;