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

fastify.get('/', async (req, reply) => {
  reply.send({ message: 'API is running' });
});

const cors = require("@fastify/cors");
const cookie = require("@fastify/cookie");

let isReady = false;

// Fonction utilitaire pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction de connexion MySQL avec retry
const connectToMySQL = async (maxRetries = 10, delay = 5000) => {
  let dbConfig;

  // Prioriser MYSQL_URL si disponible (production)
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
    console.log(`[MySQL] Connexion via MYSQL_URL (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
  } 
  // Fallback sur les variables individuelles (local/Docker)
  else if (process.env.MYSQLHOST) {
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
      // Pas de SSL pour le local/Docker
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };
    console.log(`[MySQL] Connexion via variables individuelles (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
  } 
  else {
    throw new Error("Aucune configuration MySQL trouvée. Veuillez définir MYSQL_URL ou les variables MYSQLHOST, MYSQLUSER, etc.");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MySQL] Tentative de connexion ${attempt}/${maxRetries}...`);
      const pool = await mysql.createPool(dbConfig);
      await pool.query("SELECT 1");
      console.log("✅ Connexion MySQL OK");
      return pool;
    } catch (error) {
      console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Impossible de se connecter à MySQL après ${maxRetries} tentatives`);
      }
      
      console.log(`⏳ Nouvelle tentative dans ${delay/1000}s...`);
      await sleep(delay);
    }
  }
};

const init = async () => {
  if (isReady) return;

  // CORS - Détection automatique de l'environnement
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = isProduction 
    ? ['https://nippon-kempo-tournament-individual.onrender.com']
    : ['http://localhost:8080'];

  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // MySQL avec retry
  try {
    const pool = await connectToMySQL();
    fastify.decorate("mysql", pool);
  } catch (error) {
    console.error("❌ Connexion MySQL définitivement échouée:", error.message);
    throw error;
  }

  // Cookies & JWT
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: isProduction,  // true en production, false en local
      sameSite: isProduction ? 'none' : 'lax',  // Cross-domain en prod, lax en local
      path: '/'
    }
  });

  fastify.decorate("jwtSecret", process.env.JWT_SECRET || "default-jwt-secret-change-in-production");

  // Swagger
  await fastify.register(require('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Tournament API',
        description: 'API pour la gestion des tournois de Nippon Kempo',
        version: '1.0.0'
      },
      host: isProduction ? 'nippon-kempo-tournament-individual.onrender.com' : 'localhost:3000',
      schemes: [isProduction ? 'https' : 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });

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