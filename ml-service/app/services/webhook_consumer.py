import pika
import json
import os
import asyncio
from typing import Dict, Any
from .rabbitmq_service import RabbitMQService
from .route_optimizer import RouteOptimizer
import requests

class WebhookConsumer:
    def __init__(self):
        self.rabbitmq_service = RabbitMQService()
        self.route_optimizer = RouteOptimizer()
        self.driver_api_url = os.getenv("DRIVER_API_URL", "http://localhost:3001")
        self.planner_api_url = os.getenv("PLANNER_API_URL", "http://localhost:3000")
        
    async def start_consuming(self):
        """Start consuming webhook events"""
        await self.rabbitmq_service.connect()
        
        if not self.rabbitmq_service.is_connected():
            print("❌ Failed to connect to RabbitMQ")
            return
            
        # Declare exchange and queue
        self.rabbitmq_service.declare_exchange("logistics", "topic")
        self.rabbitmq_service.declare_queue("ml-service.location.updated")
        
        # Bind queue to exchange
        self._bind_queue_to_exchange("ml-service.location.updated", "logistics", "driver.location.updated")
        
        # Start consuming
        self._start_consuming()
        
    def _bind_queue_to_exchange(self, queue_name: str, exchange: str, routing_key: str):
        """Bind queue to exchange with routing key"""
        if self.rabbitmq_service.channel:
            self.rabbitmq_service.channel.queue_bind(
                exchange=exchange,
                queue=queue_name,
                routing_key=routing_key
            )
            print(f"🔗 Queue {queue_name} bound to {exchange} with key: {routing_key}")
    
    def _start_consuming(self):
        """Start consuming messages"""
        if not self.rabbitmq_service.channel:
            print("❌ RabbitMQ channel not available")
            return
            
        def callback(ch, method, properties, body):
            try:
                event_data = json.loads(body.decode())
                print(f"📨 Received webhook event: {method.routing_key}")
                print(f"📋 Event data: {event_data}")
                
                # Process the event
                asyncio.create_task(self._process_location_update(event_data))
                
                # Acknowledge the message
                ch.basic_ack(delivery_tag=method.delivery_tag)
                
            except Exception as e:
                print(f"❌ Error processing webhook event: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        # Start consuming
        self.rabbitmq_service.channel.basic_consume(
            queue="ml-service.location.updated",
            on_message_callback=callback,
            auto_ack=False
        )
        
        print("🚀 Webhook consumer started. Listening for events...")
        
        try:
            self.rabbitmq_service.channel.start_consuming()
        except KeyboardInterrupt:
            print("🛑 Webhook consumer stopped")
            self.rabbitmq_service.channel.stop_consuming()
    
    async def _process_location_update(self, event_data: Dict[str, Any]):
        """Process driver location update event"""
        try:
            driver_id = event_data.get('driverId')
            location = event_data.get('location')
            timestamp = event_data.get('timestamp')
            
            print(f"🔄 Processing location update for driver {driver_id}")
            
            # 1. Get driver's current shipments
            shipments = await self._get_driver_shipments(driver_id)
            
            if not shipments:
                print(f"📦 No shipments found for driver {driver_id}")
                return
            
            # 2. Get shipment details from Planner API
            shipment_details = await self._get_shipment_details(shipments)
            
            if not shipment_details:
                print(f"📋 No shipment details found for driver {driver_id}")
                return
            
            # 3. Calculate optimized route
            optimized_route = await self._calculate_optimized_route(
                driver_id, location, shipment_details
            )
            
            if optimized_route:
                # 4. Save optimized route to Driver API
                await self._save_optimized_route(driver_id, optimized_route)
                print(f"✅ Route optimization completed for driver {driver_id}")
            else:
                print(f"⚠️ Route optimization failed for driver {driver_id}")
                
        except Exception as e:
            print(f"❌ Error processing location update: {e}")
    
    async def _get_driver_shipments(self, driver_id: str) -> list:
        """Get driver's current shipments"""
        try:
            # Get driver's shipments from Driver API
            response = requests.get(f"{self.driver_api_url}/api/drivers/{driver_id}/shipments")
            if response.status_code == 200:
                data = response.json()
                return data.get('shipments', [])
            return []
        except Exception as e:
            print(f"❌ Error getting driver shipments: {e}")
            return []
    
    async def _get_shipment_details(self, shipment_ids: list) -> list:
        """Get shipment details from Planner API"""
        try:
            shipment_details = []
            for shipment_id in shipment_ids:
                response = requests.get(f"{self.planner_api_url}/api/shipments/{shipment_id}")
                if response.status_code == 200:
                    shipment_details.append(response.json())
            return shipment_details
        except Exception as e:
            print(f"❌ Error getting shipment details: {e}")
            return []
    
    async def _calculate_optimized_route(self, driver_id: str, location: dict, shipments: list) -> dict:
        """Calculate optimized route using ML service"""
        try:
            # Extract destinations from shipments
            destinations = []
            for shipment in shipments:
                if shipment.get('destination'):
                    destinations.append(shipment['destination'])
            
            if not destinations:
                return None
            
            # Prepare route optimization request
            route_request = {
                "origin": f"{location.get('latitude')},{location.get('longitude')}",
                "destination": destinations[-1] if destinations else "",
                "waypoints": destinations[:-1] if len(destinations) > 1 else []
            }
            
            # Call ML service for route optimization
            response = requests.post(
                "http://localhost:8000/api/ml/optimize-route-simple",
                json=route_request
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ ML service error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error calculating optimized route: {e}")
            return None
    
    async def _save_optimized_route(self, driver_id: str, route_data: dict):
        """Save optimized route to Driver API"""
        try:
            route_payload = {
                "optimizedRoute": route_data.get('optimized_route', ''),
                "totalDistance": route_data.get('total_distance', 0),
                "estimatedTime": route_data.get('estimated_time', 0)
            }
            
            response = requests.post(
                f"{self.driver_api_url}/api/drivers/{driver_id}/route",
                json=route_payload
            )
            
            if response.status_code == 200:
                print(f"✅ Route saved to Driver API for driver {driver_id}")
            else:
                print(f"❌ Failed to save route: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error saving optimized route: {e}")

# Singleton instance
webhook_consumer = WebhookConsumer() 