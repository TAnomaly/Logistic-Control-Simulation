import pika
import os
from typing import Optional

class RabbitMQService:
    def __init__(self):
        self.connection: Optional[pika.BlockingConnection] = None
        self.channel: Optional[pika.channel.Channel] = None
        self.url = os.getenv("RABBITMQ_URL", "amqp://admin:password@localhost:5672")

    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            # Note: pika doesn't support async, so we'll use sync version
            # In production, consider using aio-pika for async support
            self.connection = pika.BlockingConnection(
                pika.URLParameters(self.url)
            )
            self.channel = self.connection.channel()
            print(f"✅ Connected to RabbitMQ")
        except Exception as e:
            print(f"❌ RabbitMQ connection failed: {e}")
            self.connection = None
            self.channel = None

    async def disconnect(self):
        """Disconnect from RabbitMQ"""
        if self.connection:
            self.connection.close()
            print("🔌 Disconnected from RabbitMQ")

    def is_connected(self) -> bool:
        """Check if connected to RabbitMQ"""
        return self.connection is not None and not self.connection.is_closed

    def publish_message(self, exchange: str, routing_key: str, message: str):
        """Publish message to RabbitMQ"""
        if self.channel:
            self.channel.basic_publish(
                exchange=exchange,
                routing_key=routing_key,
                body=message
            )

    def declare_queue(self, queue_name: str):
        """Declare a queue"""
        if self.channel:
            self.channel.queue_declare(queue=queue_name, durable=True)

    def declare_exchange(self, exchange_name: str, exchange_type: str = "topic"):
        """Declare an exchange"""
        if self.channel:
            self.channel.exchange_declare(
                exchange=exchange_name,
                exchange_type=exchange_type,
                durable=True
            ) 