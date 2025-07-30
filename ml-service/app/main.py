from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os

from app.api.routes import router as api_router
from app.services.redis_service import RedisService
from app.services.rabbitmq_service import RabbitMQService
from app.services.webhook_consumer import webhook_consumer
import asyncio

# Load environment variables
load_dotenv()

# Global services
redis_service = None
rabbitmq_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global redis_service, rabbitmq_service
    
    # Initialize Redis
    redis_service = RedisService()
    await redis_service.connect()
    
    # Initialize RabbitMQ
    rabbitmq_service = RabbitMQService()
    await rabbitmq_service.connect()
    
    # 🚀 Start webhook consumer in background
    try:
        # Start webhook consumer in a separate thread to avoid blocking
        import threading
        def start_webhook_consumer():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(webhook_consumer.start_consuming())
        
        webhook_thread = threading.Thread(target=start_webhook_consumer, daemon=True)
        webhook_thread.start()
        print("🚀 Webhook consumer started in background thread!")
    except Exception as e:
        print(f"❌ Failed to start webhook consumer: {e}")
    
    print("🚀 ML Service started successfully!")
    
    yield
    
    # Shutdown
    if redis_service:
        await redis_service.disconnect()
    if rabbitmq_service:
        await rabbitmq_service.disconnect()
    
    print("🛑 ML Service stopped!")

# Create FastAPI app
app = FastAPI(
    title="Logistic ML Service",
    description="AI/ML Microservice for Logistic Control System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/ml")

@app.get("/")
async def root():
    return {
        "message": "Logistic ML Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "redis": await redis_service.ping() if redis_service else False,
            "rabbitmq": rabbitmq_service.is_connected() if rabbitmq_service else False
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 