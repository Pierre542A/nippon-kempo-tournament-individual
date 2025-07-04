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

  // 🆕 SWAGGER CONFIGURATION avec gestion d'erreur
  try {
    console.log("📚 Configuration de Swagger...");
    
    await fastify.register(require('@fastify/swagger'), {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Nippon Kempo Tournament API',
          description: 'API de gestion des tournois de Nippon Kempo',
          version: '1.0.0'
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Serveur de développement'
          },
          {
            url: 'https://nippon-kempo-tournament-individualcube3.onrender.com',
            description: 'Serveur de production'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Token JWT pour authentification'
            }
          }
        },
        tags: [
          { name: 'System', description: 'Endpoints système' },
          { name: 'Auth', description: 'Authentification' },
          { name: 'Clubs', description: 'Gestion des clubs' },
          { name: 'Tournois', description: 'Gestion des tournois' },
          { name: 'Grades', description: 'Gestion des grades' },
          { name: 'Import', description: 'Import de données' },
          { name: 'Reset Password', description: 'Réinitialisation mot de passe' }
        ]
      }
    });

    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      },
      staticCSP: true,
      transformSpecificationClone: true
    });
    
    console.log("✅ Swagger configuré avec succès");
  } catch (swaggerError) {
    console.warn("⚠️ Erreur Swagger:", swaggerError.message);
    console.log("🔄 API démarrée sans documentation Swagger");
  }

  fastify.decorate("jwtSecret", process.env.JWT_SECRET || "default-jwt-secret-change-in-production");

  // Health check endpoint (simple, sans schema complexe pour éviter les erreurs)
  fastify.get('/health', async (request, reply) => {
    try {
      await fastify.mysql.query('SELECT 1');
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.0.0'
      };
    } catch (error) {
      reply.status(500);
      return { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      };
    }
  });

  // Route d'accueil simple
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Bienvenue sur l\'API Nippon Kempo Tournament',
      documentation: '/docs',
      health: '/health',
      version: '1.0.0'
    };
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

  // Routes principales avec gestion d'erreur
  try {
    console.log("📡 Enregistrement des routes...");
    
    await fastify.register(userRoutes);
    console.log("✅ Routes utilisateurs enregistrées");
    
    await fastify.register(gradeRoutes);
    console.log("✅ Routes grades enregistrées");
    
    await fastify.register(clubRoutes);
    console.log("✅ Routes clubs enregistrées");
    
    await fastify.register(passwordResetRoutes);
    console.log("✅ Routes reset password enregistrées");
    
    await fastify.register(importRoutes);
    console.log("✅ Routes import enregistrées");
    
  } catch (routeError) {
    console.error("❌ Erreur lors de l'enregistrement des routes:", routeError.message);
    console.error("Stack:", routeError.stack);
    throw routeError;
  }

  isReady = true;
  console.log("🎉 Initialisation terminée avec succès");
};

// Dev local
if (require.main === module) {
  const start = async () => {
    try {
      console.log("🚀 Démarrage du serveur...");
      await init();
      const PORT = process.env.PORT || 3000;
      await fastify.listen({
        port: PORT,
        host: "0.0.0.0"
      });
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      console.log(`📚 Documentation Swagger: http://localhost:${PORT}/docs`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    } catch (err) {
      console.error("❌ Erreur de démarrage détaillée:", err.message);
      console.error("❌ Stack trace:", err.stack);
      
      // Informations de debug supplémentaires
      if (err.code) console.error("❌ Code d'erreur:", err.code);
      if (err.statusCode) console.error("❌ Status code:", err.statusCode);
      
      process.exit(1);
    }
  };
  start();
}

// Export pour tests ou autres usages
module.exports = { fastify, init };