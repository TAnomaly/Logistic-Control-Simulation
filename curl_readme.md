# 🧪 Lojistik Kontrol Simülasyon API - cURL Test Komutları

Bu dokümanda sistemin tüm API endpoint'lerini test etmek için kullanabileceğiniz cURL komutları ve örnek response'lar bulunmaktadır.

## 🌐 Base URL
```
http://localhost:3000
```

---

## 1. 🏥 Health Check

### Komut:
```bash
curl -s http://localhost:3000/api/shipments/health
```

### Response:
```json
{
  "success": true,
  "message": "Shipment service is running",
  "timestamp": "2025-07-22T12:41:06.233Z"
}
```

---

## 2. 📦 Yeni Gönderi Oluşturma (POST)

### Komut:
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Ahmet Yılmaz",
    "senderAddress": "İstanbul, Türkiye", 
    "receiverName": "Ayşe Kaya",
    "receiverAddress": "Ankara, Türkiye",
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15
  }'
```

### Response:
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

---

## 3. 🔍 Gönderi Takibi (GET by Tracking Number)

### Komut:
```bash
curl -s http://localhost:3000/api/shipments/tracking/LCS-20250722-7S5NBY
```

### Response:
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

## 4. 📋 Tüm Gönderileri Listeleme (GET)

### Komut:
```bash
curl -s http://localhost:3000/api/shipments
```

### Response:
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

### Sayfa ve limit ile:
```bash
curl -s "http://localhost:3000/api/shipments?page=1&limit=5"
```

### Duruma göre filtreleme:
```bash
curl -s "http://localhost:3000/api/shipments?status=CREATED"
```

---

## 🔧 Gelişmiş Test Örnekleri

### 1. Farklı Boyutlarda Gönderi:
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Mehmet Öztürk",
    "senderAddress": "Bursa, Türkiye",
    "receiverName": "Fatma Demir",
    "receiverAddress": "İzmir, Türkiye",
    "weight": 15.3,
    "length": 60,
    "width": 40,
    "height": 25,
    "estimatedDeliveryDate": "2025-07-25T10:00:00Z"
  }'
```

### 2. Validation Error Test:
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "",
    "weight": -1
  }'
```

### 3. Olmayan Tracking Number:
```bash
curl -s http://localhost:3000/api/shipments/tracking/NONEXISTENT-123
```

---

## 📊 Response Format

Tüm API response'ları aşağıdaki standart formatı takip eder:

```json
{
  "success": boolean,
  "data": object | null,
  "message": string,
  "timestamp": string (ISO 8601)
}
```

### Error Response Örneği:
```json
{
  "success": false,
  "data": null,
  "message": "Gönderi bulunamadı",
  "error": "NOT_FOUND",
  "timestamp": "2025-07-22T12:45:00.000Z"
}
```

---

## 🎯 Test Sırası Önerisi

1. **Health check** - sistemin çalıştığını doğrula
2. **Gönderi oluştur** - yeni bir gönderi oluştur ve tracking number'ı not al
3. **Gönderi takibi** - oluşturulan gönderiyi tracking number ile sorgula
4. **Gönderi listesi** - tüm gönderileri listele

---

## 🚀 Hızlı Test Script'i

Tüm endpoint'leri sırasıyla test etmek için:

```bash
#!/bin/bash
echo "🏥 Health Check..."
curl -s http://localhost:3000/api/shipments/health | jq

echo -e "\n📦 Creating shipment..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/shipments \
  -H "Content-Type: application/json" \
  -d '{"senderName":"Test User","senderAddress":"Test Address","receiverName":"Receiver","receiverAddress":"Receiver Address","weight":1.5,"length":20,"width":15,"height":10}')
echo $RESPONSE | jq

TRACKING_NUMBER=$(echo $RESPONSE | jq -r '.data.trackingNumber')

echo -e "\n🔍 Tracking shipment: $TRACKING_NUMBER"
curl -s http://localhost:3000/api/shipments/tracking/$TRACKING_NUMBER | jq

echo -e "\n📋 Listing all shipments..."
curl -s http://localhost:3000/api/shipments | jq
```

**Not:** `jq` komutu JSON'u güzel formatlar. Yüklemek için: `brew install jq` (macOS) veya `apt install jq` (Ubuntu). 

---

## 📝 Assignment (Görev) Yönetimi

### 1. Yeni Assignment Oluşturma (POST)
```bash
curl -X POST http://localhost:3000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "cf4411fe-5fcb-4cc8-a27b-e8453ab171a4",
    "taskType": "DELIVERY",
    "description": "Test assignment"
  }'
```
#### Response:
```json
{
  "id": "cd98e1e8-0823-4ec3-bb8d-167cd106ea44",
  "taskType": "DELIVERY",
  "driver": { ... },
  "status": "ASSIGNED",
  "assignedAt": "2025-07-24T06:30:14.203Z",
  "description": "Test assignment",
  "createdAt": "2025-07-24T06:30:14.203Z",
  "updatedAt": "2025-07-24T06:30:14.203Z"
}
```

### 2. Assignment Silme (DELETE)
```bash
curl -X DELETE http://localhost:3000/api/assignments/cd98e1e8-0823-4ec3-bb8d-167cd106ea44 -w "\nHTTP Status: %{http_code}\n" -s
```
#### Response:
```
HTTP Status: 204
```

### 3. Assignment Güncelleme (PUT)
```bash
curl -X PUT http://localhost:3000/api/assignments/cd98e1e8-0823-4ec3-bb8d-167cd106ea44 \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "PICKUP",
    "description": "Güncellenmiş açıklama",
    "driverId": "dc3df3c1-1f0b-4656-aa35-f4eba5167228"
  }'
```
#### Response:
```json
{
  "id": "cd98e1e8-0823-4ec3-bb8d-167cd106ea44",
  "taskType": "PICKUP",
  "driver": { ... },
  "status": "ASSIGNED",
  "assignedAt": "2025-07-24T06:30:14.203Z",
  "description": "Güncellenmiş açıklama",
  "createdAt": "2025-07-24T06:30:14.203Z",
  "updatedAt": "2025-07-24T06:35:00.000Z"
}
```

### 4. Tüm Assignment'ları Listeleme (GET)
```bash
curl -s http://localhost:3000/api/assignments
```
#### Response:
```json
[
  {
    "id": "cd98e1e8-0823-4ec3-bb8d-167cd106ea44",
    "taskType": "DELIVERY",
    "driver": { ... },
    "status": "ASSIGNED",
    "assignedAt": "2025-07-24T06:30:14.203Z",
    "description": "Test assignment",
    "createdAt": "2025-07-24T06:30:14.203Z",
    "updatedAt": "2025-07-24T06:30:14.203Z"
  }
]
``` 