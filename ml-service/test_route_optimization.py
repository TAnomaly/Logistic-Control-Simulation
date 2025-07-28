#!/usr/bin/env python3
"""
Test script for enhanced route optimization features
"""

import asyncio
import json
from datetime import datetime
from app.models.schemas import (
    Coordinates, 
    DeliveryPoint, 
    RouteOptimizationRequest,
    PriorityEnum
)
from app.services.route_optimizer import route_optimizer
from app.services.google_maps_service import google_maps_service

async def test_basic_optimization():
    """Test basic route optimization"""
    print("🚀 Testing Basic Route Optimization...")
    
    # Test data - Istanbul locations
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)  # Sultanahmet
    
    deliveries = [
        DeliveryPoint(
            id="delivery-1",
            address="Kadıköy, İstanbul",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
            priority=PriorityEnum.HIGH,
            weight=100,
            volume=0.5
        ),
        DeliveryPoint(
            id="delivery-2",
            address="Beşiktaş, İstanbul",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
            priority=PriorityEnum.MEDIUM,
            weight=200,
            volume=1.0
        ),
        DeliveryPoint(
            id="delivery-3",
            address="Şişli, İstanbul",
            coordinates=Coordinates(latitude=41.0602, longitude=28.9877),
            priority=PriorityEnum.LOW,
            weight=150,
            volume=0.8
        ),
        DeliveryPoint(
            id="delivery-4",
            address="Bakırköy, İstanbul",
            coordinates=Coordinates(latitude=40.9819, longitude=28.8772),
            priority=PriorityEnum.HIGH,
            weight=80,
            volume=0.3
        )
    ]
    
    request = RouteOptimizationRequest(
        driver_id="test-driver-001",
        driver_location=driver_location,
        deliveries=deliveries,
        vehicle_capacity=600,
        vehicle_volume=5
    )
    
    try:
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=request.deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        print(f"✅ Optimization completed!")
        print(f"📊 Algorithm: {result.algorithm}")
        print(f"📏 Total Distance: {result.total_distance} km")
        print(f"⏱️ Total Time: {result.total_time} minutes")
        print(f"⛽ Fuel Estimate: {result.fuel_estimate} liters")
        print(f"📈 Efficiency: {result.efficiency}%")
        print(f"💬 Message: {result.message}")
        
        print("\n📍 Optimized Route:")
        for point in result.optimized_route:
            print(f"  {point.order}. {point.address}")
            print(f"     Distance: {point.distance_from_previous} km")
            print(f"     Time: {point.estimated_time} min")
            print(f"     Cumulative: {point.cumulative_distance} km, {point.cumulative_time} min")
        
        return result
        
    except Exception as e:
        print(f"❌ Optimization failed: {e}")
        return None

async def test_capacity_constraints():
    """Test capacity constraint handling"""
    print("\n🚛 Testing Capacity Constraints...")
    
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
    
    # Create deliveries that exceed capacity
    deliveries = [
        DeliveryPoint(
            id="heavy-1",
            address="Heavy Delivery 1",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
            priority=PriorityEnum.HIGH,
            weight=400,  # Heavy
            volume=2.0
        ),
        DeliveryPoint(
            id="heavy-2",
            address="Heavy Delivery 2",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
            priority=PriorityEnum.MEDIUM,
            weight=300,  # Heavy
            volume=1.5
        ),
        DeliveryPoint(
            id="light-1",
            address="Light Delivery 1",
            coordinates=Coordinates(latitude=41.0602, longitude=28.9877),
            priority=PriorityEnum.LOW,
            weight=50,  # Light
            volume=0.5
        )
    ]
    
    # Vehicle capacity is only 500kg, but deliveries total 750kg
    request = RouteOptimizationRequest(
        driver_id="test-driver-002",
        driver_location=driver_location,
        deliveries=deliveries,
        vehicle_capacity=500,  # Limited capacity
        vehicle_volume=5
    )
    
    try:
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=request.deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        print(f"✅ Capacity-constrained optimization completed!")
        print(f"📦 Deliveries in route: {len(result.optimized_route)}")
        print(f"📊 Total weight handled: {sum(d.weight or 0 for d in deliveries[:len(result.optimized_route)])} kg")
        
        return result
        
    except Exception as e:
        print(f"❌ Capacity constraint test failed: {e}")
        return None

async def test_priority_optimization():
    """Test priority-based optimization"""
    print("\n🎯 Testing Priority-Based Optimization...")
    
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
    
    # Create deliveries with different priorities
    deliveries = [
        DeliveryPoint(
            id="urgent-1",
            address="Urgent Delivery",
            coordinates=Coordinates(latitude=41.0602, longitude=28.9877),  # Farthest
            priority=PriorityEnum.HIGH,
            weight=50,
            volume=0.3
        ),
        DeliveryPoint(
            id="normal-1",
            address="Normal Delivery",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),  # Closest
            priority=PriorityEnum.MEDIUM,
            weight=100,
            volume=0.5
        ),
        DeliveryPoint(
            id="low-1",
            address="Low Priority Delivery",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),  # Medium distance
            priority=PriorityEnum.LOW,
            weight=75,
            volume=0.4
        )
    ]
    
    request = RouteOptimizationRequest(
        driver_id="test-driver-003",
        driver_location=driver_location,
        deliveries=deliveries,
        vehicle_capacity=300,
        vehicle_volume=3
    )
    
    try:
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=request.deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        print(f"✅ Priority-based optimization completed!")
        print(f"🎯 Route order by priority:")
        for point in result.optimized_route:
            delivery = next(d for d in deliveries if d.id == point.delivery_id)
            print(f"  {point.order}. {delivery.address} ({delivery.priority.value})")
        
        return result
        
    except Exception as e:
        print(f"❌ Priority optimization test failed: {e}")
        return None

async def test_google_maps_integration():
    """Test Google Maps integration (if available)"""
    print("\n🗺️ Testing Google Maps Integration...")
    
    if not google_maps_service.is_available():
        print("⚠️ Google Maps API not configured, skipping test")
        return None
    
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
    
    deliveries = [
        DeliveryPoint(
            id="gmaps-1",
            address="Test Location 1",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
            priority=PriorityEnum.MEDIUM,
            weight=100,
            volume=0.5
        ),
        DeliveryPoint(
            id="gmaps-2",
            address="Test Location 2",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
            priority=PriorityEnum.MEDIUM,
            weight=150,
            volume=0.8
        )
    ]
    
    try:
        # Test distance matrix
        points = [driver_location] + [d.coordinates for d in deliveries]
        matrix = await google_maps_service.get_distance_matrix(points, points)
        
        if matrix:
            print("✅ Google Maps distance matrix retrieved successfully")
            print(f"📊 Matrix size: {len(matrix)}x{len(matrix[0])}")
            
            # Test optimized route
            route = await google_maps_service.get_optimized_route(points)
            if route:
                print("✅ Google Maps optimized route retrieved successfully")
                print(f"📏 Total distance: {route['total_distance_km']} km")
                print(f"⏱️ Total time: {route['total_duration_minutes']} minutes")
                print(f"🔄 Waypoint order: {route['waypoint_order']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Google Maps integration test failed: {e}")
        return None

async def test_performance_benchmark():
    """Test performance with larger datasets"""
    print("\n⚡ Testing Performance Benchmark...")
    
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
    
    # Create larger dataset
    deliveries = []
    for i in range(10):
        deliveries.append(DeliveryPoint(
            id=f"benchmark-{i+1}",
            address=f"Benchmark Location {i+1}",
            coordinates=Coordinates(
                latitude=41.0082 + (i * 0.01),
                longitude=28.9784 + (i * 0.01)
            ),
            priority=PriorityEnum.MEDIUM,
            weight=50 + (i * 10),
            volume=0.3 + (i * 0.1)
        ))
    
    request = RouteOptimizationRequest(
        driver_id="benchmark-driver",
        driver_location=driver_location,
        deliveries=deliveries,
        vehicle_capacity=1000,
        vehicle_volume=10
    )
    
    import time
    start_time = time.time()
    
    try:
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=request.deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"✅ Performance benchmark completed!")
        print(f"📊 Dataset size: {len(deliveries)} deliveries")
        print(f"⏱️ Processing time: {processing_time:.3f} seconds")
        print(f"📈 Efficiency: {result.efficiency}%")
        print(f"📏 Total distance: {result.total_distance} km")
        
        return result
        
    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        return None

async def main():
    """Run all tests"""
    print("🧪 Enhanced Route Optimization Test Suite")
    print("=" * 50)
    
    # Run tests
    await test_basic_optimization()
    await test_capacity_constraints()
    await test_priority_optimization()
    await test_google_maps_integration()
    await test_performance_benchmark()
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    asyncio.run(main()) 