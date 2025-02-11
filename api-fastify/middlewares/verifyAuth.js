const jwt = require("jsonwebtoken");

async function verifyAuth(req, reply) {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
    const wantsHtml = req.headers.accept?.includes("text/html");

    if (!token) {
      if (wantsHtml) {
        return reply.redirect("/login");
      }
      return reply.status(401).send({
        error: "Désolé, veuillez d'abord vous connecter.",
      });
    }

    const decoded = jwt.verify(token, req.server.jwtSecret);

    const [user] = await req.server.mysql.execute(
      `SELECT user_active FROM users WHERE user_id = ?`,
      [decoded.user_id]
    );

    if (!user[0] || user[0].user_active === 0) {
      if (wantsHtml) {
        return reply.redirect("/login");
      }
      return reply.status(403).send({
        error: "Votre compte est désactivé. Veuillez d'abord vous reconnecter afin de le réactiver.",
      });
    }

    req.user = decoded;

  } catch (error) {
    if (req.headers.accept?.includes("text/html")) {
      return reply.redirect("/login");
    }
    return reply.status(401).send({
      error: "Session invalide. Veuillez vous reconnecter.",
    });
  }
}

module.exports = verifyAuth;
