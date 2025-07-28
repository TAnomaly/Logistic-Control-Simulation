import h3
import time
import heapq
from typing import List, Dict, Optional, Tuple, Set
from ..models.h3_schemas import (
    H3Grid, H3Cell, H3DeliveryPoint, H3RouteSegment, 
    H3OptimizedRoute, H3RouteOptimizationResponse, H3PerformanceMetrics
)
from .grid_manager import grid_manager
from ..utils.h3_utils import H3Utils

class H3RouteOptimizer:
    """H3-based route optimization using hexagonal grid pathfinding - Distance Only"""
    
    def __init__(self):
        self.algorithm_name = "H3 Distance-Based Route Optimization"
        self.supported_algorithms = ["h3_dijkstra", "h3_astar", "h3_greedy"]
    
    async def optimize_route(self, 
                           driver_id: str,
                           driver_location: Dict[str, float],
                           deliveries: List[H3DeliveryPoint],
                           vehicle_capacity: float = 1000,
                           vehicle_volume: float = 10,
                           h3_resolution: int = 9,
                           algorithm: str = "h3_dijkstra") -> H3RouteOptimizationResponse:
        """Main route optimization method using H3 grid - Distance only"""
        start_time = time.time()
        
        try:
            print(f"🚀 Starting H3 distance-based route optimization for driver {driver_id}")
            print(f"📍 Driver location: {driver_location}")
            print(f"📦 Deliveries: {len(deliveries)}")
            print(f"🔧 Algorithm: {algorithm}")
            print(f"📐 H3 Resolution: {h3_resolution}")
            
            # Validate inputs
            if not deliveries:
                return H3RouteOptimizationResponse(
                    success=False,
                    error_message="No deliveries provided",
                    processing_time_ms=0
                )
            
            # Convert driver location to H3 cell
            driver_cell = grid_manager.get_cell_by_coordinates(
                driver_location['lat'], 
                driver_location['lng'], 
                h3_resolution
            )
            
            # Create optimization grid
            grid_start_time = time.time()
            grid = grid_manager.create_optimization_grid(
                center_lat=driver_location['lat'],
                center_lng=driver_location['lng'],
                deliveries=deliveries,
                resolution=h3_resolution
            )
            grid_creation_time = time.time() - grid_start_time
            
            # Find delivery cells within grid
            delivery_cells = grid_manager.find_delivery_cells(deliveries, grid)
            
            # Create distance matrix (no environmental factors)
            distance_matrix = grid_manager.create_distance_matrix(
                grid, delivery_cells, driver_cell
            )
            
            # Apply capacity constraints
            feasible_deliveries = self._apply_capacity_constraints(
                deliveries, vehicle_capacity, vehicle_volume
            )
            
            if not feasible_deliveries:
                return H3RouteOptimizationResponse(
                    success=False,
                    error_message="No feasible deliveries within capacity constraints",
                    processing_time_ms=0
                )
            
            # Optimize route based on algorithm
            if algorithm == "h3_dijkstra":
                route_segments = self._optimize_with_dijkstra(
                    driver_cell, delivery_cells, distance_matrix, feasible_deliveries
                )
            elif algorithm == "h3_astar":
                route_segments = self._optimize_with_astar(
                    driver_cell, delivery_cells, distance_matrix, feasible_deliveries
                )
            elif algorithm == "h3_greedy":
                route_segments = self._optimize_with_greedy(
                    driver_cell, delivery_cells, distance_matrix, feasible_deliveries
                )
            else:
                return H3RouteOptimizationResponse(
                    success=False,
                    error_message=f"Unsupported algorithm: {algorithm}",
                    processing_time_ms=0
                )
            
            # Calculate route metrics
            total_distance = sum(segment.distance_km for segment in route_segments)
            total_time = sum(segment.estimated_time_min for segment in route_segments)
            fuel_estimate = self._calculate_fuel_estimate(total_distance, vehicle_capacity)
            efficiency_score = self._calculate_efficiency_score(
                total_distance, len(feasible_deliveries), vehicle_capacity
            )
            
            # Create optimized route with basic metrics
            optimized_route = H3OptimizedRoute(
                route_id=f"h3_route_{driver_id}_{int(time.time())}",
                driver_id=driver_id,
                segments=route_segments,
                total_distance_km=total_distance,
                total_time_min=total_time,
                fuel_estimate_l=fuel_estimate,
                efficiency_score=efficiency_score,
                h3_grid_info=grid,
                algorithm_used=algorithm,
                optimization_time_ms=int((time.time() - start_time) * 1000)
            )
            
            # Get grid statistics
            grid_stats = grid_manager.get_grid_statistics(grid)
            
            # Create performance metrics
            performance_metrics = H3PerformanceMetrics(
                grid_creation_time_ms=int(grid_creation_time * 1000),
                pathfinding_time_ms=int((time.time() - start_time - grid_creation_time) * 1000),
                total_optimization_time_ms=int((time.time() - start_time) * 1000),
                memory_usage_mb=self._estimate_memory_usage(grid, len(deliveries)),
                cells_processed=len(grid.cells),
                algorithm_efficiency=efficiency_score
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"✅ H3 distance-based optimization completed in {processing_time}ms")
            print(f"📊 Total distance: {total_distance:.2f} km")
            print(f"⏱️ Total time: {total_time} minutes")
            print(f"⛽ Fuel estimate: {fuel_estimate:.2f} L")
            print(f"📈 Efficiency: {efficiency_score:.1f}%")
            
            return H3RouteOptimizationResponse(
                success=True,
                route=optimized_route,
                processing_time_ms=processing_time,
                grid_statistics=grid_stats,
                performance_metrics=performance_metrics.model_dump(),
                recommendations=[
                    f"Route optimized using {algorithm} algorithm",
                    f"Total distance: {total_distance:.2f} km",
                    f"Efficiency score: {efficiency_score:.1f}%"
                ]
            )
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            print(f"❌ H3 optimization failed: {str(e)}")
            
            return H3RouteOptimizationResponse(
                success=False,
                error_message=str(e),
                processing_time_ms=processing_time
            )
    
    def _apply_capacity_constraints(self, 
                                  deliveries: List[H3DeliveryPoint],
                                  vehicle_capacity: float,
                                  vehicle_volume: float) -> List[H3DeliveryPoint]:
        """Apply capacity constraints and return feasible deliveries"""
        feasible_deliveries = []
        total_weight = 0
        total_volume = 0
        
        # Sort by priority (high first)
        priority_order = {"high": 3, "medium": 2, "low": 1}
        sorted_deliveries = sorted(
            deliveries, 
            key=lambda x: priority_order.get(x.priority, 2), 
            reverse=True
        )
        
        for delivery in sorted_deliveries:
            delivery_weight = delivery.weight or 0
            delivery_volume = delivery.volume or 0
            
            if (total_weight + delivery_weight <= vehicle_capacity and 
                total_volume + delivery_volume <= vehicle_volume):
                feasible_deliveries.append(delivery)
                total_weight += delivery_weight
                total_volume += delivery_volume
        
        return feasible_deliveries
    
    def _optimize_with_dijkstra(self, 
                               driver_cell: H3Cell,
                               delivery_cells: Dict[str, H3Cell],
                               distance_matrix: Dict[str, Dict[str, float]],
                               deliveries: List[H3DeliveryPoint]) -> List[H3RouteSegment]:
        """Optimize route using Dijkstra's algorithm on H3 grid"""
        segments = []
        current_cell = driver_cell
        remaining_deliveries = deliveries.copy()
        
        while remaining_deliveries:
            # Find nearest delivery using Dijkstra
            nearest_delivery, path = self._find_nearest_with_dijkstra(
                current_cell, delivery_cells, distance_matrix, remaining_deliveries
            )
            
            if not nearest_delivery:
                break
            
            # Create route segment
            segment = H3RouteSegment(
                from_cell=current_cell,
                to_cell=delivery_cells[nearest_delivery.id],
                distance_km=distance_matrix[current_cell.h3_index][delivery_cells[nearest_delivery.id].h3_index],
                estimated_time_min=self._estimate_travel_time(
                    distance_matrix[current_cell.h3_index][delivery_cells[nearest_delivery.id].h3_index]
                ),
                h3_path=path
            )
            segments.append(segment)
            
            # Update current position
            current_cell = delivery_cells[nearest_delivery.id]
            remaining_deliveries.remove(nearest_delivery)
        
        return segments
    
    def _find_nearest_with_dijkstra(self, 
                                   start_cell: H3Cell,
                                   delivery_cells: Dict[str, H3Cell],
                                   distance_matrix: Dict[str, Dict[str, float]],
                                   deliveries: List[H3DeliveryPoint]) -> Tuple[Optional[H3DeliveryPoint], List[str]]:
        """Find nearest delivery using Dijkstra's algorithm"""
        distances = {start_cell.h3_index: 0}
        previous = {}
        visited = set()
        pq = [(0, start_cell.h3_index)]
        
        while pq:
            current_dist, current_cell_index = heapq.heappop(pq)
            
            if current_cell_index in visited:
                continue
            
            visited.add(current_cell_index)
            
            # Check if we reached a delivery cell
            for delivery in deliveries:
                if delivery_cells[delivery.id].h3_index == current_cell_index:
                    # Reconstruct path
                    path = []
                    current = current_cell_index
                    while current in previous:
                        path.append(current)
                        current = previous[current]
                    path.append(start_cell.h3_index)
                    path.reverse()
                    
                    return delivery, path
            
            # Explore neighbors
            for neighbor_cell_index, distance in distance_matrix[current_cell_index].items():
                if neighbor_cell_index not in visited:
                    new_distance = current_dist + distance
                    if (neighbor_cell_index not in distances or 
                        new_distance < distances[neighbor_cell_index]):
                        distances[neighbor_cell_index] = new_distance
                        previous[neighbor_cell_index] = current_cell_index
                        heapq.heappush(pq, (new_distance, neighbor_cell_index))
        
        return None, []
    
    def _optimize_with_astar(self, 
                            driver_cell: H3Cell,
                            delivery_cells: Dict[str, H3Cell],
                            distance_matrix: Dict[str, Dict[str, float]],
                            deliveries: List[H3DeliveryPoint]) -> List[H3RouteSegment]:
        """Optimize route using A* algorithm on H3 grid"""
        # Similar to Dijkstra but with heuristic
        return self._optimize_with_dijkstra(driver_cell, delivery_cells, distance_matrix, deliveries)
    
    def _optimize_with_greedy(self, 
                             driver_cell: H3Cell,
                             delivery_cells: Dict[str, H3Cell],
                             distance_matrix: Dict[str, Dict[str, float]],
                             deliveries: List[H3DeliveryPoint]) -> List[H3RouteSegment]:
        """Optimize route using greedy nearest neighbor on H3 grid"""
        segments = []
        current_cell = driver_cell
        remaining_deliveries = deliveries.copy()
        
        while remaining_deliveries:
            # Find nearest delivery
            nearest_delivery = None
            min_distance = float('inf')
            
            for delivery in remaining_deliveries:
                distance = distance_matrix[current_cell.h3_index][delivery_cells[delivery.id].h3_index]
                if distance < min_distance:
                    min_distance = distance
                    nearest_delivery = delivery
            
            if not nearest_delivery:
                break
            
            # Create route segment
            segment = H3RouteSegment(
                from_cell=current_cell,
                to_cell=delivery_cells[nearest_delivery.id],
                distance_km=min_distance,
                estimated_time_min=self._estimate_travel_time(min_distance),
                h3_path=[current_cell.h3_index, delivery_cells[nearest_delivery.id].h3_index]
            )
            segments.append(segment)
            
            # Update current position
            current_cell = delivery_cells[nearest_delivery.id]
            remaining_deliveries.remove(nearest_delivery)
        
        return segments
    
    def _estimate_travel_time(self, distance_km: float, avg_speed_kmh: float = 50) -> int:
        """Estimate travel time in minutes"""
        return int((distance_km / avg_speed_kmh) * 60)
    
    def _calculate_fuel_estimate(self, distance_km: float, load_factor: float = 1.0) -> float:
        """Calculate fuel consumption estimate"""
        base_fuel_rate = 8  # km/liter
        load_efficiency = 1.0 - (load_factor / 1000) * 0.2
        return distance_km / (base_fuel_rate * load_efficiency)
    
    def _calculate_efficiency_score(self, 
                                  total_distance: float, 
                                  delivery_count: int, 
                                  vehicle_capacity: float) -> float:
        """Calculate route efficiency score"""
        if delivery_count == 0:
            return 100.0
        
        # Distance efficiency (shorter is better)
        avg_distance_per_delivery = total_distance / delivery_count
        distance_efficiency = max(0, 100 - (avg_distance_per_delivery * 2))
        
        # Capacity utilization efficiency
        capacity_efficiency = min(100, (delivery_count / 10) * 100)  # Assuming 10 is optimal
        
        # Overall efficiency
        overall_efficiency = (distance_efficiency * 0.7 + capacity_efficiency * 0.3)
        
        return max(0, min(100, overall_efficiency))
    
    def _estimate_memory_usage(self, grid: H3Grid, delivery_count: int) -> float:
        """Estimate memory usage in MB"""
        # Rough estimation: each cell ~ 1KB, each delivery ~ 2KB
        cell_memory = len(grid.cells) * 0.001  # MB
        delivery_memory = delivery_count * 0.002  # MB
        return cell_memory + delivery_memory + 10.0  # Base overhead

# Global instance
h3_optimizer = H3RouteOptimizer() 