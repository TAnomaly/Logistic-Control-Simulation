import pika
import json
import logging
import os
from typing import Callable, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class RabbitMQService:
    """RabbitMQ service for ML Route Optimizer"""
    
    def __init__(self):
        self.connection = None
        self.channel = None
        self.rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://admin:password@rabbitmq:5672')
        self.exchange = 'logistics'
        
    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            self.connection = pika.BlockingConnection(
                pika.URLParameters(self.rabbitmq_url)
            )
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange,
                exchange_type='topic',
                durable=True
            )
            
            logger.info("✅ Connected to RabbitMQ")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to RabbitMQ: {str(e)}")
            return False
    
    async def publish_event(self, event_type: str, event_data: Dict[str, Any], routing_key: str = None):
        """Publish event to RabbitMQ"""
        try:
            if not self.channel:
                await self.connect()
            
            message = {
                'event_type': event_type,
                'data': event_data,
                'timestamp': datetime.utcnow().isoformat(),
                'source': 'ml-route-optimizer'
            }
            
            routing_key = routing_key or f"ml.{event_type}"
            
            self.channel.basic_publish(
                exchange=self.exchange,
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # make message persistent
                    content_type='application/json'
                )
            )
            
            logger.info(f"📤 Published event: {event_type} -> {routing_key}")
            
        except Exception as e:
            logger.error(f"❌ Failed to publish event: {str(e)}")
    
    async def subscribe_to_events(self, queue_name: str, routing_keys: list, callback: Callable):
        """Subscribe to events from RabbitMQ"""
        try:
            if not self.channel:
                await self.connect()
            
            # Declare queue
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Bind queue to exchange with routing keys
            for routing_key in routing_keys:
                self.channel.queue_bind(
                    exchange=self.exchange,
                    queue=queue_name,
                    routing_key=routing_key
                )
            
            def message_handler(ch, method, properties, body):
                try:
                    message = json.loads(body.decode())
                    logger.info(f"📨 Received event: {message.get('event_type')}")
                    callback(message)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as e:
                    logger.error(f"❌ Error processing message: {str(e)}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            self.channel.basic_consume(
                queue=queue_name,
                on_message_callback=message_handler
            )
            
            logger.info(f"👂 Subscribed to events: {queue_name} -> {routing_keys}")
            
        except Exception as e:
            logger.error(f"❌ Failed to subscribe to events: {str(e)}")
    
    async def start_consuming(self):
        """Start consuming messages"""
        try:
            if self.channel:
                logger.info("🚀 Starting to consume messages...")
                self.channel.start_consuming()
        except Exception as e:
            logger.error(f"❌ Error consuming messages: {str(e)}")
    
    async def close(self):
        """Close RabbitMQ connection"""
        try:
            if self.connection:
                self.connection.close()
                logger.info("✅ RabbitMQ connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing RabbitMQ connection: {str(e)}")
    
    async def health_check(self) -> bool:
        """Health check for RabbitMQ"""
        try:
            if not self.connection or self.connection.is_closed:
                return await self.connect()
            return True
        except Exception as e:
            logger.error(f"❌ RabbitMQ health check failed: {str(e)}")
            return False 