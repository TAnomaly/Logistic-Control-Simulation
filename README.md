# Lojistik Kontrol Simülasyon Sistemi

Bu proje, modern yazılım mimarileri kullanarak geliştirilmiş kapsamlı bir lojistik kontrol simülasyon sistemidir. Domain Driven Design (DDD), CQRS, Outbox Pattern ve Event-Driven Architecture prensiplerini uygulayan, Kubernetes ortamında çalışacak şekilde tasarlanmış bir NestJS uygulamasıdır.

## 🏗️ Kullanılan Teknolojiler ve Mimari Desenler

### Teknolojiler
- **NestJS** - Backend framework
- **PostgreSQL** - Ana veritabanı
- **TypeORM** - ORM katmanı
- **Redis** - Cache ve message broker (gelecekte)
- **Docker & Docker Compose** - Container'laştırma
- **Kubernetes** - Orchestration ve deployment
- **Jest** - Unit testing framework
- **TypeScript** - Statik tip kontrolü

### Mimari Desenler
- **Domain Driven Design (DDD)** - Domain odaklı tasarım
- **CQRS (Command Query Responsibility Segregation)** - Okuma/yazma operasyonlarının ayrılması
- **SOLID Prensipler** - Temiz kod mimarisi
- **Outbox Pattern** - Güvenilir event publishing
- **Event Bus Process** - Event-driven architecture
- **Repository Pattern** - Data access layer abstraction

## 📁 Proje Yapısı

```
src/
├── domain/                     # Domain Layer (İş Mantığı)
│   ├── entities/              # Domain Entity'ler
│   │   ├── shipment.entity.ts        # Gönderi ana entity'si
│   │   ├── gate.entity.ts            # Kapı/Geçit entity'si
│   │   └── tracking-event.entity.ts  # İzleme olayları entity'si
│   ├── value-objects/         # Value Object'ler
│   │   ├── shipment-status.vo.ts     # Gönderi durumları
│   │   ├── gate-type.vo.ts           # Kapı türleri
│   │   └── tracking-event-type.vo.ts # Olay türleri
│   ├── events/                # Domain Events
│   │   └── shipment-created.event.ts # Gönderi oluşturma event'i
│   └── repositories/          # Repository Interface'ler
│       └── shipment.repository.ts     # Gönderi repository interface
├── application/               # Application Layer (Use Cases)
│   ├── commands/              # CQRS Commands
│   │   └── create-shipment.command.ts # Gönderi oluşturma komutu
│   ├── queries/               # CQRS Queries  
│   │   └── get-shipment-by-tracking.query.ts # Takip sorgusu
│   └── handlers/              # Command/Query Handler'ları
│       ├── create-shipment.handler.ts         # Gönderi oluşturma handler
│       ├── get-shipment-by-tracking.handler.ts # Takip sorgusu handler
│       └── __tests__/         # Unit testler
├── infrastructure/            # Infrastructure Layer
│   ├── database/             # Database konfigürasyonu
│   │   └── database.config.ts        # TypeORM config
│   └── repositories/         # Repository implementasyonları
│       └── typeorm-shipment.repository.ts # TypeORM gönderi repository
├── presentation/             # Presentation Layer (API)
│   └── controllers/          # REST API Controller'ları
│       └── shipment.controller.ts    # Gönderi API endpoint'leri
├── app.module.ts             # Ana uygulama modülü
├── logistics.module.ts       # Lojistik sistem modülü
└── main.ts                   # Uygulama giriş noktası
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose
- Kubernetes (isteğe bağlı)

### Yerel Geliştirme Ortamı

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Çevre değişkenlerini ayarlayın:**
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

3. **Docker Compose ile servisleri başlatın:**
```bash
docker-compose up -d postgres redis
```

4. **Uygulamayı geliştirme modunda çalıştırın:**
```bash
npm run start:dev
```

### Docker ile Tam Sistem

```bash
# Tüm servisleri başlatın (PostgreSQL, Redis, API, pgAdmin, Redis Commander)
docker-compose up -d

# Logları takip edin
docker-compose logs -f app
```

### Kubernetes Deployment

```bash
# Namespace oluşturun
kubectl apply -f k8s/namespace.yaml

# PostgreSQL'i deploy edin
kubectl apply -f k8s/postgres-deployment.yaml

# Uygulamayı deploy edin
kubectl apply -f k8s/app-deployment.yaml
```

## 🔧 API Endpoints

### Gönderi İşlemleri

#### Yeni Gönderi Oluşturma
```http
POST /api/shipments
Content-Type: application/json

{
  "senderName": "Ahmet Yılmaz",
  "senderAddress": "İstanbul, Türkiye",
  "receiverName": "Mehmet Demir", 
  "receiverAddress": "Ankara, Türkiye",
  "weight": 5.5,
  "length": 30,
  "width": 20,
  "height": 15,
  "estimatedDeliveryDate": "2024-12-31T10:00:00Z"
}
```

#### Gönderi Takibi
```http
GET /api/shipments/tracking/{trackingNumber}
```

#### Sistem Sağlık Kontrolü
```http
GET /api/shipments/health
```

## 📊 Lojistik Simülasyon Özellikleri

### Gönderi Takip Sistemi
- **Benzersiz takip numaraları** (Format: LCS-YYYYMMDD-XXXXXX)
- **Real-time durum güncellemeleri**
- **Geçmiş izleme olayları**

### Kapı ve Geçiş Noktaları Sistemi
- **10 farklı kapı türü** (Giriş, Çıkış, Sıralama, Depolama, vb.)
- **GPS koordinatları** ile lokasyon takibi
- **İş kuralları** ve kapı geçiş validasyonları
- **Kapıdan kapıya** süreç takibi

### İzleme Olayları
- **33 farklı olay türü** (Giriş, Çıkış, Sıralama, Kalite Kontrol, vb.)
- **Otomatik zaman damgaları**
- **Konum doğrulama** (GPS ile kapı lokasyonu karşılaştırması)
- **İş kuralları validasyonu**

### Gönderi Durumları
- **11 farklı durum** (Oluşturuldu, Transit, Teslimat, vb.)
- **Durum geçiş kuralları** ve validasyonları
- **Terminal durumlar** ve aktif süreç kontrolü

## 🧪 Test Yapısı

### Unit Testler
```bash
# Tüm testleri çalıştır
npm run test

# Test coverage raporu
npm run test:cov

# Watch modda testler
npm run test:watch
```

### Test Yapısı Örneği
- **Handler testleri** - CQRS command/query handler'ların testleri
- **Repository testleri** - Database işlemlerinin testleri
- **Domain logic testleri** - İş mantığı testleri
- **Integration testleri** - API endpoint testleri

## 🏛️ Mimari Açıklamaları

### Domain Driven Design (DDD)
- **Entities**: Gönderi, Kapı, İzleme Olayları
- **Value Objects**: Durum enums, iş kuralları
- **Aggregates**: Gönderi aggregate'i ile tracking events
- **Domain Events**: Gönderi oluşturma, durum değişimleri

### CQRS Implementation
- **Commands**: Yazma operasyonları (Gönderi oluşturma)
- **Queries**: Okuma operasyonları (Gönderi sorgulama)
- **Handlers**: Command ve query işleme mantığı
- **Separation**: Okuma ve yazma modelleri ayrılması

### Event-Driven Architecture
- **Domain Events**: İş olaylarının yayınlanması
- **Event Handlers**: Olay işleme mantığı
- **Outbox Pattern**: Güvenilir event delivery (gelecekte)

## 🌐 Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres-service
DB_NAME=logistic_control
DB_USERNAME=postgres
DB_PASSWORD=secure_password
DB_SYNC=false
DB_LOGGING=false
```

### Kubernetes Monitoring
- **Health Checks**: Liveness ve readiness probe'ları
- **HPA (Horizontal Pod Autoscaler)**: CPU/Memory bazlı otomatik scaling
- **Resource Limits**: Memory ve CPU sınırları
- **Security Context**: Non-root user, read-only filesystem

### Yönetim Arayüzleri
- **pgAdmin**: http://localhost:8080 (admin@logistic.com / admin123)
- **Redis Commander**: http://localhost:8081 (admin / admin123)

## 🔮 Gelecek Geliştirmeler

- [ ] Redis ile caching implementasyonu
- [ ] Outbox pattern ile event store
- [ ] JWT tabanlı authentication
- [ ] GraphQL API desteği
- [ ] Microservice architecture'e geçiş
- [ ] Advanced monitoring (Prometheus/Grafana)
- [ ] CI/CD pipeline kurulumu

## 📝 Lisans

Bu proje MIT lisansı altında geliştirilmiştir.
