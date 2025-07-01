// middlewares/verifyAuth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware pour vérifier l'authentification de l'utilisateur
 */
module.exports = async function verifyAuth(req, reply) {
  try {
    // Récupérer le token depuis les cookies
    const token = req.cookies.auth_token_nippon;
    
    if (!token) {
      return reply.code(401).send({ error: 'Non authentifié' });
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, this.jwtSecret);
    
    // Attacher les informations de l'utilisateur à la requête
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    // Continuer vers la route
    return;
  } catch (error) {
    // En cas d'erreur de vérification du token
    console.error('Erreur d\'authentification:', error);
    return reply.code(401).send({ error: 'Token invalide ou expiré' });
  }
};