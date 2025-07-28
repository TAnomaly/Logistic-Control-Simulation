#!/usr/bin/env python3
"""
Simple test script for route optimization without complex dependencies
"""

import math
import time
from typing import List, Dict, Any

# Simple coordinate class
class Coordinates:
    def __init__(self, latitude: float, longitude: float):
        self.latitude = latitude
        self.longitude = longitude

# Simple delivery point class
class DeliveryPoint:
    def __init__(self, id: str, address: str, coordinates: Coordinates, priority: str = "medium", weight: float = 0, volume: float = 0):
        self.id = id
        self.address = address
        self.coordinates = coordinates
        self.priority = priority
        self.weight = weight
        self.volume = volume

# Simple route optimizer
class SimpleRouteOptimizer:
    def __init__(self):
        print("🗺️ Simple Route Optimizer with Haversine distance calculation")
    
    def calculate_distance_haversine(self, coord1: Coordinates, coord2: Coordinates) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = math.radians(coord1.latitude), math.radians(coord1.longitude)
        lat2, lon2 = math.radians(coord2.latitude), math.radians(coord2.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def create_distance_matrix(self, driver_location: Coordinates, deliveries: List[DeliveryPoint]) -> List[List[float]]:
        """Create distance matrix between all points"""
        points = [driver_location] + [delivery.coordinates for delivery in deliveries]
        n = len(points)
        matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    distance = self.calculate_distance_haversine(points[i], points[j])
                    matrix[i][j] = distance
        
        return matrix
    
    def solve_tsp_greedy(self, distance_matrix: List[List[float]]) -> List[int]:
        """Solve TSP using greedy nearest neighbor algorithm"""
        n = len(distance_matrix)
        unvisited = set(range(1, n))  # Exclude driver location (index 0)
        current = 0
        route = [current]
        
        while unvisited:
            # Find nearest unvisited neighbor
            nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        
        return route
    
    def optimize_route(self, driver_id: str, driver_location: Coordinates, deliveries: List[DeliveryPoint], vehicle_capacity: float = 1000, vehicle_volume: float = 10) -> Dict[str, Any]:
        """Main route optimization method"""
        start_time = time.time()
        
        try:
            if not deliveries:
                return {
                    "driver_id": driver_id,
                    "optimized_route": [],
                    "total_distance": 0,
                    "total_time": 0,
                    "fuel_estimate": 0,
                    "efficiency": 100,
                    "algorithm": "Simple TSP",
                    "message": "No deliveries to optimize"
                }

            # Create distance matrix
            distance_matrix = self.create_distance_matrix(driver_location, deliveries)
            
            # Solve TSP to get optimal order
            optimal_order = self.solve_tsp_greedy(distance_matrix)
            
            # Build optimized route
            optimized_route = []
            total_distance = 0
            total_time = 0
            cumulative_distance = 0
            cumulative_time = 0
            
            # Calculate total weight and volume
            total_weight = sum(delivery.weight or 0 for delivery in deliveries)
            total_volume = sum(delivery.volume or 0 for delivery in deliveries)
            
            for i, point_index in enumerate(optimal_order[1:], 1):  # Skip driver location
                delivery = deliveries[point_index - 1]  # Adjust index
                
                # Calculate distance from previous point
                if i == 1:
                    distance_from_previous = distance_matrix[0][point_index]  # From driver location
                else:
                    prev_point_index = optimal_order[i - 1]
                    distance_from_previous = distance_matrix[prev_point_index][point_index]
                
                # Calculate time (considering weight and volume)
                base_time = distance_from_previous * 60 / 50  # Base speed 50 km/h
                
                # Adjust time based on load
                load_factor = 1.0 + (total_weight / vehicle_capacity) * 0.3
                volume_factor = 1.0 + (total_volume / vehicle_volume) * 0.2
                
                estimated_time = int(base_time * load_factor * volume_factor)
                
                cumulative_distance += distance_from_previous
                cumulative_time += estimated_time
                total_distance += distance_from_previous
                total_time += estimated_time
                
                route_point = {
                    "order": i,
                    "delivery_id": delivery.id,
                    "address": delivery.address,
                    "coordinates": {"latitude": delivery.coordinates.latitude, "longitude": delivery.coordinates.longitude},
                    "distance_from_previous": round(distance_from_previous, 2),
                    "estimated_time": estimated_time,
                    "cumulative_distance": round(cumulative_distance, 2),
                    "cumulative_time": cumulative_time
                }
                optimized_route.append(route_point)
            
            # Calculate fuel estimate (considering load)
            base_fuel_rate = 8  # km/liter
            load_efficiency = 1.0 - (total_weight / vehicle_capacity) * 0.2
            fuel_estimate = total_distance / (base_fuel_rate * load_efficiency)
            
            # Calculate efficiency
            distance_efficiency = 100 - (total_distance / len(deliveries) * 2) if deliveries else 100
            capacity_efficiency = min(100, (total_weight / vehicle_capacity) * 100) if vehicle_capacity > 0 else 100
            volume_efficiency = min(100, (total_volume / vehicle_volume) * 100) if vehicle_volume > 0 else 100
            
            overall_efficiency = (distance_efficiency * 0.6 + capacity_efficiency * 0.25 + volume_efficiency * 0.15)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            return {
                "driver_id": driver_id,
                "optimized_route": optimized_route,
                "total_distance": round(total_distance, 2),
                "total_time": total_time,
                "fuel_estimate": round(fuel_estimate, 2),
                "efficiency": round(overall_efficiency, 1),
                "algorithm": "Simple TSP (Greedy)",
                "message": f"Route optimized in {processing_time:.3f}s",
                "analysis": {
                    "capacity_utilization": {
                        "weight": round((total_weight / vehicle_capacity) * 100, 1),
                        "volume": round((total_volume / vehicle_volume) * 100, 1)
                    },
                    "priority_distribution": {
                        "high": len([d for d in deliveries if d.priority == "high"]),
                        "medium": len([d for d in deliveries if d.priority == "medium"]),
                        "low": len([d for d in deliveries if d.priority == "low"])
                    }
                }
            }
            
        except Exception as e:
            print(f"Route optimization error: {e}")
            raise e

def test_basic_optimization():
    """Test basic route optimization"""
    print("🚀 Testing Basic Route Optimization...")
    
    # Test data - Istanbul locations
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)  # Sultanahmet
    
    deliveries = [
        DeliveryPoint(
            id="delivery-1",
            address="Kadıköy, İstanbul",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
            priority="high",
            weight=100,
            volume=0.5
        ),
        DeliveryPoint(
            id="delivery-2",
            address="Beşiktaş, İstanbul",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
            priority="medium",
            weight=200,
            volume=1.0
        ),
        DeliveryPoint(
            id="delivery-3",
            address="Şişli, İstanbul",
            coordinates=Coordinates(latitude=41.0602, longitude=28.9877),
            priority="low",
            weight=150,
            volume=0.8
        ),
        DeliveryPoint(
            id="delivery-4",
            address="Bakırköy, İstanbul",
            coordinates=Coordinates(latitude=40.9819, longitude=28.8772),
            priority="high",
            weight=80,
            volume=0.3
        )
    ]
    
    optimizer = SimpleRouteOptimizer()
    
    try:
        result = optimizer.optimize_route(
            driver_id="test-driver-001",
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=600,
            vehicle_volume=5
        )
        
        print(f"✅ Optimization completed!")
        print(f"📊 Algorithm: {result['algorithm']}")
        print(f"📏 Total Distance: {result['total_distance']} km")
        print(f"⏱️ Total Time: {result['total_time']} minutes")
        print(f"⛽ Fuel Estimate: {result['fuel_estimate']} liters")
        print(f"📈 Efficiency: {result['efficiency']}%")
        print(f"💬 Message: {result['message']}")
        
        print("\n📍 Optimized Route:")
        for point in result['optimized_route']:
            print(f"  {point['order']}. {point['address']}")
            print(f"     Distance: {point['distance_from_previous']} km")
            print(f"     Time: {point['estimated_time']} min")
            print(f"     Cumulative: {point['cumulative_distance']} km, {point['cumulative_time']} min")
        
        print(f"\n📊 Analysis:")
        print(f"  Capacity Utilization: {result['analysis']['capacity_utilization']}")
        print(f"  Priority Distribution: {result['analysis']['priority_distribution']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Optimization failed: {e}")
        return None

def test_capacity_constraints():
    """Test capacity constraint handling"""
    print("\n🚛 Testing Capacity Constraints...")
    
    driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
    
    # Create deliveries that exceed capacity
    deliveries = [
        DeliveryPoint(
            id="heavy-1",
            address="Heavy Delivery 1",
            coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
            priority="high",
            weight=400,  # Heavy
            volume=2.0
        ),
        DeliveryPoint(
            id="heavy-2",
            address="Heavy Delivery 2",
            coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
            priority="medium",
            weight=300,  # Heavy
            volume=1.5
        ),
        DeliveryPoint(
            id="light-1",
            address="Light Delivery 1",
            coordinates=Coordinates(latitude=41.0602, longitude=28.9877),
            priority="low",
            weight=50,  # Light
            volume=0.5
        )
    ]
    
    optimizer = SimpleRouteOptimizer()
    
    try:
        result = optimizer.optimize_route(
            driver_id="test-driver-002",
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=500,  # Limited capacity
            vehicle_volume=5
        )
        
        print(f"✅ Capacity-constrained optimization completed!")
        print(f"📦 Deliveries in route: {len(result['optimized_route'])}")
        print(f"📊 Total weight handled: {sum(d.weight or 0 for d in deliveries[:len(result['optimized_route'])])} kg")
        
        return result
        
    except Exception as e:
        print(f"❌ Capacity constraint test failed: {e}")
        return None

def test_performance_benchmark():
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
            priority="medium",
            weight=50 + (i * 10),
            volume=0.3 + (i * 0.1)
        ))
    
    optimizer = SimpleRouteOptimizer()
    start_time = time.time()
    
    try:
        result = optimizer.optimize_route(
            driver_id="benchmark-driver",
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=1000,
            vehicle_volume=10
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"✅ Performance benchmark completed!")
        print(f"📊 Dataset size: {len(deliveries)} deliveries")
        print(f"⏱️ Processing time: {processing_time:.3f} seconds")
        print(f"📈 Efficiency: {result['efficiency']}%")
        print(f"📏 Total distance: {result['total_distance']} km")
        
        return result
        
    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        return None

def main():
    """Run all tests"""
    print("🧪 Simple Route Optimization Test Suite")
    print("=" * 50)
    
    # Run tests
    test_basic_optimization()
    test_capacity_constraints()
    test_performance_benchmark()
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main() 