from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PriorityEnum(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class DeliveryPoint(BaseModel):
    id: str
    address: str
    coordinates: Coordinates
    priority: PriorityEnum = PriorityEnum.MEDIUM
    estimated_time: Optional[int] = Field(None, description="Estimated delivery time in minutes")
    weight: Optional[float] = Field(None, ge=0, description="Weight in kg")
    volume: Optional[float] = Field(None, ge=0, description="Volume in m³")

class RouteOptimizationRequest(BaseModel):
    driver_id: str
    driver_location: Coordinates
    deliveries: List[DeliveryPoint]
    vehicle_capacity: Optional[float] = Field(1000, ge=0, description="Vehicle capacity in kg")
    vehicle_volume: Optional[float] = Field(10, ge=0, description="Vehicle volume in m³")
    time_window: Optional[Dict[str, str]] = Field(None, description="Time window for deliveries")

class OptimizedRoutePoint(BaseModel):
    order: int
    delivery_id: str
    address: str
    coordinates: Coordinates
    distance_from_previous: float = Field(..., ge=0, description="Distance from previous point in km")
    estimated_time: int = Field(..., ge=0, description="Estimated time in minutes")
    cumulative_distance: float = Field(..., ge=0, description="Cumulative distance in km")
    cumulative_time: int = Field(..., ge=0, description="Cumulative time in minutes")

class RouteOptimizationResponse(BaseModel):
    driver_id: str
    optimized_route: List[OptimizedRoutePoint]
    total_distance: float = Field(..., ge=0, description="Total route distance in km")
    total_time: int = Field(..., ge=0, description="Total route time in minutes")
    fuel_estimate: float = Field(..., ge=0, description="Estimated fuel consumption in liters")
    efficiency: float = Field(..., ge=0, le=100, description="Route efficiency percentage")
    algorithm: str = "Advanced TSP (2-opt + Priority + Capacity)"
    timestamp: datetime = Field(default_factory=datetime.now)
    route_id: Optional[str] = None
    message: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None

class DeliveryTimePredictionRequest(BaseModel):
    origin: str
    destination: str
    origin_coordinates: Coordinates
    destination_coordinates: Coordinates
    weight: float = Field(..., ge=0)
    volume: float = Field(..., ge=0)
    traffic_condition: str = Field("normal", description="Traffic condition: low, normal, high, very_high")
    weather: str = Field("sunny", description="Weather condition: sunny, rainy, snowy, cloudy")
    driver_experience: int = Field(1, ge=1, le=20, description="Driver experience in years")
    time_of_day: Optional[str] = Field(None, description="Time of day: morning, afternoon, evening, night")

class DeliveryTimePredictionResponse(BaseModel):
    predicted_time: int = Field(..., ge=0, description="Predicted delivery time in minutes")
    confidence: float = Field(..., ge=0, le=100, description="Prediction confidence percentage")
    factors: List[str] = Field(..., description="Factors affecting prediction")
    range_min: int = Field(..., ge=0, description="Minimum estimated time")
    range_max: int = Field(..., ge=0, description="Maximum estimated time")
    algorithm: str = "Random Forest Regression"
    timestamp: datetime = Field(default_factory=datetime.now)

class DriverPerformanceMetrics(BaseModel):
    on_time_delivery_rate: float = Field(..., ge=0, le=100)
    average_speed: float = Field(..., ge=0)
    fuel_efficiency: float = Field(..., ge=0, description="km per liter")
    customer_satisfaction: float = Field(..., ge=1, le=10)
    safety_score: float = Field(..., ge=0, le=100)
    distance_efficiency: float = Field(..., ge=0, le=100, description="Efficiency of route planning")

class DriverPerformanceRequest(BaseModel):
    driver_id: str
    metrics: DriverPerformanceMetrics

class DriverPerformanceResponse(BaseModel):
    driver_id: str
    overall_score: float = Field(..., ge=0, le=100)
    grade: str = Field(..., description="Performance grade: A, B, C, D, F")
    recommendations: List[str] = Field(..., description="Performance improvement recommendations")
    algorithm: str = "Multi-criteria Decision Making"
    timestamp: datetime = Field(default_factory=datetime.now)

class DemandForecastRequest(BaseModel):
    region: str
    days: int = Field(7, ge=1, le=30, description="Number of days to forecast")
    include_weather: bool = True
    include_events: bool = True

class DemandForecastPoint(BaseModel):
    date: str
    predicted_demand: int = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=100)
    factors: List[str] = Field(..., description="Factors affecting demand")

class DemandForecastResponse(BaseModel):
    region: str
    forecast: List[DemandForecastPoint]
    trend: str = Field(..., description="Demand trend: increasing, decreasing, stable")
    seasonality: Optional[str] = Field(None, description="Seasonal patterns detected")
    algorithm: str = "Time Series Analysis (Prophet)"
    timestamp: datetime = Field(default_factory=datetime.now) 