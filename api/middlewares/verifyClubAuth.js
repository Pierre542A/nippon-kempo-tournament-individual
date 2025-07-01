async function verifyAuth(req, reply) {
  try {
    // Vérifier si un token est présent dans les cookies
    const token = req.cookies.auth_token_nippon;
    
    if (!token) {
      return reply.code(401).send({ error: 'Authentification requise' });
    }
    
    try {
      // Vérifier et décoder le token JWT en utilisant les propriétés de fastify
      const decoded = req.server.jwt.verify(token, req.server.jwtSecret);
      
      // Ajouter les informations utilisateur à la requête
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
    } catch (err) {
      console.error('Erreur JWT:', err);
      return reply.code(401).send({ error: 'Session invalide ou expirée' });
    }
    
  } catch (err) {
    console.error('Erreur verifyAuth:', err);
    return reply.code(500).send({ error: 'Erreur interne du serveur' });
  }
}

module.exports = verifyAuth;