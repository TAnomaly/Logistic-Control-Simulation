# 🚀 Logistic Control Simulation - Test Kılavuzu

Bu kılavuz, mikroservis mimarinizi test etmek için kullanabileceğiniz script'leri ve araçları açıklar.

## 📋 Hızlı Başlangıç

### 1. Sistemi Başlatın
```bash
docker-compose -f docker-compose.true-microservices.yml up -d
```

### 2. Tam İş Akışı Testini Çalıştırın
```bash
./complete-workflow-test.sh
```

Bu script şunları yapar:
- ✅ Rastgele isim ve lisans numarası ile driver oluşturur
- ✅ 3 adet rastgele sipariş oluşturur
- ✅ Siparişleri driver'a atar
- ✅ ML ile rota optimizasyonu yapar
- ✅ Optimize edilmiş rotayı driver'a atar
- ✅ Driver konumunu günceller

## 🛠️ Mevcut Test Araçları

### 1. `complete-workflow-test.sh` - Tam İş Akışı
```bash
./complete-workflow-test.sh
```
**Özellikler:**
- Rastgele Türkçe isimler (Ahmet Yılmaz, Mehmet Demir, vb.)
- Rastgele lisans numaraları (TRAB123456 formatında)
- Rastgele şehirler (Istanbul, Ankara, Izmir, vb.)
- Rastgele ağırlıklar (500-2500kg arası)
- Rastgele öncelikler (low, medium, high, urgent)
- ML rota optimizasyonu
- Renkli terminal çıktısı

### 2. `test-workflow.sh` - Temel Test
```bash
./test-workflow.sh
```
**Özellikler:**
- Servis durumu kontrolü
- JWT authentication testi
- Basit iş akışı testi
- ML service testi

### 3. Postman Collection
```bash
# Postman'e import edin:
Logistic-Control-Test.postman_collection.json
```
**Özellikler:**
- Tüm API endpoint'leri
- Environment variables
- Hazır test senaryoları

## 🌐 Web Arayüzleri

| Servis | URL | Kullanıcı Adı | Şifre |
|--------|-----|---------------|-------|
| **pgAdmin** | http://localhost:5050 | admin@admin.com | admin |
| **RabbitMQ Management** | http://localhost:15672 | admin | password |
| **Nginx Gateway** | http://localhost | - | - |

## 📊 API Endpoint'leri

### Planner API (Port 3000)
- `POST /auth/login` - JWT token al
- `POST /shipments` - Sipariş oluştur
- `GET /shipments` - Tüm siparişleri listele
- `GET /shipments/{id}` - Sipariş detayı

### Driver API (Port 3001)
- `POST /auth/login` - JWT token al
- `POST /drivers` - Driver oluştur
- `GET /drivers` - Tüm driver'ları listele
- `POST /drivers/{id}/assign-shipment` - Sipariş ata
- `PUT /drivers/{id}/location` - Konum güncelle
- `GET /drivers/{id}/shipments` - Driver siparişleri

### ML Service (Port 8000)
- `GET /health` - Sağlık kontrolü
- `POST /optimize-route` - Rota optimizasyonu

## 🔧 Manuel Test Komutları

### JWT Token Al
```bash
# Planner API
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Driver API
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "driver", "password": "driver"}'
```

### Driver Oluştur
```bash
curl -X POST http://localhost:3001/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Ahmet Yılmaz",
    "licenseNumber": "TRAB123456",
    "vehicleType": "truck",
    "capacity": 2000,
    "currentLocation": "Istanbul, Turkey"
  }'
```

### Sipariş Oluştur
```bash
curl -X POST http://localhost:3000/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "origin": "Istanbul, Turkey",
    "destination": "Ankara, Turkey",
    "weight": 1000,
    "priority": "high",
    "estimatedDeliveryTime": "2024-01-15T10:00:00Z"
  }'
```

## 🐛 Sorun Giderme

### Servisler Başlamadıysa
```bash
# Container durumunu kontrol et
docker ps

# Log'ları izle
docker logs logistic-planner-api -f
docker logs logistic-driver-api -f
docker logs logistic-ml-service -f

# Sistemi yeniden başlat
docker-compose -f docker-compose.true-microservices.yml down
docker-compose -f docker-compose.true-microservices.yml up -d
```

### Authentication Hatası
- JWT secret key'in "DFDS-Tugra" olarak ayarlandığından emin olun
- Her iki serviste de aynı secret kullanılıyor

### Database Bağlantı Hatası
- PostgreSQL'in çalıştığından emin olun: `docker ps | grep postgres`
- pgAdmin'e giriş yaparak veritabanını kontrol edin

## 📈 Test Sonuçları

Başarılı test sonucunda şunları göreceksiniz:
- ✅ Rastgele driver oluşturuldu
- ✅ 3 adet sipariş oluşturuldu
- ✅ Siparişler driver'a atandı
- ✅ ML ile rota optimizasyonu yapıldı
- ✅ Driver konumu güncellendi

## 🎯 Özelleştirme

Script'leri özelleştirmek için:
- `generate_random_name()` fonksiyonunda isim listesini değiştirin
- `generate_random_location()` fonksiyonunda şehir listesini değiştirin
- Sipariş sayısını değiştirmek için `for i in {1..3}` kısmını düzenleyin

## 🚀 Sonraki Adımlar

1. **Performans Testi**: Apache Bench veya JMeter ile yük testi
2. **Monitoring**: Prometheus + Grafana kurulumu
3. **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
4. **CI/CD**: GitHub Actions ile otomatik test
5. **Security**: OWASP ZAP ile güvenlik testi

---

**Not:** Tüm test script'leri çalıştırılabilir durumda ve renkli terminal çıktısı ile kullanıcı dostu arayüz sunar. 