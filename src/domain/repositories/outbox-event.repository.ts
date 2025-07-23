import { OutboxEvent } from '../entities/outbox-event.entity';

/**
 * OutboxEventRepository - Outbox event'ler için domain repository interface
 */
export interface OutboxEventRepository {
    /**
     * Yeni outbox event kaydet
     */
    save(outboxEvent: OutboxEvent): Promise<OutboxEvent>;

    /**
     * ID'ye göre outbox event bul
     */
    findById(id: string): Promise<OutboxEvent | null>;

    /**
     * Event ID'ye göre outbox event bul
     */
    findByEventId(eventId: string): Promise<OutboxEvent | null>;

    /**
     * Publish edilmemiş event'leri getir
     */
    findUnpublished(limit?: number): Promise<OutboxEvent[]>;

    /**
     * Retry edilebilir event'leri getir
     */
    findRetryable(limit?: number): Promise<OutboxEvent[]>;

    /**
     * Event'i güncelle
     */
    update(outboxEvent: OutboxEvent): Promise<OutboxEvent>;

    /**
     * Eski publish edilmiş event'leri temizle
     */
    cleanupOldEvents(olderThanDays: number): Promise<number>;

    /**
     * Aggregate ID'ye göre event'leri getir
     */
    findByAggregateId(aggregateId: string): Promise<OutboxEvent[]>;
} 