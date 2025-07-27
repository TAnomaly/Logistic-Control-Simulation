from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class Waypoint(BaseModel):
    """Waypoint for route optimization"""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    type: str = Field(..., description="Type: pickup, delivery, current")
    address: Optional[str] = Field(None, description="Address")

class OptimizationRequestDto(BaseModel):
    """Request DTO for route optimization"""
    driver_id: str = Field(..., description="Driver ID")
    pickup_locations: List[Waypoint] = Field(..., description="Pickup locations")
    delivery_locations: List[Waypoint] = Field(..., description="Delivery locations")
    vehicle_capacity: float = Field(..., description="Vehicle capacity in kg")
    time_windows: Optional[Dict] = Field(None, description="Time windows constraints")

class RouteSolutionDto(BaseModel):
    """Response DTO for route optimization"""
    route_id: str = Field(..., description="Unique route ID")
    driver_id: str = Field(..., description="Driver ID")
    optimized_route: List[Waypoint] = Field(..., description="Optimized route waypoints")
    total_distance: float = Field(..., description="Total distance in km")
    total_duration: float = Field(..., description="Total duration in seconds")
    estimated_eta: datetime = Field(..., description="Estimated time of arrival")
    fuel_consumption: float = Field(..., description="Fuel consumption in liters")
    traffic_factor: float = Field(..., description="Traffic factor")
    waypoints: List[Waypoint] = Field(..., description="All waypoints")

class MultiVehicleOptimizationRequestDto(BaseModel):
    """Request DTO for multi-vehicle route optimization"""
    vehicles: List[Dict] = Field(..., description="List of vehicles with capacities")
    pickup_locations: List[Waypoint] = Field(..., description="Pickup locations")
    delivery_locations: List[Waypoint] = Field(..., description="Delivery locations")
    time_windows: Optional[Dict] = Field(None, description="Time windows constraints") 