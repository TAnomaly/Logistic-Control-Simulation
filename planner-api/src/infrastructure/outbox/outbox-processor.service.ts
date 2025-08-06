import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';
import { TypeOrmOutboxEventRepository } from '../repositories/typeorm-outbox-event.repository';
import * as amqp from 'amqplib';

@Injectable()
export class OutboxProcessorService implements OnModuleInit {
    private readonly logger = new Logger(OutboxProcessorService.name);
    private connection: any;
    private channel: any;

    constructor(
        @Inject('OutboxEventRepository')
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository,
    ) { }

    async onModuleInit() {
        await this.connectToRabbitMQ();
        this.startProcessing();
    }

    private async connectToRabbitMQ() {
        try {
            const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();

            // Declare exchange
            await this.channel.assertExchange('logistics', 'topic', { durable: true });

            this.logger.log('✅ Connected to RabbitMQ for outbox processing');
        } catch (error) {
            this.logger.error('❌ Failed to connect to RabbitMQ:', error);
        }
    }

    private startProcessing() {
        setInterval(async () => {
            await this.processPendingEvents();
        }, 5000); // Process every 5 seconds
    }

    private async processPendingEvents() {
        try {
            const pendingEvents = await this.outboxEventRepository.findPending();

            for (const event of pendingEvents) {
                await this.processEvent(event);
            }
        } catch (error) {
            this.logger.error('❌ Error processing pending events:', error);
        }
    }

    private async processEvent(event: OutboxEvent) {
        try {
            // Mark as processing
            await this.outboxEventRepository.markAsProcessing(event.id);

            // Publish to RabbitMQ
            await this.channel.publish(
                event.exchange,
                event.routingKey,
                Buffer.from(JSON.stringify(event.eventData)),
                { persistent: true }
            );

            // Mark as completed
            await this.outboxEventRepository.markAsCompleted(event.id);

            this.logger.log(`✅ Published event ${event.eventType} to RabbitMQ`);
        } catch (error) {
            // Mark as failed
            await this.outboxEventRepository.markAsFailed(event.id, error.message);

            this.logger.error(`❌ Failed to publish event ${event.eventType}:`, error);
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