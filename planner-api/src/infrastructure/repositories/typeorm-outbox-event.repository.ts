import { Injectable } from '@nestjs/common';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@Injectable()
export class TypeOrmOutboxEventRepository implements OutboxEventRepository {
    private outboxEvents: OutboxEvent[] = [];

    constructor() { }

    async save(outboxEvent: OutboxEvent): Promise<OutboxEvent> {
        if (!outboxEvent.id) {
            outboxEvent.id = Math.random().toString(36).substr(2, 9);
            outboxEvent.createdAt = new Date();
        }
        outboxEvent.updatedAt = new Date();

        const existingIndex = this.outboxEvents.findIndex(e => e.id === outboxEvent.id);
        if (existingIndex >= 0) {
            this.outboxEvents[existingIndex] = outboxEvent;
        } else {
            this.outboxEvents.push(outboxEvent);
        }

        return outboxEvent;
    }

    async findById(id: string): Promise<OutboxEvent | null> {
        return this.outboxEvents.find(e => e.id === id) || null;
    }

    async findPending(): Promise<OutboxEvent[]> {
        return this.outboxEvents.filter(e => e.status === OutboxEventStatus.PENDING);
    }

    async findByEventType(eventType: string): Promise<OutboxEvent[]> {
        return this.outboxEvents.filter(e => e.eventType === eventType);
    }

    async markAsProcessing(id: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            event.status = OutboxEventStatus.PROCESSING;
            event.updatedAt = new Date();
        }
    }

    async markAsCompleted(id: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            event.status = OutboxEventStatus.COMPLETED;
            event.processedAt = new Date();
            event.updatedAt = new Date();
        }
    }

    async markAsFailed(id: string, errorMessage: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            event.status = OutboxEventStatus.FAILED;
            event.errorMessage = errorMessage;
            event.updatedAt = new Date();
        }
    }

    async incrementRetryCount(id: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            event.retryCount = (event.retryCount || 0) + 1;
            event.updatedAt = new Date();
        }
    }

    async delete(id: string): Promise<void> {
        this.outboxEvents = this.outboxEvents.filter(e => e.id !== id);
    }

    async findPendingEvents(): Promise<OutboxEvent[]> {
        return this.findPending();
    }

    async updateStatus(id: string, status: OutboxEventStatus, errorMessage?: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            event.status = status;
            event.errorMessage = errorMessage;
            if (status === OutboxEventStatus.PROCESSED) {
                event.processedAt = new Date();
            }
            event.updatedAt = new Date();
        }
    }

    async deleteProcessedEvents(): Promise<void> {
        this.outboxEvents = this.outboxEvents.filter(e => e.status !== OutboxEventStatus.PROCESSED);
    }
} 