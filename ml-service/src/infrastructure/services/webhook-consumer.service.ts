import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { H3RouteOptimizationService } from './h3-route-optimization.service';
import { Coordinates, H3DeliveryPoint, PriorityEnum } from '../../domain/entities/h3-route.entity';
import { H3OptimizationAlgorithm } from '../../domain/repositories/h3-route-optimization.repository';

@Injectable()
export class WebhookConsumerService implements OnModuleInit {
    private readonly logger = new Logger(WebhookConsumerService.name);
    private connection: any;
    private channel: any;

    constructor(
        private readonly h3RouteOptimizationService: H3RouteOptimizationService
    ) { }

    async onModuleInit() {
        await this.connectToRabbitMQ();
        await this.setupConsumer();
    }

    private async connectToRabbitMQ() {
        try {
            const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();

            const EXCHANGE = 'logistics';
            await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });

            this.logger.log('✅ Connected to RabbitMQ');
        } catch (error) {
            this.logger.error('❌ Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    private async setupConsumer() {
        try {
            const EXCHANGE = 'logistics';
            const QUEUE = 'ml-service-webhook-queue';
            const ROUTING_KEY = 'driver.location.updated';

            // Declare queue
            await this.channel.assertQueue(QUEUE, { durable: true });
            await this.channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

            // Start consuming
            await this.channel.consume(QUEUE, async (msg: any) => {
                if (msg) {
                    try {
                        await this.processWebhookMessage(msg);
                        this.channel.ack(msg);
                    } catch (error) {
                        this.logger.error('❌ Failed to process webhook message:', error);
                        this.channel.nack(msg, false, true);
                    }
                }
            });

            this.logger.log(`🎧 Webhook consumer started for routing key: ${ROUTING_KEY}`);
        } catch (error) {
            this.logger.error('❌ Failed to setup webhook consumer:', error);
            throw error;
        }
    }

    private async processWebhookMessage(msg: any) {
        try {
            const message = JSON.parse(msg.content.toString());
            this.logger.log(`📥 Received webhook: ${message.eventType}`);

            if (message.eventType === 'driver.location.updated') {
                await this.handleDriverLocationUpdate(message.data);
            }
        } catch (error) {
            this.logger.error('❌ Failed to parse webhook message:', error);
            throw error;
        }
    }

    private async handleDriverLocationUpdate(data: any) {
        try {
            const { driverId, location } = data;
            this.logger.log(`🚗 Processing location update for driver: ${driverId}`);

            // Get driver's shipments from Driver API
            const shipments = await this.getDriverShipments(driverId);

            if (!shipments || shipments.length === 0) {
                this.logger.log(`📦 No shipments found for driver: ${driverId}`);
                return;
            }

            // Convert to H3 delivery points
            const deliveryPoints = shipments.map(shipment => {
                const h3Index = this.convertToH3Index(shipment.coordinates.latitude, shipment.coordinates.longitude);
                return new H3DeliveryPoint(
                    shipment.id,
                    shipment.deliveryAddress,
                    new Coordinates(shipment.coordinates.latitude, shipment.coordinates.longitude),
                    h3Index,
                    PriorityEnum.MEDIUM,
                    shipment.weight || 0,
                    shipment.volume || 0
                );
            });

            // Optimize route with H3
            const driverLocation = new Coordinates(location.latitude, location.longitude);
            const optimizedRoute = await this.h3RouteOptimizationService.optimizeRouteWithH3(
                driverId,
                driverLocation,
                deliveryPoints,
                9, // H3 resolution
                H3OptimizationAlgorithm.GREEDY,
                1000, // vehicle capacity
                10    // vehicle volume
            );

            // Save optimized route to Driver API
            await this.saveOptimizedRoute(driverId, optimizedRoute);

            this.logger.log(`✅ Route optimized for driver ${driverId}: ${optimizedRoute.totalDistance}km, ${optimizedRoute.totalTime}min`);
        } catch (error) {
            this.logger.error('❌ Failed to handle driver location update:', error);
            throw error;
        }
    }

    private async getDriverShipments(driverId: string): Promise<any[]> {
        try {
            const DRIVER_API_URL = process.env.DRIVER_API_URL || 'http://driver-api:3001';
            const response = await fetch(`${DRIVER_API_URL}/api/drivers/${driverId}/shipments`);

            if (!response.ok) {
                throw new Error(`Failed to get driver shipments: ${response.statusText}`);
            }

            const data = await response.json();
            return data.shipments || [];
        } catch (error) {
            this.logger.error('❌ Failed to get driver shipments:', error);
            return [];
        }
    }

    private async saveOptimizedRoute(driverId: string, optimizedRoute: any): Promise<void> {
        try {
            const DRIVER_API_URL = process.env.DRIVER_API_URL || 'http://driver-api:3001';
            const response = await fetch(`${DRIVER_API_URL}/api/drivers/${driverId}/route`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    optimizedRoute: optimizedRoute.optimizedRoute,
                    totalDistance: optimizedRoute.totalDistance,
                    totalTime: optimizedRoute.totalTime,
                    algorithm: optimizedRoute.algorithm,
                    h3Resolution: optimizedRoute.h3Resolution
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save optimized route: ${response.statusText}`);
            }

            this.logger.log(`💾 Optimized route saved for driver: ${driverId}`);
        } catch (error) {
            this.logger.error('❌ Failed to save optimized route:', error);
            throw error;
        }
    }

    private convertToH3Index(lat: number, lng: number): string {
        // This is a simplified H3 index conversion
        // In a real implementation, you would use the h3-js library
        const h3Index = `8928308280fffff`; // Placeholder H3 index
        return h3Index;
    }

    async onModuleDestroy() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
} 