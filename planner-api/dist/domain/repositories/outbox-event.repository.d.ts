import { OutboxEvent } from '../entities/outbox-event.entity';
export interface OutboxEventRepository {
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
