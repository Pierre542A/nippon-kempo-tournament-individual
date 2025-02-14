FROM node:18

WORKDIR /app

# Installation de Quasar CLI
RUN npm install -g @quasar/cli

# Exposer le port
EXPOSE 8080

# Commande de démarrage avec l'attente explicite de l'installation des dépendances
ENTRYPOINT ["sh", "-c", "npm install && quasar dev -o"]