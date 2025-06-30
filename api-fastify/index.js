// api/index.js
const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

// Import CORS
const cors = require("@fastify/cors");

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
const cookie = require("@fastify/cookie");

let isReady = false;

const init = async () => {
  if (isReady) return;

  // Configuration CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Permettre toutes les origines Vercel et localhost pour le développement
      const allowedOrigins = [
        /^https:\/\/.*\.vercel\.app$/,  // Toutes les URLs Vercel
        /^http:\/\/localhost:\d+$/,     // Localhost avec n'importe quel port
        /^http:\/\/127\.0\.0\.1:\d+$/   // 127.0.0.1 avec n'importe quel port
      ];
      
      // Si pas d'origine (requête directe), on autorise
      if (!origin) return cb(null, true);
      
      // Vérifier si l'origine correspond à un pattern autorisé
      const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
      
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Important pour les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
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
    parseOptions: {
      httpOnly: true,
      secure: false, // HTTPS en production
      sameSite: 'none', // 'none' pour cross-origin en prod
      path: '/'
    }
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

  // Route de santé pour vérifier que l'API fonctionne
  fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  isReady = true;
};

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    await init();
    await fastify.ready();
    
    // Pour les requêtes OPTIONS (preflight), répondre rapidement
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.end();
      return;
    }
    
    fastify.server.emit("request", req, res);
  } catch (err) {
    console.error("Fastify error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Internal Server Error", message: err.message }));
  }
};