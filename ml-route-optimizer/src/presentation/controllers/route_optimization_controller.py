from fastapi import APIRouter
from typing import List, Dict, Optional
import logging
from datetime import datetime, timedelta
from geopy.distance import geodesic

from src.domain.entities.route_entity import (
    OptimizationRequestDto, 
    RouteSolutionDto, 
    Waypoint,
    MultiVehicleOptimizationRequestDto
)
from src.infrastructure.ml.route_optimizer_service import RouteOptimizerService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize route optimizer service
route_optimizer = RouteOptimizerService()

@router.post("/optimize", response_model=RouteSolutionDto)
async def optimize_route(
    request: OptimizationRequestDto
):
    """
    Optimize route for given pickup and delivery locations
    """
    logger.info(f"🔧 Route optimization request received for driver: {request.driver_id}")
    # Validate request (ama hata fırlatma, boşsa default değerlerle dön)
    if not request.pickup_locations or not request.delivery_locations:
        # Boşsa default bir çözüm dön
        now = datetime.utcnow()
        return RouteSolutionDto(
            route_id=f"ROUTE_{now.strftime('%Y%m%d_%H%M%S')}",
            driver_id=request.driver_id,
            optimized_route=[],
            total_distance=0,
            total_duration=0,
            estimated_eta=now,
            fuel_consumption=0,
            traffic_factor=1.0,
            waypoints=[]
        )
    # Optimize route using simple service
    route_solution = route_optimizer.optimize_route(
        pickup_locations=request.pickup_locations,
        delivery_locations=request.delivery_locations,
        vehicle_capacity=request.vehicle_capacity,
        time_windows=request.time_windows
    )
    # Set driver ID
    route_solution.driver_id = request.driver_id
    # Generate route map
    map_filename = route_optimizer.generate_route_map(route_solution)
    logger.info(f"✅ Route optimized successfully. Route ID: {route_solution.route_id}")
    return {
        **route_solution.dict(),
        "map_url": f"/static/maps/{map_filename}" if map_filename else None
    }

@router.post("/optimize-multi-vehicle", response_model=List[RouteSolutionDto])
async def optimize_multi_vehicle_route(
    request: MultiVehicleOptimizationRequestDto
):
    """
    Optimize routes for multiple vehicles
    """
    logger.info("🔧 Multi-vehicle route optimization request received")
    
    # For now, just return a simple solution for each vehicle
    solutions = []
    for i, vehicle in enumerate(request.vehicles):
        route_solution = route_optimizer.optimize_route(
            pickup_locations=request.pickup_locations,
            delivery_locations=request.delivery_locations,
            vehicle_capacity=vehicle.get('capacity', 1000),
            time_windows=request.time_windows
        )
        route_solution.driver_id = vehicle.get('driver_id', f"driver-{i}")
        solutions.append(route_solution)
    
    logger.info(f"✅ Multi-vehicle routes optimized successfully. Count: {len(solutions)}")
    return solutions

@router.post("/estimate-eta")
async def estimate_eta(
    current_location: Waypoint,
    destination: Waypoint,
    vehicle_speed: float = 50.0
):
    """
    Estimate ETA for a given route
    """
    logger.info("🔧 ETA estimation request received")
    
    try:
        # Calculate distance
        distance = geodesic(
            (current_location.lat, current_location.lng),
            (destination.lat, destination.lng)
        ).kilometers
        
        # Calculate duration
        duration_hours = distance / vehicle_speed
        duration_seconds = duration_hours * 3600
        
        # Calculate ETA
        estimated_eta = datetime.utcnow() + timedelta(seconds=duration_seconds)
        
        logger.info(f"✅ ETA estimated successfully: {duration_hours:.2f} hours")
        
        return {
            "distance_km": distance,
            "duration_hours": duration_hours,
            "estimated_eta": estimated_eta.isoformat(),
            "vehicle_speed_kmh": vehicle_speed
        }
        
    except Exception as e:
        logger.error(f"❌ Error in ETA estimation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ETA estimation failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-route-optimizer",
        "timestamp": datetime.utcnow().isoformat()
    } 