// routes/userRoutes.js
const UserController = require("../controllers/UserController");
const hashPasswordMiddleware = require("../middlewares/hashPassword");
const verifyRecaptcha = require("../middlewares/verifyRecaptcha");
const verifyAuth = require("../middlewares/verifyAuth");

module.exports = async function (fastify) {
  const userController = new UserController(fastify);
  const recaptchaSecret = process.env.RECAPTCHA_SECRET;

  fastify.post("/login", (req, reply) => userController.login(req, reply));

  //jusqu'a la c'est ok

  fastify.post("/users", { preHandler: [hashPasswordMiddleware, verifyRecaptcha(recaptchaSecret)] }, (req, reply) => userController.createUser(req, reply));
  fastify.post("/logout", async (_req, reply) => { reply.clearCookie("auth_token", { path: "/", httpOnly: true, sameSite: 'strict' }); return reply.redirect("/login"); });
  fastify.put("/users/:id", { preHandler: [verifyAuth, hashPasswordMiddleware] }, (req, reply) => userController.updateUser(req, reply));
  fastify.delete( "/users/:id", { preHandler: verifyAuth, schema: { body: { type: 'object', required: ['user_breakage_cause_id'], properties: { user_breakage_cause_id: { type: 'number' }, }, }, }, }, (req, reply) => userController.deleteUser(req, reply));
  fastify.get("/me", { preHandler: verifyAuth }, (req, reply) => userController.getUserById(req, reply));
  fastify.get("/email_confirmation", async (req, reply) => { return userController.confirmEmail(req, reply); });
  fastify.post('/resend_confirmation_email', { preHandler: verifyAuth }, (req, reply) => { return userController.resendConfirmationEmail(req, reply); });
};
