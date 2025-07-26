import { Repository } from 'typeorm';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
export declare class TypeOrmOutboxEventRepository implements OutboxEventRepository {
    private readonly repository;
    constructor(repository: Repository<OutboxEvent>);
    save(outboxEvent: OutboxEvent): Promise<OutboxEvent>;
    findById(id: string): Promise<OutboxEvent | null>;
    findPending(): Promise<OutboxEvent[]>;
    findByEventType(eventType: string): Promise<OutboxEvent[]>;
    markAsProcessing(id: string): Promise<void>;
    markAsCompleted(id: string): Promise<void>;
    markAsFailed(id: string, errorMessage: string): Promise<void>;
    incrementRetryCount(id: string): Promise<void>;
    delete(id: string): Promise<void>;
}
