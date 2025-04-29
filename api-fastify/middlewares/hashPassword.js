const bcrypt = require("bcrypt");

const hashPasswordMiddleware = async (request, reply) => {
  if (request.body && request.body.user_password) {
    const password = request.body.user_password;

    const minLength = 8;
    const saltRounds = 12;
    const noSpacesOrInvisible = /^\S+$/;

    if (password.length < minLength) {
      reply.status(400).send({
        error: `Le mot de passe doit contenir au moins ${minLength} caractères.`,
      });
      return;
    }

    if (!noSpacesOrInvisible.test(password)) {
      reply.status(400).send({
        error:
          "Le mot de passe ne doit pas contenir d'espaces ou de caractères invisibles.",
      });
      return;
    }
    
    request.body.user_password = await bcrypt.hash(password, saltRounds);
  }
};

module.exports = hashPasswordMiddleware;
