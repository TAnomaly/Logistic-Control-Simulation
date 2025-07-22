# 📮 Postman ile Lojistik Kontrol Simülasyon API Test Guide

Bu guide Postman kullanarak API'yi nasıl test edeceğinizi adım adım açıklar.

## 🔧 Başlangıç Ayarları

### 1. Base URL Environment Variable
Postman'de yeni bir Environment oluşturun:
- **Environment Name:** `Logistics API Local`
- **Variable:** `base_url`
- **Value:** `http://localhost:3000`

---

## 📋 API Endpoint'leri

### 1. 🏥 Health Check

**Method:** `GET`  
**URL:** `{{base_url}}/api/shipments/health`  
**Headers:** Yok  
**Body:** Yok  

**Beklenen Response:**
```json
{
    "success": true,
    "message": "Shipment service is running",
    "timestamp": "2025-07-22T12:41:06.233Z"
}
```

---

### 2. 📦 Yeni Gönderi Oluşturma

**Method:** `POST`  
**URL:** `{{base_url}}/api/shipments`  
**Headers:**
- `Content-Type: application/json`

**Body (raw - JSON):**
```json
{
    "senderName": "Ahmet Yılmaz",
    "senderAddress": "İstanbul, Türkiye",
    "receiverName": "Ayşe Kaya",
    "receiverAddress": "Ankara, Türkiye",
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15
}
```

**Beklenen Response:**
```json
{
    "success": true,
    "data": {
        "id": "26028c9f-84f2-4d44-aea4-3bc18e0e5bde",
        "trackingNumber": "LCS-20250722-7S5NBY",
        "status": "CREATED"
    },
    "message": "Gönderi başarıyla oluşturuldu"
}
```

**💡 Postman Tip:** Response'daki `trackingNumber`'ı bir variable olarak kaydedin:
```javascript
// Tests tabında bu kodu ekleyin
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("tracking_number", response.data.trackingNumber);
}
```

---

### 3. 🔍 Gönderi Takibi

**Method:** `GET`  
**URL:** `{{base_url}}/api/shipments/tracking/{{tracking_number}}`  
**Headers:** Yok  
**Body:** Yok  

**Manuel Test için URL:**
`{{base_url}}/api/shipments/tracking/LCS-20250722-7S5NBY`

**Beklenen Response:**
```json
{
    "success": true,
    "data": {
        "id": "26028c9f-84f2-4d44-aea4-3bc18e0e5bde",
        "trackingNumber": "LCS-20250722-7S5NBY",
        "senderName": "Ahmet Yılmaz",
        "senderAddress": "İstanbul, Türkiye",
        "receiverName": "Ayşe Kaya",
        "receiverAddress": "Ankara, Türkiye",
        "status": "CREATED",
        "weight": "2.50",
        "dimensions": {
            "length": "30.00",
            "width": "20.00",
            "height": "15.00",
            "volume": 9000
        },
        "estimatedDeliveryDate": null,
        "actualDeliveryDate": null,
        "createdAt": "2025-07-22T12:41:46.072Z",
        "updatedAt": "2025-07-22T12:41:46.072Z",
        "trackingEvents": []
    },
    "message": "Gönderi bilgileri başarıyla alındı"
}
```

---

### 4. 📋 Tüm Gönderi Listesi

**Method:** `GET`  
**URL:** `{{base_url}}/api/shipments`  
**Headers:** Yok  
**Body:** Yok  

**Query Parameters (opsiyonel):**
- `page`: 1 (sayfa numarası)
- `limit`: 10 (sayfa başına kayıt)
- `status`: CREATED (durum filtresi)

**Örnek URL'ler:**
- `{{base_url}}/api/shipments?page=1&limit=5`
- `{{base_url}}/api/shipments?status=CREATED`

**Beklenen Response:**
```json
{
    "success": true,
    "data": {
        "shipments": [],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 0,
            "totalPages": 0
        }
    },
    "message": "Gönderi listesi başarıyla alındı"
}
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Başarılı İş Akışı
1. Health check yapın
2. Yeni gönderi oluşturun
3. Tracking number'ı kaydedin
4. Gönderiyi tracking number ile sorgulayın

### Senaryo 2: Validation Testleri

**Eksik bilgilerle gönderi:**
```json
{
    "senderName": "",
    "weight": -1
}
```

**Beklenen Error Response:**
```json
{
    "success": false,
    "message": ["senderName should not be empty", "weight must be a positive number"],
    "error": "Bad Request"
}
```

### Senaryo 3: Olmayan Kayıt
**URL:** `{{base_url}}/api/shipments/tracking/NONEXISTENT-123`

**Beklenen Response:**
```json
{
    "success": false,
    "data": null,
    "message": "Gönderi bulunamadı"
}
```

---

## 📝 Postman Collection Import

### JSON Collection (Kopyala-Yapıştır):

```json
{
    "info": {
        "name": "Lojistik Kontrol Simülasyon API",
        "description": "API endpoint'leri test collection'ı",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "base_url",
            "value": "http://localhost:3000",
            "type": "string"
        }
    ],
    "item": [
        {
            "name": "Health Check",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/shipments/health",
                    "host": ["{{base_url}}"],
                    "path": ["api", "shipments", "health"]
                }
            }
        },
        {
            "name": "Create Shipment",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "if (pm.response.code === 201) {",
                            "    const response = pm.response.json();",
                            "    pm.environment.set('tracking_number', response.data.trackingNumber);",
                            "}"
                        ]
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"senderName\": \"Ahmet Yılmaz\",\n    \"senderAddress\": \"İstanbul, Türkiye\",\n    \"receiverName\": \"Ayşe Kaya\",\n    \"receiverAddress\": \"Ankara, Türkiye\",\n    \"weight\": 2.5,\n    \"length\": 30,\n    \"width\": 20,\n    \"height\": 15\n}"
                },
                "url": {
                    "raw": "{{base_url}}/api/shipments",
                    "host": ["{{base_url}}"],
                    "path": ["api", "shipments"]
                }
            }
        },
        {
            "name": "Track Shipment",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/shipments/tracking/{{tracking_number}}",
                    "host": ["{{base_url}}"],
                    "path": ["api", "shipments", "tracking", "{{tracking_number}}"]
                }
            }
        },
        {
            "name": "List Shipments",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{base_url}}/api/shipments?page=1&limit=10",
                    "host": ["{{base_url}}"],
                    "path": ["api", "shipments"],
                    "query": [
                        {"key": "page", "value": "1"},
                        {"key": "limit", "value": "10"}
                    ]
                }
            }
        }
    ]
}
```

---

## 🚀 Hızlı Başlangıç Adımları

1. **Postman'i açın**
2. **New Collection** oluşturun
3. **Environment** oluşturun (`base_url = http://localhost:3000`)
4. **İlk olarak Health Check** endpoint'ini test edin
5. **Gönderi oluşturun** ve tracking number'ı kaydedin
6. **Tracking endpoint'ini** test edin

---

## 💡 Postman İpuçları

### 1. Environment Variables Kullanın
- `{{base_url}}` yerine `http://localhost:3000` yazmayın
- Response'lardan değerleri otomatik kaydedin

### 2. Tests Yazın
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    pm.expect(pm.response.json()).to.have.property('success');
});
```

### 3. Pre-request Scripts
```javascript
// Random test data oluşturma
pm.globals.set("random_name", "Test User " + Math.floor(Math.random() * 1000));
```

### 4. Collection Runner
Tüm request'leri sırasıyla çalıştırmak için **Collection Runner** kullanın.

---

## 🔍 Debugging İpuçları

1. **Console açık tutun** (View → Show Postman Console)
2. **Network hatalarında** base_url'yi kontrol edin
3. **API çalışıyor mu?** Health check ile kontrol edin
4. **Headers doğru mu?** Content-Type kontrolü yapın
5. **JSON formatı** geçerli mi? JSON validator kullanın

Bu guide ile Postman'de API'yi rahatlıkla test edebilirsiniz! 🎯 