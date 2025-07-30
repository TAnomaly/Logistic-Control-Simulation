import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(DriverAssignment)
        private readonly driverAssignmentRepository: Repository<DriverAssignment>,
    ) { }

    async onModuleInit() {
        console.log('✅ RabbitMQ service initialized (placeholder)');
        this.subscribeToShipmentAssigned();
    }

    async onModuleDestroy() {
        console.log('✅ RabbitMQ service destroyed');
    }

    async publishEvent(eventType: string, eventData: any, routingKey?: string): Promise<void> {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq';
        const EXCHANGE = 'logistics';
        const ROUTING_KEY = routingKey || eventType;

        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();

            // Declare exchange
            await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

            // Publish message
            const message = JSON.stringify({
                eventType,
                data: eventData,
                timestamp: new Date().toISOString()
            });

            await channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(message));
            console.log(`📤 Event published: ${eventType} -> ${ROUTING_KEY}`, eventData);

            await channel.close();
            await connection.close();
        } catch (error) {
            console.error(`❌ Failed to publish event ${eventType}:`, error);
        }
    }

    async consumeEvents(queueName: string, callback: (message: any) => Promise<void>): Promise<void> {
        console.log(`👂 Consumer registered for queue: ${queueName}`);
    }

    async bindQueueToExchange(queueName: string, exchange: string, routingKey: string): Promise<void> {
        console.log(`🔗 Queue bound: ${queueName} to ${exchange} with key: ${routingKey}`);
    }

    async getQueueInfo(queueName: string): Promise<any> {
        return { queue: queueName, messageCount: 0 };
    }

    async purgeQueue(queueName: string): Promise<void> {
        console.log(`🧹 Queue purged: ${queueName}`);
    }

    async healthCheck(): Promise<boolean> {
        return true;
    }

    async subscribeToShipmentAssigned() {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq';
        const EXCHANGE = 'logistics';
        const ROUTING_KEY = 'shipment.assigned';
        const QUEUE = 'driver-api.shipment.assigned';

        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            const channel = await connection.createChannel();

            // Declare exchange
            await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

            // Declare queue
            await channel.assertQueue(QUEUE, { durable: true });

            // Bind queue to exchange with routing key
            await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

            channel.consume(QUEUE, async (msg) => {
                if (msg) {
                    try {
                        const event = JSON.parse(msg.content.toString());
                        console.log(`📨 Received shipment.assigned event:`, event);

                        const assignment = this.driverAssignmentRepository.create({
                            driverId: event.driverId,
                            shipmentId: event.shipmentId,
                            status: AssignmentStatus.PENDING,
                            assignedAt: event.assignedAt ? new Date(event.assignedAt) : new Date(),
                        });
                        await this.driverAssignmentRepository.save(assignment);
                        console.log(`✅ Assignment created for driver ${event.driverId} and shipment ${event.shipmentId}`);
                        channel.ack(msg);
                    } catch (err) {
                        console.error('❌ Error processing shipment.assigned event:', err);
                        channel.nack(msg, false, false);
                    }
                }
            });
            console.log('🚚 Listening for shipment.assigned events from RabbitMQ...');
        } catch (err) {
            console.error('❌ Failed to connect to RabbitMQ for shipment.assigned:', err);
        }
    }
} 