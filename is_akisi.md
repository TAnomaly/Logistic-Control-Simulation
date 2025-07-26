# 🚚 LOJİSTİK KONTROL SİMÜLASYONU - İŞ AKIŞI VE VERİ MODELLEME

## 📋 İÇİNDEKİLER
1. [Veri Modelleme Yaklaşımları](#veri-modelleme-yaklaşımları)
2. [İş Akışı Senaryoları](#iş-akışı-senaryoları)
3. [API Endpoint'leri](#api-endpointleri)
4. [Veri İlişkileri](#veri-ilişkileri)
5. [Pratik Örnekler](#pratik-örnekler)
6. [Sistem Mimarisi](#sistem-mimarisi)

---

## 🏗️ VERİ MODELLEME YAKLAŞIMLARI

### **Bizim Sistemimizdeki Yaklaşım: Assignment-Based**

#### **Veri Yapısı:**
```
DRIVERS (Sürücüler)
├── id, firstName, lastName, licensePlate
├── isActive, lastLatitude, lastLongitude
└── lastLocationUpdate

SHIPMENTS (Gönderiler)
├── id, trackingNumber, senderName, receiverName
├── weight, dimensions, status
└── createdAt, updatedAt

ASSIGNMENTS (Görevler)
├── id, taskType, status, description
├── driverId → DRIVERS.id (Foreign Key)
├── shipmentId → SHIPMENTS.id (Foreign Key)
└── assignedAt, createdAt, updatedAt

GATES (Kapılar)
├── id, gateCode, name, gateType
├── locationName, address
└── isActive, createdAt, updatedAt

TRACKING_EVENTS (Takip Olayları)
├── id, eventType, eventTimestamp
├── shipmentId → SHIPMENTS.id
├── gateId → GATES.id
└── description, processedBy
```

#### **İş Akışı Sırası:**
1. **Önce sürücü oluşturulur** (sistem kaydı)
2. **Sonra gönderi oluşturulur** (müşteri talebi)
3. **En son assignment yapılır** (görev ataması)

### **Alternatif Yaklaşımlar:**

| Yaklaşım | Avantajlar | Dezavantajlar |
|----------|------------|---------------|
| **Assignment-Based (Bizim)** | ✅ Esnek, geçmiş takibi, çoklu görev | ❌ Biraz karmaşık |
| **Shipment-Centric** | ✅ Basit, hızlı | ❌ Esneklik sınırlı |
| **Driver-Centric** | ✅ Sürücü odaklı | ❌ Gönderi takibi zor |

---

## 🔄 İŞ AKIŞI SENARYOLARI

### **Senaryo 1: Yeni Sürücü Kaydı**

```bash
# 1. Sürücü oluştur
curl -X POST http://localhost:3000/api/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mehmet",
    "lastName": "Kaya",
    "licensePlate": "34XYZ789",
    "isActive": true
  }'
```

**Sonuç:**
```json
{
  "id": "driver-uuid-1",
  "firstName": "Mehmet",
  "lastName": "Kaya", 
  "licensePlate": "34XYZ789",
  "isActive": true,
  "lastLatitude": null,
  "lastLongitude": null,
  "lastLocationUpdate": null,
  "createdAt": "2025-07-26T16:30:00Z",
  "updatedAt": "2025-07-26T16:30:00Z"
}
```

### **Senaryo 2: Gönderi Oluşturma**

```bash
# 2. Gönderi oluştur
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Istanbul Şirketi",
    "senderAddress": "Istanbul, Turkey",
    "receiverName": "Ankara Şirketi", 
    "receiverAddress": "Ankara, Turkey",
    "weight": 25.0,
    "length": 60,
    "width": 40,
    "height": 30
  }'
```

**Sonuç:**
```json
{
  "id": "shipment-uuid-1",
  "trackingNumber": "LCS-20250726-ABC123",
  "senderName": "Istanbul Şirketi",
  "senderAddress": "Istanbul, Turkey",
  "receiverName": "Ankara Şirketi",
  "receiverAddress": "Ankara, Turkey",
  "status": "CREATED",
  "weight": "25.00",
  "dimensions": {
    "length": "60.00",
    "width": "40.00",
    "height": "30.00",
    "volume": 72000
  },
  "estimatedDeliveryDate": null,
  "actualDeliveryDate": null,
  "createdAt": "2025-07-26T16:35:00Z",
  "updatedAt": "2025-07-26T16:35:00Z"
}
```

### **Senaryo 3: Görev Atama**

```bash
# 3. Sürücüye görev ata
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver-uuid-1",
    "taskType": "DELIVERY",
    "shipmentId": "shipment-uuid-1",
    "description": "Istanbul-Ankara teslimatı",
    "priority": "HIGH"
  }'
```

**Sonuç:**
```json
{
  "id": "assignment-uuid-1",
  "taskType": "DELIVERY",
  "status": "ASSIGNED",
  "description": "Istanbul-Ankara teslimatı",
  "assignedAt": "2025-07-26T16:40:00Z",
  
  "driver": {
    "id": "driver-uuid-1",
    "firstName": "Mehmet",
    "lastName": "Kaya",
    "licensePlate": "34XYZ789",
    "isActive": true
  },
  
  "shipment": {
    "id": "shipment-uuid-1",
    "trackingNumber": "LCS-20250726-ABC123",
    "senderName": "Istanbul Şirketi",
    "receiverName": "Ankara Şirketi",
    "status": "CREATED"
  },
  
  "createdAt": "2025-07-26T16:40:00Z",
  "updatedAt": "2025-07-26T16:40:00Z"
}
```

---

## 🌐 API ENDPOINT'LERİ

### **Sürücü Yönetimi**
```bash
# Sürücü oluştur
POST /api/drivers

# Sürücü listesi
GET /api/drivers

# Sürücü detayı
GET /api/drivers/{id}

# Sürücü konum güncelle
PUT /api/drivers/{id}/location

# Sürücü güncelle
PUT /api/drivers/{id}

# Sürücü sil
DELETE /api/drivers/{id}
```

### **Gönderi Yönetimi**
```bash
# Gönderi oluştur
POST /api/shipments

# Gönderi listesi
GET /api/shipments

# Gönderi detayı
GET /api/shipments/{id}

# Tracking ile gönderi bul
GET /api/shipments/tracking/{trackingNumber}

# Gönderi güncelle
PUT /api/shipments/{id}

# Gönderi sil
DELETE /api/shipments/{id}
```

### **Görev Yönetimi**
```bash
# Görev oluştur
POST /api/assignments

# Görev listesi
GET /api/assignments

# Görev detayı
GET /api/assignments/{id}

# Görev durumu güncelle
PUT /api/assignments/{id}/status

# Görev güncelle
PUT /api/assignments/{id}

# Görev sil
DELETE /api/assignments/{id}
```

### **Kapı Yönetimi**
```bash
# Kapı oluştur
POST /api/gates

# Kapı listesi
GET /api/gates

# Kapı detayı
GET /api/gates/{id}

# Kapı güncelle
PUT /api/gates/{id}

# Kapı sil
DELETE /api/gates/{id}
```

### **Tracking Event Yönetimi**
```bash
# Tracking event oluştur
POST /api/tracking-events

# Tracking event listesi
GET /api/tracking-events

# Tracking event detayı
GET /api/tracking-events/{id}

# Gönderiye göre tracking events
GET /api/tracking-events/shipment/{shipmentId}
```

---

## 🔗 VERİ İLİŞKİLERİ

### **Assignment Sorgulama - Tam Çıktı**

```bash
# Assignment listesi
curl http://localhost:3000/api/assignments
```

**Çıktı:**
```json
[
  {
    "id": "fe3af8fd-2d67-42a1-bce7-32777dc3cf3d",
    "taskType": "DELIVERY",
    "status": "IN_PROGRESS",
    "description": "Ankara teslimatı",
    "assignedAt": "2025-07-26T16:26:24.932Z",
    
    // 🚗 DRIVER BİLGİLERİ
    "driver": {
      "id": "122459a6-a6a5-4a27-837e-acf5e15be1e3",
      "firstName": "Ali",
      "lastName": "Veli", 
      "licensePlate": "34ABC123",
      "isActive": true,
      "lastLatitude": "39.93340000",
      "lastLongitude": "32.85970000",
      "lastLocationUpdate": "2025-07-26T16:48:03.291Z",
      "createdAt": "2025-07-26T16:26:09.745Z",
      "updatedAt": "2025-07-26T16:48:03.292Z"
    },
    
    // 📦 SHIPMENT BİLGİLERİ
    "shipment": {
      "id": "8afe16ef-6d7c-4622-8627-166fac018c3d",
      "trackingNumber": "LCS-20250726-AX7M3N",
      "senderName": "Ahmet Yılmaz",
      "senderAddress": "Istanbul, Turkey",
      "receiverName": "Mehmet Demir", 
      "receiverAddress": "Ankara, Turkey",
      "status": "CREATED",
      "weight": "5.50",
      "dimensions": {
        "length": "30.00",
        "width": "20.00",
        "height": "15.00",
        "volume": 9000
      },
      "estimatedDeliveryDate": null,
      "actualDeliveryDate": null,
      "createdAt": "2025-07-26T16:25:47.152Z",
      "updatedAt": "2025-07-26T16:25:47.152Z"
    },
    
    "createdAt": "2025-07-26T16:26:24.932Z",
    "updatedAt": "2025-07-26T16:48:10.328Z"
  }
]
```

### **Tracking Event Sorgulama**

```bash
# Tracking event oluştur
curl -X POST http://localhost:3000/api/tracking-events \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "8afe16ef-6d7c-4622-8627-166fac018c3d",
    "gateId": "09f3aca3-a708-461b-89a9-3b81aa5462fe",
    "eventType": "ENTRY",
    "description": "Gönderi teslim alındı",
    "processedBy": "Ali Veli"
  }'
```

**Çıktı:**
```json
{
  "id": "tracking-event-uuid-1",
  "eventType": "ENTRY",
  "eventTimestamp": "2025-07-26T16:50:00Z",
  "description": "Gönderi teslim alındı",
  "processedBy": "Ali Veli",
  "isSystemGenerated": false,
  
  // 📦 SHIPMENT BİLGİLERİ
  "shipment": {
    "id": "8afe16ef-6d7c-4622-8627-166fac018c3d",
    "trackingNumber": "LCS-20250726-AX7M3N",
    "senderName": "Ahmet Yılmaz",
    "receiverName": "Mehmet Demir"
  },
  
  // 🚪 GATE BİLGİLERİ
  "gate": {
    "id": "09f3aca3-a708-461b-89a9-3b81aa5462fe",
    "gateCode": "IST-GATE-001",
    "name": "Istanbul Entry Gate",
    "gateType": "ENTRY",
    "locationName": "Istanbul",
    "address": "Istanbul Airport, Terminal 1"
  },
  
  "createdAt": "2025-07-26T16:50:00Z"
}
```

---

## 🎯 PRATİK ÖRNEKLER

### **Tam Süreç Senaryosu: Istanbul'dan Ankara'ya Teslimat**

#### **1. Gönderi Oluşturma**
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Istanbul Şirketi",
    "senderAddress": "Istanbul, Turkey",
    "receiverName": "Ankara Şirketi", 
    "receiverAddress": "Ankara, Turkey",
    "weight": 25.0,
    "length": 60,
    "width": 40,
    "height": 30
  }'
```

#### **2. Sürücü Atama**
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver-uuid-1",
    "taskType": "DELIVERY",
    "shipmentId": "shipment-uuid-1",
    "description": "Istanbul-Ankara teslimatı"
  }'
```

#### **3. Istanbul Kapısı - Giriş**
```bash
curl -X POST http://localhost:3000/api/tracking-events \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "shipment-uuid-1",
    "gateId": "istanbul-gate-uuid",
    "eventType": "ENTRY",
    "description": "Istanbul'dan çıkış",
    "processedBy": "Ali Veli"
  }'
```

#### **4. Yolda Konum Güncellemeleri**
```bash
# Bolu civarı
curl -X PUT http://localhost:3000/api/drivers/driver-uuid-1/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 40.0, "longitude": 30.0}'

# Ankara yakını
curl -X PUT http://localhost:3000/api/drivers/driver-uuid-1/location \
  -H "Content-Type: application/json" \
  -d '{"latitude": 39.9, "longitude": 32.8}'
```

#### **5. Ankara Kapısı - Giriş**
```bash
curl -X POST http://localhost:3000/api/tracking-events \
  -H "Content-Type: application/json" \
  -d '{
    "shipmentId": "shipment-uuid-1", 
    "gateId": "ankara-gate-uuid",
    "eventType": "ENTRY",
    "description": "Ankara'ya varış",
    "processedBy": "Ali Veli"
  }'
```

#### **6. Teslimat Tamamlama**
```bash
curl -X PUT http://localhost:3000/api/assignments/assignment-uuid-1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'
```

### **Farklı Sorgulama Türleri**

#### **A) Sürücüye Göre Assignment'lar**
```bash
curl "http://localhost:3000/api/assignments?driverId=driver-uuid-1"
```

#### **B) Duruma Göre Assignment'lar**
```bash
curl "http://localhost:3000/api/assignments?status=IN_PROGRESS"
```

#### **C) Gönderiye Göre Assignment'lar**
```bash
curl "http://localhost:3000/api/assignments?shipmentId=shipment-uuid-1"
```

#### **D) Tracking Number ile Gönderi Takibi**
```bash
curl "http://localhost:3000/api/shipments/tracking/LCS-20250726-ABC123"
```

---

## 🏛️ SİSTEM MİMARİSİ

### **Katmanlar**
1. **Presentation Layer** → REST API Controller'lar
2. **Application Layer** → CQRS Command/Query Handler'lar
3. **Domain Layer** → Entity'ler, Value Object'ler, Domain Event'ler
4. **Infrastructure Layer** → Repository'ler, Database, Cache

### **Teknolojiler**
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Architecture**: CQRS + Event-Driven + DDD

### **Veri İlişkileri**
```typescript
// Assignment Entity
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  taskType: string;

  @Column()
  status: string;

  // 🚗 DRIVER İLİŞKİSİ
  @ManyToOne(() => Driver, { eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  // 📦 SHIPMENT İLİŞKİSİ  
  @ManyToOne(() => Shipment, { eager: true })
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  // 🚪 TRACKING EVENTS İLİŞKİSİ
  @OneToMany(() => TrackingEvent, event => event.assignment)
  trackingEvents: TrackingEvent[];
}
```

### **Durum Yönetimi**

#### **Assignment Durumları:**
- `ASSIGNED` → Görev atandı
- `IN_PROGRESS` → Yolda
- `COMPLETED` → Tamamlandı
- `CANCELLED` → İptal edildi

#### **Shipment Durumları:**
- `CREATED` → Oluşturuldu
- `IN_TRANSIT` → Yolda
- `DELIVERED` → Teslim edildi
- `RETURNED` → İade edildi

#### **Tracking Event Türleri:**
- `ENTRY` → Giriş
- `EXIT` → Çıkış
- `SCAN` → Tarama
- `WEIGH` → Ağırlık ölçümü
- `DELIVERY` → Teslimat

---

## 📊 ÖZET

### **Assignment Sorgulandığında Çıkan Bilgiler:**

| Kategori | Bilgiler |
|----------|----------|
| **🚗 Driver** | İsim, soyisim, plaka, konum, aktiflik |
| **📦 Shipment** | Tracking number, gönderici, alıcı, ağırlık, boyutlar |
| **🚪 Gate** | Tracking events üzerinden gate bilgileri |
| **📋 Assignment** | Görev türü, durum, açıklama, zamanlar |

### **İş Akışı Sırası:**
1. **Sürücü oluştur** → Sistem kaydı
2. **Gönderi oluştur** → Müşteri talebi
3. **Assignment yap** → Görev ataması
4. **Tracking events ekle** → Süreç takibi
5. **Durum güncelle** → İlerleme takibi

### **Avantajlar:**
- ✅ **Esnek** ve **ölçeklenebilir** yapı
- ✅ **Geçmiş takibi** mümkün
- ✅ **Çoklu görev** desteği
- ✅ **Real-time tracking**
- ✅ **Event-driven architecture**
- ✅ **CQRS pattern**
- ✅ **Domain-driven design**

**Sonuç:** Tek sorguda tüm ilişkili veriler geliyor! 🎯 