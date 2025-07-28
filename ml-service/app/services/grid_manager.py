import h3
import time
from typing import List, Dict, Optional, Set
from ..models.h3_schemas import H3Grid, H3Cell, H3DeliveryPoint
from ..utils.h3_utils import H3Utils
import numpy as np

class GridManager:
    """Manages H3 grid operations and caching"""
    
    def __init__(self):
        self.grid_cache: Dict[str, H3Grid] = {}
        self.cell_cache: Dict[str, H3Cell] = {}
        self.max_cache_size = 1000
        
    def create_optimization_grid(self, 
                                center_lat: float, 
                                center_lng: float,
                                deliveries: List[H3DeliveryPoint],
                                resolution: int = 9,
                                buffer_km: float = 50) -> H3Grid:
        """Create optimization grid covering all delivery points"""
        start_time = time.time()
        
        # Calculate bounding box of all delivery points
        lats = [delivery.coordinates['lat'] for delivery in deliveries]
        lngs = [delivery.coordinates['lng'] for delivery in deliveries]
        
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)
        
        # Add center point to bounding box
        lats.extend([center_lat])
        lngs.extend([center_lng])
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)
        
        # Calculate grid center and radius
        grid_center_lat = (min_lat + max_lat) / 2
        grid_center_lng = (min_lng + max_lng) / 2
        
        # Calculate required radius to cover all points
        max_distance = 0
        for delivery in deliveries:
            dist = H3Utils.haversine_distance(
                grid_center_lat, grid_center_lng,
                delivery.coordinates['lat'], delivery.coordinates['lng']
            )
            max_distance = max(max_distance, dist)
        
        # Add buffer and center point distance
        center_dist = H3Utils.haversine_distance(
            grid_center_lat, grid_center_lng,
            center_lat, center_lng
        )
        required_radius = max(max_distance, center_dist) + buffer_km
        
        # Create grid
        grid = H3Utils.create_grid_around_point(
            grid_center_lat, grid_center_lng,
            resolution, required_radius
        )
        
        # Cache the grid
        grid_key = f"{grid_center_lat:.4f}_{grid_center_lng:.4f}_{resolution}_{required_radius:.1f}"
        self.grid_cache[grid_key] = grid
        
        # Clean cache if needed
        self._clean_cache()
        
        grid_creation_time = (time.time() - start_time) * 1000
        
        print(f"🔄 Created H3 grid: {grid.cell_count} cells, {grid_creation_time:.1f}ms")
        
        return grid
    
    def get_cell_by_coordinates(self, lat: float, lng: float, resolution: int = 9) -> H3Cell:
        """Get H3 cell for given coordinates"""
        h3_index = h3.latlng_to_cell(lat, lng, resolution)
        
        if h3_index in self.cell_cache:
            return self.cell_cache[h3_index]
        
        cell = H3Cell.from_h3_index(h3_index)
        self.cell_cache[h3_index] = cell
        
        return cell
    
    def find_delivery_cells(self, deliveries: List[H3DeliveryPoint], 
                           grid: H3Grid) -> Dict[str, H3Cell]:
        """Find H3 cells for all delivery points within grid"""
        delivery_cells = {}
        grid_cell_indices = {cell.h3_index for cell in grid.cells}
        
        for delivery in deliveries:
            delivery_h3 = delivery.h3_cell.h3_index
            
            # Check if delivery cell is in grid
            if delivery_h3 in grid_cell_indices:
                delivery_cells[delivery.id] = delivery.h3_cell
            else:
                # Find nearest cell in grid
                nearest_cell = H3Utils.find_nearest_cell(
                    delivery.coordinates['lat'],
                    delivery.coordinates['lng'],
                    grid.cells
                )
                delivery_cells[delivery.id] = nearest_cell
        
        return delivery_cells
    
    def create_distance_matrix(self, 
                              grid: H3Grid,
                              delivery_cells: Dict[str, H3Cell],
                              driver_cell: H3Cell) -> Dict[str, Dict[str, float]]:
        """Create distance matrix between all points"""
        all_cells = [driver_cell] + list(delivery_cells.values())
        cell_indices = [cell.h3_index for cell in all_cells]
        
        distance_matrix = {}
        
        for i, cell1 in enumerate(all_cells):
            distance_matrix[cell1.h3_index] = {}
            for j, cell2 in enumerate(all_cells):
                if i == j:
                    distance_matrix[cell1.h3_index][cell2.h3_index] = 0
                else:
                    distance = H3Utils.calculate_h3_distance(
                        cell1.h3_index, cell2.h3_index
                    )
                    distance_matrix[cell1.h3_index][cell2.h3_index] = distance
        
        return distance_matrix
    
    def optimize_grid_resolution(self, 
                                deliveries: List[H3DeliveryPoint],
                                target_cell_count: int = 1000) -> int:
        """Find optimal H3 resolution for given deliveries"""
        # Calculate bounding area
        lats = [delivery.coordinates['lat'] for delivery in deliveries]
        lngs = [delivery.coordinates['lng'] for delivery in deliveries]
        
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)
        
        # Approximate area calculation
        lat_diff = max_lat - min_lat
        lng_diff = max_lng - min_lng
        
        # Rough area calculation (not exact but good enough for resolution selection)
        area_km2 = lat_diff * lng_diff * 111 * 111  # 1 degree ≈ 111 km
        
        return H3Utils.optimize_grid_resolution(area_km2, target_cell_count)
    
    def get_grid_statistics(self, grid: H3Grid) -> Dict[str, any]:
        """Get statistics about the H3 grid"""
        if not grid.cells:
            return {}
        
        # Calculate spatial metrics
        spatial_metrics = H3Utils.calculate_spatial_metrics(grid.cells)
        
        # Calculate cell distribution
        cell_areas = [cell.area_km2 for cell in grid.cells]
        
        stats = {
            'total_cells': grid.cell_count,
            'resolution': grid.resolution,
            'radius_km': grid.radius_km,
            'total_area_km2': spatial_metrics.get('total_area_km2', 0),
            'avg_cell_area_km2': np.mean(cell_areas),
            'cell_density_per_km2': grid.cell_count / spatial_metrics.get('total_area_km2', 1),
            'spatial_center': {
                'lat': spatial_metrics.get('center_lat', 0),
                'lng': spatial_metrics.get('center_lng', 0)
            },
            'spatial_spread_km': spatial_metrics.get('spatial_spread', 0),
            'max_distance_from_center_km': spatial_metrics.get('max_distance_from_center', 0)
        }
        
        return stats
    
    def _clean_cache(self):
        """Clean cache if it exceeds maximum size"""
        if len(self.grid_cache) > self.max_cache_size:
            # Remove oldest entries
            keys_to_remove = list(self.grid_cache.keys())[:len(self.grid_cache) - self.max_cache_size]
            for key in keys_to_remove:
                del self.grid_cache[key]
        
        if len(self.cell_cache) > self.max_cache_size:
            keys_to_remove = list(self.cell_cache.keys())[:len(self.cell_cache) - self.max_cache_size]
            for key in keys_to_remove:
                del self.cell_cache[key]
    
    def clear_cache(self):
        """Clear all caches"""
        self.grid_cache.clear()
        self.cell_cache.clear()
        print("🗑️ Grid cache cleared")

# Global instance
grid_manager = GridManager() 