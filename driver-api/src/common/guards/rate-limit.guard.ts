import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
    private redis: Redis;
    private readonly WINDOW_SIZE = 60; // 1 minute
    private readonly MAX_REQUESTS = 100; // requests per window

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 3,
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const clientId = this.getClientId(request);
        const key = `rate_limit:${clientId}`;

        try {
            const current = await this.redis.incr(key);

            if (current === 1) {
                await this.redis.expire(key, this.WINDOW_SIZE);
            }

            if (current > this.MAX_REQUESTS) {
                throw new HttpException(
                    {
                        message: 'Rate limit exceeded',
                        errorCode: 'RATE_LIMIT_EXCEEDED',
                        retryAfter: await this.redis.ttl(key),
                    },
                    HttpStatus.TOO_MANY_REQUESTS
                );
            }

            // Add rate limit headers
            const response = context.switchToHttp().getResponse();
            response.header('X-RateLimit-Limit', this.MAX_REQUESTS.toString());
            response.header('X-RateLimit-Remaining', Math.max(0, this.MAX_REQUESTS - current).toString());
            response.header('X-RateLimit-Reset', (Date.now() + this.WINDOW_SIZE * 1000).toString());

            return true;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            // If Redis is down, allow the request but log the issue
            console.warn('Rate limiting disabled due to Redis connection issue:', error.message);
            return true;
        }
    }

    private getClientId(request: Request): string {
        // Use API key if available, otherwise use IP
        const apiKey = request.headers['x-api-key'] as string;
        if (apiKey) {
            return `api_key:${apiKey}`;
        }

        const ip = request.ip || request.connection.remoteAddress || 'unknown';
        return `ip:${ip}`;
    }
} 