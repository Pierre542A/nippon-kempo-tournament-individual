// routes/userRoutes.js
const UserController = require("../controllers/UserController");
const hashPasswordMiddleware = require("../middlewares/hashPassword");
const verifyAuth = require("../middlewares/verifyAuth");

module.exports = async function (fastify) {
  const userController = new UserController(fastify);

  fastify.post("/login", (req, reply) => userController.login(req, reply));
  fastify.post('/signup', { preHandler: hashPasswordMiddleware }, (req, reply) => userController.signup(req, reply));
  fastify.get("/me", { preHandler: verifyAuth }, (req, reply) => userController.getUserById(req, reply));
  fastify.post("/logout", (req, reply) => userController.logout(req, reply));

  //jusqu'a la c'est ok
   
  fastify.get("/email_confirmation", async (req, reply) => { return userController.confirmEmail(req, reply); });
  fastify.post('/resend_confirmation_email', { preHandler: verifyAuth }, (req, reply) => { return userController.resendConfirmationEmail(req, reply); });
};
