import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { OutboxEventRepository } from '../../domain/repositories/outbox-event.repository';

/**
 * TypeOrmOutboxEventRepository - OutboxEvent için TypeORM repository implementasyonu
 */
@Injectable()
export class TypeOrmOutboxEventRepository implements OutboxEventRepository {
    constructor(
        @InjectRepository(OutboxEvent)
        private readonly outboxEventRepo: Repository<OutboxEvent>
    ) { }

    async save(outboxEvent: OutboxEvent): Promise<OutboxEvent> {
        return await this.outboxEventRepo.save(outboxEvent);
    }

    async findById(id: string): Promise<OutboxEvent | null> {
        return await this.outboxEventRepo.findOne({ where: { id } });
    }

    async findByEventId(eventId: string): Promise<OutboxEvent | null> {
        return await this.outboxEventRepo.findOne({ where: { eventId } });
    }

    async findUnpublished(limit: number = 100): Promise<OutboxEvent[]> {
        return await this.outboxEventRepo.find({
            where: { isPublished: false },
            order: { createdAt: 'ASC' },
            take: limit
        });
    }

    async findRetryable(limit: number = 50): Promise<OutboxEvent[]> {
        const now = new Date();
        return await this.outboxEventRepo
            .createQueryBuilder('outbox')
            .where('outbox.isPublished = false')
            .andWhere('outbox.retryCount < 10')
            .andWhere('(outbox.nextRetryAt IS NULL OR outbox.nextRetryAt <= :now)', { now })
            .orderBy('outbox.createdAt', 'ASC')
            .limit(limit)
            .getMany();
    }

    async update(outboxEvent: OutboxEvent): Promise<OutboxEvent> {
        return await this.outboxEventRepo.save(outboxEvent);
    }

    async cleanupOldEvents(olderThanDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await this.outboxEventRepo.delete({
            isPublished: true,
            publishedAt: LessThan(cutoffDate)
        });

        return result.affected || 0;
    }

    async findByAggregateId(aggregateId: string): Promise<OutboxEvent[]> {
        return await this.outboxEventRepo.find({
            where: { aggregateId },
            order: { createdAt: 'ASC' }
        });
    }
} 