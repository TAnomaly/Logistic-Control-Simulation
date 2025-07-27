# 🚚 Logistic Control Simulation

Modern mikroservis mimarisi ile geliştirilmiş lojistik kontrol simülasyonu. Machine Learning destekli rota optimizasyonu ve event-driven mimari ile gerçek zamanlı lojistik operasyonları yönetimi.

## 🏗️ Mimari Yapı

### Mikroservisler:
- **Planner API** (NestJS) - Sipariş ve kargo yönetimi
- **Driver API** (NestJS) - Sürücü yönetimi ve konum takibi  
- **ML Route Optimizer** (Python FastAPI) - ML destekli rota optimizasyonu
- **Nginx Gateway** - API Gateway ve yönlendirme
- **PostgreSQL** - Ana veritabanı
- **Redis** - Önbellek
- **RabbitMQ** - Event-driven iletişim

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler
```bash
# Docker ve Docker Compose yüklü olmalı
docker --version
docker-compose --version
```

### 2. Projeyi Başlatma
```bash
# Tüm servisleri başlat
docker-compose -f docker-compose.true-microservices.yml up -d

# Servislerin hazır olmasını bekle
docker-compose -f docker-compose.true-microservices.yml ps
```

### 3. RabbitMQ Consumer'ı Aktif Etme
```bash
# ML servisinin RabbitMQ consumer'ını manuel başlat
docker exec -it logistic-ml-route-optimizer python -c "from src.main import start_rabbitmq_consumer; start_rabbitmq_consumer()"
```

## 📋 İş Akışı Senaryoları

### Senaryo 1: Temel Sipariş Oluşturma ve Atama

#### Adım 1: Sürücü Oluşturma
```bash
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmet Yılmaz",
    "licenseNumber": "TR-123456",
    "phoneNumber": "+90-555-123-4567",
    "address": "İstanbul, Türkiye"
  }'
```

**Beklenen Yanıt:**
```json
{
  "id": "driver-uuid",
  "name": "Ahmet Yılmaz",
  "licenseNumber": "TR-123456",
  "phoneNumber": "+90-555-123-4567",
  "address": "İstanbul, Türkiye",
  "status": "available",
  "createdAt": "2025-07-27T...",
  "updatedAt": "2025-07-27T..."
}
```

#### Adım 2: Sürücü Konumu Güncelleme
```bash
curl -X PUT http://localhost:3001/api/drivers/driver-uuid/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 41.0082,
    "longitude": 28.9784
  }'
```

#### Adım 3: Kargo/Sipariş Oluşturma
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK-2025-001",
    "origin": "İstanbul Merkez",
    "destination": "Ankara Merkez", 
    "description": "Elektronik ürünler",
    "weight": 500,
    "volume": 2.5
  }'
```

**Beklenen Yanıt:**
```json
{
  "id": "shipment-uuid",
  "trackingNumber": "TRK-2025-001",
  "origin": "İstanbul Merkez",
  "destination": "Ankara Merkez",
  "description": "Elektronik ürünler",
  "weight": 500,
  "volume": 2.5,
  "status": "pending",
  "assignedDriverId": null,
  "createdAt": "2025-07-27T...",
  "updatedAt": "2025-07-27T..."
}
```

#### Adım 4: ML Rota Optimizasyonu
```bash
curl -X POST http://localhost:3002/api/v1/routes/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "driver-uuid",
    "pickup_locations": [
      {
        "lat": 41.0082,
        "lng": 28.9784,
        "type": "pickup",
        "address": "İstanbul Merkez"
      }
    ],
    "delivery_locations": [
      {
        "lat": 39.9334,
        "lng": 32.8597,
        "type": "delivery", 
        "address": "Ankara Merkez"
      }
    ],
    "vehicle_capacity": 1000
  }'
```

**Beklenen Yanıt:**
```json
{
  "route_id": "ROUTE_20250727_123456",
  "driver_id": "driver-uuid",
  "optimized_route": [...],
  "total_distance": 450.5,
  "total_duration": 32400,
  "estimated_eta": "2025-07-27T...",
  "fuel_consumption": 36.04,
  "traffic_factor": 1.0,
  "waypoints": [...],
  "map_url": "/static/maps/route_20250727_123456.html"
}
```

#### Adım 5: Sipariş Atama
```bash
curl -X POST http://localhost:3000/api/shipments/shipment-uuid/assign \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver-uuid"
  }'
```

### Senaryo 2: Event-Driven Entegrasyon

#### Adım 1: RabbitMQ Consumer Aktif Etme
```bash
# ML servisinin event dinleyicisini başlat
docker exec -it logistic-ml-route-optimizer python -c "from src.main import start_rabbitmq_consumer; start_rabbitmq_consumer()"
```

#### Adım 2: Event-Driven Sipariş Oluşturma
```bash
# Bu sipariş otomatik olarak ML servisine event gönderecek
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK-2025-002",
    "origin": "İzmir Liman",
    "destination": "Bursa Organize",
    "description": "Event-driven test",
    "weight": 750,
    "volume": 3.0
  }'
```

**Event Akışı:**
1. Planner API sipariş oluşturur
2. `shipment.created` event'i RabbitMQ'ya gönderilir
3. ML servisi event'i dinler ve rota optimizasyonu yapar
4. Sonuç veritabanına kaydedilir

### Senaryo 3: Çoklu Araç Rota Optimizasyonu

```bash
curl -X POST http://localhost:3002/api/v1/routes/optimize-multi-vehicle \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [
      {"id": "truck-1", "capacity": 2000},
      {"id": "van-1", "capacity": 500}
    ],
    "pickup_locations": [
      {"lat": 41.0082, "lng": 28.9784, "type": "pickup"},
      {"lat": 40.9862, "lng": 29.1244, "type": "pickup"}
    ],
    "delivery_locations": [
      {"lat": 39.9334, "lng": 32.8597, "type": "delivery"},
      {"lat": 38.4192, "lng": 27.1287, "type": "delivery"}
    ]
  }'
```

## 🔍 Durum Kontrolü

### Mevcut Siparişleri Görüntüleme
```bash
# Tüm siparişleri listele
curl http://localhost:3000/api/shipments

# Atanmış siparişleri filtrele
curl "http://localhost:3000/api/shipments?status=assigned"

# Bekleyen siparişleri filtrele  
curl "http://localhost:3000/api/shipments?status=pending"
```

### Mevcut Sürücüleri Görüntüleme
```bash
# Tüm sürücüleri listele
curl http://localhost:3001/api/drivers

# Müsait sürücüleri filtrele
curl "http://localhost:3001/api/drivers?status=available"
```

### ML Servisi Durumu
```bash
# ML servisi sağlık kontrolü
curl http://localhost:3002/health

# Rota optimizasyon geçmişi
curl http://localhost:3002/api/v1/routes/history
```

## 🛠️ Geliştirme ve Debug

### Logları İzleme
```bash
# Tüm servislerin logları
docker-compose -f docker-compose.true-microservices.yml logs -f

# Belirli servisin logları
docker logs -f logistic-planner-api
docker logs -f logistic-driver-api  
docker logs -f logistic-ml-route-optimizer
```

### Veritabanı Erişimi
```bash
# PostgreSQL'e bağlan
docker exec -it logistic-postgres psql -U postgres -d planner_db

# pgAdmin web arayüzü
# http://localhost:5050
# Email: admin@admin.com
# Password: admin
```

### RabbitMQ Yönetimi
```bash
# RabbitMQ web arayüzü
# http://localhost:15672
# Username: admin
# Password: password
```

## 🔧 Konfigürasyon

### Environment Variables
```yaml
# Planner API
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: postgres
DB_PASSWORD: postgres
DB_NAME: planner_db
RABBITMQ_URL: amqp://admin:password@rabbitmq:5672

# Driver API  
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: postgres
DB_PASSWORD: postgres
DB_NAME: driver_db
RABBITMQ_URL: amqp://admin:password@rabbitmq:5672

# ML Route Optimizer
DB_HOST: postgres
DB_PORT: 5432
DB_USERNAME: postgres
DB_PASSWORD: postgres
DB_NAME: ml_route_db
RABBITMQ_URL: amqp://admin:password@rabbitmq:5672
```

### Port Mappings
- **Planner API**: 3000
- **Driver API**: 3001  
- **ML Route Optimizer**: 3002
- **Nginx Gateway**: 80
- **PostgreSQL**: 5432
- **Redis**: 6379
- **RabbitMQ**: 5672 (AMQP), 15672 (Management)
- **pgAdmin**: 5050

## 🚨 Bilinen Sorunlar ve Çözümler

### 1. RabbitMQ Consumer Manuel Başlatma
**Sorun:** ML servisi başladığında RabbitMQ consumer otomatik başlamıyor.

**Çözüm:** 
```bash
docker exec -it logistic-ml-route-optimizer python -c "from src.main import start_rabbitmq_consumer; start_rabbitmq_consumer()"
```

### 2. Database Migration Sorunları
**Sorun:** Servisler başladığında tablolar eksik olabilir.

**Çözüm:**
```bash
# Servisleri yeniden başlat
docker-compose -f docker-compose.true-microservices.yml restart planner-api driver-api
```

### 3. ML Route Optimization Hataları
**Sorun:** OR-Tools kütüphanesi ile ilgili hatalar.

**Çözüm:** Sistem fallback mekanizması ile basit rota hesaplaması yapar.

## 📊 Performans Metrikleri

### API Response Times
- **Planner API**: ~50ms
- **Driver API**: ~45ms  
- **ML Route Optimizer**: ~200ms (basit hesaplama)
- **Nginx Gateway**: ~10ms

### Event Processing
- **RabbitMQ Event Latency**: ~100ms
- **Event Processing Time**: ~150ms
- **Database Write Time**: ~30ms

## 🔮 Gelecek Geliştirmeler

1. **Otomatik RabbitMQ Consumer Başlatma**
2. **Gelişmiş ML Algoritmaları**
3. **Real-time Konum Takibi**
4. **Mobil Uygulama Entegrasyonu**
5. **Analytics Dashboard**
6. **Multi-language Support**
7. **Advanced Caching Strategies**
8. **Load Balancing**
9. **Monitoring ve Alerting**
10. **CI/CD Pipeline**

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Logları kontrol edin
2. Servis durumlarını kontrol edin  
3. Veritabanı bağlantılarını test edin
4. RabbitMQ event akışını kontrol edin

---

**Not:** Bu sistem geliştirme ortamı için tasarlanmıştır. Production ortamı için ek güvenlik, monitoring ve scaling konfigürasyonları gerekir.
