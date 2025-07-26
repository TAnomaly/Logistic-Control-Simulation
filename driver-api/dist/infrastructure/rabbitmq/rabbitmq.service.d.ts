import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RabbitMQService implements OnModuleDestroy {
    private readonly configService;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishEvent(eventType: string, eventData: any, routingKey?: string): Promise<void>;
    consumeEvents(queueName: string, callback: (message: any) => Promise<void>): Promise<void>;
    bindQueueToExchange(queueName: string, exchange: string, routingKey: string): Promise<void>;
    getQueueInfo(queueName: string): Promise<any>;
    purgeQueue(queueName: string): Promise<void>;
    healthCheck(): Promise<boolean>;
}
