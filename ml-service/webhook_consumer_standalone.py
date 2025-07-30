#!/usr/bin/env python3
"""
Standalone Webhook Consumer for ML Service
This script runs independently to test the webhook system
"""

import pika
import json
import os
import time
import requests
from typing import Dict, Any

class StandaloneWebhookConsumer:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.url = os.getenv("RABBITMQ_URL", "amqp://admin:password@localhost:5672")
        self.driver_api_url = os.getenv("DRIVER_API_URL", "http://localhost:3001")
        self.planner_api_url = os.getenv("PLANNER_API_URL", "http://localhost:3000")
        
    def connect(self):
        """Connect to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(
                pika.URLParameters(self.url)
            )
            self.channel = self.connection.channel()
            print(f"✅ Connected to RabbitMQ")
            return True
        except Exception as e:
            print(f"❌ RabbitMQ connection failed: {e}")
            return False
    
    def setup_queue(self):
        """Setup exchange and queue"""
        try:
            # Declare exchange
            self.channel.exchange_declare(
                exchange="logistics",
                exchange_type="topic",
                durable=True
            )
            
            # Declare queue
            self.channel.queue_declare(
                queue="ml-service.location.updated",
                durable=True
            )
            
            # Bind queue to exchange
            self.channel.queue_bind(
                exchange="logistics",
                queue="ml-service.location.updated",
                routing_key="driver.location.updated"
            )
            
            print("🔗 Queue setup completed")
            return True
        except Exception as e:
            print(f"❌ Queue setup failed: {e}")
            return False
    
    def start_consuming(self):
        """Start consuming messages"""
        def callback(ch, method, properties, body):
            try:
                event_data = json.loads(body.decode())
                print(f"📨 Received webhook event: {method.routing_key}")
                print(f"📋 Event data: {event_data}")
                
                # Process the event
                self.process_location_update(event_data)
                
                # Acknowledge the message
                ch.basic_ack(delivery_tag=method.delivery_tag)
                
            except Exception as e:
                print(f"❌ Error processing webhook event: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        # Start consuming
        self.channel.basic_consume(
            queue="ml-service.location.updated",
            on_message_callback=callback,
            auto_ack=False
        )
        
        print("🚀 Webhook consumer started. Listening for events...")
        
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            print("🛑 Webhook consumer stopped")
            self.channel.stop_consuming()
    
    def process_location_update(self, event_data: Dict[str, Any]):
        """Process driver location update event"""
        try:
            driver_id = event_data.get('driverId')
            location = event_data.get('location')
            timestamp = event_data.get('timestamp')
            
            print(f"🔄 Processing location update for driver {driver_id}")
            
            # 1. Get driver's current shipments
            shipments = self.get_driver_shipments(driver_id)
            
            if not shipments:
                print(f"📦 No shipments found for driver {driver_id}")
                return
            
            # 2. Get shipment details from Planner API
            shipment_details = self.get_shipment_details(shipments)
            
            if not shipment_details:
                print(f"📋 No shipment details found for driver {driver_id}")
                return
            
            # 3. Calculate optimized route
            optimized_route = self.calculate_optimized_route(
                driver_id, location, shipment_details
            )
            
            if optimized_route:
                # 4. Save optimized route to Driver API
                self.save_optimized_route(driver_id, optimized_route)
                print(f"✅ Route optimization completed for driver {driver_id}")
            else:
                print(f"⚠️ Route optimization failed for driver {driver_id}")
                
        except Exception as e:
            print(f"❌ Error processing location update: {e}")
    
    def get_driver_shipments(self, driver_id: str) -> list:
        """Get driver's current shipments"""
        try:
            response = requests.get(f"{self.driver_api_url}/api/drivers/{driver_id}/shipments")
            if response.status_code == 200:
                data = response.json()
                return data.get('shipments', [])
            return []
        except Exception as e:
            print(f"❌ Error getting driver shipments: {e}")
            return []
    
    def get_shipment_details(self, shipment_ids: list) -> list:
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
    
    def calculate_optimized_route(self, driver_id: str, location: dict, shipments: list) -> dict:
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
            
            print(f"🗺️ Route optimization request: {route_request}")
            
            # Call ML service for route optimization
            response = requests.post(
                "http://localhost:8000/api/ml/optimize-route-simple",
                json=route_request
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Route optimization result: {result}")
                return result
            else:
                print(f"❌ ML service error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ Error calculating optimized route: {e}")
            return None
    
    def save_optimized_route(self, driver_id: str, route_data: dict):
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
    
    def close(self):
        """Close connection"""
        if self.connection:
            self.connection.close()
            print("🔌 Disconnected from RabbitMQ")

def main():
    print("🚀 Starting Standalone Webhook Consumer...")
    
    consumer = StandaloneWebhookConsumer()
    
    # Connect to RabbitMQ
    if not consumer.connect():
        print("❌ Failed to connect to RabbitMQ. Exiting...")
        return
    
    # Setup queue
    if not consumer.setup_queue():
        print("❌ Failed to setup queue. Exiting...")
        return
    
    try:
        # Start consuming
        consumer.start_consuming()
    except KeyboardInterrupt:
        print("🛑 Shutting down...")
    finally:
        consumer.close()

if __name__ == "__main__":
    main() 