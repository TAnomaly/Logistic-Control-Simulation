import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateDriverLocationCommand } from '../../application/commands/update-driver-location.command';
import { Coordinates } from '../../domain/entities/driver-track.entity';

@Injectable()
export class WebhookConsumerService implements OnModuleInit {
    private readonly logger = new Logger(WebhookConsumerService.name);
    private connection: any;
    private channel: any;

    constructor(private readonly commandBus: CommandBus) { }

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
            const QUEUE = 'tracking-service-webhook-queue';
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

            const coordinates = new Coordinates(location.latitude, location.longitude);
            const command = new UpdateDriverLocationCommand(
                driverId,
                coordinates,
                new Date(),
                location.speed,
                location.heading,
                location.accuracy
            );

            await this.commandBus.execute(command);
            this.logger.log(`✅ Location updated for driver ${driverId}`);
        } catch (error) {
            this.logger.error('❌ Failed to handle driver location update:', error);
            throw error;
        }
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