const fastify = require("fastify")({ logger: true });
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();
require('events').EventEmitter.defaultMaxListeners = 15;

fastify.register(require("@fastify/cors"), {
  origin: "*", // ou "http://localhost:8080" ou autre
  methods: ["GET", "POST", "OPTIONS"],
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

fastify.register(require("@fastify/cookie"), {
 secret: process.env.COOKIE_SECRET || 'a-secret-with-at-least-32-characters',
 parseOptions: {} 
});

fastify.register(require('@fastify/static'), {
 root: path.join(__dirname, '../frontend/public'),
 prefix: '/',
 setHeaders: (res, _path) => {
   if (_path.endsWith('.css') || _path.endsWith('.jpg') || _path.endsWith('.png')) {
     res.setHeader('Cache-Control', 'public, max-age=31536000');
   } else if (_path.endsWith('.html')) {
     res.setHeader('Cache-Control', 'no-store');
   }
 }
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

   fastify.register(userRoutes);

   await fastify.listen({ port: 3000, host: "0.0.0.0" });
   fastify.log.info(`Server is running at http://localhost:3000`);
 } catch (err) {
   fastify.log.error("Server startup error:", err);
   process.exit(1);
 }
};

const cleanup = async (signal) => {
 fastify.log.info(`${signal} signal received. Closing server gracefully...`);
 if (fastify.mysql) await fastify.mysql.end();
 await fastify.close();
 process.exit(0);
};

process.on("SIGTERM", () => cleanup("SIGTERM"));
process.on("SIGINT", () => cleanup("SIGINT"));

start();