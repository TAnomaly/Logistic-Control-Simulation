# Multi-stage build için Node.js base image
FROM node:18-alpine AS builder

# İş dizinini ayarla
WORKDIR /app

# Package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Tüm bağımlılıkları yükle (build için gerekli)
RUN npm ci --force && npm cache clean --force

# Kaynak kodunu kopyala
COPY . .

# TypeScript'i JavaScript'e derle
RUN npm run build

# Production bağımlılıklarını yükle
RUN npm ci --omit=dev --force && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Güvenlik için non-root user oluştur
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# İş dizinini ayarla
WORKDIR /app

# Builder stage'den gerekli dosyaları kopyala
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Port bilgisini belirle
EXPOSE 3000

# User'ı değiştir
USER nestjs

# Health check ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/shipments/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Uygulamayı başlat
CMD ["node", "dist/main"] 