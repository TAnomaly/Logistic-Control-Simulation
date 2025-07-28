import time
import random
from typing import Dict, List, Optional
from ..models.h3_schemas import H3Cell, H3TrafficAnalysis, TrafficCondition
from ..utils.h3_utils import H3Utils

class TrafficAnalyzer:
    """H3-based traffic analysis service"""
    
    def __init__(self):
        self.traffic_cache: Dict[str, H3TrafficAnalysis] = {}
        self.cache_ttl = 300  # 5 minutes
        self.last_update = 0
        
    def analyze_traffic_for_cell(self, cell: H3Cell) -> H3TrafficAnalysis:
        """Analyze traffic conditions for a specific H3 cell"""
        cache_key = f"{cell.h3_index}_{int(time.time() // self.cache_ttl)}"
        
        if cache_key in self.traffic_cache:
            return self.traffic_cache[cache_key]
        
        # Simulate traffic analysis (in real implementation, this would call external APIs)
        traffic_condition = self._simulate_traffic_condition(cell)
        congestion_level = self._calculate_congestion_level(traffic_condition)
        average_speed = self._calculate_average_speed(traffic_condition)
        travel_time_factor = self._calculate_travel_time_factor(congestion_level)
        
        analysis = H3TrafficAnalysis(
            cell_id=cell.h3_index,
            traffic_condition=traffic_condition,
            congestion_level=congestion_level,
            average_speed_kmh=average_speed,
            travel_time_factor=travel_time_factor,
            peak_hours=self._get_peak_hours(cell),
            historical_data=self._get_historical_data(cell)
        )
        
        self.traffic_cache[cache_key] = analysis
        return analysis
    
    def analyze_traffic_for_grid(self, cells: List[H3Cell]) -> Dict[str, H3TrafficAnalysis]:
        """Analyze traffic conditions for all cells in a grid"""
        traffic_data = {}
        
        for cell in cells:
            traffic_data[cell.h3_index] = self.analyze_traffic_for_cell(cell)
        
        return traffic_data
    
    def get_traffic_hotspots(self, cells: List[H3Cell], threshold: float = 0.7) -> List[Dict]:
        """Identify traffic hotspots in the grid"""
        hotspots = []
        
        for cell in cells:
            analysis = self.analyze_traffic_for_cell(cell)
            
            if analysis.congestion_level >= threshold:
                hotspot = {
                    "cell_id": cell.h3_index,
                    "coordinates": {
                        "lat": cell.center_lat,
                        "lng": cell.center_lng
                    },
                    "congestion_level": analysis.congestion_level,
                    "traffic_condition": analysis.traffic_condition,
                    "impact_radius_km": self._calculate_impact_radius(analysis.congestion_level)
                }
                hotspots.append(hotspot)
        
        return hotspots
    
    def calculate_traffic_factor(self, from_cell: H3Cell, to_cell: H3Cell) -> float:
        """Calculate traffic factor for route segment"""
        from_analysis = self.analyze_traffic_for_cell(from_cell)
        to_analysis = self.analyze_traffic_for_cell(to_cell)
        
        # Weighted average of traffic conditions
        avg_congestion = (from_analysis.congestion_level + to_analysis.congestion_level) / 2
        avg_travel_factor = (from_analysis.travel_time_factor + to_analysis.travel_time_factor) / 2
        
        # Traffic factor: 1.0 = no impact, higher = more delay
        traffic_factor = 1.0 + (avg_congestion * 0.5) + (avg_travel_factor - 1.0) * 0.3
        
        return min(traffic_factor, 3.0)  # Cap at 3x delay
    
    def _simulate_traffic_condition(self, cell: H3Cell) -> TrafficCondition:
        """Simulate traffic condition based on cell characteristics"""
        # Use cell coordinates as seed for consistent results
        seed = hash(f"{cell.center_lat:.4f}_{cell.center_lng:.4f}")
        random.seed(seed)
        
        # Simulate different traffic patterns based on location
        hour = time.localtime().tm_hour
        
        # Peak hours simulation
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
            conditions = [TrafficCondition.LIGHT, TrafficCondition.MODERATE, 
                         TrafficCondition.HEAVY, TrafficCondition.CONGESTED]
            weights = [0.1, 0.3, 0.4, 0.2]
        else:  # Off-peak hours
            conditions = [TrafficCondition.LIGHT, TrafficCondition.MODERATE, 
                         TrafficCondition.HEAVY]
            weights = [0.6, 0.3, 0.1]
        
        return random.choices(conditions, weights=weights)[0]
    
    def _calculate_congestion_level(self, traffic_condition: TrafficCondition) -> float:
        """Calculate congestion level (0-1) based on traffic condition"""
        congestion_map = {
            TrafficCondition.LIGHT: 0.1,
            TrafficCondition.MODERATE: 0.3,
            TrafficCondition.HEAVY: 0.6,
            TrafficCondition.CONGESTED: 0.9
        }
        return congestion_map.get(traffic_condition, 0.3)
    
    def _calculate_average_speed(self, traffic_condition: TrafficCondition) -> float:
        """Calculate average speed based on traffic condition"""
        speed_map = {
            TrafficCondition.LIGHT: 60.0,
            TrafficCondition.MODERATE: 45.0,
            TrafficCondition.HEAVY: 25.0,
            TrafficCondition.CONGESTED: 10.0
        }
        return speed_map.get(traffic_condition, 40.0)
    
    def _calculate_travel_time_factor(self, congestion_level: float) -> float:
        """Calculate travel time factor (1.0 = normal, higher = more time)"""
        return 1.0 + (congestion_level * 2.0)
    
    def _get_peak_hours(self, cell: H3Cell) -> List[str]:
        """Get peak traffic hours for the cell"""
        # Simulate different peak hours based on location
        seed = hash(f"{cell.center_lat:.4f}_{cell.center_lng:.4f}")
        random.seed(seed)
        
        patterns = [
            ["07:00-09:00", "17:00-19:00"],  # Standard rush hours
            ["08:00-10:00", "16:00-18:00"],  # Slightly different
            ["06:00-08:00", "18:00-20:00"],  # Early/late rush
            ["09:00-11:00", "15:00-17:00"]   # Mid-morning/afternoon
        ]
        
        return random.choice(patterns)
    
    def _get_historical_data(self, cell: H3Cell) -> Dict:
        """Get historical traffic data for the cell"""
        return {
            "avg_daily_congestion": random.uniform(0.2, 0.6),
            "peak_day": random.choice(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
            "seasonal_variation": random.uniform(0.8, 1.2),
            "trend": random.choice(["increasing", "stable", "decreasing"])
        }
    
    def _calculate_impact_radius(self, congestion_level: float) -> float:
        """Calculate impact radius of traffic hotspot in km"""
        return 2.0 + (congestion_level * 3.0)  # 2-5 km radius
    
    def clear_cache(self):
        """Clear traffic analysis cache"""
        self.traffic_cache.clear()
        print("🗑️ Traffic analysis cache cleared")

# Global instance
traffic_analyzer = TrafficAnalyzer() 