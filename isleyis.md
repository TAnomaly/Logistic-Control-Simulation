# 🚚 Lojistik Kontrol Sistemi - İşleyiş Dokümantasyonu

## 📋 Sistem Genel Bakış

Bu sistem, **gerçek mikroservis mimarisi** kullanarak lojistik operasyonlarını yöneten iki ayrı API'den oluşur:

- **📋 Planner API** (Port 3000): Sevkiyat planlama ve yönetimi
- **🚗 Driver API** (Port 3001): Sürücü yönetimi ve konum takibi

## 🏗️ Kullanılan Teknolojiler

### **Mikroservis Mimarisi**
- **NestJS**: Backend framework
- **TypeScript**: Programlama dili
- **Docker & Docker Compose**: Konteynerizasyon ve orkestrasyon

### **Veritabanı ve Depolama**
- **PostgreSQL**: İlişkisel veritabanı (2 ayrı database)
  - `planner_db`: Sevkiyat verileri
  - `driver_db`: Sürücü verileri
- **Redis**: Önbellekleme ve session yönetimi
- **PgAdmin**: Veritabanı yönetim arayüzü

### **Mesajlaşma ve Event-Driven Architecture**
- **RabbitMQ**: Mesaj broker (event-driven communication)
- **Outbox Pattern**: Güvenilir event publishing

### **Mimari Desenler**
- **DDD (Domain-Driven Design)**: Domain entities, repositories, events
- **CQRS (Command Query Responsibility Segregation)**: Command/Query ayrımı
- **Event-Driven Architecture**: Asenkron event processing

## 🔄 Business Logic ve İş Akışı

### **1. Sürücü Kaydı ve Yönetimi**
```
Sürücü Kaydı → Konum Güncelleme → Durum Takibi
```

### **2. Sevkiyat Yaşam Döngüsü**
```
Sevkiyat Oluşturma → Sürücü Atama → Teslimat Takibi → Tamamlama
```

### **3. Event-Driven İletişim**
```
API Event → Outbox → RabbitMQ → Diğer Servisler
```

## 🚀 API Endpoints ve Kullanım

### **Planner API (Port 3000)**

#### **1. Sevkiyat Oluşturma**
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK001",
    "origin": "Istanbul, Turkey",
    "destination": "Ankara, Turkey",
    "description": "Electronics shipment",
    "weight": 15.5,
    "volume": 2.0,
    "estimatedDeliveryDate": "2025-07-28"
  }'
```

**Response:**
```json
{
  "trackingNumber": "TRK001",
  "origin": "Istanbul, Turkey",
  "destination": "Ankara, Turkey",
  "description": "Electronics shipment",
  "weight": "15.50",
  "volume": "2.00",
  "status": "pending",
  "estimatedDeliveryDate": "2025-07-28",
  "assignedDriverId": null,
  "actualDeliveryDate": null,
  "id": "a92ca6dc-747d-4141-832d-b2506c0059f7",
  "createdAt": "2025-07-26T23:38:42.238Z",
  "updatedAt": "2025-07-26T23:38:42.238Z"
}
```

#### **2. Tüm Sevkiyatları Listeleme**
```bash
curl -X GET http://localhost:3000/api/shipments
```

**Response:**
```json
[
  {
    "id": "a92ca6dc-747d-4141-832d-b2506c0059f7",
    "trackingNumber": "TRK001",
    "origin": "Istanbul, Turkey",
    "destination": "Ankara, Turkey",
    "description": "Electronics shipment",
    "weight": "15.50",
    "volume": "2.00",
    "status": "assigned",
    "assignedDriverId": "8308f036-e16d-4267-81ea-b04e15ef3b87",
    "estimatedDeliveryDate": "2025-07-28T00:00:00.000Z",
    "actualDeliveryDate": null,
    "createdAt": "2025-07-26T23:38:42.238Z",
    "updatedAt": "2025-07-26T23:40:00.778Z",
    "trackingEvents": []
  }
]
```

#### **3. Sürücü Atama**
```bash
curl -X PUT http://localhost:3000/api/shipments/a92ca6dc-747d-4141-832d-b2506c0059f7/assign \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "8308f036-e16d-4267-81ea-b04e15ef3b87"
  }'
```

**Response:**
```json
{
  "id": "a92ca6dc-747d-4141-832d-b2506c0059f7",
  "trackingNumber": "TRK001",
  "origin": "Istanbul, Turkey",
  "destination": "Ankara, Turkey",
  "description": "Electronics shipment",
  "weight": "15.50",
  "volume": "2.00",
  "status": "assigned",
  "assignedDriverId": "8308f036-e16d-4267-81ea-b04e15ef3b87",
  "estimatedDeliveryDate": "2025-07-28T00:00:00.000Z",
  "actualDeliveryDate": null,
  "createdAt": "2025-07-26T23:38:42.238Z",
  "updatedAt": "2025-07-26T23:40:00.778Z",
  "trackingEvents": []
}
```

#### **4. Sevkiyat Detayı**
```bash
curl -X GET http://localhost:3000/api/shipments/a92ca6dc-747d-4141-832d-b2506c0059f7
```

### **Driver API (Port 3001)**

#### **1. Sürücü Oluşturma**
```bash
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmet Yılmaz",
    "licenseNumber": "ABC123456",
    "phoneNumber": "+905551234567",
    "address": "İstanbul, Türkiye"
  }'
```

**Response:**
```json
{
  "id": "8308f036-e16d-4267-81ea-b04e15ef3b87",
  "name": "Ahmet Yılmaz",
  "licenseNumber": "ABC123456",
  "phoneNumber": "+905551234567",
  "address": "İstanbul, Türkiye",
  "status": "available",
  "currentLocation": null,
  "lastActiveAt": "2025-07-26T23:27:39.330Z",
  "createdAt": "2025-07-26T23:27:39.341Z",
  "updatedAt": "2025-07-26T23:27:39.341Z",
  "locationHistory": []
}
```

#### **2. Tüm Sürücüleri Listeleme**
```bash
curl -X GET http://localhost:3001/api/drivers
```

**Response:**
```json
[
  {
    "id": "8308f036-e16d-4267-81ea-b04e15ef3b87",
    "name": "Ahmet Yılmaz",
    "licenseNumber": "ABC123456",
    "phoneNumber": "+905551234567",
    "address": "İstanbul, Türkiye",
    "status": "available",
    "currentLocation": {
      "address": "Istanbul, Turkey",
      "latitude": 41.0082,
      "longitude": 28.9784
    },
    "lastActiveAt": "2025-07-26T23:38:31.348Z",
    "createdAt": "2025-07-26T23:27:39.341Z",
    "updatedAt": "2025-07-26T23:38:31.351Z",
    "locationHistory": []
  }
]
```

#### **3. Sürücü Konum Güncelleme**
```bash
curl -X PUT http://localhost:3001/api/drivers/8308f036-e16d-4267-81ea-b04e15ef3b87/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 41.0082,
    "longitude": 28.9784,
    "address": "Istanbul, Turkey"
  }'
```

**Response:** (Başarılı güncelleme - boş response)

## 🗄️ Veritabanı Yapısı

### **Planner Database (planner_db)**

#### **shipments Tablosu**
```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY,
  trackingNumber VARCHAR UNIQUE,
  origin TEXT,
  destination TEXT,
  description TEXT,
  weight DECIMAL,
  volume DECIMAL,
  status VARCHAR,
  assignedDriverId UUID,
  estimatedDeliveryDate TIMESTAMP,
  actualDeliveryDate TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### **outbox_events Tablosu**
```sql
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  eventType VARCHAR,
  eventData JSONB,
  status VARCHAR,
  routingKey VARCHAR,
  exchange VARCHAR,
  retryCount INTEGER,
  processedAt TIMESTAMP,
  errorMessage TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### **tracking_events Tablosu**
```sql
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY,
  shipmentId UUID,
  eventType VARCHAR,
  location TEXT,
  description TEXT,
  timestamp TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### **Driver Database (driver_db)**

#### **drivers Tablosu**
```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY,
  name VARCHAR,
  licenseNumber VARCHAR UNIQUE,
  phoneNumber VARCHAR,
  address TEXT,
  status VARCHAR,
  currentLocation JSONB,
  lastActiveAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### **driver_locations Tablosu**
```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY,
  driverId UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  timestamp TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### **driver_assignments Tablosu**
```sql
CREATE TABLE driver_assignments (
  id UUID PRIMARY KEY,
  driverId UUID,
  shipmentId UUID,
  assignedAt TIMESTAMP,
  status VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## 🔄 Event-Driven İş Akışı

### **1. Sevkiyat Oluşturma Event'i**
```json
{
  "eventType": "ShipmentCreated",
  "eventData": {
    "shipmentId": "a92ca6dc-747d-4141-832d-b2506c0059f7",
    "trackingNumber": "TRK001",
    "origin": "Istanbul, Turkey",
    "destination": "Ankara, Turkey",
    "createdAt": "2025-07-26T23:38:42.238Z"
  },
  "routingKey": "shipment.created",
  "exchange": "logistics"
}
```

### **2. Sürücü Atama Event'i**
```json
{
  "eventType": "ShipmentAssigned",
  "eventData": {
    "shipmentId": "a92ca6dc-747d-4141-832d-b2506c0059f7",
    "driverId": "8308f036-e16d-4267-81ea-b04e15ef3b87",
    "assignedAt": "2025-07-26T23:40:00.784Z"
  },
  "routingKey": "shipment.assigned",
  "exchange": "logistics"
}
```

### **3. Sürücü Konum Güncelleme Event'i**
```json
{
  "eventType": "DriverLocationUpdated",
  "eventData": {
    "driverId": "8308f036-e16d-4267-81ea-b04e15ef3b87",
    "latitude": 41.0082,
    "longitude": 28.9784,
    "address": "Istanbul, Turkey",
    "timestamp": "2025-07-26T23:38:31.348Z"
  }
}
```

## 🏗️ Mimari Katmanları

### **Domain Layer**
- **Entities**: `Shipment`, `Driver`, `TrackingEvent`, `OutboxEvent`
- **Repositories**: `ShipmentRepository`, `DriverRepository`
- **Events**: `ShipmentCreatedEvent`, `ShipmentAssignedEvent`, `DriverLocationUpdatedEvent`

### **Application Layer**
- **Commands**: `CreateShipmentCommand`, `AssignShipmentCommand`, `UpdateDriverLocationCommand`
- **Queries**: `GetShipmentsQuery`, `GetDriversQuery`
- **Handlers**: Command ve Query handlers

### **Infrastructure Layer**
- **Repositories**: `TypeOrmShipmentRepository`, `TypeOrmDriverRepository`
- **Services**: `RedisService`, `RabbitMQService`
- **Database**: PostgreSQL connections

### **Presentation Layer**
- **Controllers**: `ShipmentController`, `DriverController`
- **DTOs**: Request/Response data transfer objects

## 🔧 Sistem Başlatma

### **1. Tüm Servisleri Başlatma**
```bash
docker-compose -f docker-compose.true-microservices.yml up -d
```

### **2. Servis Durumunu Kontrol Etme**
```bash
docker-compose -f docker-compose.true-microservices.yml ps
```

### **3. Logları İzleme**
```bash
# Planner API logs
docker logs logistic-planner-api -f

# Driver API logs
docker logs logistic-driver-api -f
```

## 📊 Monitoring ve Health Checks

### **API Health Endpoints**
```bash
# Planner API Health
curl http://localhost:3000/health

# Driver API Health
curl http://localhost:3001/health
```

### **Database Bağlantı Kontrolü**
```bash
# PostgreSQL bağlantısı
docker exec -it logistic-postgres psql -U postgres -c "\l"

# Redis bağlantısı
docker exec -it logistic-redis redis-cli ping
```

### **RabbitMQ Management**
```bash
# RabbitMQ durumu
docker exec -it logistic-rabbitmq rabbitmqctl status
```

## 🎯 Business Logic Senaryoları

### **Senaryo 1: Yeni Sevkiyat Süreci**
1. Sürücü kaydı oluştur
2. Sevkiyat oluştur
3. Sürücüyü sevkiyata ata
4. Konum güncellemelerini takip et

### **Senaryo 2: Teslimat Süreci**
1. Sevkiyat durumunu "in_transit" yap
2. Konum güncellemelerini kaydet
3. Teslimat tamamlandığında durumu "delivered" yap

### **Senaryo 3: Event-Driven İletişim**
1. Event oluştur (Outbox pattern)
2. RabbitMQ'ya gönder
3. Diğer servisler event'i dinle ve işle

## 🔒 Güvenlik ve Performans

### **Rate Limiting**
- Nginx ile API rate limiting
- Redis ile session yönetimi

### **Caching**
- Redis ile sürücü konum önbellekleme
- Shipment durumu önbellekleme

### **Error Handling**
- Global exception filters
- Structured error responses
- Retry mechanisms

## 📈 Ölçeklenebilirlik

### **Horizontal Scaling**
- Her API bağımsız olarak ölçeklendirilebilir
- Load balancer ile trafik dağıtımı

### **Database Scaling**
- Read replicas
- Connection pooling
- Query optimization

### **Event Processing**
- RabbitMQ cluster
- Event replay capabilities
- Dead letter queues

---

## 🎉 Sonuç

Bu sistem, modern mikroservis mimarisi prensiplerini kullanarak:
- ✅ **Bağımsız servisler** (Planner ve Driver API'leri)
- ✅ **Ayrı veritabanları** (planner_db ve driver_db)
- ✅ **Event-driven iletişim** (RabbitMQ + Outbox pattern)
- ✅ **DDD ve CQRS** mimari desenleri
- ✅ **Containerized deployment** (Docker)
- ✅ **Scalable architecture** (Horizontal scaling ready)

Tüm bu özelliklerle birlikte, lojistik operasyonlarını etkili bir şekilde yönetebilen, ölçeklenebilir ve sürdürülebilir bir sistem oluşturulmuştur. 