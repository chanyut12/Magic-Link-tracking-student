FROM node:20

WORKDIR /app

# Install Quasar CLI globally
RUN npm install -g @quasar/cli

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

# Expose port and start
EXPOSE 9001

# Run in development mode, ensuring host is 0.0.0.0
CMD ["quasar", "dev", "-p", "9001", "-H", "0.0.0.0"]
