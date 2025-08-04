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
        return await this.repository.find({
            where: { eventType },
            order: { createdAt: 'DESC' }
        });
    }

    async findProcessing(): Promise<OutboxEvent[]> {
        return await this.repository.find({
            where: { status: OutboxEventStatus.PROCESSING },
            order: { createdAt: 'ASC' }
        });
    }

    async findCompleted(): Promise<OutboxEvent[]> {
        return await this.repository.find({
            where: { status: OutboxEventStatus.COMPLETED },
            order: { createdAt: 'DESC' }
        });
    }

    async findFailed(): Promise<OutboxEvent[]> {
        return await this.repository.find({
            where: { status: OutboxEventStatus.FAILED },
            order: { createdAt: 'DESC' }
        });
    }

    async findPendingEvents(): Promise<OutboxEvent[]> {
        return await this.findPending();
    }

    async updateStatus(id: string, status: OutboxEventStatus, errorMessage?: string): Promise<void> {
        await this.repository.update(id, {
            status,
            errorMessage,
            processedAt: status === OutboxEventStatus.PROCESSED ? new Date() : undefined,
        });
    }

    async deleteProcessedEvents(): Promise<void> {
        await this.repository.delete({
            status: OutboxEventStatus.PROCESSED
        });
    }
} 