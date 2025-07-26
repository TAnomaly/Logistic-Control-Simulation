import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@Injectable()
export class TypeOrmOutboxEventRepository implements OutboxEventRepository {
    constructor(
        @InjectRepository(OutboxEvent)
        private readonly repository: Repository<OutboxEvent>
    ) { }

    async save(outboxEvent: OutboxEvent): Promise<OutboxEvent> {
        return await this.repository.save(outboxEvent);
    }

    async findById(id: string): Promise<OutboxEvent | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findPending(): Promise<OutboxEvent[]> {
        return await this.repository.find({
            where: { status: OutboxEventStatus.PENDING },
            order: { createdAt: 'ASC' }
        });
    }

    async findByEventType(eventType: string): Promise<OutboxEvent[]> {
        return await this.repository.find({ where: { eventType } });
    }

    async markAsProcessing(id: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.PROCESSING
        });
    }

    async markAsCompleted(id: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.COMPLETED,
            processedAt: new Date()
        });
    }

    async markAsFailed(id: string, errorMessage: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.FAILED,
            errorMessage
        });
    }

    async incrementRetryCount(id: string): Promise<void> {
        await this.repository.increment({ id }, 'retryCount', 1);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
} 