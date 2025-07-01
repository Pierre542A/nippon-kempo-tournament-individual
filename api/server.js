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
    origin: true, // Accepte toutes les origines en production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // MySQL - Configuration pour Railway avec SSL et optimisations
  try {
    let pool;
    
    if (process.env.MYSQL_URL) {
      console.log("🔗 Connexion MySQL via URL complète");
      
      // Parse l'URL pour extraire les composants
      const url = new URL(process.env.MYSQL_URL);
      
      const dbConfig = {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Enlève le '/' initial
        
        // Configuration optimisée pour Railway
        connectionLimit: 5, // Réduit pour éviter trop de connexions
        waitForConnections: true,
        queueLimit: 0,
        connectTimeout: 120000, // 2 minutes pour Railway
        
        // Configuration SSL importante pour Railway
        ssl: {
          rejectUnauthorized: false // Railway utilise des certificats auto-signés
        },
        
        // Options de reconnexion
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      };
      
      pool = await mysql.createPool(dbConfig);
    } else {
      throw new Error("MYSQL_URL non définie");
    }
    
    // Test de connexion avec retry
    let retries = 3;
    while (retries > 0) {
      try {
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

// Export pour les tests ou autres usages
module.exports = { fastify, init };