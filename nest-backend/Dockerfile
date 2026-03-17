FROM node:20

WORKDIR /app

# Install build tools just in case native modules need compiling
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Run in production mode
CMD ["npm", "run", "start:prod"]
