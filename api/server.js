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

  // CORS - Configuration pour Vercel/Render
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // LOG DEBUG ENV VARS POUR MYSQL
  console.log("=== ENV Render → Variables MySQL ===");
  console.log("MYSQL_URL:", process.env.MYSQL_URL);
  console.log("MYSQLHOST:", process.env.MYSQLHOST);
  console.log("MYSQLUSER:", process.env.MYSQLUSER);
  console.log("MYSQLPASSWORD:", process.env.MYSQLPASSWORD ? "***" : undefined);
  console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE);
  console.log("MYSQLPORT:", process.env.MYSQLPORT);
  console.log("====================================");

  // MySQL - Configuration Railway avec SSL & logs debug
  try {
    let pool;
    if (process.env.MYSQL_URL) {
      console.log("🔗 Connexion MySQL via URL complète");
      const url = new URL(process.env.MYSQL_URL);

      // LOG DE LA CONFIG VRAIMENT UTILISÉE
      console.log("[CONF] Host:", url.hostname);
      console.log("[CONF] Port:", url.port);
      console.log("[CONF] User:", url.username);
      console.log("[CONF] Database:", url.pathname.slice(1));

      const dbConfig = {
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

      pool = await mysql.createPool(dbConfig);
    } else {
      console.log("🔗 Connexion MySQL via variables manuelles");
      const dbConfig = {
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
      console.log("[CONF]", dbConfig);
      pool = await mysql.createPool(dbConfig);
    }

    // Test de connexion avec retry et logs explicites
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🟡 Test de connexion MySQL... (tentative ${4 - retries}/3)`);
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log("✅ Connexion MySQL établie avec succès");
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⚠️ Tentative de connexion échouée, ${retries} essais restants...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

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

  // Routes de test
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

// Pour le développement local
if (require.main === module) {
  const start = async () => {
    try {
      await init();
      const PORT = process.env.PORT || 3000;
      await fastify.listen({
        port: PORT,
        host: "0.0.0.0" // Important pour Render
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
