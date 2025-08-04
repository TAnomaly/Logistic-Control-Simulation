# Lojistik Kontrol Simülasyon Sistemi

Bu proje, modern yazılım mimarileri kullanarak geliştirilmiş kapsamlı bir lojistik kontrol simülasyon sistemidir. Domain Driven Design (DDD), CQRS, Outbox Pattern, Event-Driven Architecture ve Microservice Architecture prensiplerini uygulayan, Kubernetes ortamında çalışacak şekilde tasarlanmış bir NestJS uygulamasıdır.

## 🏗️ Kullanılan Teknolojiler ve Mimari Desenler

### Teknolojiler
- **NestJS** - Backend framework
- **PostgreSQL** - Ana veritabanı
- **TypeORM** - ORM katmanı
- **Redis** - Cache ve session management
- **RabbitMQ** - Message broker ve event streaming
- **Docker & Docker Compose** - Container'laştırma
- **Kubernetes** - Orchestration ve deployment
- **Jest** - Unit testing framework
- **TypeScript** - Statik tip kontrolü
- **Nginx** - API Gateway ve load balancing

### Mimari Desenler
- **Domain Driven Design (DDD)** - Domain odaklı tasarım
- **CQRS (Command Query Responsibility Segregation)** - Okuma/yazma operasyonlarının ayrılması
- **SOLID Prensipler** - Temiz kod mimarisi
- **Outbox Pattern** - Güvenilir event publishing
- **Event-Driven Architecture** - Event-driven communication
- **Microservice Architecture** - Servis bazlı mimari
- **Repository Pattern** - Data access layer abstraction
- **API Gateway Pattern** - Merkezi API yönetimi

## 🏛️ Microservice Architecture

### Servis Yapısı
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Planner API    │    │   Driver API    │
│   (Nginx)       │    │   (Port:3000)   │    │   (Port:3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   ML Service    │    │ Tracking Service│    │ Webhook Consumer│
    │   (Port:8000)   │    │   (Port:8002)   │    │   (Port:8001)   │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │   PostgreSQL    │    │     Redis       │    │    RabbitMQ     │
    │   (Port:5432)   │    │   (Port:6379)   │    │   (Port:5672)   │
    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Servis Detayları

#### 1. **API Gateway (Nginx)**
- **Port**: 80
- **Görev**: Load balancing, routing, rate limiting
- **Özellikler**: 
  - `/api/planner/*` → Planner API
  - `/api/driver/*` → Driver API
  - `/api/ml/*` → ML Service

#### 2. **Planner API**
- **Port**: 3000
- **Görev**: Shipment yönetimi, route planning
- **Database**: `planner_db`
- **Özellikler**:
  - Shipment CRUD işlemleri
  - Route optimization
  - Outbox pattern ile event publishing

#### 3. **Driver API**
- **Port**: 3001
- **Görev**: Driver yönetimi, location tracking
- **Database**: `driver_db`
- **Özellikler**:
  - Driver CRUD işlemleri
  - Real-time location updates
  - Outbox pattern ile event publishing

#### 4. **ML Service**
- **Port**: 8000
- **Görev**: Route optimization, ML algorithms
- **Özellikler**:
  - H3 geospatial indexing
  - Route optimization algorithms
  - Webhook event processing

#### 5. **Tracking Service**
- **Port**: 8002
- **Görev**: Real-time tracking, WebSocket connections
- **Özellikler**:
  - WebSocket connections
  - Real-time location updates
  - Event streaming

#### 6. **Webhook Consumer**
- **Port**: 8001
- **Görev**: Event processing, webhook handling
- **Özellikler**:
  - RabbitMQ event consumption
  - Webhook processing
  - Event routing

## 📁 Proje Yapısı

```
Logistic-Control-Simulation/
├── api-gateway/                    # Nginx API Gateway
├── planner-api/                    # Planner Microservice
│   ├── src/
│   │   ├── domain/                # Domain Layer
│   │   ├── application/           # Application Layer
│   │   ├── infrastructure/        # Infrastructure Layer
│   │   └── controllers/           # API Controllers
├── driver-api/                     # Driver Microservice
│   ├── src/
│   │   ├── domain/                # Domain Layer
│   │   ├── application/           # Application Layer
│   │   ├── infrastructure/        # Infrastructure Layer
│   │   └── controllers/           # API Controllers
├── ml-service/                     # ML Service
├── tracking-service/               # Tracking Service
├── shared/                         # Shared DTOs and Entities
├── k8s/                           # Kubernetes Manifests
└── docker-compose.true-microservices.yml
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3+
- Docker & Docker Compose
- Kubernetes (isteğe bağlı)

### Docker ile Tam Sistem

```bash
# Tüm microservice'leri başlatın
docker-compose -f docker-compose.true-microservices.yml up -d

# Logları takip edin
docker-compose -f docker-compose.true-microservices.yml logs -f

# Servis durumunu kontrol edin
docker-compose -f docker-compose.true-microservices.yml ps
```

### Servis Erişim Bilgileri

| Servis | URL | Port | Açıklama |
|--------|-----|------|----------|
| API Gateway | http://localhost | 80 | Ana giriş noktası |
| Planner API | http://localhost:3000 | 3000 | Shipment yönetimi |
| Driver API | http://localhost:3001 | 3001 | Driver yönetimi |
| ML Service | http://localhost:8000 | 8000 | ML algorithms |
| Tracking Service | http://localhost:8002 | 8002 | Real-time tracking |
| pgAdmin | http://localhost:5050 | 5050 | Database yönetimi |
| RabbitMQ Management | http://localhost:15672 | 15672 | Message broker |

### Authentication

#### Planner API
```bash
# Login
curl -X POST http://localhost:3000/api/auth/planner/login \
  -H "Content-Type: application/json" \
  -d '{"email":"planner@logistic.com","password":"planner123"}'
```

#### Driver API
```bash
# Admin Login
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logistic.com","password":"admin123"}'

# Driver Login
curl -X POST http://localhost:3001/api/auth/driver/login \
  -H "Content-Type: application/json" \
  -d '{"licenseNumber":"TEST123","phoneNumber":"+905551234567"}'
```

## 🔧 API Endpoints

### Planner API (Port: 3000)

#### Shipment İşlemleri
```http
# Shipment oluşturma
POST /api/shipments
Authorization: Bearer <token>

{
  "trackingNumber": "TEST123",
  "origin": "Istanbul",
  "destination": "Ankara",
  "weight": 10,
  "volume": 5
}

# Shipment listeleme
GET /api/shipments
Authorization: Bearer <token>

# Shipment detayı
GET /api/shipments/:id
Authorization: Bearer <token>

# Driver'a shipment atama
PUT /api/shipments/:id/assign
Authorization: Bearer <token>

{
  "driverId": "driver-uuid"
}
```

### Driver API (Port: 3001)

#### Driver İşlemleri
```http
# Driver oluşturma
POST /api/drivers
Authorization: Bearer <token>

{
  "name": "Test Driver",
  "licenseNumber": "TEST123",
  "phoneNumber": "+905551234567"
}

# Driver listeleme
GET /api/drivers
Authorization: Bearer <token>

# Driver konum güncelleme
PUT /api/drivers/:id/location
Authorization: Bearer <token>

{
  "latitude": 39.9334,
  "longitude": 32.8597
}

# Driver shipments
GET /api/drivers/:id/shipments
Authorization: Bearer <token>
```

### ML Service (Port: 8000)

#### Route Optimization
```http
# Route optimization
POST /api/optimize-route

{
  "driverId": "driver-uuid",
  "shipments": ["shipment-uuid-1", "shipment-uuid-2"]
}
```

### Tracking Service (Port: 8002)

#### Real-time Tracking
```http
# WebSocket connection
ws://localhost:8002/tracking

# Health check
GET /api/health
```

## 📊 Outbox Pattern Implementation

### Güvenilir Event Publishing

Sistem, **Outbox Pattern** kullanarak güvenilir event publishing sağlar:

#### Planner API Outbox
```sql
-- planner_db.outbox_events tablosu
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    eventType VARCHAR NOT NULL,
    eventData JSONB NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    routingKey VARCHAR,
    exchange VARCHAR,
    retryCount INTEGER DEFAULT 0,
    processedAt TIMESTAMP,
    errorMessage TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Driver API Outbox
```sql
-- driver_db.outbox_events tablosu
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    eventType VARCHAR NOT NULL,
    eventData JSONB NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    routingKey VARCHAR,
    exchange VARCHAR,
    retryCount INTEGER DEFAULT 0,
    processedAt TIMESTAMP,
    errorMessage TEXT,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Event Flow

1. **Event Oluşturma**: Handler'da event oluşturulur
2. **Outbox'a Kaydetme**: Event outbox tablosuna kaydedilir
3. **Outbox Processor**: Background'da event'leri işler
4. **RabbitMQ'ya Gönderme**: Event RabbitMQ'ya publish edilir
5. **Status Güncelleme**: Event status'u completed olarak güncellenir

### Event Türleri

#### Planner API Events
- `ShipmentCreated` → `shipment.created`
- `ShipmentAssigned` → `shipment.assigned`

#### Driver API Events
- `DriverCreated` → `driver.created`
- `DriverLocationUpdated` → `driver.location.updated`

## 🧪 Test Yapısı

### Unit Testler
```bash
# Planner API testleri
cd planner-api && npm run test

# Driver API testleri
cd driver-api && npm run test

# ML Service testleri
cd ml-service && npm run test
```

### Integration Testler
```bash
# E2E testleri
npm run test:e2e

# API testleri
npm run test:api
```

## 🏛️ Mimari Açıklamaları

### Domain Driven Design (DDD)
- **Entities**: Shipment, Driver, Assignment, TrackingEvent
- **Value Objects**: Status enums, Location, Capacity
- **Aggregates**: Shipment aggregate, Driver aggregate
- **Domain Events**: ShipmentCreated, DriverLocationUpdated

### CQRS Implementation
- **Commands**: CreateShipmentCommand, UpdateDriverLocationCommand
- **Queries**: GetShipmentsQuery, GetDriverShipmentsQuery
- **Handlers**: Command ve query işleme mantığı
- **Separation**: Okuma ve yazma modelleri ayrılması

### Event-Driven Architecture
- **Domain Events**: İş olaylarının yayınlanması
- **Event Handlers**: Olay işleme mantığı
- **Outbox Pattern**: Güvenilir event delivery
- **RabbitMQ**: Message broker ve event streaming

### Microservice Communication
- **Synchronous**: HTTP REST API calls
- **Asynchronous**: RabbitMQ event streaming
- **WebSocket**: Real-time tracking updates
- **API Gateway**: Centralized routing ve load balancing

## 🌐 Production Deployment

### Environment Variables
```env
# Planner API
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_NAME=planner_db
DB_USERNAME=postgres
DB_PASSWORD=postgres
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
REDIS_HOST=redis
REDIS_PORT=6379

# Driver API
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_NAME=driver_db
DB_USERNAME=postgres
DB_PASSWORD=postgres
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
REDIS_HOST=redis
REDIS_PORT=6379
```

### Kubernetes Monitoring
- **Health Checks**: Liveness ve readiness probe'ları
- **HPA (Horizontal Pod Autoscaler)**: CPU/Memory bazlı otomatik scaling
- **Resource Limits**: Memory ve CPU sınırları
- **Security Context**: Non-root user, read-only filesystem

### Database Management
- **pgAdmin**: http://localhost:5050
  - Email: `admin@admin.com`
  - Password: `admin`
- **Databases**:
  - `planner_db`: Planner API veritabanı
  - `driver_db`: Driver API veritabanı

## 🔮 Gelecek Geliştirmeler

- [x] ✅ Outbox pattern implementation
- [x] ✅ Microservice architecture
- [x] ✅ Event-driven communication
- [x] ✅ Real-time tracking
- [ ] GraphQL API desteği
- [ ] Advanced monitoring (Prometheus/Grafana)
- [ ] CI/CD pipeline kurulumu
- [ ] Service mesh (Istio) implementation
- [ ] Distributed tracing (Jaeger)
- [ ] Circuit breaker pattern
- [ ] Rate limiting ve throttling
- [ ] API versioning
- [ ] Multi-tenancy support

## 📝 Lisans

Bu proje MIT lisansı altında geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilirsiniz.
