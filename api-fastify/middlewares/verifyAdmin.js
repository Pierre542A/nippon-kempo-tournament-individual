// middlewares/verifyAdmin.js
const bcrypt = require('bcrypt') 

module.exports = async function verifyAdminLogin(req, reply) { 
  const { email, password } = req.body 

  if (!email || !password) { 
    return reply.code(400).send({ error: 'Email et mot de passe requis.' }) 
  } 

  const user = await req.server.userService.getUserByEmail(email) 
  const isValid = user && await bcrypt.compare(password, user.password) 

  if (!isValid) { 
    return reply.code(401).send({ error: 'Identifiants incorrects.' }) 
  } 

  if (![1, 2].includes(user.id_role)) { 
    return reply.code(403).send({ error: 'Accès interdit au back-office.' }) 
  } 

  // attach user to req for reuse in loginAdmin 
  req.userFromDb = user 
  
  // Ne rien retourner pour continuer l'exécution dans Fastify
  // Avec Fastify, aucun retour = continue
}