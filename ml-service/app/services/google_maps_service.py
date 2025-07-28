import os
import httpx
from typing import List, Optional, Dict, Any
from app.models.schemas import Coordinates, DeliveryPoint

class GoogleMapsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            print("🗺️ Google Maps API integration enabled")
        else:
            print("🗺️ Google Maps API not configured, using Haversine distance calculation")

    async def get_distance_matrix(self, origins: List[Coordinates], destinations: List[Coordinates]) -> Optional[List[List[float]]]:
        """
        Get real distance matrix from Google Maps API
        """
        if not self.enabled:
            return None
            
        try:
            # Convert coordinates to string format
            origins_str = "|".join([f"{coord.latitude},{coord.longitude}" for coord in origins])
            destinations_str = "|".join([f"{coord.latitude},{coord.longitude}" for coord in destinations])
            
            url = f"{self.base_url}/distancematrix/json"
            params = {
                "origins": origins_str,
                "destinations": destinations_str,
                "key": self.api_key,
                "mode": "driving",
                "traffic_model": "best_guess",
                "departure_time": "now"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data["status"] == "OK":
                    matrix = []
                    for row in data["rows"]:
                        matrix_row = []
                        for element in row["elements"]:
                            if element["status"] == "OK":
                                # Convert meters to kilometers
                                distance = element["distance"]["value"] / 1000
                                matrix_row.append(distance)
                            else:
                                matrix_row.append(float('inf'))
                        matrix.append(matrix_row)
                    return matrix
                else:
                    print(f"Google Maps API error: {data['status']}")
                    return None
                    
        except Exception as e:
            print(f"Google Maps API request failed: {e}")
            return None

    async def get_optimized_route(self, waypoints: List[Coordinates]) -> Optional[Dict[str, Any]]:
        """
        Get optimized route from Google Maps Directions API
        """
        if not self.enabled or len(waypoints) < 2:
            return None
            
        try:
            # Convert coordinates to string format
            waypoints_str = "|".join([f"{coord.latitude},{coord.longitude}" for coord in waypoints])
            
            url = f"{self.base_url}/directions/json"
            params = {
                "origin": f"{waypoints[0].latitude},{waypoints[0].longitude}",
                "destination": f"{waypoints[-1].latitude},{waypoints[-1].longitude}",
                "waypoints": "optimize:true|" + waypoints_str,
                "key": self.api_key,
                "mode": "driving",
                "traffic_model": "best_guess",
                "departure_time": "now"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data["status"] == "OK" and data["routes"]:
                    route = data["routes"][0]
                    
                    # Extract optimized waypoint order
                    waypoint_order = route.get("waypoint_order", [])
                    
                    # Calculate total distance and duration
                    total_distance = 0
                    total_duration = 0
                    
                    for leg in route["legs"]:
                        total_distance += leg["distance"]["value"]  # meters
                        total_duration += leg["duration"]["value"]  # seconds
                    
                    return {
                        "waypoint_order": waypoint_order,
                        "total_distance_km": total_distance / 1000,
                        "total_duration_minutes": total_duration / 60,
                        "polyline": route["overview_polyline"]["points"],
                        "legs": route["legs"]
                    }
                else:
                    print(f"Google Maps Directions API error: {data.get('status', 'Unknown')}")
                    return None
                    
        except Exception as e:
            print(f"Google Maps Directions API request failed: {e}")
            return None

    async def get_traffic_info(self, coordinates: Coordinates) -> Optional[Dict[str, Any]]:
        """
        Get traffic information for a specific location
        """
        if not self.enabled:
            return None
            
        try:
            url = f"{self.base_url}/geocode/json"
            params = {
                "latlng": f"{coordinates.latitude},{coordinates.longitude}",
                "key": self.api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data["status"] == "OK" and data["results"]:
                    result = data["results"][0]
                    
                    # Extract address components
                    address_components = {}
                    for component in result["address_components"]:
                        types = component["types"]
                        if "locality" in types:
                            address_components["city"] = component["long_name"]
                        elif "administrative_area_level_1" in types:
                            address_components["state"] = component["long_name"]
                        elif "country" in types:
                            address_components["country"] = component["long_name"]
                    
                    return {
                        "formatted_address": result["formatted_address"],
                        "address_components": address_components,
                        "place_id": result["place_id"]
                    }
                else:
                    return None
                    
        except Exception as e:
            print(f"Google Maps Geocoding API request failed: {e}")
            return None

    def is_available(self) -> bool:
        """
        Check if Google Maps API is available
        """
        return self.enabled

# Global instance
google_maps_service = GoogleMapsService() 