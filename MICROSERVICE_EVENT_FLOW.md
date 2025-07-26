# Microservice Event Flow - Uçtan Uca Kurulum ve Test Dokümantasyonu

## 1. Genel Mimari

- **Microservice Yapısı:**
  - `planner-api`: Görev (assignment) atama ve yönetimi.
  - `driver-api`: Sürücülerin görevlerini event tabanlı olarak alması.
  - `RabbitMQ`: Servisler arası event iletişimi (Outbox Pattern ile).
  - `PostgreSQL`: Kalıcı veri saklama.
  - `Redis`: Cache, Pub/Sub ve hızlı veri erişimi.
  - `Docker Compose`: Tüm servislerin orkestrasyonu.

## 2. Docker Compose Servisleri

```yaml
services:
  postgres: ...
  redis: ...
  rabbitmq: ...
  planner-api:
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - REDIS_PASSWORD=redis_password
  driver-api:
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - REDIS_PASSWORD=redis_password
  pgadmin: ...
networks:
  logistic-network: ...
```

## 3. Outbox Pattern ve Event Akışı
- planner-api'da görev atanınca Outbox tablosuna event yazılır.
- OutboxService bu eventi RabbitMQ'ya publish eder.
- driver-api, RabbitMQ'dan eventleri dinler ve memory'ye işler.

## 4. Redis ve Postgres Bağlantı Ayarları
- Docker ortamında host olarak `postgres` ve `redis` kullanılır.
- Redis şifresi: `redis_password` (docker-compose'da tanımlı).

## 5. Uçtan Uca Test Senaryosu
1. **Driver UUID'si Al:**
   ```sh
   curl -s http://localhost:3000/api/drivers
   # Çıktıdan bir id al: örn. c651696d-120d-4b15-80c7-b89cfe118e15
   ```
2. **Görev Ata:**
   ```sh
   curl -X POST http://localhost:3000/api/assignments \
     -H "Content-Type: application/json" \
     -d '{"driverId": "c651696d-120d-4b15-80c7-b89cfe118e15", "taskType": "DELIVERY", "description": "Microservice event test"}'
   ```
3. **Driver API'da Görevleri Gör:**
   ```sh
   curl -s http://localhost:3001/api/assignments
   # Atanan görev burada listelenir
   ```

## 6. Karşılaşılan Sorunlar ve Çözümler
- **ECONNREFUSED/ENOTFOUND (RabbitMQ, Postgres, Redis):**
  - Docker ortamında host olarak servis adı (`postgres`, `redis`, `rabbitmq`) kullanılmalı.
- **Redis NOAUTH Authentication required:**
  - Redis şifresi environment olarak eklenmeli (`REDIS_PASSWORD=redis_password`).
- **Cannot find module '/usr/src/app/dist/main.js':**
  - Dockerfile'da doğru build path'i ve start komutu: `CMD ["node", "dist/src/main.js"]`
- **UUID Hatası:**
  - Görev atarken driverId olarak gerçek bir UUID kullanılmalı.
- **404 Not Found:**
  - Doğru endpoint: `/api/assignments`

## 7. Başarıyla Çalışan Akış
- Tüm servisler Docker Compose ile ayağa kalkar.
- planner-api üzerinden görev atanır.
- Outbox event RabbitMQ'ya publish edilir.
- driver-api eventi alır ve görevleri listeler.

## 8. Ek Notlar
- Tüm environment ayarları docker-compose üzerinden yönetilmeli.
- Kodda environment değişkenleri okunurken default olarak `localhost` yerine servis adı kullanılmalı.
- Testler için Postman/cURL örnekleri yukarıda verilmiştir.

---

Bu dokümantasyon, microservice event akışının Docker ortamında uçtan uca nasıl kurulduğunu, test edildiğini ve karşılaşılan tüm sorunların nasıl çözüldüğünü özetler. Herhangi bir yeni servis eklerken veya ortamı taşırken bu adımlar referans alınabilir. 