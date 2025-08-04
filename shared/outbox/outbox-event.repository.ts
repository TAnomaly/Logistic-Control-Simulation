import { OutboxEvent, OutboxEventStatus } from './outbox-event.entity';

export interface OutboxEventRepository {
    save(outboxEvent: OutboxEvent): Promise<OutboxEvent>;
    findById(id: string): Promise<OutboxEvent | null>;
    findPending(): Promise<OutboxEvent[]>;
    findByEventType(eventType: string): Promise<OutboxEvent[]>;
    updateStatus(id: string, status: OutboxEventStatus, errorMessage?: string): Promise<void>;
} 