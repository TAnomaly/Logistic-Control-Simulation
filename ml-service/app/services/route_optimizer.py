import math
import time
from typing import List, Optional, Tuple, Dict
from app.models.schemas import (
    DeliveryPoint, 
    OptimizedRoutePoint, 
    RouteOptimizationResponse,
    Coordinates,
    PriorityEnum
)
from app.services.google_maps_service import google_maps_service

class RouteOptimizer:
    def __init__(self):
        if google_maps_service.is_available():
            print("🗺️ Using Advanced Route Optimization with Google Maps API")
            self.algorithm_used = "Advanced TSP + Google Maps API"
        else:
            print("🗺️ Using Advanced Route Optimization with Haversine distance calculation")
            self.algorithm_used = "Advanced TSP (2-opt + Priority + Capacity)"

    def calculate_distance_haversine(self, coord1: Coordinates, coord2: Coordinates) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = math.radians(coord1.latitude), math.radians(coord1.longitude)
        lat2, lon2 = math.radians(coord2.latitude), math.radians(coord2.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c

    async def create_distance_matrix(self, driver_location: Coordinates, deliveries: List[DeliveryPoint]) -> List[List[float]]:
        """
        Create distance matrix between all points using Google Maps API if available
        """
        points = [driver_location] + [delivery.coordinates for delivery in deliveries]
        n = len(points)
        
        # Try Google Maps API first
        if google_maps_service.is_available():
            try:
                google_matrix = await google_maps_service.get_distance_matrix(points, points)
                if google_matrix and len(google_matrix) == n:
                    return google_matrix
            except Exception as e:
                print(f"Google Maps API failed, falling back to Haversine: {e}")
        
        # Fallback to Haversine calculation
        matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    distance = self.calculate_distance_haversine(points[i], points[j])
                    matrix[i][j] = distance
        
        return matrix

    def calculate_route_distance(self, route: List[int], distance_matrix: List[List[float]]) -> float:
        """
        Calculate total distance for a given route
        """
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += distance_matrix[route[i]][route[i + 1]]
        return total_distance

    def solve_tsp_greedy(self, distance_matrix: List[List[float]]) -> List[int]:
        """
        Solve TSP using greedy nearest neighbor algorithm
        """
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

    def two_opt_swap(self, route: List[int], i: int, j: int) -> List[int]:
        """
        Perform 2-opt swap on route
        """
        new_route = route[:i+1]
        new_route.extend(reversed(route[i+1:j+1]))
        new_route.extend(route[j+1:])
        return new_route

    def improve_route_2opt(self, route: List[int], distance_matrix: List[List[float]], max_iterations: int = 100) -> List[int]:
        """
        Improve route using 2-opt algorithm
        """
        n = len(route)
        best_distance = self.calculate_route_distance(route, distance_matrix)
        improved = True
        iterations = 0
        
        while improved and iterations < max_iterations:
            improved = False
            for i in range(1, n - 2):  # Skip driver location (index 0)
                for j in range(i + 1, n):
                    if j - i == 1:
                        continue
                    
                    new_route = self.two_opt_swap(route, i, j)
                    new_distance = self.calculate_route_distance(new_route, distance_matrix)
                    
                    if new_distance < best_distance:
                        route = new_route
                        best_distance = new_distance
                        improved = True
                        break
                if improved:
                    break
            iterations += 1
        
        return route

    def apply_priority_weights(self, deliveries: List[DeliveryPoint]) -> List[float]:
        """
        Apply priority weights to deliveries
        """
        priority_weights = {
            PriorityEnum.HIGH: 3.0,
            PriorityEnum.MEDIUM: 2.0,
            PriorityEnum.LOW: 1.0
        }
        
        return [priority_weights.get(delivery.priority, 2.0) for delivery in deliveries]

    def solve_tsp_with_priorities(self, distance_matrix: List[List[float]], deliveries: List[DeliveryPoint]) -> List[int]:
        """
        Solve TSP considering delivery priorities
        """
        n = len(distance_matrix)
        priority_weights = self.apply_priority_weights(deliveries)
        
        # Start with greedy solution
        route = self.solve_tsp_greedy(distance_matrix)
        
        # Apply 2-opt improvement
        route = self.improve_route_2opt(route, distance_matrix)
        
        # Adjust for priorities (move high priority items earlier)
        adjusted_route = self.adjust_route_for_priorities(route, priority_weights, distance_matrix)
        
        return adjusted_route

    def adjust_route_for_priorities(self, route: List[int], priority_weights: List[float], distance_matrix: List[List[float]]) -> List[int]:
        """
        Adjust route to prioritize high-priority deliveries
        """
        if len(priority_weights) <= 1:
            return route
        
        # Create priority-adjusted distance matrix
        adjusted_matrix = [row[:] for row in distance_matrix]
        
        # Adjust distances based on priorities (higher priority = lower effective distance)
        for i in range(1, len(adjusted_matrix)):
            for j in range(1, len(adjusted_matrix[i])):
                if i != j:
                    priority_factor = priority_weights[i-1] / max(priority_weights)
                    adjusted_matrix[i][j] *= (2.0 - priority_factor)
        
        # Re-solve with adjusted distances
        new_route = self.solve_tsp_greedy(adjusted_matrix)
        new_route = self.improve_route_2opt(new_route, adjusted_matrix, max_iterations=50)
        
        return new_route

    def check_capacity_constraints(self, route: List[int], deliveries: List[DeliveryPoint], 
                                 vehicle_capacity: float, vehicle_volume: float) -> bool:
        """
        Check if route satisfies capacity constraints
        """
        total_weight = 0
        total_volume = 0
        
        for point_index in route[1:]:  # Skip driver location
            delivery = deliveries[point_index - 1]
            total_weight += delivery.weight or 0
            total_volume += delivery.volume or 0
        
        return total_weight <= vehicle_capacity and total_volume <= vehicle_volume

    async def optimize_with_capacity_constraints(self, distance_matrix: List[List[float]], 
                                               deliveries: List[DeliveryPoint],
                                               vehicle_capacity: float, 
                                               vehicle_volume: float) -> List[int]:
        """
        Optimize route considering capacity constraints
        """
        # Try to fit all deliveries
        route = self.solve_tsp_with_priorities(distance_matrix, deliveries)
        
        if self.check_capacity_constraints(route, deliveries, vehicle_capacity, vehicle_volume):
            return route
        
        # If capacity exceeded, remove lowest priority deliveries
        priority_weights = self.apply_priority_weights(deliveries)
        delivery_priorities = list(enumerate(priority_weights))
        delivery_priorities.sort(key=lambda x: x[1])  # Sort by priority (lowest first)
        
        for idx, _ in delivery_priorities:
            # Remove one delivery at a time
            temp_deliveries = deliveries[:idx] + deliveries[idx+1:]
            if not temp_deliveries:
                continue
                
            temp_matrix = await self.create_distance_matrix(
                Coordinates(latitude=0, longitude=0),  # Dummy driver location
                temp_deliveries
            )
            
            temp_route = self.solve_tsp_with_priorities(temp_matrix, temp_deliveries)
            
            if self.check_capacity_constraints(temp_route, temp_deliveries, vehicle_capacity, vehicle_volume):
                return temp_route
        
        # If still can't fit, return empty route
        return [0]

    async def optimize_route(self, driver_id: str, driver_location: Coordinates, 
                           deliveries: List[DeliveryPoint], vehicle_capacity: float = 1000, 
                           vehicle_volume: float = 10) -> RouteOptimizationResponse:
        """
        Main route optimization method using Advanced TSP + Priority + Capacity
        """
        start_time = time.time()
        
        try:
            if not deliveries:
                return RouteOptimizationResponse(
                    driver_id=driver_id,
                    optimized_route=[],
                    total_distance=0,
                    total_time=0,
                    fuel_estimate=0,
                    efficiency=100,
                    algorithm=self.algorithm_used
                )

            # Create distance matrix
            distance_matrix = await self.create_distance_matrix(driver_location, deliveries)
            
            # Optimize with capacity constraints
            optimal_order = await self.optimize_with_capacity_constraints(
                distance_matrix, deliveries, vehicle_capacity, vehicle_volume
            )
            
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
                
                route_point = OptimizedRoutePoint(
                    order=i,
                    delivery_id=delivery.id,
                    address=delivery.address,
                    coordinates=delivery.coordinates,
                    distance_from_previous=round(distance_from_previous, 2),
                    estimated_time=estimated_time,
                    cumulative_distance=round(cumulative_distance, 2),
                    cumulative_time=cumulative_time
                )
                optimized_route.append(route_point)
            
            # Calculate fuel estimate (considering load)
            base_fuel_rate = 8  # km/liter
            load_efficiency = 1.0 - (total_weight / vehicle_capacity) * 0.2
            fuel_estimate = total_distance / (base_fuel_rate * load_efficiency)
            
            # Calculate efficiency (based on route optimization and capacity utilization)
            distance_efficiency = max(0, 100 - (total_distance / len(deliveries) * 2)) if deliveries else 100
            capacity_efficiency = min(100, (total_weight / vehicle_capacity) * 100) if vehicle_capacity > 0 else 100
            volume_efficiency = min(100, (total_volume / vehicle_volume) * 100) if vehicle_volume > 0 else 100
            
            overall_efficiency = max(0, min(100, (distance_efficiency * 0.6 + capacity_efficiency * 0.25 + volume_efficiency * 0.15)))
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            return RouteOptimizationResponse(
                driver_id=driver_id,
                optimized_route=optimized_route,
                total_distance=round(total_distance, 2),
                total_time=total_time,
                fuel_estimate=round(fuel_estimate, 2),
                efficiency=round(overall_efficiency, 1),
                algorithm=self.algorithm_used,
                message=f"Route optimized in {processing_time:.3f}s"
            )
            
        except Exception as e:
            print(f"Route optimization error: {e}")
            raise e

# Global instance
route_optimizer = RouteOptimizer() 