import { OutboxEvent, OutboxEventStatus } from '../entities/outbox-event.entity';

export interface OutboxEventRepository {
    save(event: OutboxEvent): Promise<OutboxEvent>;
    findPendingEvents(): Promise<OutboxEvent[]>;
    findById(id: string): Promise<OutboxEvent | null>;
    updateStatus(id: string, status: OutboxEventStatus, errorMessage?: string): Promise<void>;
    deleteProcessedEvents(): Promise<void>;
} 