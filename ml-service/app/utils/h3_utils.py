try:
    import h3
except ImportError:
    print("⚠️ H3 library not available, using fallback")
    h3 = None

import numpy as np
from typing import List, Dict, Tuple, Optional
import time
from ..models.h3_schemas import H3Cell, H3Grid, H3DeliveryPoint

class H3Utils:
    """H3 utility functions for geospatial operations"""
    
    @staticmethod
    def latlng_to_h3(lat: float, lng: float, resolution: int = 9) -> str:
        """Convert lat/lng to H3 index"""
        if h3 is None:
            raise ImportError("H3 library not available")
        return h3.latlng_to_cell(lat, lng, resolution)
    
    @staticmethod
    def h3_to_latlng(h3_index: str) -> Tuple[float, float]:
        """Convert H3 index to lat/lng"""
        return h3.cell_to_latlng(h3_index)
    
    @staticmethod
    def get_cell_area(h3_index: str, unit: str = 'km^2') -> float:
        """Get H3 cell area"""
        return h3.cell_area(h3_index, unit=unit)
    
    @staticmethod
    def get_cell_edge_length(h3_index: str, unit: str = 'km') -> float:
        """Get H3 cell edge length"""
        return h3.edge_length(h3_index, unit=unit)
    
    @staticmethod
    def create_grid_around_point(center_lat: float, center_lng: float, 
                                resolution: int, radius_km: float) -> H3Grid:
        """Create H3 grid around a center point"""
        start_time = time.time()
        
        # Convert center point to H3
        center_h3 = h3.latlng_to_cell(center_lat, center_lng, resolution)
        
        # Calculate grid radius in H3 cells
        # Approximate: 1 H3 cell at res 9 ≈ 0.174 km
        cell_size_km = 0.174 * (2 ** (9 - resolution))
        grid_radius = max(1, int(radius_km / cell_size_km))
        
        # Create grid disk
        grid_cells = h3.grid_disk(center_h3, grid_radius)
        
        # Convert to H3Cell objects
        cells = []
        for h3_index in grid_cells:
            cell = H3Cell.from_h3_index(h3_index)
            cells.append(cell)
        
        grid_creation_time = (time.time() - start_time) * 1000  # ms
        
        return H3Grid(
            center_h3=center_h3,
            resolution=resolution,
            radius_km=radius_km,
            cells=cells,
            cell_count=len(cells)
        )
    
    @staticmethod
    def calculate_h3_distance(h3_index1: str, h3_index2: str, unit: str = 'km') -> float:
        """Calculate distance between two H3 cells"""
        lat1, lng1 = h3.cell_to_latlng(h3_index1)
        lat2, lng2 = h3.cell_to_latlng(h3_index2)
        
        # Haversine distance
        return H3Utils.haversine_distance(lat1, lng1, lat2, lng2)
    
    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate Haversine distance between two points"""
        import math
        
        R = 6371  # Earth's radius in kilometers
        
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    @staticmethod
    def find_nearest_cell(target_lat: float, target_lng: float, 
                         available_cells: List[H3Cell]) -> H3Cell:
        """Find nearest H3 cell to target coordinates"""
        min_distance = float('inf')
        nearest_cell = None
        
        for cell in available_cells:
            distance = H3Utils.haversine_distance(
                target_lat, target_lng, 
                cell.center_lat, cell.center_lng
            )
            if distance < min_distance:
                min_distance = distance
                nearest_cell = cell
        
        return nearest_cell
    
    @staticmethod
    def get_cell_neighbors(h3_index: str) -> List[str]:
        """Get neighboring H3 cells"""
        return list(h3.grid_disk(h3_index, 1))[1:]  # Exclude center cell
    
    @staticmethod
    def create_delivery_points_with_h3(deliveries: List[Dict], 
                                     resolution: int = 9) -> List[H3DeliveryPoint]:
        """Convert delivery points to H3DeliveryPoint objects"""
        h3_deliveries = []
        
        for delivery in deliveries:
            coords = delivery.get('coordinates', {})
            lat = coords.get('latitude', coords.get('lat', 0))
            lng = coords.get('longitude', coords.get('lng', 0))
            
            h3_delivery = H3DeliveryPoint.from_coordinates(
                delivery_id=delivery['id'],
                address=delivery['address'],
                lat=lat,
                lng=lng,
                resolution=resolution,
                priority=delivery.get('priority', 'medium'),
                weight=delivery.get('weight'),
                volume=delivery.get('volume'),
                time_window=delivery.get('time_window')
            )
            h3_deliveries.append(h3_delivery)
        
        return h3_deliveries
    
    @staticmethod
    def optimize_grid_resolution(area_km2: float, desired_cell_count: int = 1000) -> int:
        """Find optimal H3 resolution for given area and desired cell count"""
        # H3 cell areas at different resolutions (approximate)
        cell_areas = {
            0: 4250547, 1: 607221, 2: 86746, 3: 12393, 4: 1770,
            5: 253, 6: 36, 7: 5, 8: 0.7, 9: 0.1, 10: 0.015, 11: 0.002, 12: 0.0003
        }
        
        for resolution, cell_area in cell_areas.items():
            estimated_cells = area_km2 / cell_area
            if estimated_cells <= desired_cell_count:
                return resolution
        
        return 12  # Default to highest resolution
    
    @staticmethod
    def calculate_spatial_metrics(cells: List[H3Cell]) -> Dict[str, float]:
        """Calculate spatial metrics for H3 grid"""
        if not cells:
            return {}
        
        # Calculate center of mass
        total_lat = sum(cell.center_lat for cell in cells)
        total_lng = sum(cell.center_lng for cell in cells)
        center_lat = total_lat / len(cells)
        center_lng = total_lng / len(cells)
        
        # Calculate spread
        distances = []
        for cell in cells:
            dist = H3Utils.haversine_distance(
                center_lat, center_lng,
                cell.center_lat, cell.center_lng
            )
            distances.append(dist)
        
        return {
            'center_lat': center_lat,
            'center_lng': center_lng,
            'total_area_km2': sum(cell.area_km2 for cell in cells),
            'avg_distance_from_center': np.mean(distances),
            'max_distance_from_center': max(distances),
            'spatial_spread': np.std(distances)
        }
    
    @staticmethod
    def validate_h3_index(h3_index: str) -> bool:
        """Validate H3 index format"""
        try:
            h3.cell_to_latlng(h3_index)
            return True
        except:
            return False 