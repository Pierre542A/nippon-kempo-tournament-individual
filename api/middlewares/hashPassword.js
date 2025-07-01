// middlewares/hashPassword.js
const bcrypt = require('bcrypt');

async function hashPasswordMiddleware(req, reply) {
  try {
    // Vérifier si le mot de passe est présent dans le corps de la requête
    if (req.body.password || req.body.user_password) {
      // Récupérer le mot de passe quel que soit le champ utilisé
      const plainPassword = req.body.password || req.body.user_password;
      
      // Vérifier la longueur minimale du mot de passe (8 caractères)
      if (plainPassword.length < 8) {
        return reply.code(400).send({ 
          error: 'Le mot de passe doit contenir au moins 8 caractères' 
        });
      }
      
      // Si changement de mot de passe avec confirmation, vérifier que les 2 mots de passe correspondent
      if (req.body.confirm_password && plainPassword !== req.body.confirm_password) {
        return reply.code(400).send({ 
          error: 'Les mots de passe ne correspondent pas' 
        });
      }
      
      // Si le mot de passe n'est pas déjà hashé (ne commence pas par $2a$), le hasher
      if (!plainPassword.startsWith('$2a$')) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        
        // Mettre à jour le mot de passe dans le corps de la requête
        req.body.password = hashedPassword;
      }
    }
  } catch (error) {
    console.error('Erreur de hachage du mot de passe :', error);
    return reply.code(500).send({ error: 'Erreur interne du serveur' });
  }
}

module.exports = hashPasswordMiddleware;