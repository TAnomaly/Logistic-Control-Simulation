import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { ShipmentCreatedEvent } from '../../../domain/events/shipment-created.event';
import { OutboxService } from '../../../infrastructure/outbox/outbox.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';

/**
 * ShipmentCreatedEventHandler - Gönderi oluşturuldu eventi handler'ı
 * Event-driven architecture'da side-effect'leri yönetir
 */
@EventsHandler(ShipmentCreatedEvent)
@Injectable()
export class ShipmentCreatedEventHandler implements IEventHandler<ShipmentCreatedEvent> {
    private readonly logger = new Logger(ShipmentCreatedEventHandler.name);

    constructor(
        private readonly outboxService: OutboxService,
        private readonly redisService: RedisService,
    ) { }

    async handle(event: ShipmentCreatedEvent): Promise<void> {
        this.logger.log(`Gönderi oluşturuldu eventi işleniyor: ${event.trackingNumber}`);

        try {
            // 1. Outbox'a event ekle (güvenilir publish için)
            await this.outboxService.addToOutbox(
                event.getEventType(),
                event.shipmentId,
                event.toJSON(),
                event.occurredOn
            );

            // 2. Cache'e yeni gönderi bilgisini ekle
            await this.cacheShipmentInfo(event);

            // 3. Real-time notification için Redis pub/sub kullan
            await this.publishRealTimeNotification(event);

            // 4. Analytics için event count'u artır
            await this.updateAnalytics(event);

            // 5. İş kuralları kontrolü
            await this.applyBusinessRules(event);

            this.logger.log(`Gönderi oluşturuldu eventi başarıyla işlendi: ${event.trackingNumber}`);

        } catch (error) {
            this.logger.error(`Gönderi oluşturuldu eventi işlenirken hata: ${event.trackingNumber}`, error);
            // Hata durumunda retry mechanism devreye girecek
            throw error;
        }
    }

    /**
     * Cache'e gönderi bilgisini ekle
     */
    private async cacheShipmentInfo(event: ShipmentCreatedEvent): Promise<void> {
        try {
            const cacheKey = `shipment:${event.trackingNumber}`;
            const cacheData = {
                shipmentId: event.shipmentId,
                trackingNumber: event.trackingNumber,
                senderName: event.senderName,
                receiverName: event.receiverName,
                weight: event.weight,
                volume: event.volume,
                createdAt: event.occurredOn,
                status: 'CREATED'
            };

            // 24 saat cache'le
            await this.redisService.set(cacheKey, cacheData, 24 * 60 * 60);

            // Tracking number'ları da cache'le (arama için)
            await this.redisService.rpush('active_shipments', event.trackingNumber);

            this.logger.debug(`Gönderi cache'e eklendi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Cache güncelleme hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Real-time notification publish et
     */
    private async publishRealTimeNotification(event: ShipmentCreatedEvent): Promise<void> {
        try {
            const notification = {
                type: 'shipment_created',
                shipmentId: event.shipmentId,
                trackingNumber: event.trackingNumber,
                senderName: event.senderName,
                receiverName: event.receiverName,
                timestamp: event.occurredOn,
                message: `Yeni gönderi oluşturuldu: ${event.trackingNumber}`
            };

            // WebSocket clients için notification channel'a publish et
            await this.redisService.publish('shipment_notifications', notification);

            // Sender ve receiver için özel notification'lar
            await this.redisService.publish(`user_notifications:${event.senderName}`, {
                ...notification,
                userType: 'sender',
                message: `Gönderiniz sisteme kaydedildi: ${event.trackingNumber}`
            });

            this.logger.debug(`Real-time notification gönderildi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Notification publish hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Analytics verilerini güncelle
     */
    private async updateAnalytics(event: ShipmentCreatedEvent): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

            // Günlük gönderi sayısını artır
            await this.redisService.getClient().incr(`analytics:shipments:daily:${today}`);

            // Aylık istatistik
            const month = today.substring(0, 7); // YYYY-MM format
            await this.redisService.getClient().incr(`analytics:shipments:monthly:${month}`);

            // Gönderici bazlı istatistik
            await this.redisService.getClient().incr(`analytics:sender:${event.senderName}:count`);

            // Ağırlık kategorisi istatistiği
            const weightCategory = this.getWeightCategory(event.weight);
            await this.redisService.getClient().incr(`analytics:weight:${weightCategory}:${today}`);

            this.logger.debug(`Analytics güncellendi: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`Analytics güncelleme hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * İş kurallarını uygula
     */
    private async applyBusinessRules(event: ShipmentCreatedEvent): Promise<void> {
        try {
            // Büyük gönderi kontrolü
            if (event.weight > 50 || event.volume > 100000) { // 50kg veya 100L üzeri
                await this.flagLargeShipment(event);
            }

            // Değerli gönderi kontrolü (iş kuralına göre)
            if (event.volume > 50000) { // Örnek kural: 50L üzeri değerli sayılır
                await this.flagValuableShipment(event);
            }

            // Günlük gönderici limit kontrolü
            await this.checkSenderDailyLimit(event);

            this.logger.debug(`İş kuralları uygulandı: ${event.trackingNumber}`);
        } catch (error) {
            this.logger.error(`İş kuralları hatası: ${event.trackingNumber}`, error);
        }
    }

    /**
     * Büyük gönderi işaretle
     */
    private async flagLargeShipment(event: ShipmentCreatedEvent): Promise<void> {
        await this.redisService.rpush('large_shipments', {
            trackingNumber: event.trackingNumber,
            weight: event.weight,
            volume: event.volume,
            flaggedAt: new Date()
        });

        // Özel işleme gerektirir notification'ı
        await this.redisService.publish('special_handling_required', {
            trackingNumber: event.trackingNumber,
            reason: 'large_shipment',
            weight: event.weight,
            volume: event.volume
        });
    }

    /**
     * Değerli gönderi işaretle
     */
    private async flagValuableShipment(event: ShipmentCreatedEvent): Promise<void> {
        await this.redisService.rpush('valuable_shipments', {
            trackingNumber: event.trackingNumber,
            volume: event.volume,
            flaggedAt: new Date()
        });
    }

    /**
     * Gönderici günlük limit kontrolü
     */
    private async checkSenderDailyLimit(event: ShipmentCreatedEvent): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const senderDailyKey = `sender_daily_count:${event.senderName}:${today}`;

        const currentCount = await this.redisService.getClient().incr(senderDailyKey);

        // İlk gönderi ise TTL ayarla (24 saat)
        if (currentCount === 1) {
            await this.redisService.expire(senderDailyKey, 24 * 60 * 60);
        }

        // Günlük limit kontrolü (örnek: 100 gönderi)
        if (currentCount > 100) {
            await this.redisService.publish('sender_limit_exceeded', {
                senderName: event.senderName,
                currentCount,
                trackingNumber: event.trackingNumber,
                date: today
            });
        }
    }

    /**
     * Ağırlık kategorisini belirle
     */
    private getWeightCategory(weight: number): string {
        if (weight <= 1) return 'light';
        if (weight <= 5) return 'medium';
        if (weight <= 20) return 'heavy';
        return 'extra_heavy';
    }
} 