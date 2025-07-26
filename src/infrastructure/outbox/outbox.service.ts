import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { TypeOrmOutboxEventRepository } from '../repositories/typeorm-outbox-event.repository';
import { v4 as uuidv4 } from 'uuid';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

/**
 * OutboxService - Outbox pattern implementation
 * Domain event'lerin güvenilir şekilde publish edilmesini sağlar
 */
@Injectable()
export class OutboxService {
    private readonly logger = new Logger(OutboxService.name);

    constructor(
        private readonly outboxRepository: TypeOrmOutboxEventRepository,
        private readonly eventBus: EventBus,
        private readonly amqp: AmqpConnection, // RabbitMQ publisher
    ) { }

    /**
     * Domain event'i outbox'a ekle
     */
    async addToOutbox(
        eventType: string,
        aggregateId: string,
        eventData: Record<string, any>,
        occurredOn: Date = new Date()
    ): Promise<OutboxEvent> {
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventId = uuidv4();
        outboxEvent.eventType = eventType;
        outboxEvent.aggregateId = aggregateId;
        outboxEvent.eventData = eventData;
        outboxEvent.occurredOn = occurredOn;

        const savedEvent = await this.outboxRepository.save(outboxEvent);

        this.logger.log(`Event outbox'a eklendi: ${eventType} - ${aggregateId}`);

        return savedEvent;
    }

    /**
     * Publish edilmemiş event'leri işle (scheduled job)
     */
    @Cron(CronExpression.EVERY_30_SECONDS)
    async processUnpublishedEvents(): Promise<void> {
        try {
            const unpublishedEvents = await this.outboxRepository.findUnpublished(50);

            if (unpublishedEvents.length === 0) {
                return;
            }

            this.logger.log(`${unpublishedEvents.length} adet publish edilmemiş event işleniyor...`);

            for (const outboxEvent of unpublishedEvents) {
                await this.publishSingleEvent(outboxEvent);
            }
        } catch (error) {
            this.logger.error('Unpublished eventler işlenirken hata: ', error);
        }
    }

    /**
     * Retry edilebilir event'leri işle (scheduled job)
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processRetryableEvents(): Promise<void> {
        try {
            const retryableEvents = await this.outboxRepository.findRetryable(25);

            if (retryableEvents.length === 0) {
                return;
            }

            this.logger.log(`${retryableEvents.length} adet retry edilebilir event işleniyor...`);

            for (const outboxEvent of retryableEvents) {
                await this.publishSingleEvent(outboxEvent);
            }
        } catch (error) {
            this.logger.error('Retryable eventler işlenirken hata: ', error);
        }
    }

    /**
     * Tek bir event'i publish et
     */
    private async publishSingleEvent(outboxEvent: OutboxEvent): Promise<void> {
        try {
            // Domain event nesnesini yeniden oluştur
            const domainEvent = this.reconstructDomainEvent(outboxEvent);

            // RabbitMQ'ya publish et
            await this.amqp.publish('assignment-exchange', outboxEvent.eventType, outboxEvent.eventData);

            // EventBus ile publish et (varsa eski mantık)
            await this.eventBus.publish(domainEvent);

            // Başarılı durumda outbox event'i güncelle
            outboxEvent.markAsPublished();
            await this.outboxRepository.update(outboxEvent);

            this.logger.log(`Event RabbitMQ'ya publish edildi: ${outboxEvent.eventType} - ${outboxEvent.aggregateId}`);

        } catch (error) {
            this.logger.error(`Event publish edilirken hata: ${outboxEvent.eventType} - ${error.message}`);

            // Hata durumunda retry bilgilerini güncelle
            outboxEvent.markRetryAttempt(error.message);
            await this.outboxRepository.update(outboxEvent);
        }
    }

    /**
     * Domain event nesnesini outbox verilerinden yeniden oluştur
     */
    private reconstructDomainEvent(outboxEvent: OutboxEvent): any {
        // Event type'a göre uygun domain event class'ını instantiate et
        switch (outboxEvent.eventType) {
            case 'ShipmentCreated':
                return this.createShipmentCreatedEvent(outboxEvent.eventData);
            case 'ShipmentStatusUpdated':
                return this.createShipmentStatusUpdatedEvent(outboxEvent.eventData);
            case 'TrackingEventAdded':
                return this.createTrackingEventAddedEvent(outboxEvent.eventData);
            default:
                // Generic event wrapper
                return {
                    eventType: outboxEvent.eventType,
                    aggregateId: outboxEvent.aggregateId,
                    eventData: outboxEvent.eventData,
                    occurredOn: outboxEvent.occurredOn
                };
        }
    }

    private createShipmentCreatedEvent(eventData: any): any {
        // ShipmentCreatedEvent import edilip kullanılabilir
        return {
            shipmentId: eventData.shipmentId,
            trackingNumber: eventData.trackingNumber,
            senderName: eventData.senderName,
            receiverName: eventData.receiverName,
            weight: eventData.weight,
            volume: eventData.volume,
            occurredOn: new Date(eventData.occurredOn)
        };
    }

    private createShipmentStatusUpdatedEvent(eventData: any): any {
        return {
            shipmentId: eventData.shipmentId,
            trackingNumber: eventData.trackingNumber,
            oldStatus: eventData.oldStatus,
            newStatus: eventData.newStatus,
            updatedBy: eventData.updatedBy,
            occurredOn: new Date(eventData.occurredOn)
        };
    }

    private createTrackingEventAddedEvent(eventData: any): any {
        return {
            shipmentId: eventData.shipmentId,
            trackingEventId: eventData.trackingEventId,
            gateId: eventData.gateId,
            eventType: eventData.eventType,
            occurredOn: new Date(eventData.occurredOn)
        };
    }

    /**
     * Eski event'leri temizle (scheduled job - günlük)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldEvents(): Promise<void> {
        try {
            const deletedCount = await this.outboxRepository.cleanupOldEvents(30); // 30 gün öncesi

            if (deletedCount > 0) {
                this.logger.log(`${deletedCount} adet eski outbox event temizlendi`);
            }
        } catch (error) {
            this.logger.error('Eski eventler temizlenirken hata: ', error);
        }
    }

    /**
     * Belirli bir aggregate'in tüm event'lerini getir
     */
    async getEventsByAggregateId(aggregateId: string): Promise<OutboxEvent[]> {
        return await this.outboxRepository.findByAggregateId(aggregateId);
    }

    /**
     * Outbox istatistiklerini getir
     */
    async getOutboxStats(): Promise<{
        totalEvents: number;
        publishedEvents: number;
        unpublishedEvents: number;
        failedEvents: number;
    }> {
        // Bu metodun implementasyonu için raw SQL query gerekebilir
        // Şimdilik basit implementation
        const unpublishedEvents = await this.outboxRepository.findUnpublished(1000);
        const retryableEvents = await this.outboxRepository.findRetryable(1000);

        return {
            totalEvents: 0, // Toplam sayı için ayrı query gerekli
            publishedEvents: 0, // Published sayısı için ayrı query gerekli  
            unpublishedEvents: unpublishedEvents.length,
            failedEvents: retryableEvents.filter(e => e.retryCount >= 10).length
        };
    }
} 