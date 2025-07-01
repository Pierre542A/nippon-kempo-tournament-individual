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

  // CORS - Configuration pour Vercel
  await fastify.register(cors, {
    origin: true, // Accepte toutes les origines en production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // MySQL - Utilise les variables d'environnement
  const dbConfig = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
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

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    // Gestion spéciale pour les requêtes OPTIONS (preflight CORS)
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.end();
      return;
    }

    await init();
    await fastify.ready();
    
    // Ajouter les headers CORS à toutes les réponses
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    fastify.server.emit("request", req, res);
  } catch (err) {
    console.error("Fastify error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }));
  }
};