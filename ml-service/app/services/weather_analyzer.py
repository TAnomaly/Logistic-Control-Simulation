import time
import random
from typing import Dict, List, Optional
from ..models.h3_schemas import H3Cell, H3WeatherAnalysis, WeatherCondition
from ..utils.h3_utils import H3Utils

class WeatherAnalyzer:
    """H3-based weather analysis service"""
    
    def __init__(self):
        self.weather_cache: Dict[str, H3WeatherAnalysis] = {}
        self.cache_ttl = 1800  # 30 minutes (weather changes slower than traffic)
        self.last_update = 0
        
    def analyze_weather_for_cell(self, cell: H3Cell) -> H3WeatherAnalysis:
        """Analyze weather conditions for a specific H3 cell"""
        cache_key = f"{cell.h3_index}_{int(time.time() // self.cache_ttl)}"
        
        if cache_key in self.weather_cache:
            return self.weather_cache[cache_key]
        
        # Simulate weather analysis (in real implementation, this would call weather APIs)
        weather_condition = self._simulate_weather_condition(cell)
        temperature = self._simulate_temperature(cell)
        humidity = self._simulate_humidity(weather_condition)
        wind_speed = self._simulate_wind_speed(cell)
        precipitation = self._simulate_precipitation(weather_condition)
        visibility = self._simulate_visibility(weather_condition)
        impact_factor = self._calculate_weather_impact(weather_condition, wind_speed, precipitation)
        
        analysis = H3WeatherAnalysis(
            cell_id=cell.h3_index,
            weather_condition=weather_condition,
            temperature_celsius=temperature,
            humidity_percent=humidity,
            wind_speed_kmh=wind_speed,
            precipitation_mm=precipitation,
            visibility_km=visibility,
            impact_factor=impact_factor
        )
        
        self.weather_cache[cache_key] = analysis
        return analysis
    
    def analyze_weather_for_grid(self, cells: List[H3Cell]) -> Dict[str, H3WeatherAnalysis]:
        """Analyze weather conditions for all cells in a grid"""
        weather_data = {}
        
        for cell in cells:
            weather_data[cell.h3_index] = self.analyze_weather_for_cell(cell)
        
        return weather_data
    
    def get_weather_zones(self, cells: List[H3Cell]) -> List[Dict]:
        """Identify weather zones in the grid"""
        weather_zones = {}
        
        for cell in cells:
            analysis = self.analyze_weather_for_cell(cell)
            condition = analysis.weather_condition
            
            if condition not in weather_zones:
                weather_zones[condition] = {
                    "weather_condition": condition,
                    "cells": [],
                    "avg_temperature": 0,
                    "avg_humidity": 0,
                    "avg_wind_speed": 0,
                    "total_precipitation": 0
                }
            
            weather_zones[condition]["cells"].append({
                "cell_id": cell.h3_index,
                "coordinates": {
                    "lat": cell.center_lat,
                    "lng": cell.center_lng
                },
                "temperature": analysis.temperature_celsius,
                "humidity": analysis.humidity_percent,
                "wind_speed": analysis.wind_speed_kmh,
                "precipitation": analysis.precipitation_mm
            })
        
        # Calculate averages for each zone
        for condition, zone in weather_zones.items():
            cells_data = zone["cells"]
            zone["avg_temperature"] = sum(c["temperature"] for c in cells_data) / len(cells_data)
            zone["avg_humidity"] = sum(c["humidity"] for c in cells_data) / len(cells_data)
            zone["avg_wind_speed"] = sum(c["wind_speed"] for c in cells_data) / len(cells_data)
            zone["total_precipitation"] = sum(c["precipitation"] for c in cells_data)
        
        return list(weather_zones.values())
    
    def calculate_weather_factor(self, from_cell: H3Cell, to_cell: H3Cell) -> float:
        """Calculate weather factor for route segment"""
        from_analysis = self.analyze_weather_for_cell(from_cell)
        to_analysis = self.analyze_weather_for_cell(to_cell)
        
        # Weighted average of weather impacts
        avg_impact = (from_analysis.impact_factor + to_analysis.impact_factor) / 2
        
        # Weather factor: 1.0 = no impact, higher = more delay
        weather_factor = 1.0 + (avg_impact * 0.8)
        
        return min(weather_factor, 2.5)  # Cap at 2.5x delay
    
    def get_weather_alerts(self, cells: List[H3Cell]) -> List[Dict]:
        """Get weather alerts for the grid"""
        alerts = []
        
        for cell in cells:
            analysis = self.analyze_weather_for_cell(cell)
            
            # Check for severe weather conditions
            if analysis.weather_condition in [WeatherCondition.SNOW, WeatherCondition.FOG]:
                if analysis.visibility_km < 1.0:
                    alerts.append({
                        "cell_id": cell.h3_index,
                        "coordinates": {
                            "lat": cell.center_lat,
                            "lng": cell.center_lng
                        },
                        "alert_type": "visibility_warning",
                        "severity": "high" if analysis.visibility_km < 0.5 else "medium",
                        "description": f"Low visibility: {analysis.visibility_km:.1f} km",
                        "recommendation": "Consider alternative route or delay delivery"
                    })
            
            if analysis.wind_speed_kmh > 50:
                alerts.append({
                    "cell_id": cell.h3_index,
                    "coordinates": {
                        "lat": cell.center_lat,
                        "lng": cell.center_lng
                    },
                    "alert_type": "wind_warning",
                    "severity": "high" if analysis.wind_speed_kmh > 70 else "medium",
                    "description": f"High winds: {analysis.wind_speed_kmh:.1f} km/h",
                    "recommendation": "Secure cargo and drive carefully"
                })
            
            if analysis.precipitation_mm > 10:
                alerts.append({
                    "cell_id": cell.h3_index,
                    "coordinates": {
                        "lat": cell.center_lat,
                        "lng": cell.center_lng
                    },
                    "alert_type": "precipitation_warning",
                    "severity": "high" if analysis.precipitation_mm > 20 else "medium",
                    "description": f"Heavy precipitation: {analysis.precipitation_mm:.1f} mm",
                    "recommendation": "Reduce speed and increase following distance"
                })
        
        return alerts
    
    def _simulate_weather_condition(self, cell: H3Cell) -> WeatherCondition:
        """Simulate weather condition based on cell characteristics"""
        # Use cell coordinates as seed for consistent results
        seed = hash(f"{cell.center_lat:.4f}_{cell.center_lng:.4f}")
        random.seed(seed)
        
        # Simulate seasonal weather patterns
        month = time.localtime().tm_mon
        
        if month in [12, 1, 2]:  # Winter
            conditions = [WeatherCondition.CLEAR, WeatherCondition.CLOUDY, 
                         WeatherCondition.RAIN, WeatherCondition.SNOW, WeatherCondition.FOG]
            weights = [0.3, 0.4, 0.2, 0.08, 0.02]
        elif month in [3, 4, 5]:  # Spring
            conditions = [WeatherCondition.CLEAR, WeatherCondition.CLOUDY, 
                         WeatherCondition.RAIN, WeatherCondition.FOG]
            weights = [0.4, 0.3, 0.25, 0.05]
        elif month in [6, 7, 8]:  # Summer
            conditions = [WeatherCondition.CLEAR, WeatherCondition.CLOUDY, 
                         WeatherCondition.RAIN]
            weights = [0.6, 0.3, 0.1]
        else:  # Fall
            conditions = [WeatherCondition.CLEAR, WeatherCondition.CLOUDY, 
                         WeatherCondition.RAIN, WeatherCondition.FOG]
            weights = [0.3, 0.4, 0.25, 0.05]
        
        return random.choices(conditions, weights=weights)[0]
    
    def _simulate_temperature(self, cell: H3Cell) -> float:
        """Simulate temperature based on location and season"""
        seed = hash(f"{cell.center_lat:.4f}_{cell.center_lng:.4f}")
        random.seed(seed)
        
        month = time.localtime().tm_mon
        
        # Base temperature by season
        if month in [12, 1, 2]:  # Winter
            base_temp = random.uniform(-5, 10)
        elif month in [3, 4, 5]:  # Spring
            base_temp = random.uniform(10, 25)
        elif month in [6, 7, 8]:  # Summer
            base_temp = random.uniform(20, 35)
        else:  # Fall
            base_temp = random.uniform(10, 25)
        
        # Add some variation based on time of day
        hour = time.localtime().tm_hour
        if 6 <= hour <= 18:  # Daytime
            temp_variation = random.uniform(-2, 5)
        else:  # Nighttime
            temp_variation = random.uniform(-5, 2)
        
        return base_temp + temp_variation
    
    def _simulate_humidity(self, weather_condition: WeatherCondition) -> float:
        """Simulate humidity based on weather condition"""
        humidity_ranges = {
            WeatherCondition.CLEAR: (30, 60),
            WeatherCondition.CLOUDY: (50, 80),
            WeatherCondition.RAIN: (70, 95),
            WeatherCondition.SNOW: (60, 85),
            WeatherCondition.FOG: (85, 98)
        }
        
        min_humidity, max_humidity = humidity_ranges.get(weather_condition, (40, 70))
        return random.uniform(min_humidity, max_humidity)
    
    def _simulate_wind_speed(self, cell: H3Cell) -> float:
        """Simulate wind speed"""
        seed = hash(f"{cell.center_lat:.4f}_{cell.center_lng:.4f}")
        random.seed(seed)
        
        # Most of the time, wind is light to moderate
        if random.random() < 0.8:
            return random.uniform(5, 25)
        else:
            return random.uniform(25, 60)  # Occasionally stronger winds
    
    def _simulate_precipitation(self, weather_condition: WeatherCondition) -> float:
        """Simulate precipitation amount"""
        if weather_condition in [WeatherCondition.RAIN, WeatherCondition.SNOW]:
            return random.uniform(1, 30)  # 1-30 mm
        else:
            return 0.0
    
    def _simulate_visibility(self, weather_condition: WeatherCondition) -> float:
        """Simulate visibility based on weather condition"""
        visibility_ranges = {
            WeatherCondition.CLEAR: (10, 50),
            WeatherCondition.CLOUDY: (8, 15),
            WeatherCondition.RAIN: (2, 8),
            WeatherCondition.SNOW: (0.5, 5),
            WeatherCondition.FOG: (0.1, 2)
        }
        
        min_visibility, max_visibility = visibility_ranges.get(weather_condition, (5, 15))
        return random.uniform(min_visibility, max_visibility)
    
    def _calculate_weather_impact(self, weather_condition: WeatherCondition, 
                                wind_speed: float, precipitation: float) -> float:
        """Calculate weather impact factor (0-1)"""
        impact = 0.0
        
        # Weather condition impact
        condition_impacts = {
            WeatherCondition.CLEAR: 0.0,
            WeatherCondition.CLOUDY: 0.1,
            WeatherCondition.RAIN: 0.3,
            WeatherCondition.SNOW: 0.6,
            WeatherCondition.FOG: 0.7
        }
        impact += condition_impacts.get(weather_condition, 0.2)
        
        # Wind impact
        if wind_speed > 40:
            impact += 0.2
        elif wind_speed > 25:
            impact += 0.1
        
        # Precipitation impact
        if precipitation > 20:
            impact += 0.3
        elif precipitation > 10:
            impact += 0.2
        elif precipitation > 5:
            impact += 0.1
        
        return min(impact, 1.0)
    
    def clear_cache(self):
        """Clear weather analysis cache"""
        self.weather_cache.clear()
        print("🗑️ Weather analysis cache cleared")

# Global instance
weather_analyzer = WeatherAnalyzer() 