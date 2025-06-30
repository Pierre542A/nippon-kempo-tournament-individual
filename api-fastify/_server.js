const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

// Importation des services et contrôleurs
const UserService = require("./services/userService");
const TournamentService = require("./services/TournamentService");
const PasswordResetService = require("./services/PasswordResetService");
const PasswordResetController = require("./controllers/PasswordResetController");
const MatchService = require('./services/MatchService');

// Importation des routes
const rateLimit = require("./middlewares/rateLimit");
const userRoutes = require("./routes/userRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const clubRoutes = require("./routes/clubRoutes");
const passwordResetRoutes = require("./routes/passwordReset");
const importRoutes = require("./routes/importRoutes");

// Configuration CORS
fastify.register(require("@fastify/cors"), {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Configuration de la base de données
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

// Configuration des cookies
fastify.register(require("@fastify/cookie"), {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {} 
});

// Décoration du JWT secret
fastify.decorate("jwtSecret", process.env.JWT_SECRET);

// Ajout du middleware de rate limiting
fastify.addHook("onRequest", rateLimit);

// Configuration de la connexion à la base de données avec retry
const setupDBConnection = async (maxRetries = 5, delay = 5000) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      fastify.log.info(`Tentative de connexion à la base de données (${attempts + 1}/${maxRetries})...`);
      
      const pool = mysql.createPool(dbConfig);
      
      // Test de connexion
      await pool.query('SELECT 1');
      
      fastify.log.info("Connexion à la base de données établie avec succès");
      
      pool.on('connection', () => {
        fastify.log.info("New database connection established");
      });
      
      pool.on('error', (err) => {
        fastify.log.error("Database connection error:", err);
      });
      
      return pool;
    } catch (err) {
      attempts++;
      fastify.log.error(`Erreur de connexion à la base de données: ${err.message}`);
      
      if (attempts >= maxRetries) {
        fastify.log.error("Nombre maximum de tentatives atteint. Abandon.");
        throw err;
      }
      
      fastify.log.info(`Nouvelle tentative dans ${delay/1000} secondes...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Fonction de démarrage du serveur
const start = async () => {
  try {
    // Initialisation de la connexion à la base de données avec retry
    const pool = await setupDBConnection();
    fastify.decorate("mysql", pool);

    // Initialisation des services
    const userServiceInstance = new UserService(fastify);
    fastify.decorate("userService", userServiceInstance);

    const tournamentServiceInstance = new TournamentService(fastify);
    fastify.decorate("tournamentService", tournamentServiceInstance);

    // Initialisation du service et du contrôleur pour la réinitialisation de mot de passe
    const passwordResetServiceInstance = new PasswordResetService(fastify);
    fastify.decorate("passwordResetService", passwordResetServiceInstance);
    
    const passwordResetControllerInstance = new PasswordResetController(fastify);
    fastify.decorate("passwordResetController", passwordResetControllerInstance);

    fastify.decorate('matchService', new MatchService(fastify));

    // Initialisation de la connexion pour le service de réinitialisation
    try {
      await passwordResetServiceInstance.initialize();
    } catch (error) {
      fastify.log.error("Erreur lors de l'initialisation du service", error);
    }

    // Enregistrement des routes
    fastify.register(userRoutes);
    fastify.register(gradeRoutes);
    fastify.register(clubRoutes);
    fastify.register(passwordResetRoutes);
    fastify.register(importRoutes);

    // Démarrage du serveur
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info("Serveur démarré sur le port 3000");
  } catch (err) {
    fastify.log.error("Server startup error:", err);
    process.exit(1);
  }
};

// Fonction de nettoyage lors de l'arrêt du serveur
const cleanup = async (signal) => {
  fastify.log.info(`Arrêt du serveur (${signal})...`);
  if (fastify.mysql) {
    fastify.log.info("Fermeture de la connexion à la base de données...");
    await fastify.mysql.end();
  }
  await fastify.close();
  process.exit(0);
};

// Gestion des signaux d'arrêt
process.on("SIGTERM", () => cleanup("SIGTERM"));
process.on("SIGINT", () => cleanup("SIGINT"));

// Démarrage du serveur
start();