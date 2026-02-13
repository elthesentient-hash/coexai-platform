# PLUTUS Trading Bot - Docker Image
FROM node:18-alpine

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy bot code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Environment variables (override at runtime)
ENV NODE_ENV=production

# Run the bot
CMD ["npm", "start"]
