# front-quasar/Dockerfile

FROM node:18

WORKDIR /app

# Install Quasar CLI globally
RUN npm install -g @quasar/cli

RUN npm config set loglevel error
RUN npm config set fund false
RUN npm config set update-notifier false

EXPOSE 8080

# We’ll override this in docker-compose with a custom command, but it’s fine as a default.
CMD ["quasar", "dev", "--hostname", "0.0.0.0"]
