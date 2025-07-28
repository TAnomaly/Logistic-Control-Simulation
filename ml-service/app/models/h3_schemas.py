from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from enum import Enum
try:
    import h3
except ImportError:
    print("⚠️ H3 library not available, using fallback")
    h3 = None

class H3Resolution(str, Enum):
    RES_0 = "0"   # ~4,250,547 km²
    RES_1 = "1"   # ~607,221 km²
    RES_2 = "2"   # ~86,746 km²
    RES_3 = "3"   # ~12,393 km²
    RES_4 = "4"   # ~1,770 km²
    RES_5 = "5"   # ~253 km²
    RES_6 = "6"   # ~36 km²
    RES_7 = "7"   # ~5 km²
    RES_8 = "8"   # ~0.7 km²
    RES_9 = "9"   # ~0.1 km² (174m)
    RES_10 = "10" # ~0.015 km² (66m)
    RES_11 = "11" # ~0.002 km² (24m)
    RES_12 = "12" # ~0.0003 km² (9m)

class TrafficCondition(str, Enum):
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    CONGESTED = "congested"

class WeatherCondition(str, Enum):
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAIN = "rain"
    SNOW = "snow"
    FOG = "fog"

class H3Cell(BaseModel):
    """H3 hexagonal cell representation"""
    h3_index: str = Field(..., description="H3 cell index")
    resolution: int = Field(..., description="H3 resolution level")
    center_lat: float = Field(..., description="Center latitude")
    center_lng: float = Field(..., description="Center longitude")
    area_km2: float = Field(..., description="Cell area in km²")
    traffic_condition: Optional[TrafficCondition] = Field(None, description="Current traffic condition")
    weather_condition: Optional[WeatherCondition] = Field(None, description="Current weather condition")
    elevation_m: Optional[float] = Field(None, description="Average elevation in meters")
    
    @classmethod
    def from_h3_index(cls, h3_index: str):
        """Create H3Cell from H3 index"""
        if h3 is None:
            raise ImportError("H3 library not available")
        
        lat, lng = h3.cell_to_latlng(h3_index)
        resolution = h3.get_resolution(h3_index)
        area = h3.cell_area(h3_index, unit='km^2')
        
        return cls(
            h3_index=h3_index,
            resolution=resolution,
            center_lat=lat,
            center_lng=lng,
            area_km2=area
        )

class H3Grid(BaseModel):
    """H3 grid representation for optimization"""
    center_h3: str = Field(..., description="Center H3 cell")
    resolution: int = Field(..., description="Grid resolution")
    radius_km: float = Field(..., description="Grid radius in km")
    cells: List[H3Cell] = Field(..., description="Grid cells")
    cell_count: int = Field(..., description="Number of cells in grid")
    coverage_efficiency: Optional[float] = Field(None, description="Grid coverage efficiency")
    spatial_density: Optional[float] = Field(None, description="Cells per km²")
    
    @classmethod
    def create_grid(cls, center_lat: float, center_lng: float, 
                   resolution: int, radius_km: float):
        """Create H3 grid around center point"""
        if h3 is None:
            raise ImportError("H3 library not available")
        
        center_h3 = h3.latlng_to_cell(center_lat, center_lng, resolution)
        grid_radius = int(radius_km / 0.174)  # Approximate cell size at res 9
        
        grid_cells = h3.grid_disk(center_h3, grid_radius)
        cells = [H3Cell.from_h3_index(h3_index) for h3_index in grid_cells]
        
        return cls(
            center_h3=center_h3,
            resolution=resolution,
            radius_km=radius_km,
            cells=cells,
            cell_count=len(cells)
        )

class H3DeliveryPoint(BaseModel):
    """Delivery point with H3 cell information"""
    id: str
    address: str
    coordinates: Dict[str, float]  # lat, lng
    h3_cell: H3Cell
    priority: str = "medium"
    weight: Optional[float] = None
    volume: Optional[float] = None
    time_window: Optional[Dict[str, str]] = None
    service_time_min: Optional[int] = Field(5, description="Service time in minutes")
    special_requirements: Optional[List[str]] = Field(None, description="Special delivery requirements")
    
    @classmethod
    def from_coordinates(cls, delivery_id: str, address: str, 
                        lat: float, lng: float, resolution: int = 9, **kwargs):
        """Create H3DeliveryPoint from coordinates"""
        if h3 is None:
            raise ImportError("H3 library not available")
        
        h3_index = h3.latlng_to_cell(lat, lng, resolution)
        h3_cell = H3Cell.from_h3_index(h3_index)
        
        return cls(
            id=delivery_id,
            address=address,
            coordinates={"lat": lat, "lng": lng},
            h3_cell=h3_cell,
            **kwargs
        )

class H3DeliveryRequest(BaseModel):
    """Simple delivery request for H3 optimization"""
    id: str
    address: str
    coordinates: Dict[str, float]  # lat, lng
    priority: str = "medium"
    weight: Optional[float] = None
    volume: Optional[float] = None
    time_window: Optional[Dict[str, str]] = None
    service_time_min: Optional[int] = 5
    special_requirements: Optional[List[str]] = None

class H3RouteOptimizationRequest(BaseModel):
    """H3-based route optimization request"""
    driver_id: str
    driver_location: Dict[str, float]  # lat, lng
    deliveries: List[H3DeliveryRequest]
    vehicle_capacity: float = 1000
    vehicle_volume: float = 10
    h3_resolution: int = 9
    optimization_algorithm: str = "h3_dijkstra"
    constraints: Optional[Dict[str, Any]] = None

class H3RouteSegment(BaseModel):
    """Route segment between H3 cells"""
    from_cell: H3Cell
    to_cell: H3Cell
    distance_km: float
    estimated_time_min: int
    h3_path: List[str] = Field(..., description="H3 cells in path")
    road_type: Optional[str] = None
    traffic_factor: float = 1.0
    weather_factor: float = 1.0
    elevation_change_m: Optional[float] = None
    fuel_consumption_l: Optional[float] = None
    carbon_footprint_kg: Optional[float] = None

class H3OptimizedRoute(BaseModel):
    """H3-optimized route"""
    route_id: str
    driver_id: str
    segments: List[H3RouteSegment]
    total_distance_km: float
    total_time_min: int
    fuel_estimate_l: float
    efficiency_score: float
    h3_grid_info: H3Grid
    algorithm_used: str
    optimization_time_ms: int
    created_at: datetime = Field(default_factory=datetime.now)
    carbon_footprint_kg: Optional[float] = None
    traffic_impact_score: Optional[float] = None
    weather_impact_score: Optional[float] = None
    sustainability_score: Optional[float] = None

class H3PerformanceMetrics(BaseModel):
    """H3 optimization performance metrics"""
    grid_creation_time_ms: int
    pathfinding_time_ms: int
    total_optimization_time_ms: int
    memory_usage_mb: float
    cells_processed: int
    algorithm_efficiency: float
    cache_hit_rate: Optional[float] = None
    parallel_processing_cores: Optional[int] = None
    gpu_acceleration: Optional[bool] = None

class H3RouteOptimizationResponse(BaseModel):
    """H3 route optimization response"""
    success: bool
    route: Optional[H3OptimizedRoute] = None
    error_message: Optional[str] = None
    processing_time_ms: int
    grid_statistics: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[H3PerformanceMetrics] = None
    recommendations: Optional[List[str]] = None

class H3SpatialAnalysis(BaseModel):
    """H3-based spatial analysis results"""
    coverage_area_km2: float
    cell_density: float  # cells per km²
    optimal_resolution: int
    spatial_distribution: Dict[str, Any]
    clustering_score: float
    accessibility_score: float
    traffic_hotspots: Optional[List[Dict[str, Any]]] = None
    weather_zones: Optional[List[Dict[str, Any]]] = None

class H3PerformanceMetrics(BaseModel):
    """H3 optimization performance metrics"""
    grid_creation_time_ms: int
    pathfinding_time_ms: int
    total_optimization_time_ms: int
    memory_usage_mb: float
    cells_processed: int
    algorithm_efficiency: float
    cache_hit_rate: Optional[float] = None
    parallel_processing_cores: Optional[int] = None
    gpu_acceleration: Optional[bool] = None

class H3TrafficAnalysis(BaseModel):
    """H3-based traffic analysis"""
    cell_id: str
    traffic_condition: TrafficCondition
    congestion_level: float  # 0-1
    average_speed_kmh: float
    travel_time_factor: float
    peak_hours: Optional[List[str]] = None
    historical_data: Optional[Dict[str, Any]] = None

class H3WeatherAnalysis(BaseModel):
    """H3-based weather analysis"""
    cell_id: str
    weather_condition: WeatherCondition
    temperature_celsius: float
    humidity_percent: float
    wind_speed_kmh: float
    precipitation_mm: float
    visibility_km: float
    impact_factor: float  # 0-1, how much weather affects travel

class H3SustainabilityMetrics(BaseModel):
    """H3-based sustainability metrics"""
    total_carbon_footprint_kg: float
    fuel_efficiency_kmpl: float
    eco_friendly_score: float  # 0-100
    green_route_percentage: float
    alternative_fuel_compatibility: bool
    emission_reduction_potential: float 