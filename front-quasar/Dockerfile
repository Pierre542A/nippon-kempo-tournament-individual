# front-quasar/Dockerfile

FROM node:18

WORKDIR /app

# Install Quasar CLI globally
RUN npm install -g @quasar/cli

EXPOSE 8080

# We’ll override this in docker-compose with a custom command, but it’s fine as a default.
CMD ["quasar", "dev", "--hostname", "0.0.0.0"]
