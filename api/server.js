const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

// Services & contrôleurs
const UserService = require("./services/userService");
const TournamentService = require("./services/TournamentService");
const PasswordResetService = require("./services/PasswordResetService");
const PasswordResetController = require("./controllers/PasswordResetController");
const MatchService = require("./services/MatchService");

// Middlewares & routes
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

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // MySQL
  try {
    let dbConfig;

    if (process.env.MYSQL_URL) {
      const url = new URL(process.env.MYSQL_URL);
      dbConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 120000,
        ssl: { rejectUnauthorized: false },
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      };
      console.log(`[MySQL] Connexion via URL (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
    } else {
      dbConfig = {
        host: process.env.MYSQLHOST,
        port: parseInt(process.env.MYSQLPORT) || 3306,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 120000,
        ssl: { rejectUnauthorized: false },
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      };
      console.log(`[MySQL] Connexion via variables (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
    }

    const pool = await mysql.createPool(dbConfig);
    // Test simple, une seule fois
    await pool.query("SELECT 1");
    console.log("✅ Connexion MySQL OK");
    fastify.decorate("mysql", pool);
  } catch (error) {
    console.error("❌ Connexion MySQL échouée:", error.message);
    throw error;
  }

  // Cookies & JWT
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
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
  fastify.decorate("userService", new UserService(fastify));
  fastify.decorate("tournamentService", new TournamentService(fastify));
  fastify.decorate("passwordResetService", new PasswordResetService(fastify));
  fastify.decorate("passwordResetController", new PasswordResetController(fastify));
  fastify.decorate("matchService", new MatchService(fastify));

  await fastify.passwordResetService.initialize();

  // Routes principales
  fastify.register(userRoutes);
  fastify.register(gradeRoutes);
  fastify.register(clubRoutes);
  fastify.register(passwordResetRoutes);
  fastify.register(importRoutes);

  isReady = true;
};

// Dev local
if (require.main === module) {
  const start = async () => {
    try {
      await init();
      const PORT = process.env.PORT || 3000;
      await fastify.listen({
        port: PORT,
        host: "0.0.0.0"
      });
      fastify.log.info(`Serveur démarré sur le port ${PORT}`);
    } catch (err) {
      fastify.log.error("Server startup error:", err);
      process.exit(1);
    }
  };
  start();
}

// Export pour tests ou autres usages
module.exports = { fastify, init };
