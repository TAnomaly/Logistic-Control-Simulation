# 🚀 Lojistik Kontrol Simülasyon Sistemi - Mimari ve İşleyiş Rehberi

## 📋 İçindekiler
- [Proje Özeti](#proje-özeti)
- [Teknoloji Stack'i](#teknoloji-stacki)
- [Mimari Yapı](#mimari-yapı)
- [Domain Driven Design (DDD)](#domain-driven-design-ddd)
- [CQRS Pattern](#cqrs-pattern)
- [Event Sourcing & Outbox Pattern](#event-sourcing--outbox-pattern)
- [Redis Kullanımı](#redis-kullanımı)
- [Veritabanı Tasarımı](#veritabanı-tasarımı)
- [API Endpoints](#api-endpoints)
- [Docker & Kubernetes](#docker--kubernetes)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Test Senaryoları](#test-senaryoları)

---

## 🎯 Proje Özeti

Bu proje, modern yazılım geliştirme pratikleri kullanılarak geliştirilmiş bir **Lojistik Kontrol Simülasyon Sistemi**'dir. Gerçek dünya lojistik operasyonlarını simüle eder ve şu temel özellikleri sunar:

- **Gönderi Yönetimi**: Paket oluşturma, takip ve durum güncelleme
- **Gate Kontrolü**: Lojistik merkezlerdeki kapı/geçiş noktası yönetimi
- **Takip Sistemi**: Real-time gönderi takibi ve olay kayıtları
- **Analytics Dashboard**: Operasyonel metriklerin izlenmesi
- **Event-Driven Architecture**: Mikro servis uyumlu event tabanlı yapı

---

## 🛠️ Teknoloji Stack'i

### **Backend Framework**
- **NestJS** (v10.x)
  - **Neden**: Enterprise-grade TypeScript framework
  - **Faydalar**: Dependency Injection, Modüler yapı, Decorator pattern
  - **Kullanım**: Ana uygulama framework'ü olarak

### **Veritabanı & ORM**
- **PostgreSQL** (v15)
  - **Neden**: ACID uyumlu, güçlü relational database
  - **Faydalar**: JSON support, performans, güvenilirlik
  - **Kullanım**: Ana veri depolama sistemi

- **TypeORM** (v0.3.x)
  - **Neden**: TypeScript native ORM
  - **Faydalar**: Type safety, migration support, decorator pattern
  - **Kullanım**: Database abstraction layer

### **Cache & Message Broker**
- **Redis** (v7.x)
  - **Neden**: In-memory data store, pub/sub capabilities
  - **Faydalar**: Yüksek performans cache, real-time messaging
  - **Kullanım**: Cache, session storage, pub/sub messaging

### **Containerization & Orchestration**
- **Docker** & **Docker Compose**
  - **Neden**: Konteyner tabanlı deployment
  - **Faydalar**: Environment consistency, kolay deployment
  - **Kullanım**: Local development ve production environment

- **Kubernetes**
  - **Neden**: Container orchestration
  - **Faydalar**: Scalability, high availability, service discovery
  - **Kullanım**: Production deployment ve scaling

---

## 🏗️ Mimari Yapı

### **Clean Architecture + Hexagonal Architecture**

```
src/
├── domain/                 # Domain Layer (Business Logic)
│   ├── entities/          # Domain Entities
│   ├── value-objects/     # Value Objects
│   ├── events/           # Domain Events
│   └── repositories/     # Repository Interfaces
├── application/           # Application Layer (Use Cases)
│   ├── commands/         # CQRS Commands
│   ├── queries/          # CQRS Queries
│   ├── handlers/         # Command/Query Handlers
│   └── events/           # Event Handlers
├── infrastructure/       # Infrastructure Layer
│   ├── database/         # Database Configuration
│   ├── repositories/     # Repository Implementations
│   ├── redis/           # Redis Services
│   └── outbox/          # Outbox Pattern Implementation
└── presentation/         # Presentation Layer
    ├── controllers/      # REST API Controllers  
    └── dtos/            # Data Transfer Objects
```

### **Katman Sorumlulukları**

1. **Domain Layer**: İş mantığı, domain kuralları
2. **Application Layer**: Use case'ler, orchestration
3. **Infrastructure Layer**: External services, database
4. **Presentation Layer**: API endpoints, HTTP handling

---

## 🎭 Domain Driven Design (DDD)

### **Ana Domain Entities**

#### **Shipment (Gönderi)**
```typescript
@Entity('shipments')
export class Shipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ unique: true })
    trackingNumber: string;
    
    // Gönderici-Alıcı bilgileri
    @Column() senderName: string;
    @Column() receiverName: string;
    
    // Fiziksel özellikler
    @Column('decimal') weight: number;
    @Column('decimal') length: number;
    
    // İş kuralları (Domain Methods)
    updateStatus(newStatus: ShipmentStatus): void {
        // Domain validation logic
    }
    
    calculateVolume(): number {
        return this.length * this.width * this.height;
    }
}
```

#### **Gate (Kapı)**  
```typescript
@Entity('gates')
export class Gate {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ unique: true })
    gateCode: string;
    
    @Column({ type: 'enum', enum: GateType })
    gateType: GateType;
    
    // İş kuralları
    canProcessShipment(shipment: Shipment): boolean {
        // Gate type'a göre shipment kabul kuralları
    }
}
```

### **Value Objects**
```typescript
export enum ShipmentStatus {
    CREATED = 'CREATED',
    IN_TRANSIT = 'IN_TRANSIT', 
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum GateType {
    ENTRY = 'ENTRY',
    EXIT = 'EXIT',
    SORTING = 'SORTING',
    LOADING = 'LOADING'
}
```

---

## ⚡ CQRS Pattern

### **Command-Query Responsibility Segregation**

#### **Commands (Write Operations)**
```typescript
// Gönderi oluşturma
export class CreateShipmentCommand {
    constructor(
        public readonly trackingNumber: string,
        public readonly senderName: string,
        public readonly receiverName: string,
        public readonly weight: number
    ) {}
}

@CommandHandler(CreateShipmentCommand)  
export class CreateShipmentHandler {
    async execute(command: CreateShipmentCommand): Promise<void> {
        // Business logic
        // Event publishing
    }
}
```

#### **Queries (Read Operations)**
```typescript
// Gönderi sorgulama
export class GetShipmentByTrackingQuery {
    constructor(public readonly trackingNumber: string) {}
}

@QueryHandler(GetShipmentByTrackingQuery)
export class GetShipmentByTrackingHandler {
    async execute(query: GetShipmentByTrackingQuery): Promise<Shipment> {
        // Cache-first strategy
        // Database fallback
    }
}
```

### **CQRS Faydaları**
- **Separation of Concerns**: Read/Write operasyonları ayrı
- **Scalability**: Read ve Write ayrı optimize edilebilir
- **Performance**: Cache stratejileri read-specific
- **Maintainability**: Domain logic daha net

---

## 📡 Event Sourcing & Outbox Pattern

### **Domain Events**
```typescript
export class ShipmentCreatedEvent implements IDomainEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly trackingNumber: string,
        public readonly occurredOn: Date = new Date()
    ) {}
}
```

### **Event Handlers**
```typescript
@EventsHandler(ShipmentCreatedEvent)
export class ShipmentCreatedEventHandler {
    async handle(event: ShipmentCreatedEvent): Promise<void> {
        // Outbox pattern ile reliable event publishing
        await this.outboxService.publishEvent(event);
        
        // Redis pub/sub ile real-time notifications
        await this.redisService.publish('shipment-updates', event);
        
        // Analytics güncelleme
        await this.analyticsService.recordShipmentCreated(event);
    }
}
```

### **Outbox Pattern**
```typescript
@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column() eventType: string;
    @Column('jsonb') eventData: any;
    @Column({ default: false }) published: boolean;
    
    // Retry logic
    @Column({ default: 0 }) retryCount: number;
}
```

**Outbox Pattern Faydaları:**
- **Transactional Safety**: Database ve event publishing atomik
- **Reliability**: Event publishing garantili
- **Retry Mechanism**: Failed event'ler için retry logic
- **Ordering**: Event sıralaması korunur

---

## 🔥 Redis Kullanımı

### **1. High-Performance Caching**
```typescript
@Cache(300, 'shipment') // 5 dakika TTL
async getShipmentByTracking(trackingNumber: string): Promise<Shipment> {
    // İlk çağrı: Database'den + Redis'e cache
    // Sonraki çağrılar: Redis'ten (çok hızlı!)
}
```

### **2. Real-time Pub/Sub Messaging**
```typescript
// Event publishing
await this.redisService.publish('shipment-updates', {
    trackingNumber: 'TRK001',
    status: 'IN_TRANSIT',
    location: 'Istanbul Hub'
});

// Real-time listening
await this.redisService.subscribe('shipment-updates', (data) => {
    // WebSocket ile frontend'e push
    this.websocketGateway.broadcastUpdate(data);
});
```

### **3. Session & Analytics Storage**
```typescript
// Session management
await this.redisService.hset('user:123', {
    userId: '123',
    role: 'operator',
    permissions: ['read', 'write']
});

// Analytics counters
await this.redisService.incr('daily:shipments:created');
await this.redisService.hincrby('gate:stats', 'G001', 1);
```

### **4. Queue Management**
```typescript
// Async job queue
await this.redisService.rpush('email-queue', {
    to: 'customer@example.com',
    template: 'shipment-created',
    data: { trackingNumber: 'TRK001' }
});

// Worker process
const job = await this.redisService.lpop('email-queue');
if (job) {
    await this.emailService.sendEmail(job);
}
```

---

## 🗄️ Veritabanı Tasarımı

### **Ana Tablolar**

#### **shipments**
```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR UNIQUE NOT NULL,
    sender_name VARCHAR NOT NULL,
    sender_address TEXT NOT NULL,
    receiver_name VARCHAR NOT NULL, 
    receiver_address TEXT NOT NULL,
    status shipment_status DEFAULT 'CREATED',
    weight DECIMAL(10,2) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) NOT NULL,
    height DECIMAL(10,2) NOT NULL,
    estimated_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **gates**
```sql
CREATE TABLE gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    gate_code VARCHAR UNIQUE NOT NULL,
    gate_type gate_type NOT NULL,
    location_name VARCHAR NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **tracking_events**
```sql
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id),
    gate_id UUID REFERENCES gates(id),
    event_type tracking_event_type NOT NULL,
    description TEXT,
    location VARCHAR,
    metadata JSONB,
    occurred_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **İndexler ve Performans**
```sql
-- Tracking number için unique index (çok sık kullanılır)
CREATE UNIQUE INDEX idx_shipments_tracking_number ON shipments(tracking_number);

-- Status bazlı sorgular için
CREATE INDEX idx_shipments_status ON shipments(status);

-- Tarih aralığı sorguları için
CREATE INDEX idx_tracking_events_occurred_at ON tracking_events(occurred_at);

-- Shipment'a ait events için
CREATE INDEX idx_tracking_events_shipment_id ON tracking_events(shipment_id);
```

---

## 🌐 API Endpoints

### **Shipment Management**
```http
POST   /api/shipments              # Yeni gönderi oluştur
GET    /api/shipments              # Tüm gönderileri listele  
GET    /api/shipments/tracking/:trackingNumber  # Tracking ile sorgula
PUT    /api/shipments/:id/status   # Durum güncelle
GET    /api/shipments/health       # Health check
```

### **Gate Management**
```http
POST   /api/gates                  # Yeni gate oluştur
GET    /api/gates                  # Tüm gate'leri listele
GET    /api/gates/:id              # Gate detayları
PUT    /api/gates/:id              # Gate güncelle
DELETE /api/gates/:id              # Gate sil
PUT    /api/gates/:id/toggle-status # Gate aktif/pasif
GET    /api/gates/:id/statistics   # Gate istatistikleri
```

### **Tracking Events**
```http
POST   /api/tracking-events        # Yeni event oluştur
GET    /api/tracking-events/shipment/:shipmentId    # Shipment eventleri
GET    /api/tracking-events/gate/:gateId            # Gate eventleri  
GET    /api/tracking-events/tracking/:trackingNumber # Tracking eventleri
GET    /api/tracking-events/today  # Günlük eventler
GET    /api/tracking-events/statistics # Event istatistikleri
```

### **Response Format**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "trackingNumber": "LCS-20250723-ABC123",
        "status": "IN_TRANSIT",
        "dimensions": {
            "length": "30.00", 
            "width": "20.00",
            "height": "10.00",
            "volume": 6000
        }
    },
    "message": "İşlem başarılı",
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 100,
        "totalPages": 10
    }
}
```

---

## 🐳 Docker & Kubernetes

### **Docker Compose (Development)**
```yaml
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: logistic_control
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Message Broker  
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # NestJS Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://postgres:password@postgres:5432/logistic_control?sslmode=disable
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: redis_password
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    restart: unless-stopped

  # pgAdmin (Database Management)
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@logistic.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "8080:80"
    depends_on:
      - postgres
```

### **Kubernetes Manifests**

#### **Namespace**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: logistic-control
  labels:
    name: logistic-control
```

#### **ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: logistic-config
  namespace: logistic-control
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "logistic_control"
  REDIS_HOST: "redis-service"  
  REDIS_PORT: "6379"
```

#### **Application Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logistic-api
  namespace: logistic-control
spec:
  replicas: 3
  selector:
    matchLabels:
      app: logistic-api
  template:
    metadata:
      labels:
        app: logistic-api
    spec:
      containers:
      - name: api
        image: logistic-control:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: logistic-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi" 
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/shipments/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/shipments/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 🚀 Kurulum ve Çalıştırma

### **Gereksinimler**
- Node.js v18+
- Docker & Docker Compose
- Git

### **Local Development**
```bash
# Repository clone
git clone https://github.com/your-username/logistic-control-simulation.git
cd logistic-control-simulation

# Dependencies yükle
npm install

# Infrastructure container'ları başlat
docker-compose up -d postgres redis pgadmin

# Environment variables ayarla
export DATABASE_URL="postgres://postgres:password@localhost:5432/logistic_control?sslmode=disable"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"  
export REDIS_PASSWORD="redis_password"

# Uygulamayı development mode'da başlat
npm run start:dev

# API'ye erişim
curl http://localhost:3000/api/shipments/health
```

### **Production Deployment**
```bash
# Kubernetes cluster'a deploy
kubectl apply -f k8s/

# Deployment durumunu kontrol et
kubectl get pods -n logistic-control

# Service'lere erişim
kubectl port-forward svc/logistic-api-service 3000:3000 -n logistic-control
```

### **Servis Erişim Adresleri**
- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:8080
- **API Documentation**: http://localhost:3000/api/docs (Swagger)

---

## 🧪 Test Senaryoları

### **Unit Tests**
```bash
# Tüm unit testleri çalıştır
npm run test

# Coverage raporu
npm run test:cov

# Watch mode
npm run test:watch
```

### **Integration Tests**
```bash
# E2E testler
npm run test:e2e

# Database integration tests
npm run test:db
```

### **API Test Scenarios**

#### **Gönderi Oluşturma ve Takip**
```bash
# 1. Yeni gönderi oluştur
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Ahmet Yılmaz",
    "senderAddress": "İstanbul, Türkiye", 
    "receiverName": "Mehmet Demir",
    "receiverAddress": "Ankara, Türkiye",
    "weight": 5.5,
    "length": 30,
    "width": 20,
    "height": 10
  }'

# Response: {"success":true,"data":{"trackingNumber":"LCS-20250723-ABC123"}}

# 2. Tracking number ile sorgula
curl -X GET "http://localhost:3000/api/shipments/tracking/LCS-20250723-ABC123"

# 3. Tüm gönderileri listele
curl -X GET "http://localhost:3000/api/shipments?page=1&limit=10"
```

#### **Gate Yönetimi**
```bash
# 1. Yeni gate oluştur
curl -X POST http://localhost:3000/api/gates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Giriş Kapısı",
    "gateCode": "G001", 
    "gateType": "ENTRY",
    "locationName": "Depo 1 - Kuzey",
    "address": "İstanbul Lojistik Merkezi"
  }'

# 2. Gate listesi
curl -X GET "http://localhost:3000/api/gates"

# 3. Gate istatistikleri  
curl -X GET "http://localhost:3000/api/gates/G001/statistics"
```

### **Performance Tests**
```bash
# Apache Bench ile load test
ab -n 1000 -c 10 http://localhost:3000/api/shipments/health

# Artillery ile advanced load testing
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/shipments
```

---

## 📊 Monitoring & Analytics

### **Health Checks**
- **API Health**: `/api/shipments/health`
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping test
- **Memory Usage**: Node.js heap monitoring

### **Metrics & KPIs**
- **Throughput**: Request/second
- **Latency**: Response time percentiles  
- **Error Rate**: 4xx/5xx responses
- **Cache Hit Ratio**: Redis cache effectiveness
- **Database Performance**: Query execution times

### **Logging Strategy**
```typescript
// Structured logging
this.logger.log('Shipment created', {
    trackingNumber: 'TRK001',
    userId: 'user123',
    duration: 150,
    metadata: { source: 'api' }
});

// Error tracking  
this.logger.error('Database connection failed', error, {
    context: 'ShipmentService',
    operation: 'create',
    retryCount: 3
});
```

---

## 🔒 Security & Best Practices

### **Security Measures**
- **Input Validation**: class-validator ile DTO validation
- **SQL Injection Prevention**: TypeORM parameterized queries
- **Rate Limiting**: Redis ile API rate limiting
- **Environment Variables**: Sensitive data encryption
- **Health Checks**: Service monitoring

### **Code Quality**
- **TypeScript**: Strong typing
- **ESLint**: Code linting
- **Prettier**: Code formatting  
- **Husky**: Pre-commit hooks
- **Unit Tests**: Comprehensive test coverage

### **Performance Optimizations**
- **Database Indexing**: Query optimization
- **Redis Caching**: Multi-layer caching strategy
- **Connection Pooling**: Database connection management
- **Async Processing**: Non-blocking operations

---

## 🎯 Gelecek Geliştirmeler

### **Phase 2 Features**
- [ ] WebSocket real-time tracking
- [ ] Mobile API endpoints
- [ ] Advanced analytics dashboard
- [ ] Machine learning predictions
- [ ] Multi-tenant support

### **Scalability Improvements**  
- [ ] Database sharding
- [ ] Redis cluster setup
- [ ] CDN integration
- [ ] Horizontal pod autoscaling
- [ ] Circuit breaker pattern

### **DevOps Enhancements**
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing
- [ ] Blue-green deployment
- [ ] Infrastructure as Code (Terraform)
- [ ] Monitoring stack (Prometheus + Grafana)

---

## 📞 Destek ve Katkı

### **Geliştirici Ekibi**
- **Backend Developer**: NestJS, PostgreSQL, Redis expertise
- **DevOps Engineer**: Docker, Kubernetes, CI/CD
- **Frontend Developer**: React/Vue.js integration (gelecek)

### **Katkıda Bulunma**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### **Issue Reporting**
GitHub Issues kullanarak bug report ve feature request gönderebilirsiniz.

---

## 📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

---

**🎉 Bu dokümantasyon projenin tam olarak nasıl çalıştığını ve neden bu teknolojilerin seçildiğini açıklamaktadır. Her bölüm gerçek kod örnekleri ve pratik kullanım senaryoları içermektedir.** 