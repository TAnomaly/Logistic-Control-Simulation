#!/usr/bin/env python3
"""
Simple H3 Route Optimization Test
Tests the simplified distance-based H3 optimization system
"""

import asyncio
import json
from app.models.h3_schemas import H3RouteOptimizationRequest, H3DeliveryRequest
from app.services.h3_optimizer import h3_optimizer

def create_test_deliveries():
    """Create test delivery data"""
    return [
        H3DeliveryRequest(
            id="delivery-1",
            address="Kadıköy, İstanbul",
            coordinates={"lat": 40.9909, "lng": 29.0303},
            priority="high",
            weight=50.0,
            volume=0.5
        ),
        H3DeliveryRequest(
            id="delivery-2", 
            address="Beşiktaş, İstanbul",
            coordinates={"lat": 41.0422, "lng": 29.0083},
            priority="medium",
            weight=30.0,
            volume=0.3
        ),
        H3DeliveryRequest(
            id="delivery-3",
            address="Şişli, İstanbul", 
            coordinates={"lat": 41.0602, "lng": 28.9877},
            priority="low",
            weight=20.0,
            volume=0.2
        ),
        H3DeliveryRequest(
            id="delivery-4",
            address="Beyoğlu, İstanbul",
            coordinates={"lat": 41.0370, "lng": 28.9850},
            priority="medium", 
            weight=40.0,
            volume=0.4
        ),
        H3DeliveryRequest(
            id="delivery-5",
            address="Fatih, İstanbul",
            coordinates={"lat": 41.0082, "lng": 28.9784},
            priority="high",
            weight=60.0,
            volume=0.6
        )
    ]

def create_test_request():
    """Create test optimization request"""
    return H3RouteOptimizationRequest(
        driver_id="driver-001",
        driver_location={"lat": 41.0082, "lng": 28.9784},  # Sultanahmet
        deliveries=create_test_deliveries(),
        vehicle_capacity=200.0,
        vehicle_volume=2.0,
        h3_resolution=9,
        optimization_algorithm="h3_dijkstra"
    )

async def test_simple_h3_optimization():
    """Test simple H3 route optimization"""
    print("🧪 Simple H3 Route Optimization Test")
    print("=" * 50)
    
    try:
        # Create test request
        request = create_test_request()
        
        print(f"📦 Testing with {len(request.deliveries)} deliveries")
        print(f"📍 Driver location: {request.driver_location}")
        print(f"🔧 Algorithm: {request.optimization_algorithm}")
        print(f"📐 H3 Resolution: {request.h3_resolution}")
        print()
        
        # Convert deliveries to H3DeliveryPoint format
        from app.models.h3_schemas import H3DeliveryPoint
        deliveries = []
        for delivery in request.deliveries:
            h3_delivery = H3DeliveryPoint.from_coordinates(
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
            deliveries.append(h3_delivery)
        
        # Test optimization
        print("🚀 Starting H3 distance-based optimization...")
        result = await h3_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume,
            h3_resolution=request.h3_resolution,
            algorithm=request.optimization_algorithm
        )
        
        if result.success:
            print("✅ H3 Optimization completed successfully!")
            print(f"⏱️ Total time: {result.processing_time_ms} ms")
            print(f"📊 Route ID: {result.route.route_id}")
            print(f"🚗 Driver ID: {result.route.driver_id}")
            print(f"📏 Total distance: {result.route.total_distance_km:.2f} km")
            print(f"⏰ Total time: {result.route.total_time_min} minutes")
            print(f"⛽ Fuel estimate: {result.route.fuel_estimate_l:.2f} L")
            print(f"📈 Efficiency score: {result.route.efficiency_score:.1f}%")
            print(f"🔧 Algorithm used: {result.route.algorithm_used}")
            print(f"⚡ Optimization time: {result.route.optimization_time_ms} ms")
            
            print("\n📊 Performance Metrics:")
            if result.performance_metrics:
                metrics = result.performance_metrics
                print(f"   Grid creation: {getattr(metrics, 'grid_creation_time_ms', 0)} ms")
                print(f"   Pathfinding: {getattr(metrics, 'pathfinding_time_ms', 0)} ms")
                print(f"   Total optimization: {getattr(metrics, 'total_optimization_time_ms', 0)} ms")
                print(f"   Memory usage: {getattr(metrics, 'memory_usage_mb', 0):.1f} MB")
                print(f"   Cells processed: {getattr(metrics, 'cells_processed', 0)}")
                print(f"   Algorithm efficiency: {getattr(metrics, 'algorithm_efficiency', 0):.1f}%")
            
            print("\n🗺️ Grid Statistics:")
            if result.grid_statistics:
                stats = result.grid_statistics
                print(f"   Total cells: {stats.get('total_cells', 0)}")
                print(f"   Resolution: {stats.get('resolution', 0)}")
                print(f"   Total area: {stats.get('total_area_km2', 0):.1f} km²")
                print(f"   Cell density: {stats.get('cell_density_per_km2', 0):.1f} cells/km²")
            
            print("\n💡 Recommendations:")
            if result.recommendations:
                for i, rec in enumerate(result.recommendations, 1):
                    print(f"   {i}. {rec}")
            
            print("\n🛣️ Route Segments:")
            for i, segment in enumerate(result.route.segments, 1):
                print(f"   {i}. {segment.from_cell.h3_index} → {segment.to_cell.h3_index}")
                print(f"      Distance: {segment.distance_km:.2f} km")
                print(f"      Time: {segment.estimated_time_min} min")
                print()
            
        else:
            print(f"❌ H3 Optimization failed: {result.error_message}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_h3_optimization()) 