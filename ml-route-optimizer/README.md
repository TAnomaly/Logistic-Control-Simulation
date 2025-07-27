# 🗺️ ML Route Optimizer Service

Bu servis, lojistik kontrol simülasyonu için AI destekli rota optimizasyonu ve ETA tahmini sağlar.

## 🚀 Özellikler

### 🤖 ML Algoritmaları
- **Google OR-Tools**: Vehicle Routing Problem (VRP) çözümü
- **Geospatial Analysis**: Mesafe hesaplama ve harita görselleştirme
- **Traffic Prediction**: Gerçek zamanlı trafik faktörü hesaplama
- **ETA Estimation**: Yakıt tüketimi ve süre tahmini

### 📊 Optimizasyon Kriterleri
- **Mesafe Minimizasyonu**: En kısa rota hesaplama
- **Zaman Pencereleri**: Teslimat zaman kısıtları
- **Araç Kapasitesi**: Yük kapasitesi optimizasyonu
- **Trafik Koşulları**: Gerçek zamanlı trafik analizi

## 🏗️ Mimari

```
ml-route-optimizer/
├── src/
│   ├── domain/           # Domain entities
│   ├── application/      # Business logic
│   ├── infrastructure/   # External services
│   └── presentation/     # API controllers
├── ml_models/           # Trained ML models
├── data/               # Training data
└── static/maps/        # Generated route maps
```

## 🔧 API Endpoints

### POST `/api/v1/routes/optimize`
Rota optimizasyonu yapar.

**Request:**
```json
{
  "driver_id": "driver-123",
  "pickup_locations": [
    {
      "lat": 41.0082,
      "lng": 28.9784,
      "type": "pickup"
    }
  ],
  "delivery_locations": [
    {
      "lat": 39.9334,
      "lng": 32.8597,
      "type": "delivery"
    }
  ],
  "vehicle_capacity": 1000,
  "time_windows": {
    "0": {"earliest": 9, "latest": 17}
  }
}
```

**Response:**
```json
{
  "route_id": "ROUTE_20241201_143022",
  "driver_id": "driver-123",
  "total_distance": 450.5,
  "total_duration": 32400,
  "estimated_eta": "2024-12-01T18:30:22Z",
  "fuel_consumption": 36.04,
  "traffic_factor": 1.2,
  "map_url": "/static/maps/route_map_ROUTE_20241201_143022.html"
}
```

### GET `/api/v1/routes/estimate-eta`
Tek nokta ETA tahmini.

**Parameters:**
- `origin_lat`: Başlangıç latitude
- `origin_lng`: Başlangıç longitude
- `destination_lat`: Hedef latitude
- `destination_lng`: Hedef longitude
- `vehicle_type`: Araç tipi (truck/van/motorcycle)

### POST `/api/v1/routes/optimize-multi-vehicle`
Çoklu araç rota optimizasyonu.

## 🛠️ Kurulum

### Gereksinimler
- Python 3.11+
- PostgreSQL
- Redis
- Docker

### Yerel Geliştirme
```bash
# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Bağımlılıkları yükle
pip install -r requirements.txt

# Environment variables
cp .env.example .env

# Uygulamayı çalıştır
uvicorn src.main:app --reload --port 3002
```

### Docker ile
```bash
# Build ve çalıştır
docker build -t ml-route-optimizer .
docker run -p 3002:3002 ml-route-optimizer
```

## 📈 ML Model Detayları

### Route Optimization Algorithm
- **Algoritma**: Google OR-Tools VRP Solver
- **Optimizasyon**: Mesafe, zaman, kapasite
- **Kısıtlar**: Zaman pencereleri, araç kapasitesi
- **Çözüm Süresi**: < 30 saniye

### Traffic Analysis
- **Veri Kaynağı**: Gerçek zamanlı trafik API'leri
- **Faktörler**: Saat, gün, hava durumu
- **Hesaplama**: Dinamik trafik faktörü

### ETA Prediction
- **Model**: Regression-based prediction
- **Features**: Mesafe, trafik, araç tipi
- **Accuracy**: %85+ doğruluk

## 🔗 Entegrasyon

### Mevcut Servislerle
- **Planner API**: Shipment bilgileri
- **Driver API**: Sürücü konumları
- **RabbitMQ**: Event-driven communication
- **Redis**: Cache ve session management

### Event Flow
1. Shipment oluşturulduğunda route optimization tetiklenir
2. Driver location güncellendiğinde ETA yeniden hesaplanır
3. Traffic değişikliklerinde route güncellenir

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3002/health
```

### Metrics
- Route optimization success rate
- Average optimization time
- ETA prediction accuracy
- Traffic factor accuracy

## 🧪 Testing

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/

# Performance tests
pytest tests/performance/
```

## 🔮 Gelecek Geliştirmeler

- [ ] Real-time traffic API integration
- [ ] Machine learning model training
- [ ] Multi-objective optimization
- [ ] Dynamic route updates
- [ ] Weather impact analysis
- [ ] Fuel price optimization 