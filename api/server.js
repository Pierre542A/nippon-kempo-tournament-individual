const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

// Import services et contrôleurs
const UserService = require("./services/userService");
const TournamentService = require("./services/TournamentService");
const PasswordResetService = require("./services/PasswordResetService");
const PasswordResetController = require("./controllers/PasswordResetController");
const MatchService = require("./services/MatchService");

// Import middlewares & routes
const rateLimit = require("./middlewares/rateLimit");
const userRoutes = require("./routes/userRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const clubRoutes = require("./routes/clubRoutes");
const passwordResetRoutes = require("./routes/passwordReset");
const importRoutes = require("./routes/importRoutes");

const cors = require("@fastify/cors");
const cookie = require("@fastify/cookie");

let isReady = false;

const init = async () => {
  if (isReady) return;

  // CORS - Configuration pour Render
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // MySQL - Utilise les variables d'environnement
  const dbConfig = {
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  try {
    const pool = await mysql.createPool(dbConfig);

    // Test de connexion
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ Connexion MySQL établie avec succès");

    fastify.decorate("mysql", pool);
  } catch (error) {
    console.error("❌ Erreur de connexion MySQL:", error);
    throw error;
  }

  // Cookies & JWT
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || "default-secret-change-in-production",
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    }
  });

  fastify.decorate("jwtSecret", process.env.JWT_SECRET || "default-jwt-secret-change-in-production");

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

  // Route health check
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  });

  // Routes principales
  fastify.register(userRoutes);
  fastify.register(gradeRoutes);
  fastify.register(clubRoutes);
  fastify.register(passwordResetRoutes);
  fastify.register(importRoutes);

  isReady = true;
};

// === DÉMARRAGE CLASSIQUE POUR RENDER ===
init().then(() => {
  const PORT = process.env.PORT || 3000;
  fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`✅ Fastify server ready on ${address}`);
  });
});
