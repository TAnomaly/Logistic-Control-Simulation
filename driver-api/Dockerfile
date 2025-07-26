# Development stage
FROM node:18-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY shared ./shared
COPY . .
COPY .env .env

# Production stage
FROM node:18-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY shared ./shared
COPY . .
RUN npm run build

CMD ["node", "dist/src/main.js"] 