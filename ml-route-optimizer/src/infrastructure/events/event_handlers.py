import logging
import httpx
from typing import Dict, Any
from src.infrastructure.rabbitmq.rabbitmq_service import RabbitMQService
from src.infrastructure.ml.route_optimizer_service import RouteOptimizerService

logger = logging.getLogger(__name__)

class EventHandlers:
    """Event handlers for ML Route Optimizer"""
    
    def __init__(self, rabbitmq_service: RabbitMQService, route_optimizer: RouteOptimizerService):
        self.rabbitmq_service = rabbitmq_service
        self.route_optimizer = route_optimizer
        self.planner_api_url = "http://planner-api:3000"
        self.driver_api_url = "http://driver-api:3001"
    
    async def handle_shipment_created(self, event: Dict[str, Any]):
        """Handle shipment.created event from Planner API"""
        try:
            shipment_data = event.get('data', {})
            logger.info(f"📦 Processing shipment.created event: {shipment_data.get('id')}")
            
            # Extract shipment details
            shipment_id = shipment_data.get('id')
            sender_address = shipment_data.get('senderAddress')
            receiver_address = shipment_data.get('receiverAddress')
            
            # Get coordinates from addresses (simplified - in real app would use geocoding)
            pickup_coords = self._extract_coordinates(sender_address)
            delivery_coords = self._extract_coordinates(receiver_address)
            
            if pickup_coords and delivery_coords:
                # Create waypoints
                from src.domain.entities.route_entity import Waypoint
                
                pickup_waypoint = Waypoint(
                    lat=pickup_coords['lat'],
                    lng=pickup_coords['lng'],
                    type="pickup"
                )
                
                delivery_waypoint = Waypoint(
                    lat=delivery_coords['lat'],
                    lng=delivery_coords['lng'],
                    type="delivery"
                )
                
                # Optimize route
                route_solution = self.route_optimizer.optimize_route(
                    pickup_locations=[pickup_waypoint],
                    delivery_locations=[delivery_waypoint],
                    vehicle_capacity=1000
                )
                
                # Publish route.optimized event
                await self.rabbitmq_service.publish_event(
                    event_type="route.optimized",
                    event_data={
                        'shipment_id': shipment_id,
                        'route_id': route_solution.route_id,
                        'total_distance': route_solution.total_distance,
                        'estimated_eta': route_solution.estimated_eta.isoformat(),
                        'fuel_consumption': route_solution.fuel_consumption
                    },
                    routing_key="planner.route.optimized"
                )
                
                logger.info(f"✅ Route optimized for shipment {shipment_id}")
            
        except Exception as e:
            logger.error(f"❌ Error handling shipment.created: {str(e)}")
    
    async def handle_driver_location_updated(self, event: Dict[str, Any]):
        """Handle driver.location.updated event from Driver API"""
        try:
            driver_data = event.get('data', {})
            logger.info(f"🚗 Processing driver.location.updated event: {driver_data.get('driver_id')}")
            
            driver_id = driver_data.get('driver_id')
            new_lat = driver_data.get('latitude')
            new_lng = driver_data.get('longitude')
            
            # Get driver's current assignments
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.driver_api_url}/api/assignments/driver/{driver_id}")
                if response.status_code == 200:
                    assignments = response.json()
                    
                    for assignment in assignments:
                        if assignment.get('status') == 'IN_PROGRESS':
                            # Recalculate ETA for this assignment
                            shipment_id = assignment.get('shipment_id')
                            
                            # Get shipment details
                            shipment_response = await client.get(f"{self.planner_api_url}/api/shipments/{shipment_id}")
                            if shipment_response.status_code == 200:
                                shipment = shipment_response.json()
                                
                                # Calculate new ETA from current driver location to destination
                                from src.domain.entities.route_entity import Waypoint
                                
                                current_location = Waypoint(
                                    lat=new_lat,
                                    lng=new_lng,
                                    type="current"
                                )
                                
                                destination_coords = self._extract_coordinates(shipment.get('receiverAddress'))
                                if destination_coords:
                                    destination = Waypoint(
                                        lat=destination_coords['lat'],
                                        lng=destination_coords['lng'],
                                        type="delivery"
                                    )
                                    
                                    # Calculate new ETA
                                    distance = self.route_optimizer.calculate_distance_matrix([
                                        (new_lat, new_lng),
                                        (destination_coords['lat'], destination_coords['lng'])
                                    ])[0][1] / 1000
                                    
                                    duration_hours = distance / 50  # Assuming 50 km/h
                                    traffic_factor = self.route_optimizer._calculate_traffic_factor([
                                        (new_lat, new_lng),
                                        (destination_coords['lat'], destination_coords['lng'])
                                    ])
                                    
                                    adjusted_duration = duration_hours * traffic_factor
                                    
                                    # Publish eta.updated event
                                    await self.rabbitmq_service.publish_event(
                                        event_type="eta.updated",
                                        event_data={
                                            'driver_id': driver_id,
                                            'shipment_id': shipment_id,
                                            'new_eta_hours': adjusted_duration,
                                            'distance_remaining_km': distance,
                                            'traffic_factor': traffic_factor
                                        },
                                        routing_key="planner.eta.updated"
                                    )
                                    
                                    logger.info(f"✅ ETA updated for driver {driver_id}, shipment {shipment_id}")
            
        except Exception as e:
            logger.error(f"❌ Error handling driver.location.updated: {str(e)}")
    
    async def handle_shipment_assigned(self, event: Dict[str, Any]):
        """Handle shipment.assigned event from Planner API"""
        try:
            assignment_data = event.get('data', {})
            logger.info(f"📋 Processing shipment.assigned event: {assignment_data.get('shipment_id')}")
            
            shipment_id = assignment_data.get('shipment_id')
            driver_id = assignment_data.get('driver_id')
            
            # Get shipment details
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.planner_api_url}/api/shipments/{shipment_id}")
                if response.status_code == 200:
                    shipment = response.json()
                    
                    # Get driver's current location
                    driver_response = await client.get(f"{self.driver_api_url}/api/drivers/{driver_id}")
                    if driver_response.status_code == 200:
                        driver = driver_response.json()
                        
                        # Create route from driver location to pickup and delivery
                        from src.domain.entities.route_entity import Waypoint
                        
                        driver_location = Waypoint(
                            lat=driver.get('lastLatitude'),
                            lng=driver.get('lastLongitude'),
                            type="current"
                        )
                        
                        pickup_coords = self._extract_coordinates(shipment.get('senderAddress'))
                        delivery_coords = self._extract_coordinates(shipment.get('receiverAddress'))
                        
                        if pickup_coords and delivery_coords:
                            pickup = Waypoint(
                                lat=pickup_coords['lat'],
                                lng=pickup_coords['lng'],
                                type="pickup"
                            )
                            
                            delivery = Waypoint(
                                lat=delivery_coords['lat'],
                                lng=delivery_coords['lng'],
                                type="delivery"
                            )
                            
                            # Optimize route
                            route_solution = self.route_optimizer.optimize_route(
                                pickup_locations=[driver_location, pickup],
                                delivery_locations=[delivery],
                                vehicle_capacity=1000
                            )
                            
                            # Publish assignment.route.optimized event
                            await self.rabbitmq_service.publish_event(
                                event_type="assignment.route.optimized",
                                event_data={
                                    'assignment_id': assignment_data.get('id'),
                                    'driver_id': driver_id,
                                    'shipment_id': shipment_id,
                                    'route_id': route_solution.route_id,
                                    'total_distance': route_solution.total_distance,
                                    'estimated_eta': route_solution.estimated_eta.isoformat(),
                                    'waypoints': [
                                        {
                                            'lat': wp.lat,
                                            'lng': wp.lng,
                                            'type': wp.type
                                        } for wp in route_solution.waypoints
                                    ]
                                },
                                routing_key="driver.assignment.route.optimized"
                            )
                            
                            logger.info(f"✅ Assignment route optimized for driver {driver_id}, shipment {shipment_id}")
            
        except Exception as e:
            logger.error(f"❌ Error handling shipment.assigned: {str(e)}")
    
    def _extract_coordinates(self, address: str) -> Dict[str, float]:
        """Extract coordinates from address (simplified)"""
        # In a real application, this would use geocoding service
        # For now, return mock coordinates based on common Turkish cities
        
        address_lower = address.lower()
        
        if 'istanbul' in address_lower:
            return {'lat': 41.0082, 'lng': 28.9784}
        elif 'ankara' in address_lower:
            return {'lat': 39.9334, 'lng': 32.8597}
        elif 'izmir' in address_lower:
            return {'lat': 38.4192, 'lng': 27.1287}
        elif 'antalya' in address_lower:
            return {'lat': 36.8969, 'lng': 30.7133}
        elif 'bursa' in address_lower:
            return {'lat': 40.1885, 'lng': 29.0610}
        else:
            # Default to Istanbul
            return {'lat': 41.0082, 'lng': 28.9784} 