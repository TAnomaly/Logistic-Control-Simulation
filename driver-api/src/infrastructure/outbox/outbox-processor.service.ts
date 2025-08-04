import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';
import * as amqp from 'amqplib';

@Injectable()
export class OutboxProcessorService implements OnModuleInit {
    private readonly logger = new Logger(OutboxProcessorService.name);
    private connection: any;
    private channel: any;

    constructor(
        @InjectRepository(OutboxEvent)
        private readonly outboxEventRepository: Repository<OutboxEvent>,
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
            this.logger.error('❌ Failed to connect to RabbitMQ for outbox processing:', error);
        }
    }

    private async startProcessing() {
        setInterval(async () => {
            await this.processPendingEvents();
        }, 5000); // Process every 5 seconds
    }

    private async processPendingEvents() {
        try {
            const pendingEvents = await this.outboxEventRepository.find({
                where: { status: OutboxEventStatus.PENDING },
                order: { createdAt: 'ASC' },
                take: 10
            });

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
            event.status = OutboxEventStatus.PROCESSING;
            await this.outboxEventRepository.save(event);

            // Publish to RabbitMQ
            await this.channel.publish(
                event.exchange,
                event.routingKey,
                Buffer.from(JSON.stringify(event.eventData)),
                { persistent: true }
            );

            // Mark as completed
            event.status = OutboxEventStatus.COMPLETED;
            event.processedAt = new Date();
            await this.outboxEventRepository.save(event);

            this.logger.log(`✅ Published event ${event.eventType} to RabbitMQ`);
        } catch (error) {
            // Mark as failed
            event.status = OutboxEventStatus.FAILED;
            event.errorMessage = error.message;
            await this.outboxEventRepository.save(event);

            this.logger.error(`❌ Failed to publish event ${event.eventType}:`, error);
        }
    }
} 