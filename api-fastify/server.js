const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

fastify.register(require("@fastify/cors"), {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
});

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

const rateLimit = require("./middlewares/rateLimit");
const userRoutes = require("./routes/userRoutes");
const UserService = require("./services/userService");
const TournamentService = require("./services/TournamentService"); // <-- Ajoutez cette ligne

fastify.register(require("@fastify/cookie"), {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {} 
});

fastify.decorate("jwtSecret", process.env.JWT_SECRET);
fastify.addHook("onRequest", rateLimit);

const setupDBConnection = () => {
  const pool = mysql.createPool(dbConfig);
  
  pool.on('connection', () => {
    fastify.log.info("New database connection established");
  });

  pool.on('error', (err) => {
    fastify.log.error("Database connection error:", err);
    setTimeout(() => setupDBConnection(), 3000);
  });

  return pool;
};

const start = async () => {
  try {
    const pool = await setupDBConnection();
    fastify.decorate("mysql", pool);

    const userServiceInstance = new UserService(fastify);
    fastify.decorate("userService", userServiceInstance);

    const tournamentServiceInstance = new TournamentService(fastify); // <-- Ajoutez cette ligne
    fastify.decorate("tournamentService", tournamentServiceInstance); // <-- Ajoutez cette ligne

    fastify.register(userRoutes);

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error("Server startup error:", err);
    process.exit(1);
  }
};

const cleanup = async () => {
  if (fastify.mysql) await fastify.mysql.end();
  await fastify.close();
  process.exit(0);
};

process.on("SIGTERM", () => cleanup("SIGTERM"));
process.on("SIGINT", () => cleanup("SIGINT"));

start();