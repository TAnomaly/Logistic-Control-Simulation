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
        return await this.repository.find({ where: { status: OutboxEventStatus.PENDING } });
    }

    async findByEventType(eventType: string): Promise<OutboxEvent[]> {
        return await this.repository.find({ where: { eventType } });
    }

    async markAsProcessing(id: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.PROCESSING,
            updatedAt: new Date()
        });
    }

    async markAsCompleted(id: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.COMPLETED,
            processedAt: new Date(),
            updatedAt: new Date()
        });
    }

    async markAsFailed(id: string, errorMessage: string): Promise<void> {
        await this.repository.update(id, {
            status: OutboxEventStatus.FAILED,
            errorMessage,
            updatedAt: new Date()
        });
    }

    async incrementRetryCount(id: string): Promise<void> {
        const event = await this.findById(id);
        if (event) {
            await this.repository.update(id, {
                retryCount: (event.retryCount || 0) + 1,
                updatedAt: new Date()
            });
        }
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findPendingEvents(): Promise<OutboxEvent[]> {
        return await this.findPending();
    }

    async updateStatus(id: string, status: OutboxEventStatus, errorMessage?: string): Promise<void> {
        const updateData: any = {
            status,
            updatedAt: new Date()
        };

        if (errorMessage) {
            updateData.errorMessage = errorMessage;
        }

        if (status === OutboxEventStatus.PROCESSED) {
            updateData.processedAt = new Date();
        }

        await this.repository.update(id, updateData);
    }

    async deleteProcessedEvents(): Promise<void> {
        await this.repository.delete({ status: OutboxEventStatus.PROCESSED });
    }
} 