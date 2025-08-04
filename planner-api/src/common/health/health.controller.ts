import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import Redis from 'ioredis';
import * as amqp from 'amqplib';

@Controller('health')
export class HealthController {
    private redis: Redis;
    private rabbitmqUrl: string;

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });

        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
    }

    @Get()
    async healthCheck(@Res() res: Response) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Planner API',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: {
                database: 'unknown',
                redis: 'unknown',
                rabbitmq: 'unknown',
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };

        let overallStatus = 'healthy';

        // Database check - using in-memory repositories
        health.checks.database = 'healthy';

        // Redis check
        try {
            await this.redis.ping();
            health.checks.redis = 'healthy';
        } catch (error) {
            health.checks.redis = 'unhealthy';
            overallStatus = 'unhealthy';
        }

        // RabbitMQ check
        try {
            const connection = await amqp.connect(this.rabbitmqUrl);
            await connection.close();
            health.checks.rabbitmq = 'healthy';
        } catch (error) {
            health.checks.rabbitmq = 'unhealthy';
            overallStatus = 'unhealthy';
        }

        health.status = overallStatus;

        const statusCode = overallStatus === 'healthy' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        res.status(statusCode).json(health);
    }

    @Get('ready')
    async readinessCheck(@Res() res: Response) {
        const readiness = {
            status: 'ready',
            timestamp: new Date().toISOString(),
            service: 'Planner API',
        };

        // Check if all critical services are ready
        try {
            await this.redis.ping();

            res.status(HttpStatus.OK).json(readiness);
        } catch (error) {
            readiness.status = 'not_ready';
            res.status(HttpStatus.SERVICE_UNAVAILABLE).json(readiness);
        }
    }

    @Get('live')
    async livenessCheck(@Res() res: Response) {
        const liveness = {
            status: 'alive',
            timestamp: new Date().toISOString(),
            service: 'Planner API',
            uptime: process.uptime(),
        };

        res.status(HttpStatus.OK).json(liveness);
    }
} 