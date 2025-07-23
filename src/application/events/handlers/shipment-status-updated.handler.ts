import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ShipmentStatusUpdatedEvent } from '../../../domain/events/shipment-status-updated.event';
import { OutboxService } from '../../../infrastructure/outbox/outbox.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';

/**
 * ShipmentStatusUpdatedEventHandler - Gönderi durumu güncellendi eventi handler'ı
 */
@EventsHandler(ShipmentStatusUpdatedEvent)
@Injectable()
export class ShipmentStatusUpdatedEventHandler implements IEventHandler<ShipmentStatusUpdatedEvent> {
    private readonly logger = new Logger(ShipmentStatusUpdatedEventHandler.name);

    constructor(
        private readonly outboxService: OutboxService,
        private readonly redisService: RedisService,
    ) { }

    async handle(event: ShipmentStatusUpdatedEvent): Promise<void> {
        this.logger.log(`Gönderi durumu güncellendi eventi işleniyor: ${event.trackingNumber} - ${event.oldStatus} -> ${event.newStatus}`);

        try {
            // 1. Outbox'a event ekle
            await this.outboxService.addToOutbox(
                event.getEventType(),
                event.shipmentId,
                event.toJSON(),
                event.occurredOn
            );

            // 2. Cache'i güncelle
            await this.updateShipmentCache(event);

            // 3. Status-based notifications
            await this.sendStatusNotifications(event);

            // 4. Analytics güncelle
            await this.updateStatusAnalytics(event);

            // 5. İş kuralları uygula
            await this.applyStatusBusinessRules(event);

            // 6. Kritik durum değişiklikleri için özel işlemler
            if (event.isCriticalStatusChange()) {
                await this.handleCriticalStatusChange(event);
            }

            this.logger.log(`Status update eventi başarıyla işlendi: ${event.trackingNumber}`);

        } catch (error) {
            this.logger.error(`Status update eventi işlenirken hata: ${event.trackingNumber}`, error);
            throw error;
        }
    }

    /**
     * Cache'deki gönderi bilgisini güncelle
     */
    private async updateShipmentCache(event: ShipmentStatusUpdatedEvent): Promise<void> {
        try {
            const cacheKey = `shipment:${event.trackingNumber}`;
            const existingData = await this.redisService.get<any>(cacheKey);

            if (existingData) {
                existingData.status = event.newStatus;
                existingData.lastUpdated = event.occurredOn;
                existingData.updatedBy = event.updatedBy;

                await this.redisService.set(cacheKey, existingData, 24 * 60 * 60);
            }

            // Status bazlı listeleri güncelle
            await this.updateStatusLists(event);

            this.logger.debug(`Cache güncellendi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Cache güncelleme hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Status bazlı listeleri güncelle
     */
    private async updateStatusLists(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // Eski status listesinden çıkar
        await this.redisService.getClient().lrem(`shipments_by_status:${event.oldStatus}`, 0, event.trackingNumber);

        // Yeni status listesine ekle
        await this.redisService.rpush(`shipments_by_status:${event.newStatus}`, event.trackingNumber);
    }

    /**
     * Status değişikliği notification'larını gönder
     */
    private async sendStatusNotifications(event: ShipmentStatusUpdatedEvent): Promise<void> {
        try {
            const notification = {
                type: 'status_updated',
                shipmentId: event.shipmentId,
                trackingNumber: event.trackingNumber,
                oldStatus: event.oldStatus,
                newStatus: event.newStatus,
                updatedBy: event.updatedBy,
                reason: event.reason,
                timestamp: event.occurredOn,
                progressDirection: event.getProgressDirection()
            };

            // Genel notification
            await this.redisService.publish('shipment_status_updates', notification);

            // Status'a göre özel message'lar
            const message = this.getStatusMessage(event);

            // Customer notification (sender ve receiver için)
            await this.sendCustomerNotification(event, message);

            // Internal teams notification
            await this.sendInternalNotification(event, notification);

            this.logger.debug(`Status notification gönderildi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Notification gönderme hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Müşteri notification'ları gönder
     */
    private async sendCustomerNotification(event: ShipmentStatusUpdatedEvent, message: string): Promise<void> {
        const customerNotification = {
            trackingNumber: event.trackingNumber,
            status: event.newStatus,
            message,
            timestamp: event.occurredOn
        };

        // Tracking number ile customer'ları bulup notification gönder
        // Bu örnekte basit implementation, gerçekte customer database'den bakılır
        await this.redisService.publish(`customer_notifications:${event.trackingNumber}`, customerNotification);
    }

    /**
     * Internal team notification'ları gönder
     */
    private async sendInternalNotification(event: ShipmentStatusUpdatedEvent, notification: any): Promise<void> {
        // Operations team
        await this.redisService.publish('operations_team_notifications', notification);

        // Customer service team (sadece problem durumları için)
        if (event.newStatus === 'DELIVERY_FAILED' || event.newStatus === 'CANCELLED') {
            await this.redisService.publish('customer_service_notifications', {
                ...notification,
                priority: 'high',
                requiresAction: true
            });
        }
    }

    /**
     * Status analytics güncelle
     */
    private async updateStatusAnalytics(event: ShipmentStatusUpdatedEvent): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Status transition count
            const transitionKey = `analytics:transitions:${event.oldStatus}_to_${event.newStatus}:${today}`;
            await this.redisService.getClient().incr(transitionKey);

            // Status duration tracking
            await this.trackStatusDuration(event);

            // Progress direction analytics
            const direction = event.getProgressDirection();
            await this.redisService.getClient().incr(`analytics:progress:${direction}:${today}`);

            this.logger.debug(`Status analytics güncellendi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Analytics güncelleme hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Status süresini takip et
     */
    private async trackStatusDuration(event: ShipmentStatusUpdatedEvent): Promise<void> {
        const statusStartKey = `status_start:${event.shipmentId}:${event.oldStatus}`;
        const startTime = await this.redisService.get<string>(statusStartKey);

        if (startTime) {
            const duration = event.occurredOn.getTime() - new Date(startTime).getTime();
            const durationMinutes = Math.round(duration / (1000 * 60));

            // Status süresini kaydet
            await this.redisService.rpush(`status_durations:${event.oldStatus}`, durationMinutes);

            // Eski kayıtları temizle
            await this.redisService.delete(statusStartKey);
        }

        // Yeni status için başlangıç zamanını kaydet
        const newStatusStartKey = `status_start:${event.shipmentId}:${event.newStatus}`;
        await this.redisService.set(newStatusStartKey, event.occurredOn.toISOString(), 7 * 24 * 60 * 60); // 7 gün TTL
    }

    /**
     * Status business rules uygula
     */
    private async applyStatusBusinessRules(event: ShipmentStatusUpdatedEvent): Promise<void> {
        try {
            // SLA kontrolü
            await this.checkSLACompliance(event);

            // Automatic next actions
            await this.triggerAutomaticActions(event);

            // Escalation rules
            await this.checkEscalationRules(event);

        } catch (error) {
            this.logger.error(`Business rules hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * SLA uygunluk kontrolü
     */
    private async checkSLACompliance(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // SLA breach detection logic
        if (event.newStatus === 'DELIVERY_FAILED') {
            await this.redisService.publish('sla_breach_alert', {
                trackingNumber: event.trackingNumber,
                reason: 'delivery_failed',
                timestamp: event.occurredOn
            });
        }
    }

    /**
     * Otomatik aksiyonları tetikle
     */
    private async triggerAutomaticActions(event: ShipmentStatusUpdatedEvent): Promise<void> {
        switch (event.newStatus) {
            case 'OUT_FOR_DELIVERY':
                // Teslimat notification'ı gönder
                await this.scheduleDeliveryNotification(event);
                break;
            case 'DELIVERED':
                // Feedback request gönder
                await this.scheduleFeedbackRequest(event);
                break;
            case 'DELIVERY_FAILED':
                // Retry delivery schedule et
                await this.scheduleRetryDelivery(event);
                break;
        }
    }

    /**
     * Escalation kurallarını kontrol et
     */
    private async checkEscalationRules(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // Kritik durumlar için escalation
        if (event.newStatus === 'DELIVERY_FAILED') {
            const failureCount = await this.getDeliveryFailureCount(event.shipmentId);
            if (failureCount >= 3) {
                await this.escalateToManagement(event);
            }
        }
    }

    /**
     * Kritik durum değişikliklerini handle et
     */
    private async handleCriticalStatusChange(event: ShipmentStatusUpdatedEvent): Promise<void> {
        await this.redisService.publish('critical_status_changes', {
            ...event.toJSON(),
            priority: 'critical',
            requiresImmediateAttention: true
        });
    }

    // Yardımcı metodlar
    private getStatusMessage(event: ShipmentStatusUpdatedEvent): string {
        const messages: Record<string, string> = {
            'PICKED_UP': 'Gönderiniz kargo şirketimize teslim edildi',
            'IN_TRANSIT': 'Gönderiniz yolda',
            'AT_DISTRIBUTION_CENTER': 'Gönderiniz dağıtım merkezinde',
            'OUT_FOR_DELIVERY': 'Gönderiniz teslimat için yola çıktı',
            'DELIVERED': 'Gönderiniz başarıyla teslim edildi',
            'DELIVERY_FAILED': 'Teslimat girişimi başarısız oldu',
            'CANCELLED': 'Gönderiniz iptal edildi'
        };

        return messages[event.newStatus] || `Gönderi durumu güncellendi: ${event.newStatus}`;
    }

    private async scheduleDeliveryNotification(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // Implementation for delivery notification scheduling
    }

    private async scheduleFeedbackRequest(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // Implementation for feedback request scheduling
    }

    private async scheduleRetryDelivery(event: ShipmentStatusUpdatedEvent): Promise<void> {
        // Implementation for retry delivery scheduling
    }

    private async getDeliveryFailureCount(shipmentId: string): Promise<number> {
        const count = await this.redisService.get<number>(`delivery_failures:${shipmentId}`);
        return count || 0;
    }

    private async escalateToManagement(event: ShipmentStatusUpdatedEvent): Promise<void> {
        await this.redisService.publish('management_escalation', {
            trackingNumber: event.trackingNumber,
            reason: 'multiple_delivery_failures',
            timestamp: event.occurredOn
        });
    }
} 