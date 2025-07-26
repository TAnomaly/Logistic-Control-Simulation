import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            maxRetriesPerRequest: 3,
        });

        this.redis.on('error', (error) => {
            console.error('Redis connection error:', error);
        });

        this.redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, serializedValue);
        } else {
            await this.redis.set(key, serializedValue);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const value = await this.redis.get(key);
        if (!value) return null;
        return JSON.parse(value);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key);
        return result === 1;
    }

    async expire(key: string, seconds: number): Promise<void> {
        await this.redis.expire(key, seconds);
    }

    async publish(channel: string, message: any): Promise<void> {
        await this.redis.publish(channel, JSON.stringify(message));
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        const subscriber = this.redis.duplicate();
        await subscriber.subscribe(channel);

        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                callback(JSON.parse(message));
            }
        });
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.redis.ping();
            return true;
        } catch (error) {
            return false;
        }
    }
} 