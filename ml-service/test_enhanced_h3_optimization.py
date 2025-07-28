#!/usr/bin/env python3
"""
Enhanced H3 Route Optimization Test Script
Tests the new traffic, weather, and sustainability analysis features
"""

import asyncio
import json
import time
from typing import Dict, List

# Mock data for testing
def create_test_deliveries() -> List[Dict]:
    """Create test delivery data"""
    return [
        {
            "id": "delivery-1",
            "address": "Kadıköy, İstanbul",
            "coordinates": {"lat": 40.9909, "lng": 29.0303},
            "priority": "high",
            "weight": 150.0,
            "volume": 2.0,
            "service_time_min": 10,
            "special_requirements": ["fragile"]
        },
        {
            "id": "delivery-2", 
            "address": "Beşiktaş, İstanbul",
            "coordinates": {"lat": 41.0422, "lng": 29.0083},
            "priority": "medium",
            "weight": 200.0,
            "volume": 3.0,
            "service_time_min": 15,
            "special_requirements": ["refrigerated"]
        },
        {
            "id": "delivery-3",
            "address": "Şişli, İstanbul", 
            "coordinates": {"lat": 41.0602, "lng": 28.9877},
            "priority": "low",
            "weight": 100.0,
            "volume": 1.5,
            "service_time_min": 8,
            "special_requirements": []
        },
        {
            "id": "delivery-4",
            "address": "Bakırköy, İstanbul",
            "coordinates": {"lat": 40.9819, "lng": 28.8772},
            "priority": "medium",
            "weight": 180.0,
            "volume": 2.5,
            "service_time_min": 12,
            "special_requirements": ["express"]
        },
        {
            "id": "delivery-5",
            "address": "Üsküdar, İstanbul",
            "coordinates": {"lat": 41.0235, "lng": 29.0122},
            "priority": "high",
            "weight": 120.0,
            "volume": 1.8,
            "service_time_min": 10,
            "special_requirements": ["fragile", "express"]
        }
    ]

def create_test_request() -> Dict:
    """Create test optimization request"""
    return {
        "driver_id": "driver-001",
        "driver_location": {"lat": 41.0082, "lng": 28.9784},  # Istanbul center
        "deliveries": create_test_deliveries(),
        "vehicle_capacity": 1000.0,
        "vehicle_volume": 10.0,
        "h3_resolution": 9,
        "optimization_algorithm": "h3_dijkstra",
        "traffic_aware": True,
        "weather_aware": True,
        "real_time_updates": False,
        "constraints": {
            "vehicle_type": "medium_truck",
            "max_route_time": 480,  # 8 hours
            "prefer_highways": True
        }
    }

async def test_h3_optimization():
    """Test H3 route optimization with enhanced features"""
    print("🚀 Testing Enhanced H3 Route Optimization")
    print("=" * 50)
    
    # Import required modules
    try:
        from app.models.h3_schemas import H3RouteOptimizationRequest, H3DeliveryRequest
        from app.services.h3_optimizer import h3_optimizer
        from app.services.traffic_analyzer import traffic_analyzer
        from app.services.weather_analyzer import weather_analyzer
        from app.services.sustainability_analyzer import sustainability_analyzer
        from app.services.grid_manager import grid_manager
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return
    
    # Create test request
    test_data = create_test_request()
    
    # Convert to H3DeliveryRequest objects
    h3_deliveries = []
    for delivery in test_data["deliveries"]:
        h3_delivery = H3DeliveryRequest(
            id=delivery["id"],
            address=delivery["address"],
            coordinates=delivery["coordinates"],
            priority=delivery["priority"],
            weight=delivery["weight"],
            volume=delivery["volume"],
            service_time_min=delivery["service_time_min"],
            special_requirements=delivery["special_requirements"]
        )
        h3_deliveries.append(h3_delivery)
    
    # Create H3RouteOptimizationRequest
    request = H3RouteOptimizationRequest(
        driver_id=test_data["driver_id"],
        driver_location=test_data["driver_location"],
        deliveries=h3_deliveries,
        vehicle_capacity=test_data["vehicle_capacity"],
        vehicle_volume=test_data["vehicle_volume"],
        h3_resolution=test_data["h3_resolution"],
        optimization_algorithm=test_data["optimization_algorithm"],
        traffic_aware=test_data["traffic_aware"],
        weather_aware=test_data["weather_aware"],
        real_time_updates=test_data["real_time_updates"],
        constraints=test_data["constraints"]
    )
    
    print(f"📦 Testing with {len(h3_deliveries)} deliveries")
    print(f"📍 Driver location: {request.driver_location}")
    print(f"🔧 Algorithm: {request.optimization_algorithm}")
    print(f"🚦 Traffic aware: {request.traffic_aware}")
    print(f"🌤️ Weather aware: {request.weather_aware}")
    print()
    
    # Test individual components
    print("🧪 Testing Individual Components")
    print("-" * 30)
    
    # Test traffic analysis
    print("🚦 Testing Traffic Analysis...")
    try:
        # Create a test cell
        from app.models.h3_schemas import H3Cell
        test_cell = H3Cell.from_h3_index("8928308280fffff")  # Istanbul area
        traffic_analysis = traffic_analyzer.analyze_traffic_for_cell(test_cell)
        print(f"✅ Traffic analysis: {traffic_analysis.traffic_condition.value}")
        print(f"   Congestion level: {traffic_analysis.congestion_level:.2f}")
        print(f"   Average speed: {traffic_analysis.average_speed_kmh:.1f} km/h")
    except Exception as e:
        print(f"❌ Traffic analysis failed: {e}")
    
    # Test weather analysis
    print("\n🌤️ Testing Weather Analysis...")
    try:
        weather_analysis = weather_analyzer.analyze_weather_for_cell(test_cell)
        print(f"✅ Weather analysis: {weather_analysis.weather_condition.value}")
        print(f"   Temperature: {weather_analysis.temperature_celsius:.1f}°C")
        print(f"   Humidity: {weather_analysis.humidity_percent:.1f}%")
        print(f"   Wind speed: {weather_analysis.wind_speed_kmh:.1f} km/h")
        print(f"   Impact factor: {weather_analysis.impact_factor:.2f}")
    except Exception as e:
        print(f"❌ Weather analysis failed: {e}")
    
    # Test sustainability analysis
    print("\n🌱 Testing Sustainability Analysis...")
    try:
        # Gerçek bir H3OptimizedRoute oluştur
        from app.models.h3_schemas import H3OptimizedRoute, H3RouteSegment, H3Grid, H3Cell
        dummy_cell = H3Cell.from_h3_index("8928308280fffff")
        dummy_grid = H3Grid(
            center_h3=dummy_cell.h3_index,
            resolution=9,
            radius_km=10,
            cells=[dummy_cell],
            cell_count=1
        )
        dummy_segment = H3RouteSegment(
            from_cell=dummy_cell,
            to_cell=dummy_cell,
            distance_km=1.0,
            estimated_time_min=2,
            h3_path=[dummy_cell.h3_index],
            road_type="main_road",
            traffic_factor=1.0,
            weather_factor=1.0
        )
        dummy_route = H3OptimizedRoute(
            route_id="test-route",
            driver_id="driver-001",
            segments=[dummy_segment],
            total_distance_km=1.0,
            total_time_min=2,
            fuel_estimate_l=0.1,
            efficiency_score=90.0,
            h3_grid_info=dummy_grid,
            algorithm_used="h3_dijkstra",
            optimization_time_ms=10
        )
        sustainability_metrics = sustainability_analyzer.calculate_route_sustainability(
            route=dummy_route,
            vehicle_type="medium_truck",
            load_factor=0.7
        )
        print(f"✅ Sustainability analysis completed")
        print(f"   Eco-friendly score: {sustainability_metrics.eco_friendly_score:.1f}%")
        print(f"   Fuel efficiency: {sustainability_metrics.fuel_efficiency_kmpl:.1f} km/l")
    except Exception as e:
        print(f"❌ Sustainability analysis failed: {e}")
    
    # Test grid creation
    print("\n🗺️ Testing Grid Creation...")
    try:
        # En az bir dummy delivery kullan
        grid = grid_manager.create_optimization_grid(
            center_lat=request.driver_location["lat"],
            center_lng=request.driver_location["lng"],
            deliveries=[h3_deliveries[0]],
            resolution=request.h3_resolution,
            buffer_km=50
        )
        print(f"✅ Grid created: {grid.cell_count} cells")
        print(f"   Resolution: {grid.resolution}")
        print(f"   Radius: {grid.radius_km:.1f} km")
    except Exception as e:
        print(f"❌ Grid creation failed: {e}")
    
    # Test full optimization
    print("\n🚀 Testing Full H3 Optimization")
    print("-" * 30)
    
    start_time = time.time()
    
    try:
        # Convert deliveries to H3DeliveryPoint format
        from app.models.h3_schemas import H3DeliveryPoint
        
        h3_delivery_points = []
        for delivery in request.deliveries:
            h3_delivery_point = H3DeliveryPoint.from_coordinates(
                delivery_id=delivery.id,
                address=delivery.address,
                lat=delivery.coordinates["lat"],
                lng=delivery.coordinates["lng"],
                resolution=request.h3_resolution,
                priority=delivery.priority,
                weight=delivery.weight,
                volume=delivery.volume,
                time_window=delivery.time_window,
                service_time_min=delivery.service_time_min,
                special_requirements=delivery.special_requirements
            )
            h3_delivery_points.append(h3_delivery_point)
        
        # Run optimization
        result = await h3_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=h3_delivery_points,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume,
            h3_resolution=request.h3_resolution,
            algorithm=request.optimization_algorithm,
            traffic_aware=request.traffic_aware,
            weather_aware=request.weather_aware,
            vehicle_type=request.constraints.get("vehicle_type", "medium_truck") if request.constraints else "medium_truck"
        )
        
        optimization_time = time.time() - start_time
        
        if result.success:
            print("✅ H3 Optimization completed successfully!")
            print(f"⏱️ Total time: {optimization_time:.2f} seconds")
            print(f"📊 Route ID: {result.route.route_id}")
            print(f"🚗 Driver ID: {result.route.driver_id}")
            print(f"📏 Total distance: {result.route.total_distance_km:.2f} km")
            print(f"⏰ Total time: {result.route.total_time_min} minutes")
            print(f"⛽ Fuel estimate: {result.route.fuel_estimate_l:.2f} L")
            print(f"📈 Efficiency score: {result.route.efficiency_score:.1f}%")
            print(f"🌱 Carbon footprint: {result.route.carbon_footprint_kg:.2f} kg CO2")
            print(f"🚦 Traffic impact score: {result.route.traffic_impact_score:.1f}%")
            print(f"🌤️ Weather impact score: {result.route.weather_impact_score:.1f}%")
            print(f"🌿 Sustainability score: {result.route.sustainability_score:.1f}%")
            print(f"🔧 Algorithm used: {result.route.algorithm_used}")
            print(f"⚡ Optimization time: {result.route.optimization_time_ms} ms")
            
            # Performance metrics
            if result.performance_metrics:
                print(f"\n📊 Performance Metrics:")
                print(f"   Grid creation: {result.performance_metrics.grid_creation_time_ms} ms")
                print(f"   Pathfinding: {result.performance_metrics.pathfinding_time_ms} ms")
                print(f"   Total optimization: {result.performance_metrics.total_optimization_time_ms} ms")
                print(f"   Memory usage: {result.performance_metrics.memory_usage_mb:.1f} MB")
                print(f"   Cells processed: {result.performance_metrics.cells_processed}")
                print(f"   Algorithm efficiency: {result.performance_metrics.algorithm_efficiency:.1f}%")
                print(f"   Cache hit rate: {result.performance_metrics.cache_hit_rate:.1f}%")
            
            # Grid statistics
            if result.grid_statistics:
                print(f"\n🗺️ Grid Statistics:")
                print(f"   Total cells: {result.grid_statistics.get('total_cells', 0)}")
                print(f"   Resolution: {result.grid_statistics.get('resolution', 0)}")
                print(f"   Total area: {result.grid_statistics.get('total_area_km2', 0):.1f} km²")
                print(f"   Cell density: {result.grid_statistics.get('cell_density_per_km2', 0):.1f} cells/km²")
                
                if "traffic_analysis" in result.grid_statistics:
                    traffic_stats = result.grid_statistics["traffic_analysis"]
                    print(f"   Traffic cells analyzed: {traffic_stats.get('total_cells_analyzed', 0)}")
                    print(f"   Congested cells: {traffic_stats.get('congested_cells', 0)}")
                
                if "weather_analysis" in result.grid_statistics:
                    weather_stats = result.grid_statistics["weather_analysis"]
                    print(f"   Weather cells analyzed: {weather_stats.get('total_cells_analyzed', 0)}")
                    print(f"   Severe weather cells: {weather_stats.get('severe_weather_cells', 0)}")
            
            # Recommendations
            if result.recommendations:
                print(f"\n💡 Recommendations:")
                for i, rec in enumerate(result.recommendations, 1):
                    print(f"   {i}. {rec}")
            
            # Route segments
            print(f"\n🛣️ Route Segments ({len(result.route.segments)}):")
            for i, segment in enumerate(result.route.segments, 1):
                print(f"   {i}. {segment.from_cell.h3_index} → {segment.to_cell.h3_index}")
                print(f"      Distance: {segment.distance_km:.2f} km")
                print(f"      Time: {segment.estimated_time_min} min")
                print(f"      Traffic factor: {segment.traffic_factor:.2f}")
                print(f"      Weather factor: {segment.weather_factor:.2f}")
                if segment.carbon_footprint_kg:
                    print(f"      Carbon: {segment.carbon_footprint_kg:.2f} kg CO2")
                print()
            
        else:
            print(f"❌ H3 Optimization failed: {result.error_message}")
            
    except Exception as e:
        print(f"❌ Optimization failed with exception: {e}")
        import traceback
        traceback.print_exc()

async def test_api_endpoints():
    """Test the new API endpoints"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 30)
    
    try:
        import httpx
        
        base_url = "http://localhost:8000"
        
        # Test health endpoint
        print("🏥 Testing health endpoint...")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/health")
            if response.status_code == 200:
                health_data = response.json()
                print("✅ Health check passed")
                print(f"   Service: {health_data.get('service', 'Unknown')}")
                print(f"   Features: {len(health_data.get('features', []))} features available")
                print(f"   H3 support: {health_data.get('h3_support', False)}")
                print(f"   Advanced features: {health_data.get('advanced_features', {})}")
            else:
                print(f"❌ Health check failed: {response.status_code}")
        
        # Test H3 grid info
        print("\n🗺️ Testing H3 grid info...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/h3/grid-info",
                params={"lat": 41.0082, "lng": 28.9784, "resolution": 9, "radius_km": 20}
            )
            if response.status_code == 200:
                grid_data = response.json()
                if grid_data.get("success"):
                    print("✅ Grid info retrieved")
                    grid_info = grid_data.get("grid_info", {})
                    print(f"   Cell count: {grid_info.get('cell_count', 0)}")
                    print(f"   Resolution: {grid_info.get('resolution', 0)}")
                    print(f"   Radius: {grid_info.get('radius_km', 0)} km")
                else:
                    print(f"❌ Grid info failed: {grid_data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Grid info request failed: {response.status_code}")
        
        # Test traffic analysis
        print("\n🚦 Testing traffic analysis...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/h3/traffic-analysis",
                params={"lat": 41.0082, "lng": 28.9784, "resolution": 9, "radius_km": 10}
            )
            if response.status_code == 200:
                traffic_data = response.json()
                if traffic_data.get("success"):
                    print("✅ Traffic analysis completed")
                    analysis = traffic_data.get("traffic_analysis", {})
                    print(f"   Cells analyzed: {analysis.get('cells_analyzed', 0)}")
                    print(f"   Traffic hotspots: {len(analysis.get('traffic_hotspots', []))}")
                    congestion = analysis.get('congestion_summary', {})
                    print(f"   Congestion summary: {congestion}")
                else:
                    print(f"❌ Traffic analysis failed: {traffic_data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Traffic analysis request failed: {response.status_code}")
        
        # Test weather analysis
        print("\n🌤️ Testing weather analysis...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/h3/weather-analysis",
                params={"lat": 41.0082, "lng": 28.9784, "resolution": 9, "radius_km": 10}
            )
            if response.status_code == 200:
                weather_data = response.json()
                if weather_data.get("success"):
                    print("✅ Weather analysis completed")
                    analysis = weather_data.get("weather_analysis", {})
                    print(f"   Cells analyzed: {analysis.get('cells_analyzed', 0)}")
                    print(f"   Weather zones: {len(analysis.get('weather_zones', []))}")
                    print(f"   Weather alerts: {len(analysis.get('weather_alerts', []))}")
                    weather_summary = analysis.get('weather_summary', {})
                    print(f"   Weather summary: {weather_summary}")
                else:
                    print(f"❌ Weather analysis failed: {weather_data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Weather analysis request failed: {response.status_code}")
        
        # Test sustainability analysis
        print("\n🌱 Testing sustainability analysis...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{base_url}/h3/sustainability-analysis",
                params={"vehicle_type": "medium_truck", "load_factor": 0.7}
            )
            if response.status_code == 200:
                sustainability_data = response.json()
                if sustainability_data.get("success"):
                    print("✅ Sustainability analysis completed")
                    analysis = sustainability_data.get("sustainability_analysis", {})
                    print(f"   Vehicle type: {analysis.get('vehicle_type', 'Unknown')}")
                    print(f"   Eco-friendly: {analysis.get('eco_friendly', False)}")
                    print(f"   Recommendations: {len(analysis.get('recommendations', []))}")
                else:
                    print(f"❌ Sustainability analysis failed: {sustainability_data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Sustainability analysis request failed: {response.status_code}")
                
    except ImportError:
        print("⚠️ httpx not available, skipping API endpoint tests")
    except Exception as e:
        print(f"❌ API endpoint tests failed: {e}")

async def main():
    """Main test function"""
    print("🧪 Enhanced H3 Route Optimization Test Suite")
    print("=" * 60)
    
    # Test H3 optimization
    await test_h3_optimization()
    
    # Test API endpoints
    await test_api_endpoints()
    
    print("\n✅ Test suite completed!")

if __name__ == "__main__":
    asyncio.run(main()) 