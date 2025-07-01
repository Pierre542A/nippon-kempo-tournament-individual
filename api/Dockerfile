# Utiliser une image Node.js officielle
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app/api

# Copier le fichier package.json et package-lock.json dans le conteneur
COPY package*.json ./

# Installer les dépendances (cela inclut Fastify, Bcrypt, MySQL, etc.)
RUN npm install

# Copier le reste de l'application
COPY . .

# Exposer le port sur lequel Fastify va écouter
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]
