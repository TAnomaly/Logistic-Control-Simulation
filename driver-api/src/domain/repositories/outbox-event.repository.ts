import { OutboxEvent, OutboxEventStatus } from '../entities/outbox-event.entity';

export interface OutboxEventRepository {
    save(outboxEvent: OutboxEvent): Promise<OutboxEvent>;
    findById(id: string): Promise<OutboxEvent | null>;
    findPending(): Promise<OutboxEvent[]>;
    findByEventType(eventType: string): Promise<OutboxEvent[]>;
} 