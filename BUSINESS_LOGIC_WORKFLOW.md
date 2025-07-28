# 🚚 Lojistik Kontrol Sistemi - Business Logic Workflow

## 📋 Sistem Genel Bakış

Bu sistem, modern lojistik operasyonlarını yönetmek için tasarlanmış mikroservis mimarisinde bir platformdur. Sürücü yönetimi, kargo takibi ve teslimat süreçlerini otomatize eder.

## 🏗️ Mimari Yapı

### **Mikroservisler:**
- **Driver API** (Port 3001): Sürücü yönetimi
- **Planner API** (Port 3000): Kargo planlama ve takip
- **Nginx Gateway** (Port 80): API Gateway
- **PostgreSQL**: Ana veritabanı
- **Redis**: Önbellek
- **RabbitMQ**: Mesaj kuyruğu

## 🔄 İş Akışı (Business Workflow)

### **1. Sürücü Kayıt Süreci**

#### **1.1 Sürücü Oluşturma**
```json
POST /api/drivers
{
    "name": "Tugra Mirac Kızılyazı",
    "licenseNumber": "TRK999888",
    "phoneNumber": "+905551234567",
    "address": "Kadıköy, İstanbul"
}
```

**Business Rules:**
- ✅ License number benzersiz olmalı
- ✅ Telefon numarası geçerli format olmalı
- ✅ İsim zorunlu alan
- ✅ Adres opsiyonel

**Response:**
```json
{
    "id": "06bc6440-94f8-473d-85a0-424f3bded6a0",
    "name": "Tugra Mirac Kızılyazı",
    "licenseNumber": "TRK999888",
    "status": "available",
    "currentLocation": null,
    "lastActiveAt": "2025-07-28T06:05:52.313Z"
}
```

#### **1.2 Sürücü Konum Güncelleme**
```json
PUT /api/drivers/{driverId}/location
{
    "latitude": 41.0422,
    "longitude": 29.0083,
    "address": "Beşiktaş Teslimat Merkezi",
    "speed": 0,
    "heading": 0
}
```

**Business Rules:**
- ✅ Koordinatlar geçerli olmalı
- ✅ Konum geçmişi saklanır
- ✅ Son aktif zaman güncellenir

### **2. Kargo Yönetim Süreci**

#### **2.1 Kargo Oluşturma**
```json
POST /api/shipments
{
    "trackingNumber": "TRK-TUGRA-001",
    "origin": "Kadıköy Depo",
    "destination": "Beşiktaş Teslimat",
    "description": "Tugra Mirac Test Kargo",
    "weight": 15.0,
    "volume": 0.3,
    "estimatedDeliveryDate": "2025-07-29T18:00:00.000Z"
}
```

**Business Rules:**
- ✅ Tracking number benzersiz olmalı
- ✅ Ağırlık ve hacim pozitif olmalı
- ✅ Menşei ve hedef zorunlu
- ✅ Tahmini teslimat tarihi opsiyonel

**Kargo Durumları:**
- `pending`: Bekliyor
- `assigned`: Sürücüye atandı
- `in_transit`: Yolda
- `delivered`: Teslim edildi
- `cancelled`: İptal edildi

#### **2.2 Kargo Atama Süreci**
```json
PUT /api/shipments/{shipmentId}/assign
{
    "driverId": "06bc6440-94f8-473d-85a0-424f3bded6a0"
}
```

**Business Rules:**
- ✅ Sürücü müsait olmalı
- ✅ Kargo bekliyor durumunda olmalı
- ✅ Event-driven mimari ile RabbitMQ'ya bildirim gönderilir

**Event Flow:**
1. Kargo atama komutu alınır
2. Sürücü durumu kontrol edilir
3. Kargo durumu güncellenir
4. `shipment.assigned` eventi RabbitMQ'ya gönderilir
5. Driver API eventi dinler ve sürücü durumunu günceller

### **3. Takip ve İzleme Süreci**

#### **3.1 Kargo Takibi**
```json
GET /api/shipments/tracking/{trackingNumber}
GET /api/shipments/{shipmentId}
```

#### **3.2 Sürücü Takibi**
```json
GET /api/drivers/{driverId}
GET /api/drivers/available
```

## 🎯 Business Logic Kuralları

### **Sürücü Yönetimi:**
1. **Kayıt:** Benzersiz license number zorunlu
2. **Durum:** available, busy, offline
3. **Konum:** Gerçek zamanlı GPS takibi
4. **Performans:** Teslimat geçmişi ve puanlama

### **Kargo Yönetimi:**
1. **Oluşturma:** Benzersiz tracking number
2. **Atama:** Müsait sürücü kontrolü
3. **Takip:** Gerçek zamanlı durum güncellemesi
4. **Teslimat:** Zaman ve konum doğrulaması

### **Sistem Kuralları:**
1. **Event-Driven:** Tüm işlemler event ile bildirilir
2. **Outbox Pattern:** Event güvenilirliği sağlanır
3. **Caching:** Redis ile performans optimizasyonu
4. **Monitoring:** Health check ve loglama

## 📊 Veri Modeli

### **Driver Entity:**
```typescript
{
    id: string;
    name: string;
    licenseNumber: string; // Unique
    phoneNumber: string;
    address?: string;
    status: DriverStatus;
    currentLocation: Location;
    lastActiveAt: Date;
    locationHistory: LocationHistory[];
}
```

### **Shipment Entity:**
```typescript
{
    id: string;
    trackingNumber: string; // Unique
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    status: ShipmentStatus;
    assignedDriverId?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    trackingEvents: TrackingEvent[];
}
```

## 🔄 Event Flow

### **Shipment Assigned Event:**
```typescript
{
    eventType: 'shipment.assigned',
    eventData: {
        shipmentId: string;
        driverId: string;
        trackingNumber: string;
        assignedAt: Date;
    }
}
```

### **Driver Location Updated Event:**
```typescript
{
    eventType: 'driver.location.updated',
    eventData: {
        driverId: string;
        latitude: number;
        longitude: number;
        address: string;
        speed?: number;
        heading?: number;
        recordedAt: Date;
    }
}
```

## 🚀 API Endpoint'leri

### **Driver API (Port 3001):**
- `POST /api/drivers` - Sürücü oluştur
- `PUT /api/drivers/{id}/location` - Konum güncelle
- `GET /api/drivers` - Tüm sürücüler
- `GET /api/drivers/available` - Müsait sürücüler
- `GET /api/drivers/{id}` - Sürücü detayı

### **Planner API (Port 3000):**
- `POST /api/shipments` - Kargo oluştur
- `PUT /api/shipments/{id}/assign` - Kargo ata
- `GET /api/shipments` - Tüm kargolar
- `GET /api/shipments/{id}` - Kargo detayı
- `GET /api/shipments/tracking/{number}` - Takip numarası ile ara

## 📈 Performans Metrikleri

### **Sürücü Metrikleri:**
- Teslimat sayısı
- Ortalama teslimat süresi
- Müşteri memnuniyet puanı
- Aktif çalışma süresi

### **Sistem Metrikleri:**
- API response time
- Event processing rate
- Database query performance
- Cache hit ratio

## 🔒 Güvenlik

### **Authentication:**
- JWT token tabanlı kimlik doğrulama
- Role-based access control
- API rate limiting

### **Data Protection:**
- PII (Personal Identifiable Information) şifreleme
- GDPR compliance
- Audit logging

## 🧪 Test Senaryoları

### **Senaryo 1: Tam Teslimat Süreci**
1. Sürücü kaydı
2. Kargo oluşturma
3. Kargo atama
4. Konum güncellemeleri
5. Teslimat tamamlama

### **Senaryo 2: Çoklu Kargo Yönetimi**
1. Birden fazla kargo oluşturma
2. Farklı sürücülere atama
3. Paralel teslimat takibi

### **Senaryo 3: Hata Senaryoları**
1. Müsait olmayan sürücüye atama
2. Geçersiz tracking number
3. Sistem kesintisi durumu

## 📝 Sonuç

Bu business logic workflow, modern lojistik operasyonlarının tüm temel ihtiyaçlarını karşılar:

✅ **Ölçeklenebilir Mikroservis Mimarisi**  
✅ **Event-Driven Communication**  
✅ **Real-time Tracking**  
✅ **Fault Tolerance**  
✅ **Performance Optimization**  
✅ **Business Rule Enforcement**  

Sistem, küçük ölçekli operasyonlardan büyük ölçekli lojistik ağlarına kadar genişletilebilir yapıdadır. 