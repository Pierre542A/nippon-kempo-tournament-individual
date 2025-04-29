// middlewares/verifyAuth.js
const jwt = require("jsonwebtoken");

async function verifyAuth(req, reply) {
  try {
    const token = req.cookies?.auth_token_nippon || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return reply.status(401).send({ error: "Non autorisé (token manquant)." });
    }

    const decoded = jwt.verify(token, req.server.jwtSecret);

    const [user] = await req.server.mysql.execute(
      `SELECT is_active FROM users WHERE id = ?`, 
      [decoded.id]
    );

    if (!user[0] || !user[0].is_active) {
      return reply.status(403).send({
        error: "Compte désactivé, veuillez vous reconnecter."
      });
    }

    req.user = { user_id: decoded.id };

  } catch (error) {
    return reply.status(401).send({ error: "Session invalide ou expirée." });
  }
}

module.exports = verifyAuth;
