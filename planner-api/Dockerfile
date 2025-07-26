# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies and keep only production
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"] 