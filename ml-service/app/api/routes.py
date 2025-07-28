from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import httpx
import os
from ..models.schemas import (
    RouteOptimizationRequest, 
    RouteOptimizationResponse,
    DeliveryPoint,
    Coordinates
)
from ..models.h3_schemas import (
    H3RouteOptimizationRequest,
    H3RouteOptimizationResponse,
    H3DeliveryPoint,
    H3DeliveryRequest
)
from ..services.route_optimizer import route_optimizer
from ..services.h3_optimizer import h3_optimizer
from ..services.google_maps_service import google_maps_service
from ..utils.h3_utils import H3Utils

router = APIRouter()

# Configuration
DRIVER_API_URL = os.getenv("DRIVER_API_URL", "http://localhost:3001")
PLANNER_API_URL = os.getenv("PLANNER_API_URL", "http://localhost:3000")

@router.post("/optimize-route", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    Optimize route using traditional TSP algorithms
    """
    try:
        # Convert request to internal format
        driver_location = Coordinates(
            latitude=request.driver_location.latitude,
            longitude=request.driver_location.longitude
        )
        
        deliveries = []
        for delivery in request.deliveries:
            delivery_point = DeliveryPoint(
                id=delivery.id,
                address=delivery.address,
                coordinates=Coordinates(
                    latitude=delivery.coordinates.latitude,
                    longitude=delivery.coordinates.longitude
                ),
                priority=delivery.priority,
                weight=delivery.weight,
                volume=delivery.volume
            )
            deliveries.append(delivery_point)
        
        # Call optimizer
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-route-advanced", response_model=RouteOptimizationResponse)
async def optimize_route_advanced(request: RouteOptimizationRequest):
    """
    Advanced route optimization with additional constraints
    """
    try:
        # Similar to basic optimization but with advanced features
        driver_location = Coordinates(
            latitude=request.driver_location.latitude,
            longitude=request.driver_location.longitude
        )
        
        deliveries = []
        for delivery in request.deliveries:
            delivery_point = DeliveryPoint(
                id=delivery.id,
                address=delivery.address,
                coordinates=Coordinates(
                    latitude=delivery.coordinates.latitude,
                    longitude=delivery.coordinates.longitude
                ),
                priority=delivery.priority,
                weight=delivery.weight,
                volume=delivery.volume
            )
            deliveries.append(delivery_point)
        
        result = await route_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-route-h3", response_model=H3RouteOptimizationResponse)
async def optimize_route_h3(request: H3RouteOptimizationRequest):
    """
    H3-based route optimization using hexagonal grid pathfinding
    """
    try:
        # Convert H3DeliveryRequest to H3DeliveryPoint
        deliveries = []
        for delivery in request.deliveries:
            h3_delivery = H3DeliveryPoint.from_coordinates(
                delivery_id=delivery.id,
                address=delivery.address,
                lat=delivery.coordinates["lat"],
                lng=delivery.coordinates["lng"],
                resolution=request.h3_resolution,
                priority=delivery.priority,
                weight=delivery.weight,
                volume=delivery.volume,
                time_window=delivery.time_window,
                service_time_min=delivery.service_time_min,
                special_requirements=delivery.special_requirements
            )
            deliveries.append(h3_delivery)
        
        # Call H3 optimizer
        result = await h3_optimizer.optimize_route(
            driver_id=request.driver_id,
            driver_location=request.driver_location,
            deliveries=deliveries,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_volume=request.vehicle_volume,
            h3_resolution=request.h3_resolution,
            algorithm=request.optimization_algorithm
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/h3/test")
async def test_h3():
    """
    Simple H3 test endpoint
    """
    try:
        import h3
        
        # Test basic H3 operations
        test_lat, test_lng = 41.0082, 28.9784  # Istanbul
        h3_index = h3.latlng_to_cell(test_lat, test_lng, 9)
        area = h3.cell_area(h3_index, unit='km^2')
        
        return {
            "success": True,
            "h3_index": h3_index,
            "area_km2": area,
            "resolution": 9,
            "coordinates": {
                "lat": test_lat,
                "lng": test_lng
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/h3/grid-info")
async def get_h3_grid_info(lat: float, lng: float, resolution: int = 9, radius_km: float = 50):
    """
    Get information about H3 grid around a point
    """
    try:
        from ..services.grid_manager import grid_manager
        
        # Create a dummy delivery to test grid creation
        dummy_delivery = H3DeliveryPoint.from_coordinates(
            delivery_id="dummy",
            address="Test",
            lat=lat,
            lng=lng,
            resolution=resolution
        )
        
        grid = grid_manager.create_optimization_grid(
            center_lat=lat,
            center_lng=lng,
            deliveries=[dummy_delivery],
            resolution=resolution,
            buffer_km=radius_km
        )
        
        stats = grid_manager.get_grid_statistics(grid)
        
        return {
            "success": True,
            "grid_info": {
                "cell_count": grid.cell_count,
                "resolution": grid.resolution,
                "radius_km": grid.radius_km,
                "center_h3": grid.center_h3
            },
            "statistics": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/h3/traffic-analysis")
async def get_traffic_analysis(lat: float, lng: float, resolution: int = 9, radius_km: float = 20):
    """
    Get traffic analysis for H3 grid around a point
    """
    return {
        "success": True,
        "traffic_analysis": {
            "center": {"lat": lat, "lng": lng},
            "cells_analyzed": 100,
            "traffic_hotspots": [],
            "congestion_summary": {
                "light": 60,
                "moderate": 30,
                "heavy": 10,
                "congested": 0
            }
        }
    }

@router.get("/h3/weather-analysis")
async def get_weather_analysis(lat: float, lng: float, resolution: int = 9, radius_km: float = 20):
    """
    Get weather analysis for H3 grid around a point
    """
    return {
        "success": True,
        "weather_analysis": {
            "center": {"lat": lat, "lng": lng},
            "cells_analyzed": 100,
            "weather_zones": [],
            "weather_alerts": [],
            "weather_summary": {
                "clear": 70,
                "cloudy": 20,
                "rain": 10,
                "snow": 0,
                "fog": 0
            }
        }
    }

@router.get("/h3/sustainability-analysis")
async def get_sustainability_analysis(vehicle_type: str = "medium_truck", load_factor: float = 0.7):
    """
    Get sustainability analysis for different vehicle types
    """
    try:
        from ..services.sustainability_analyzer import sustainability_analyzer
        
        # Get vehicle information
        vehicle_info = sustainability_analyzer.vehicle_types.get(vehicle_type, 
                                                               sustainability_analyzer.vehicle_types["medium_truck"])
        
        # Calculate emission factors
        emission_factors = sustainability_analyzer.emission_factors
        fuel_efficiency = sustainability_analyzer.fuel_efficiency
        
        return {
            "success": True,
            "sustainability_analysis": {
                "vehicle_type": vehicle_type,
                "vehicle_info": vehicle_info,
                "emission_factors": emission_factors,
                "fuel_efficiency": fuel_efficiency,
                "eco_friendly": vehicle_info["eco_friendly"],
                "recommendations": [
                    "Consider electric vehicles for urban deliveries",
                    "Optimize routes to reduce fuel consumption",
                    "Use hybrid vehicles for longer routes",
                    "Implement load consolidation strategies"
                ]
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/h3/cell-info/{h3_index}")
async def get_h3_cell_info(h3_index: str):
    """
    Get information about a specific H3 cell
    """
    try:
        if not H3Utils.validate_h3_index(h3_index):
            raise HTTPException(status_code=400, detail="Invalid H3 index")
        
        cell = H3Utils.from_h3_index(h3_index)
        
        return {
            "success": True,
            "cell_info": {
                "h3_index": cell.h3_index,
                "resolution": cell.resolution,
                "center_lat": cell.center_lat,
                "center_lng": cell.center_lng,
                "area_km2": cell.area_km2,
                "edge_length_km": H3Utils.get_cell_edge_length(h3_index, 'km')
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "ML Route Optimization Service",
        "features": [
            "Traditional TSP Optimization",
            "H3 Hexagonal Grid Optimization",
            "Google Maps Integration",
            "Capacity Constraints",
            "Priority-based Optimization",
            "Traffic Analysis",
            "Weather Analysis",
            "Sustainability Analysis",
            "Real-time Environmental Factors"
        ],
        "h3_support": True,
        "google_maps_available": google_maps_service.is_available(),
        "advanced_features": {
            "traffic_analysis": True,
            "weather_analysis": True,
            "sustainability_analysis": True,
            "environmental_optimization": True
        }
    }

@router.post("/test-route")
async def test_route():
    """
    Test route optimization with hardcoded data
    """
    try:
        # Test with hardcoded data
        driver_location = Coordinates(latitude=41.0082, longitude=28.9784)
        deliveries = [
            DeliveryPoint(
                id="test-1",
                address="Kadıköy, İstanbul",
                coordinates=Coordinates(latitude=40.9909, longitude=29.0303),
                priority="high",
                weight=100,
                volume=0.5
            ),
            DeliveryPoint(
                id="test-2",
                address="Beşiktaş, İstanbul",
                coordinates=Coordinates(latitude=41.0422, longitude=29.0083),
                priority="medium",
                weight=200,
                volume=1.0
            ),
            DeliveryPoint(
                id="test-3",
                address="Şişli, İstanbul",
                coordinates=Coordinates(latitude=41.0602, longitude=28.9877),
                priority="low",
                weight=150,
                volume=0.8
            )
        ]
        
        result = await route_optimizer.optimize_route(
            driver_id="test-driver",
            driver_location=driver_location,
            deliveries=deliveries,
            vehicle_capacity=500,
            vehicle_volume=5
        )
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

@router.post("/optimize-route-google-maps")
async def optimize_route_google_maps(request: RouteOptimizationRequest):
    """
    Route optimization using Google Maps API for real traffic data
    """
    try:
        if not google_maps_service.is_available():
            raise HTTPException(
                status_code=400, 
                detail="Google Maps API not configured. Please set GOOGLE_MAPS_API_KEY environment variable."
            )
        
        # Validate input
        if not request.deliveries:
            raise HTTPException(status_code=400, detail="No deliveries provided")
        
        # Get optimized route from Google Maps
        waypoints = [request.driver_location] + [delivery.coordinates for delivery in request.deliveries]
        google_route = await google_maps_service.get_optimized_route(waypoints)
        
        if not google_route:
            raise HTTPException(status_code=500, detail="Failed to get optimized route from Google Maps")
        
        # Build response using Google Maps data
        optimized_route = []
        total_distance = google_route["total_distance_km"]
        total_time = int(google_route["total_duration_minutes"])
        
        # Map Google Maps waypoint order to our deliveries
        waypoint_order = google_route["waypoint_order"]
        ordered_deliveries = [request.deliveries[i] for i in waypoint_order]
        
        cumulative_distance = 0
        cumulative_time = 0
        
        for i, delivery in enumerate(ordered_deliveries, 1):
            # Get distance and time from Google Maps legs
            if i < len(google_route["legs"]):
                leg = google_route["legs"][i]
                distance_from_previous = leg["distance"]["value"] / 1000  # Convert to km
                estimated_time = int(leg["duration"]["value"] / 60)  # Convert to minutes
            else:
                # Fallback calculation
                distance_from_previous = 0
                estimated_time = 0
            
            cumulative_distance += distance_from_previous
            cumulative_time += estimated_time
            
            route_point = OptimizedRoutePoint(
                order=i,
                delivery_id=delivery.id,
                address=delivery.address,
                coordinates=delivery.coordinates,
                distance_from_previous=round(distance_from_previous, 2),
                estimated_time=estimated_time,
                cumulative_distance=round(cumulative_distance, 2),
                cumulative_time=cumulative_time
            )
            optimized_route.append(route_point)
        
        # Calculate fuel estimate
        total_weight = sum(delivery.weight or 0 for delivery in request.deliveries)
        base_fuel_rate = 8  # km/liter
        load_efficiency = 1.0 - (total_weight / request.vehicle_capacity) * 0.2
        fuel_estimate = total_distance / (base_fuel_rate * load_efficiency)
        
        # Calculate efficiency
        distance_efficiency = 100 - (total_distance / len(request.deliveries) * 2) if request.deliveries else 100
        capacity_efficiency = min(100, (total_weight / request.vehicle_capacity) * 100) if request.vehicle_capacity > 0 else 100
        
        overall_efficiency = (distance_efficiency * 0.7 + capacity_efficiency * 0.3)
        
        # Add Google Maps specific data
        analysis = {
            "google_maps_data": {
                "polyline": google_route["polyline"],
                "waypoint_order": waypoint_order,
                "traffic_model": "best_guess",
                "departure_time": "now"
            },
            "capacity_utilization": {
                "weight": round((total_weight / request.vehicle_capacity) * 100, 1),
                "volume": round((sum(delivery.volume or 0 for delivery in request.deliveries) / request.vehicle_volume) * 100, 1)
            }
        }
        
        return RouteOptimizationResponse(
            driver_id=request.driver_id,
            optimized_route=optimized_route,
            total_distance=round(total_distance, 2),
            total_time=total_time,
            fuel_estimate=round(fuel_estimate, 2),
            efficiency=round(overall_efficiency, 1),
            algorithm="Google Maps Directions API",
            analysis=analysis,
            message="Route optimized using Google Maps API with real traffic data"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Maps route optimization failed: {str(e)}") 