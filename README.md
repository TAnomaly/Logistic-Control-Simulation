# 🚚 Lojistik Kontrol Simülasyon Sistemi

Modern mikroservis mimarisiyle geliştirilmiş, gerçek zamanlı rota optimizasyonu ve sürücü yönetimi sağlayan kapsamlı bir lojistik kontrol simülasyon sistemidir. Domain Driven Design (DDD), CQRS, Outbox Pattern ve Event-Driven Architecture prensipleriyle tasarlanmıştır.

## 🏗️ Teknoloji Stack'i

### Backend
- **NestJS** - Backend framework
- **TypeScript** - Programlama dili
- **TypeORM** - ORM
- **PostgreSQL** - Ana veritabanı
- **Redis** - Cache ve session
- **RabbitMQ** - Message broker
- **JWT** - Authentication

### Frontend & Infrastructure
- **HTML/CSS/JavaScript** - Dashboard
- **Leaflet.js** - Harita görselleştirme
- **Docker & Docker Compose** - Containerization
- **Nginx** - API Gateway
- **H3** - Rota optimizasyonu

## 🏛️ Mikroservis Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx:80)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Planner API │  │ Driver API  │  │Tracking Svc │         │
│  │   (3000)    │  │   (3001)    │  │   (8002)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌─────────┐         ┌─────────┐           ┌─────────┐
   │PostgreSQL│         │  Redis  │           │ RabbitMQ│
   │  (5432)  │         │  (6379) │           │  (5672) │
   └─────────┘         └─────────┘           └─────────┘
```

## 🚀 Hızlı Başlangıç

### 1. Sistemi Başlat
```bash
# Tüm servisleri başlat
docker-compose -f docker-compose.true-microservices.yml up -d

# Servislerin durumunu kontrol et
docker-compose -f docker-compose.true-microservices.yml ps
```

### 2. Dashboard'a Erişim
```bash
# Dashboard'u aç
http://localhost:8002/tracking-dashboard/
```

### 3. API Gateway
```bash
# Tüm API'lere erişim
http://localhost:80/api/
```

### 4. 🗺️ Geocoding Özelliği
Sistem artık **profesyonel geocoding** kullanıyor:
- **Nominatim API** (OpenStreetMap) ile ücretsiz geocoding
- **Cache sistemi** ile performans optimizasyonu
- **Otomatik koordinat dönüşümü** - şehir isimleri → koordinatlar
- **Rota optimizasyonu** için doğru koordinatlar

## 📊 Dashboard Özellikleri

### 🗺️ Gerçek Zamanlı Harita
- **Sürücü Konumları**: Her sürücünün güncel konumu marker olarak gösterilir
- **Optimize Rotalar**: Başlangıçtan sona kadar polyline olarak çizilir
- **Waypoints**: 
  - 🟢 **Yeşil "P"**: Pickup noktaları
  - 🟠 **Turuncu "D"**: Delivery noktaları
- **Otomatik Zoom**: Seçili sürücünün rotasına göre harita fit edilir
- **Popup Detayları**: Sürücü ve waypoint bilgileri

### 📈 İstatistikler
- Toplam sürücü sayısı
- Müsait sürücüler
- Aktif rotalar
- Toplam sipariş sayısı

### 🔍 Filtreleme ve Arama
- Sürücü adına göre arama
- Durum filtreleme (available, busy, offline)
- Gerçek zamanlı güncelleme (30 saniye)

### 🚗 Sürücü Kartları
- Sürücü adı ve lisans numarası
- Durum göstergesi (available/busy/offline)
- Kapasite bilgisi
- Sipariş sayısı
- Rota mesafesi ve süresi

## 🔐 Authentication

### Planner API Login
```bash
curl -X POST http://localhost:80/api/planner/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "planner@logistic.com",
    "password": "planner123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "planner@logistic.com",
    "role": "planner"
  }
}
```

### Driver API Login
```bash
curl -X POST http://localhost:80/api/driver/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "DRV1754477567234664",
    "phoneNumber": "+905551234567"
  }'
```

## 📡 API Endpoint'leri

### 🚛 Driver API (Port 80/api/driver/api/)

#### Sürücü Listesi
```bash
# Tüm sürücüleri getir
curl -X GET http://localhost:80/api/driver/api/drivers

# Müsait sürücüleri getir
curl -X GET http://localhost:80/api/driver/api/drivers/available
```

#### Sürücü Detayları
```bash
# Sürücü profilini getir
curl -X GET http://localhost:80/api/driver/api/drivers/{driverId}/profile

# Sürücünün siparişlerini getir
curl -X GET http://localhost:80/api/driver/api/drivers/{driverId}/shipments

# Sürücünün mevcut rotasını getir
curl -X GET http://localhost:80/api/driver/api/drivers/{driverId}/current-route

# Sürücünün optimize edilmiş rotasını getir
curl -X GET http://localhost:80/api/driver/api/drivers/{driverId}/optimized-route
```

#### Konum Güncelleme
```bash
# Sürücü konumunu güncelle
curl -X PUT http://localhost:80/api/driver/api/drivers/{driverId}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 39.9334,
    "longitude": 32.8597,
    "address": "Ankara, Türkiye",
    "speed": 60,
    "heading": 180
  }'
```

#### Sipariş Atama
```bash
# Sürücüye sipariş ata
curl -X POST http://localhost:80/api/driver/api/drivers/{driverId}/assign-shipment \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "shipment-uuid"
  }'
```

### 📋 Planner API (Port 80/api/planner/api/)

#### Sürücü Yönetimi
```bash
# Yeni sürücü oluştur
curl -X POST http://localhost:80/api/planner/api/drivers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmet Yılmaz",
    "licenseNumber": "DRV123456789",
    "phoneNumber": "+905551234567",
    "address": "İstanbul, Türkiye",
    "vehicleType": "PICKUP",
    "maxCapacity": 1000
  }'
```

#### Sipariş Yönetimi
```bash
# Yeni sipariş oluştur
curl -X POST http://localhost:80/api/planner/api/shipments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "ABC Şirketi",
    "pickupAddress": "İstanbul, Kadıköy",
    "deliveryAddress": "Ankara, Çankaya",
    "weight": 50.5,
    "volume": 2.5,
    "pickupLocation": {
      "latitude": 40.9909,
      "longitude": 29.0304
    },
    "deliveryLocation": {
      "latitude": 39.9334,
      "longitude": 32.8597
    }
  }'
```

#### Sipariş Atama
```bash
# Siparişi sürücüye ata
curl -X POST http://localhost:80/api/planner/api/shipments/assign \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "shipment-uuid",
    "driverId": "driver-uuid"
  }'
```

### 🗺️ Tracking Service (Port 8002/api/)

#### Rota Optimizasyonu
```bash
# Sürücü için rota optimize et
curl -X POST http://localhost:8002/api/routes/optimize/{driverId}

# Polyline decode et
curl -X POST http://localhost:8002/api/routes/decode-polyline \
  -H "Content-Type: application/json" \
  -d '{
    "polyline": "encoded_polyline_string"
  }'
```

#### Dashboard Verisi (YENİ!)
```bash
# Sürücünün dashboard verilerini getir (konum + rota + waypoints)
curl -X GET http://localhost:8002/api/routes/driver/{driverId}/dashboard

# Response:
{
  "success": true,
  "data": {
    "driverId": "uuid",
    "currentLocation": {
      "lat": 41.0082,
      "lng": 28.9784,
      "address": "Istanbul, Turkey"
    },
    "activeRoute": { /* route details */ },
    "polylinePoints": [
      {"lat": 41.00638, "lng": 28.97587},
      {"lat": 39.98959, "lng": 28.89447}
    ],
    "waypoints": [
      {
        "lat": 41.006381,
        "lng": 28.9758715,
        "type": "pickup",
        "shipmentId": "uuid"
      }
    ]
  }
}
```

#### Gerçek Zamanlı Polyline Güncelleme (YENİ!)
```bash
# Sürücünün polyline'ına yeni konum ekle
curl -X POST http://localhost:8002/api/routes/update-polyline/{driverId} \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 39.8945,
    "longitude": 43.9427,
    "address": "Iğdır, Turkey"
  }'

# Response:
{
  "success": true,
  "message": "Polyline başarıyla güncellendi",
  "data": {
    "driverId": "uuid",
    "newLocation": {"lat": 39.8945, "lng": 43.9427},
    "updatedRoute": {
      "totalDistance": "3930.67",
      "fuelEstimate": "393.07",
      "optimizedRoute": {
        "polyline": "updated_polyline_string"
      }
    }
  }
}
```

## 📊 Veritabanı Şeması

### Ana Tablolar
```sql
-- Sürücüler
drivers (
  id, name, licenseNumber, phoneNumber, 
  address, vehicleType, maxCapacity, status, 
  currentLocation, createdAt, updatedAt
)

-- Siparişler
shipments (
  id, trackingNumber, customerName, 
  pickupAddress, deliveryAddress, weight, volume,
  pickupLocation, deliveryLocation, status,
  assignedDriverId, createdAt, updatedAt
)

-- Sürücü Atamaları
driver_assignments (
  id, driverId, shipmentId, status,
  assignedAt, startedAt, completedAt,
  acceptedAt, estimatedDuration, actualDuration,
  notes, createdAt, updatedAt
)

-- Sürücü Rotaları
driver_routes (
  id, driverId, status, optimizedRoute,
  waypoints, totalDistance, totalTime,
  currentLocation, completedDeliveries,
  startedAt, createdAt, updatedAt
)
```

## 🔍 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Sipariş ve Atama (Geocoding ile)
```bash
# 1. Sipariş oluştur (Koordinatlar otomatik hesaplanır)
SHIPMENT_RESPONSE=$(curl -X POST http://localhost:80/api/planner/api/shipments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK123456789",
    "origin": "Ankara",
    "destination": "İstanbul",
    "weight": 25.5,
    "volume": 2.0,
    "description": "Test shipment with geocoding"
  }')

SHIPMENT_ID=$(echo $SHIPMENT_RESPONSE | jq -r '.id')

# Koordinatlar otomatik hesaplanır:
# Ankara: 39.9207759, 32.8540497
# İstanbul: 41.006381, 28.9758715

# 2. Siparişi sürücüye ata
curl -X POST http://localhost:80/api/planner/api/shipments/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shipmentId\": \"$SHIPMENT_ID\",
    \"driverId\": \"$DRIVER_ID\"
  }"

# 3. Rota optimize et (Koordinatlar kullanılarak)
curl -X POST http://localhost:8002/api/routes/optimize/$DRIVER_ID

# 4. Dashboard verilerini kontrol et
curl -X GET http://localhost:8002/api/routes/driver/$DRIVER_ID/dashboard

# 5. Gerçek zamanlı konum güncelleme
curl -X POST http://localhost:8002/api/routes/update-polyline/$DRIVER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 39.8945,
    "longitude": 43.9427,
    "address": "Iğdır, Turkey"
  }'
```

### Senaryo 2: Sürücü Bilgilerini Kontrol Et
```bash
# Belirli lisans numarasına sahip sürücüyü bul
DRIVER_ID=$(curl -X GET http://localhost:80/api/driver/api/drivers | \
  jq -r '.[] | select(.licenseNumber == "DRV1754477567234664") | .id')

# Sürücünün sipariş sayısını kontrol et
curl -X GET http://localhost:80/api/driver/api/drivers/$DRIVER_ID/shipments | \
  jq 'length'

# Sürücünün sipariş detaylarını gör
curl -X GET http://localhost:80/api/driver/api/drivers/$DRIVER_ID/shipments | \
  jq '.[] | {trackingNumber, origin, destination, weight, status}'
```

### Senaryo 3: End-to-End Test (YENİ!)
```bash
# 1. Admin olarak giriş yap
TOKEN=$(curl -X POST http://localhost:80/api/driver/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@logistic.com",
    "password": "admin123"
  }' | jq -r '.access_token')

# 2. Yeni sürücü oluştur
DRIVER_RESPONSE=$(curl -X POST http://localhost:80/api/driver/api/drivers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DFDS",
    "licenseNumber": "DFDS-001",
    "phoneNumber": "5551234567",
    "address": "İstanbul, Turkey"
  }')

DRIVER_ID=$(echo $DRIVER_RESPONSE | jq -r '.id')

# 3. Sürücünün konumunu İstanbul olarak ayarla
curl -X PUT http://localhost:80/api/driver/api/drivers/$DRIVER_ID/location \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 41.0082,
    "longitude": 28.9784,
    "address": "Istanbul, Turkey"
  }'

# 4. Planner olarak giriş yap
PLANNER_TOKEN=$(curl -X POST http://localhost:80/api/planner/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "planner@logistic.com",
    "password": "planner123"
  }' | jq -r '.access_token')

# 5. 3 adet sipariş oluştur (Bursa, Ankara, Iğdır)
curl -X POST http://localhost:80/api/planner/api/shipments \
  -H "Authorization: Bearer $PLANNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK-BURSA-001",
    "origin": "Bursa",
    "destination": "Bursa",
    "weight": 25.5,
    "volume": 2.0
  }'

curl -X POST http://localhost:80/api/planner/api/shipments \
  -H "Authorization: Bearer $PLANNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK-ANKARA-001",
    "origin": "Ankara",
    "destination": "Ankara",
    "weight": 30.0,
    "volume": 3.0
  }'

curl -X POST http://localhost:80/api/planner/api/shipments \
  -H "Authorization: Bearer $PLANNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRK-IGDIR-001",
    "origin": "Iğdır",
    "destination": "Iğdır",
    "weight": 20.0,
    "volume": 1.5
  }'

# 6. Rota optimizasyonu başlat
curl -X POST http://localhost:8002/api/routes/optimize/$DRIVER_ID

# 7. Dashboard'da sonucu gör
echo "Dashboard: http://localhost:8002/tracking-dashboard/"
```

## 🛠️ Geliştirme

### Servisleri Yeniden Başlat
```bash
# Belirli servisi yeniden başlat
docker restart logistic-driver-api
docker restart logistic-planner-api
docker restart logistic-tracking-service

# Tüm servisleri yeniden başlat
docker-compose -f docker-compose.true-microservices.yml restart
```

### Logları İzle
```bash
# Belirli servisin loglarını izle
docker logs -f logistic-driver-api
docker logs -f logistic-planner-api
docker logs -f logistic-tracking-service

# Tüm logları izle
docker-compose -f docker-compose.true-microservices.yml logs -f
```

### Veritabanına Bağlan
```bash
# PostgreSQL'e bağlan
docker exec -it logistic-postgres psql -U postgres -d driver_db

# Tabloları listele
\dt

# Örnek sorgu
SELECT d.name, COUNT(da.id) as shipment_count 
FROM drivers d 
LEFT JOIN driver_assignments da ON d.id = da.driverId 
GROUP BY d.id, d.name;
```

## 🐛 Sorun Giderme

### CORS Hatası
```bash
# Driver API CORS ayarlarını kontrol et
docker exec -it logistic-driver-api env | grep CORS
```

### Veritabanı Bağlantı Hatası
```bash
# PostgreSQL durumunu kontrol et
docker exec -it logistic-postgres pg_isready -U postgres
```

### RabbitMQ Bağlantı Hatası
```bash
# RabbitMQ durumunu kontrol et
docker exec -it logistic-rabbitmq rabbitmqctl status
```

## 📝 Notlar

- Tüm API'ler Nginx API Gateway üzerinden erişilebilir (port 80)
- Dashboard otomatik olarak 30 saniyede bir güncellenir
- Sipariş atamaları otomatik olarak rota optimizasyonu tetikler
- Tüm veriler PostgreSQL'de `driver_db` veritabanında saklanır
- **YENİ**: Gerçek zamanlı polyline güncelleme özelliği
- **YENİ**: Dashboard'da waypoints görselleştirme

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**🚀 Sistem hazır! Dashboard'u açmak için: http://localhost:8002/tracking-dashboard/**

**🗺️ Yeni Özellikler:**
- ✅ Gerçek zamanlı polyline güncelleme
- ✅ Dashboard'da waypoints görselleştirme
- ✅ Optimize rota polyline gösterimi
- ✅ Sürücü konumu ve adres bilgisi
- ✅ Otomatik harita fit etme
