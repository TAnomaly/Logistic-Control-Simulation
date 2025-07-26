# 🏗️ DDD + MICROSERVICE MİMARİSİ DOKÜMANTASYONU

## 📋 **GENEL BAKIŞ**

Bu proje, **Domain-Driven Design (DDD)**, **Command Query Responsibility Segregation (CQRS)**, **Event-Driven Architecture** ve **Microservices** pattern'lerini kullanarak geliştirilmiş modern bir lojistik kontrol simülasyonu sistemidir.

## 🏛️ **MİMARİ YAPISI**

### **1. MICROSERVICE'LER**

#### **📦 Planner Service (Port: 3000)**
- **Sorumluluk**: Shipment, Gate, Tracking Event yönetimi
- **Veritabanı**: `planner_db` (PostgreSQL)
- **Ana Domain**: Shipment, Gate, TrackingEvent

#### **🚗 Driver Service (Port: 3001)**
- **Sorumluluk**: Driver, DriverLocation yönetimi
- **Veritabanı**: `driver_db` (PostgreSQL)
- **Ana Domain**: Driver, DriverLocation

#### **🌐 API Gateway (Port: 8080)**
- **Sorumluluk**: Dış dünya ile iletişim, routing, rate limiting
- **Teknoloji**: Nginx

### **2. DDD (DOMAIN-DRIVEN DESIGN) YAPISI**

```
📁 planner-api/src/
├── 🏗️ domain/
│   ├── entities/
│   │   ├── shipment.entity.ts ✅
│   │   ├── tracking-event.entity.ts ✅
│   │   └── gate.entity.ts ✅
│   ├── events/
│   │   └── shipment-created.event.ts ✅
│   └── repositories/
│       ├── shipment.repository.ts ✅
│       ├── tracking-event.repository.ts ✅
│       ├── gate.repository.ts ✅
│       └── outbox-event.repository.ts ✅
├── ⚡ application/
│   ├── commands/
│   │   └── create-shipment.command.ts ✅
│   └── handlers/
│       └── create-shipment.handler.ts ✅
└── 🔧 infrastructure/
    ├── outbox/
    │   └── outbox-event.entity.ts ✅
    ├── redis/
    │   └── redis.service.ts ✅
    ├── rabbitmq/
    │   └── rabbitmq.service.ts ✅
    └── repositories/
        ├── typeorm-shipment.repository.ts ✅
        ├── typeorm-tracking-event.repository.ts ✅
        ├── typeorm-gate.repository.ts ✅
        └── typeorm-outbox-event.repository.ts ✅
```

```
📁 driver-api/src/
├── 🏗️ domain/
│   ├── entities/
│   │   ├── driver.entity.ts ✅
│   │   └── driver-location.entity.ts ✅
│   ├── events/
│   │   └── driver-created.event.ts ✅
│   └── repositories/
│       ├── driver.repository.ts ✅
│       └── driver-location.repository.ts ✅
├── ⚡ application/
│   ├── commands/
│   │   └── create-driver.command.ts ✅
│   └── handlers/
│       └── create-driver.handler.ts ✅
└── 🔧 infrastructure/
    └── repositories/
        ├── typeorm-driver.repository.ts ✅
        └── typeorm-driver-location.repository.ts ✅
```

## 🔄 **CQRS PATTERN**

### **Commands (Komutlar)**
- `CreateShipmentCommand`: Yeni shipment oluşturma
- `CreateDriverCommand`: Yeni driver oluşturma

### **Queries (Sorgular)**
- `GetShipmentsQuery`: Shipment listesi alma
- `GetShipmentByIdQuery`: Tekil shipment alma

### **Handlers (İşleyiciler)**
- `CreateShipmentHandler`: Shipment oluşturma işlemi
- `CreateDriverHandler`: Driver oluşturma işlemi

## 📨 **EVENT-DRIVEN ARCHITECTURE**

### **Domain Events**
- `ShipmentCreatedEvent`: Shipment oluşturulduğunda
- `DriverCreatedEvent`: Driver oluşturulduğunda

### **Event Publishing**
- **RabbitMQ**: Inter-service communication
- **Outbox Pattern**: Reliable message delivery

## 🗄️ **OUTBOX PATTERN**

### **Avantajları**
- **Reliable Delivery**: Mesajların kaybolmaması
- **Consistency**: Database transaction ile mesaj gönderimi
- **Retry Mechanism**: Başarısız mesajların tekrar denenmesi

### **Implementasyon**
```typescript
@Entity('outbox_events')
export class OutboxEvent {
  @Column()
  eventType: string;
  
  @Column()
  aggregateId: string;
  
  @Column('jsonb')
  payload: Record<string, any>;
  
  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  status: OutboxEventStatus;
}
```

## 🔧 **INFRASTRUCTURE SERVICES**

### **Redis Service**
- **Caching**: Session ve data caching
- **Pub/Sub**: Real-time communication
- **Health Checks**: Connection monitoring

### **RabbitMQ Service**
- **Event Publishing**: Domain event'lerin yayınlanması
- **Message Broker**: Inter-service communication
- **Reliable Delivery**: Persistent messages

## 🗄️ **DATABASE DESIGN**

### **Planner Database (planner_db)**
```sql
-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  tracking_number VARCHAR UNIQUE,
  sender_name VARCHAR,
  receiver_name VARCHAR,
  status VARCHAR,
  weight DECIMAL,
  created_at TIMESTAMP
);

-- Gates table
CREATE TABLE gates (
  id UUID PRIMARY KEY,
  gate_code VARCHAR UNIQUE,
  name VARCHAR,
  gate_type VARCHAR,
  location_name VARCHAR
);

-- Tracking Events table
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR,
  shipment_id UUID,
  gate_id UUID,
  event_timestamp TIMESTAMP
);

-- Outbox Events table
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR,
  aggregate_id VARCHAR,
  payload JSONB,
  status VARCHAR,
  created_at TIMESTAMP
);
```

### **Driver Database (driver_db)**
```sql
-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR UNIQUE,
  phone_number VARCHAR UNIQUE,
  license_number VARCHAR UNIQUE,
  status VARCHAR,
  current_latitude DECIMAL,
  current_longitude DECIMAL
);

-- Driver Locations table
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY,
  driver_id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  timestamp TIMESTAMP
);
```

## 🚀 **API ENDPOINTS**

### **Planner Service (Port 3000)**
```
POST   /api/shipments          # Shipment oluştur
GET    /api/shipments          # Shipment listesi
GET    /api/shipments/:id      # Tekil shipment
GET    /api/shipments/tracking/:trackingNumber  # Tracking
POST   /api/gates              # Gate oluştur
GET    /api/gates              # Gate listesi
POST   /api/tracking-events    # Tracking event ekle
```

### **Driver Service (Port 3001)**
```
POST   /api/drivers            # Driver oluştur
GET    /api/drivers            # Driver listesi
GET    /api/drivers/:id        # Tekil driver
PUT    /api/drivers/:id/location  # Location güncelle
GET    /api/drivers/:id/location  # Location al
```

### **API Gateway (Port 8080)**
```
# Planner routes
/api/shipments/*     → planner-api:3000
/api/gates/*         → planner-api:3000
/api/tracking-events/* → planner-api:3000

# Driver routes
/api/drivers/*       → driver-api:3001
```

## 🔄 **BUSINESS WORKFLOW**

### **1. Shipment Oluşturma**
```
1. Client → API Gateway → Planner Service
2. CreateShipmentCommand → CreateShipmentHandler
3. Shipment Entity oluşturulur
4. ShipmentCreatedEvent publish edilir
5. Outbox Pattern ile RabbitMQ'ya gönderilir
6. Driver Service event'i alır ve işler
```

### **2. Driver Assignment**
```
1. Planner Service → RabbitMQ → Driver Service
2. Driver Service available driver'ları kontrol eder
3. En uygun driver seçilir
4. Assignment oluşturulur
5. Driver status güncellenir
```

### **3. Tracking Event**
```
1. Gate'den tracking event gelir
2. Planner Service event'i kaydeder
3. Shipment status güncellenir
4. Real-time notification gönderilir
```

## 🧪 **TESTING**

### **Health Checks**
```bash
# Planner API
curl http://localhost:3000/api/shipments

# Driver API
curl http://localhost:3001/api/drivers

# API Gateway
curl http://localhost:8080/api/shipments
```

### **Database Checks**
```bash
# Planner DB
docker exec -it logistic-planner-postgres psql -U postgres -d planner_db

# Driver DB
docker exec -it logistic-driver-postgres psql -U postgres -d driver_db
```

## 🚀 **DEPLOYMENT**

### **Docker Compose**
```bash
# Tüm servisleri başlat
docker-compose -f docker-compose.true-microservices.yml up -d

# Servisleri durdur
docker-compose -f docker-compose.true-microservices.yml down

# Logları görüntüle
docker-compose -f docker-compose.true-microservices.yml logs -f
```

### **Environment Variables**
```env
# Planner Service
DB_HOST=planner-postgres
DB_PORT=5432
DB_NAME=planner_db
DB_USERNAME=postgres
DB_PASSWORD=password

# Driver Service
DB_HOST=driver-postgres
DB_PORT=5432
DB_NAME=driver_db
DB_USERNAME=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:5672
```

## 📊 **MONITORING & LOGGING**

### **Health Endpoints**
- `/api/health` - Service health check
- `/api/metrics` - Performance metrics

### **Logging**
- **Structured Logging**: JSON format
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Request tracking

## 🔒 **SECURITY**

### **Authentication**
- JWT tokens
- API key authentication
- Rate limiting

### **Authorization**
- Role-based access control
- Resource-level permissions

## 📈 **SCALABILITY**

### **Horizontal Scaling**
- Stateless services
- Load balancing via API Gateway
- Database connection pooling

### **Performance**
- Redis caching
- Database indexing
- Query optimization

## 🎯 **SONUÇ**

Bu mimari, modern microservice best practice'lerini kullanarak:

✅ **Scalable**: Yatay ölçeklenebilir  
✅ **Maintainable**: Kolay bakım  
✅ **Testable**: Test edilebilir  
✅ **Reliable**: Güvenilir  
✅ **Event-Driven**: Event-driven architecture  
✅ **DDD Compliant**: Domain-driven design uyumlu  

**Teknolojiler**: NestJS, TypeScript, PostgreSQL, Redis, RabbitMQ, Docker, Nginx 