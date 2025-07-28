import redis.asyncio as redis
import os
from typing import Optional

class RedisService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", 6379))

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.Redis(
                host=self.host,
                port=self.port,
                decode_responses=True
            )
            await self.redis_client.ping()
            print(f"✅ Connected to Redis at {self.host}:{self.port}")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self.redis_client = None

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            print("🔌 Disconnected from Redis")

    async def ping(self) -> bool:
        """Ping Redis server"""
        try:
            if self.redis_client:
                await self.redis_client.ping()
                return True
            return False
        except:
            return False

    async def set(self, key: str, value: str, expire: int = 3600):
        """Set key-value pair with expiration"""
        if self.redis_client:
            await self.redis_client.set(key, value, ex=expire)

    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        if self.redis_client:
            return await self.redis_client.get(key)
        return None

    async def delete(self, key: str):
        """Delete key"""
        if self.redis_client:
            await self.redis_client.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if self.redis_client:
            return await self.redis_client.exists(key) > 0
        return False 