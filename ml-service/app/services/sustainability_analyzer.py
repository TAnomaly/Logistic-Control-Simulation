import math
from typing import Dict, List, Optional
from ..models.h3_schemas import H3Cell, H3RouteSegment, H3OptimizedRoute, H3SustainabilityMetrics
from ..utils.h3_utils import H3Utils

class SustainabilityAnalyzer:
    """H3-based sustainability analysis service"""
    
    def __init__(self):
        # Carbon emission factors (kg CO2 per km)
        self.emission_factors = {
            "diesel": 2.68,      # Diesel truck
            "gasoline": 2.31,    # Gasoline truck
            "electric": 0.0,     # Electric vehicle (assuming renewable energy)
            "hybrid": 1.15       # Hybrid vehicle
        }
        
        # Fuel efficiency factors (km/liter)
        self.fuel_efficiency = {
            "diesel": 8.0,       # Diesel truck
            "gasoline": 6.5,     # Gasoline truck
            "electric": 0.0,     # Electric vehicle
            "hybrid": 12.0       # Hybrid vehicle
        }
        
        # Vehicle types and their characteristics
        self.vehicle_types = {
            "small_van": {
                "fuel_type": "gasoline",
                "base_efficiency": 8.0,
                "capacity_kg": 1000,
                "eco_friendly": False
            },
            "medium_truck": {
                "fuel_type": "diesel",
                "base_efficiency": 6.5,
                "capacity_kg": 3000,
                "eco_friendly": False
            },
            "large_truck": {
                "fuel_type": "diesel",
                "base_efficiency": 5.0,
                "capacity_kg": 8000,
                "eco_friendly": False
            },
            "electric_van": {
                "fuel_type": "electric",
                "base_efficiency": 0.0,  # km/kWh instead
                "capacity_kg": 800,
                "eco_friendly": True
            },
            "hybrid_truck": {
                "fuel_type": "hybrid",
                "base_efficiency": 10.0,
                "capacity_kg": 2000,
                "eco_friendly": True
            }
        }
    
    def calculate_route_sustainability(self, 
                                     route: H3OptimizedRoute,
                                     vehicle_type: str = "medium_truck",
                                     load_factor: float = 0.7) -> H3SustainabilityMetrics:
        """Calculate sustainability metrics for a route"""
        
        vehicle_info = self.vehicle_types.get(vehicle_type, self.vehicle_types["medium_truck"])
        
        # Calculate fuel consumption
        fuel_consumption = self._calculate_fuel_consumption(
            route.total_distance_km, 
            vehicle_info, 
            load_factor
        )
        
        # Calculate carbon footprint
        carbon_footprint = self._calculate_carbon_footprint(
            route.total_distance_km,
            vehicle_info,
            load_factor
        )
        
        # Calculate fuel efficiency
        fuel_efficiency = self._calculate_fuel_efficiency(
            route.total_distance_km,
            fuel_consumption,
            vehicle_info
        )
        
        # Calculate eco-friendly score
        eco_score = self._calculate_eco_friendly_score(
            vehicle_info,
            carbon_footprint,
            route.total_distance_km,
            len(route.segments)
        )
        
        # Calculate green route percentage
        green_route_percentage = self._calculate_green_route_percentage(route.segments)
        
        # Check alternative fuel compatibility
        alt_fuel_compatibility = self._check_alternative_fuel_compatibility(vehicle_info)
        
        # Calculate emission reduction potential
        emission_reduction = self._calculate_emission_reduction_potential(
            carbon_footprint,
            vehicle_info,
            route.total_distance_km
        )
        
        return H3SustainabilityMetrics(
            total_carbon_footprint_kg=carbon_footprint,
            fuel_efficiency_kmpl=fuel_efficiency,
            eco_friendly_score=eco_score,
            green_route_percentage=green_route_percentage,
            alternative_fuel_compatibility=alt_fuel_compatibility,
            emission_reduction_potential=emission_reduction
        )
    
    def analyze_segment_sustainability(self, 
                                     segment: H3RouteSegment,
                                     vehicle_type: str = "medium_truck",
                                     load_factor: float = 0.7) -> Dict:
        """Analyze sustainability for a single route segment"""
        
        vehicle_info = self.vehicle_types.get(vehicle_type, self.vehicle_types["medium_truck"])
        
        # Calculate segment-specific metrics
        segment_fuel = self._calculate_fuel_consumption(
            segment.distance_km,
            vehicle_info,
            load_factor
        )
        
        segment_carbon = self._calculate_carbon_footprint(
            segment.distance_km,
            vehicle_info,
            load_factor
        )
        
        # Analyze road conditions impact
        road_impact = self._analyze_road_conditions_impact(segment)
        
        # Analyze elevation impact
        elevation_impact = self._analyze_elevation_impact(segment)
        
        return {
            "segment_id": f"{segment.from_cell.h3_index}_{segment.to_cell.h3_index}",
            "distance_km": segment.distance_km,
            "fuel_consumption_l": segment_fuel,
            "carbon_footprint_kg": segment_carbon,
            "road_conditions_impact": road_impact,
            "elevation_impact": elevation_impact,
            "sustainability_score": self._calculate_segment_sustainability_score(
                segment, vehicle_info, load_factor
            )
        }
    
    def get_sustainability_recommendations(self, 
                                         route: H3OptimizedRoute,
                                         vehicle_type: str = "medium_truck",
                                         deliveries: Optional[List] = None) -> List[str]:
        """Get sustainability improvement recommendations"""
        
        recommendations = []
        vehicle_info = self.vehicle_types.get(vehicle_type, self.vehicle_types["medium_truck"])
        
        # Check vehicle type recommendations
        if not vehicle_info["eco_friendly"]:
            recommendations.append(
                "Consider switching to electric or hybrid vehicle for reduced emissions"
            )
        
        # Check route efficiency
        if route.efficiency_score < 70:
            recommendations.append(
                "Route efficiency is low. Consider consolidating deliveries or optimizing route"
            )
        
        # Check for high-emission segments
        high_emission_segments = []
        for segment in route.segments:
            if segment.carbon_footprint_kg and segment.carbon_footprint_kg > 5:
                high_emission_segments.append(segment)
        
        if high_emission_segments:
            recommendations.append(
                f"Found {len(high_emission_segments)} high-emission segments. Consider alternative routes"
            )
        
        # Check load optimization
        total_weight = 0
        if deliveries:
            # Eşleştirme: segment.to_cell.h3_index ile delivery.h3_cell.h3_index
            for segment in route.segments:
                for delivery in deliveries:
                    if hasattr(delivery, 'h3_cell') and delivery.h3_cell.h3_index == segment.to_cell.h3_index:
                        total_weight += delivery.weight or 0
        else:
            # Eski davranış (hata vermesin diye)
            total_weight = 0
        
        if total_weight < 500:  # Assuming low load
            recommendations.append(
                "Vehicle load is low. Consider route consolidation or smaller vehicle"
            )
        
        # Check for green route opportunities
        green_percentage = self._calculate_green_route_percentage(route.segments)
        if green_percentage < 30:
            recommendations.append(
                "Low green route percentage. Consider routes with more eco-friendly roads"
            )
        
        return recommendations
    
    def _calculate_fuel_consumption(self, 
                                  distance_km: float,
                                  vehicle_info: Dict,
                                  load_factor: float) -> float:
        """Calculate fuel consumption for given distance"""
        
        if vehicle_info["fuel_type"] == "electric":
            # Electric vehicles use kWh instead of liters
            # Assuming 0.2 kWh/km for electric van
            return distance_km * 0.2
        else:
            # Fuel vehicles
            base_efficiency = vehicle_info["base_efficiency"]
            
            # Load factor impact on efficiency
            load_impact = 1.0 - (load_factor * 0.2)  # 20% efficiency loss at full load
            
            # Calculate actual efficiency
            actual_efficiency = base_efficiency * load_impact
            
            return distance_km / actual_efficiency
    
    def _calculate_carbon_footprint(self, 
                                  distance_km: float,
                                  vehicle_info: Dict,
                                  load_factor: float) -> float:
        """Calculate carbon footprint for given distance"""
        
        fuel_type = vehicle_info["fuel_type"]
        
        if fuel_type == "electric":
            # Assuming grid mix with some renewable energy
            # Average grid emission: 0.5 kg CO2/kWh
            kwh_consumed = distance_km * 0.2
            return kwh_consumed * 0.5
        elif fuel_type == "hybrid":
            # Hybrid uses both electric and fuel
            electric_portion = 0.4  # 40% electric
            fuel_portion = 0.6      # 60% fuel
            
            electric_emission = (distance_km * electric_portion * 0.2) * 0.5
            fuel_emission = (distance_km * fuel_portion) * self.emission_factors["gasoline"]
            
            return electric_emission + fuel_emission
        else:
            # Traditional fuel vehicles
            emission_factor = self.emission_factors.get(fuel_type, 2.5)
            return distance_km * emission_factor * (1.0 + load_factor * 0.1)
    
    def _calculate_fuel_efficiency(self, 
                                 distance_km: float,
                                 fuel_consumption: float,
                                 vehicle_info: Dict) -> float:
        """Calculate fuel efficiency in km/liter or km/kWh"""
        
        if vehicle_info["fuel_type"] == "electric":
            # Convert kWh to equivalent liters for comparison
            # Assuming 1 kWh ≈ 0.1 liters equivalent
            equivalent_liters = fuel_consumption * 0.1
            return distance_km / equivalent_liters if equivalent_liters > 0 else 0
        else:
            return distance_km / fuel_consumption if fuel_consumption > 0 else 0
    
    def _calculate_eco_friendly_score(self, 
                                    vehicle_info: Dict,
                                    carbon_footprint: float,
                                    distance_km: float,
                                    delivery_count: int) -> float:
        """Calculate eco-friendly score (0-100)"""
        
        score = 0.0
        
        # Vehicle type score (40 points)
        if vehicle_info["eco_friendly"]:
            score += 40
        else:
            score += 20
        
        # Carbon efficiency score (30 points)
        # Lower carbon footprint per km = higher score
        carbon_per_km = carbon_footprint / distance_km if distance_km > 0 else 0
        if carbon_per_km < 1.0:
            score += 30
        elif carbon_per_km < 2.0:
            score += 20
        elif carbon_per_km < 3.0:
            score += 10
        else:
            score += 5
        
        # Delivery efficiency score (20 points)
        # More deliveries per km = higher score
        deliveries_per_km = delivery_count / distance_km if distance_km > 0 else 0
        if deliveries_per_km > 0.1:
            score += 20
        elif deliveries_per_km > 0.05:
            score += 15
        elif deliveries_per_km > 0.02:
            score += 10
        else:
            score += 5
        
        # Route optimization score (10 points)
        # This would be based on route efficiency
        score += 10
        
        return min(score, 100.0)
    
    def _calculate_green_route_percentage(self, segments: List[H3RouteSegment]) -> float:
        """Calculate percentage of route that uses green/eco-friendly roads"""
        
        if not segments:
            return 0.0
        
        green_segments = 0
        
        for segment in segments:
            # Check if segment uses green roads (highways, eco-friendly routes)
            if segment.road_type in ["highway", "eco_route", "green_corridor"]:
                green_segments += 1
            elif segment.traffic_factor < 1.2:  # Low traffic impact
                green_segments += 0.5
        
        return (green_segments / len(segments)) * 100.0
    
    def _check_alternative_fuel_compatibility(self, vehicle_info: Dict) -> bool:
        """Check if vehicle is compatible with alternative fuels"""
        
        fuel_type = vehicle_info["fuel_type"]
        return fuel_type in ["electric", "hybrid"]
    
    def _calculate_emission_reduction_potential(self, 
                                              current_carbon: float,
                                              vehicle_info: Dict,
                                              distance_km: float) -> float:
        """Calculate potential emission reduction by switching to eco-friendly vehicle"""
        
        if vehicle_info["eco_friendly"]:
            return 0.0  # Already eco-friendly
        
        # Calculate emissions with electric vehicle
        electric_emission = (distance_km * 0.2) * 0.5  # Electric vehicle emissions
        
        # Calculate potential reduction
        reduction = current_carbon - electric_emission
        
        return max(reduction, 0.0)
    
    def _analyze_road_conditions_impact(self, segment: H3RouteSegment) -> Dict:
        """Analyze how road conditions affect sustainability"""
        
        impact = {
            "traffic_impact": segment.traffic_factor,
            "weather_impact": segment.weather_factor,
            "road_quality": "good" if segment.road_type in ["highway", "main_road"] else "variable",
            "sustainability_impact": "low"
        }
        
        # Calculate overall impact
        total_impact = segment.traffic_factor * segment.weather_factor
        
        if total_impact > 2.0:
            impact["sustainability_impact"] = "high"
        elif total_impact > 1.5:
            impact["sustainability_impact"] = "medium"
        
        return impact
    
    def _analyze_elevation_impact(self, segment: H3RouteSegment) -> Dict:
        """Analyze how elevation changes affect sustainability"""
        
        elevation_change = segment.elevation_change_m or 0
        
        impact = {
            "elevation_change_m": elevation_change,
            "energy_impact": "low",
            "fuel_penalty": 0.0
        }
        
        if abs(elevation_change) > 100:
            impact["energy_impact"] = "high"
            impact["fuel_penalty"] = abs(elevation_change) * 0.01  # 1% per 100m
        elif abs(elevation_change) > 50:
            impact["energy_impact"] = "medium"
            impact["fuel_penalty"] = abs(elevation_change) * 0.005  # 0.5% per 100m
        
        return impact
    
    def _calculate_segment_sustainability_score(self, 
                                              segment: H3RouteSegment,
                                              vehicle_info: Dict,
                                              load_factor: float) -> float:
        """Calculate sustainability score for a single segment (0-100)"""
        
        score = 100.0
        
        # Deduct points for various factors
        if segment.traffic_factor > 1.5:
            score -= 20
        elif segment.traffic_factor > 1.2:
            score -= 10
        
        if segment.weather_factor > 1.5:
            score -= 15
        elif segment.weather_factor > 1.2:
            score -= 8
        
        if segment.elevation_change_m and abs(segment.elevation_change_m) > 100:
            score -= 10
        
        if not vehicle_info["eco_friendly"]:
            score -= 15
        
        return max(score, 0.0)

# Global instance
sustainability_analyzer = SustainabilityAnalyzer() 