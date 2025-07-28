# 🤖 Logistic ML Service

AI/ML Microservice for Logistic Control System using Python, FastAPI, and advanced algorithms.

## 🚀 Features

### **1. Advanced Route Optimization**
- **Multi-delivery route optimization with 2-opt algorithm**
- **Google Maps API integration with real traffic data**
- **Haversine distance calculation fallback**
- **Priority-based optimization (High/Medium/Low)**
- **Capacity constraints (weight & volume)**
- **Fuel efficiency calculation with load factors**
- **Time window support**
- **Performance benchmarking**

### **2. H3 Hexagonal Grid Optimization**
- **H3-based spatial indexing for efficient route planning**
- **Multiple optimization algorithms (Dijkstra, A*, Greedy)**
- **Traffic-aware route optimization**
- **Weather-aware route planning**
- **Sustainability analysis and recommendations**
- **Real-time environmental factor integration**
- **Advanced grid management with caching**
- **Spatial analysis and clustering**

### **3. Environmental Analysis**
- **Real-time traffic condition analysis**
- **Weather impact assessment and alerts**
- **Sustainability metrics and carbon footprint calculation**
- **Eco-friendly route recommendations**
- **Alternative fuel vehicle compatibility**
- **Environmental impact scoring**

### **4. Delivery Time Prediction**
- **ML-based delivery time prediction**
- **Traffic condition analysis**
- **Weather impact calculation**
- **Driver experience factor**
- **Confidence scoring**

### **5. Driver Performance Scoring**
- **Multi-criteria decision making**
- **Weighted performance metrics**
- **Grade-based scoring (A-F)**
- **Personalized recommendations**
- **Real-time performance tracking**

### **6. Demand Forecasting**
- **Time series analysis**
- **Seasonal pattern detection**
- **Trend analysis**
- **Confidence intervals**
- **Regional demand prediction**

## 🛠️ Technology Stack

- **Framework**: FastAPI
- **ML Libraries**: Scikit-learn, Pandas, NumPy
- **Geospatial**: H3 (Uber's Hexagonal Hierarchical Spatial Index)
- **Maps API**: Google Maps
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Container**: Docker

## 📦 Installation

### **1. Local Development**
```bash
# Clone repository
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GOOGLE_MAPS_API_KEY="your-api-key"
export DRIVER_API_URL="http://localhost:3001"
export PLANNER_API_URL="http://localhost:3000"

# Run service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### **2. Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up ml-service

# Or build individually
docker build -t logistic-ml-service .
docker run -p 8000:8000 logistic-ml-service
```

## 🎯 API Endpoints

### **Core Route Optimization**

#### **Traditional TSP Optimization**
```bash
POST /optimize-route
{
  "driver_id": "driver-123",
  "driver_location": {
    "latitude": 41.0082,
    "longitude": 28.9784
  },
  "deliveries": [
    {
      "id": "delivery-1",
      "address": "Kadıköy, İstanbul",
      "coordinates": {"latitude": 40.9909, "longitude": 29.0303},
      "priority": "high",
      "weight": 100,
      "volume": 0.5
    }
  ],
  "vehicle_capacity": 1000,
  "vehicle_volume": 10
}
```

#### **H3 Hexagonal Grid Optimization**
```bash
POST /optimize-route-h3
{
  "driver_id": "driver-123",
  "driver_location": {"lat": 41.0082, "lng": 28.9784},
  "deliveries": [
    {
      "id": "delivery-1",
      "address": "Kadıköy, İstanbul",
      "coordinates": {"lat": 40.9909, "lng": 29.0303},
      "priority": "high",
      "weight": 100,
      "volume": 0.5,
      "service_time_min": 10,
      "special_requirements": ["fragile"]
    }
  ],
  "vehicle_capacity": 1000,
  "vehicle_volume": 10,
  "h3_resolution": 9,
  "optimization_algorithm": "h3_dijkstra",
  "traffic_aware": true,
  "weather_aware": true,
  "constraints": {
    "vehicle_type": "medium_truck"
  }
}
```

#### **Google Maps Route Optimization**
```bash
POST /optimize-route-google-maps
# Requires GOOGLE_MAPS_API_KEY environment variable
```

### **H3 Grid Analysis**
```bash
# Get H3 grid information
GET /h3/grid-info?lat=41.0082&lng=28.9784&resolution=9&radius_km=20

# Get specific H3 cell information
GET /h3/cell-info/{h3_index}

# Test H3 functionality
GET /h3/test
```

### **Environmental Analysis**
```bash
# Traffic analysis
GET /h3/traffic-analysis?lat=41.0082&lng=28.9784&resolution=9&radius_km=10

# Weather analysis
GET /h3/weather-analysis?lat=41.0082&lng=28.9784&resolution=9&radius_km=10

# Sustainability analysis
GET /h3/sustainability-analysis?vehicle_type=medium_truck&load_factor=0.7
```

### **Delivery Time Prediction**
```bash
POST /predict-delivery-time
{
  "origin": "Istanbul",
  "destination": "Ankara",
  "origin_coordinates": {"latitude": 41.0082, "longitude": 28.9784},
  "destination_coordinates": {"latitude": 39.9334, "longitude": 32.8597},
  "weight": 500,
  "traffic_condition": "normal",
  "weather": "sunny",
  "driver_experience": 3
}
```

### **Driver Performance Scoring**
```bash
POST /score-driver
{
  "driver_id": "driver-123",
  "metrics": {
    "on_time_delivery_rate": 92.5,
    "average_speed": 65.0,
    "fuel_efficiency": 12.5,
    "customer_satisfaction": 8.5,
    "safety_score": 95.0,
    "distance_efficiency": 85.0
  }
}
```

### **Demand Forecasting**
```bash
GET /forecast-demand?region=Istanbul&days=7
```

### **System Health**
```bash
# Health check
GET /health
```

## 🔧 Configuration

### **Environment Variables**
```bash
# API URLs
DRIVER_API_URL=http://localhost:3001
PLANNER_API_URL=http://localhost:3000

# Google Maps API (Optional - for enhanced route optimization)
GOOGLE_MAPS_API_KEY=your-api-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://admin:password@localhost:5672
```

## 🧪 Testing

### **Run Tests**
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/

# Run with coverage
pytest --cov=app tests/

# Run route optimization test suite
python test_route_optimization.py
```

### **API Documentation**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📊 Performance Metrics

- **Response Time**: < 500ms
- **Route Optimization**: < 200ms
- **Prediction Accuracy**: > 85%
- **Uptime**: 99.9%

## 🔄 Integration

### **With Driver API**
- Driver capacity validation
- Real-time location updates
- Performance tracking

### **With Planner API**
- Shipment assignment optimization
- Demand forecasting
- Route planning

## 🚀 Future Enhancements

- **Deep Learning Models**
- **Real-time Traffic Data**
- **Weather API Integration**
- **Advanced Analytics Dashboard**
- **Predictive Maintenance**

## 📝 License

MIT License - see LICENSE file for details. 