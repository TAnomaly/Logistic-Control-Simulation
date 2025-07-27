from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import asyncio
import threading

from src.presentation.controllers.route_optimization_controller import router as route_router
from src.infrastructure.rabbitmq.rabbitmq_service import RabbitMQService
from src.infrastructure.ml.route_optimizer_service import RouteOptimizerService
from src.infrastructure.events.event_handlers import EventHandlers

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="ML Route Optimizer Service",
    description="AI-powered route optimization and ETA prediction service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
rabbitmq_service = RabbitMQService()
route_optimizer = RouteOptimizerService()
event_handlers = EventHandlers(rabbitmq_service, route_optimizer)

# Include routers
app.include_router(route_router, prefix="/api/v1/routes", tags=["Route Optimization"])

async def setup_event_subscriptions():
    """Setup event subscriptions"""
    try:
        await rabbitmq_service.connect()
        
        # Subscribe to events from other services
        await rabbitmq_service.subscribe_to_events(
            queue_name="ml-route-optimizer.shipment.created",
            routing_keys=["planner.shipment.created"],
            callback=event_handlers.handle_shipment_created
        )
        
        await rabbitmq_service.subscribe_to_events(
            queue_name="ml-route-optimizer.driver.location.updated",
            routing_keys=["driver.location.updated"],
            callback=event_handlers.handle_driver_location_updated
        )
        
        await rabbitmq_service.subscribe_to_events(
            queue_name="ml-route-optimizer.shipment.assigned",
            routing_keys=["planner.shipment.assigned"],
            callback=event_handlers.handle_shipment_assigned
        )
        
        print("✅ Event subscriptions setup completed!")
        
    except Exception as e:
        print(f"❌ Error setting up event subscriptions: {str(e)}")

def start_rabbitmq_consumer():
    """Start RabbitMQ consumer in a separate thread"""
    try:
        import pika
        import json
        import time
        
        # Simple blocking connection
        connection = pika.BlockingConnection(
            pika.URLParameters('amqp://admin:password@rabbitmq:5672')
        )
        channel = connection.channel()
        
        # Declare exchange
        channel.exchange_declare(
            exchange='logistics',
            exchange_type='topic',
            durable=True
        )
        
        # Declare queues
        queues = [
            'ml-route-optimizer.shipment.created',
            'ml-route-optimizer.driver.location.updated',
            'ml-route-optimizer.shipment.assigned'
        ]
        
        for queue in queues:
            channel.queue_declare(queue=queue, durable=True)
            if 'shipment.created' in queue:
                channel.queue_bind(exchange='logistics', queue=queue, routing_key='planner.shipment.created')
            elif 'driver.location.updated' in queue:
                channel.queue_bind(exchange='logistics', queue=queue, routing_key='driver.location.updated')
            elif 'shipment.assigned' in queue:
                channel.queue_bind(exchange='logistics', queue=queue, routing_key='planner.shipment.assigned')
        
        def callback(ch, method, properties, body):
            try:
                message = json.loads(body.decode())
                print(f"📨 ML Service received event: {message.get('event_type')}")
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f"❌ Error processing message: {str(e)}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
        # Start consuming
        for queue in queues:
            channel.basic_consume(queue=queue, on_message_callback=callback)
        
        print("🚀 ML Service RabbitMQ consumer started!")
        channel.start_consuming()
        
    except Exception as e:
        print(f"❌ Error in RabbitMQ consumer: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize services"""
    print("🚀 ML Route Optimizer Service started!")
    
    # Start RabbitMQ consumer in background thread
    consumer_thread = threading.Thread(target=start_rabbitmq_consumer, daemon=True)
    consumer_thread.start()
    
    print("✅ RabbitMQ consumer started automatically!")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-route-optimizer",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ML Route Optimizer Service",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    ) 