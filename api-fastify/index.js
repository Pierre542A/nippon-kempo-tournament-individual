const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

// Import services et contrôleurs
const UserService = require("../services/userService");
const TournamentService = require("../services/TournamentService");
const PasswordResetService = require("../services/PasswordResetService");
const PasswordResetController = require("../controllers/PasswordResetController");
const MatchService = require("../services/MatchService");

// Import middlewares & routes
const rateLimit = require("../middlewares/rateLimit");
const userRoutes = require("../routes/userRoutes");
const gradeRoutes = require("../routes/gradeRoutes");
const clubRoutes = require("../routes/clubRoutes");
const passwordResetRoutes = require("../routes/passwordReset");
const importRoutes = require("../routes/importRoutes");

const cors = require("@fastify/cors");
const cookie = require("@fastify/cookie");

let isReady = false;

const init = async () => {
  if (isReady) return;

  // CORS
  await fastify.register(cors, {
    origin: ["http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  // MySQL
  const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 25,
    waitForConnections: true,
    queueLimit: 50,
    connectTimeout: 2000
  };

  const pool = await mysql.createPool(dbConfig);
  fastify.decorate("mysql", pool);

  // Cookies & JWT
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {}
  });
  fastify.decorate("jwtSecret", process.env.JWT_SECRET);

  // Rate limiter
  fastify.addHook("onRequest", rateLimit);

  // Services
  const userServiceInstance = new UserService(fastify);
  const tournamentServiceInstance = new TournamentService(fastify);
  const passwordResetServiceInstance = new PasswordResetService(fastify);
  const passwordResetControllerInstance = new PasswordResetController(fastify);
  const matchServiceInstance = new MatchService(fastify);

  fastify.decorate("userService", userServiceInstance);
  fastify.decorate("tournamentService", tournamentServiceInstance);
  fastify.decorate("passwordResetService", passwordResetServiceInstance);
  fastify.decorate("passwordResetController", passwordResetControllerInstance);
  fastify.decorate("matchService", matchServiceInstance);

  await passwordResetServiceInstance.initialize();

  // Routes
  fastify.register(userRoutes);
  fastify.register(gradeRoutes);
  fastify.register(clubRoutes);
  fastify.register(passwordResetRoutes);
  fastify.register(importRoutes);

  isReady = true;
};

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    await init();
    await fastify.ready();
    fastify.server.emit("request", req, res);
  } catch (err) {
    console.error("Fastify error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
};
