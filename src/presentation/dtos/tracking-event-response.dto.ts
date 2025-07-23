import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { TrackingEventType } from '../../domain/value-objects/tracking-event-type.vo';

/**
 * TrackingEventResponseDto - TrackingEvent entity'si için response DTO
 */
export class TrackingEventResponseDto {
    id: string;
    shipmentId: string;
    gateId: string;
    eventType: TrackingEventType;
    eventTimestamp: Date;
    description?: string;
    processedBy?: string;
    processingDurationMinutes?: number;
    measuredWeight?: number;
    temperature?: number;
    humidity?: number;
    createdAt: Date;

    // İlişkili veriler
    shipment?: {
        id: string;
        trackingNumber: string;
        status: string;
    };

    gate?: {
        id: string;
        gateCode: string;
        name: string;
        locationName: string;
        gateType: string;
    };

    constructor(trackingEvent: TrackingEvent) {
        this.id = trackingEvent.id;
        this.shipmentId = trackingEvent.shipment?.id;
        this.gateId = trackingEvent.gate?.id;
        this.eventType = trackingEvent.eventType;
        this.eventTimestamp = trackingEvent.eventTimestamp;
        this.description = trackingEvent.description;
        this.processedBy = trackingEvent.processedBy;
        this.processingDurationMinutes = trackingEvent.processingDurationMinutes;
        this.measuredWeight = trackingEvent.measuredWeight;
        this.temperature = trackingEvent.temperature;
        this.humidity = trackingEvent.humidity;
        this.createdAt = trackingEvent.createdAt;

        // İlişkili shipment verisi varsa ekle
        if (trackingEvent.shipment) {
            this.shipment = {
                id: trackingEvent.shipment.id,
                trackingNumber: trackingEvent.shipment.trackingNumber,
                status: trackingEvent.shipment.status
            };
        }

        // İlişkili gate verisi varsa ekle
        if (trackingEvent.gate) {
            this.gate = {
                id: trackingEvent.gate.id,
                gateCode: trackingEvent.gate.gateCode,
                name: trackingEvent.gate.name,
                locationName: trackingEvent.gate.locationName,
                gateType: trackingEvent.gate.gateType
            };
        }
    }

    /**
     * Event'in ne kadar süre önce gerçekleştiğini döner
     */
    getTimeAgo(): string {
        const now = new Date();
        const diffMs = now.getTime() - this.eventTimestamp.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Az önce';
        if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        return `${diffDays} gün önce`;
    }

    /**
     * Event'in kritik olup olmadığını kontrol eder
     */
    isCritical(): boolean {
        const criticalEvents = [
            TrackingEventType.DELIVERED,
            TrackingEventType.DELIVERY_FAILED,
            TrackingEventType.LOST,
            TrackingEventType.DAMAGE_DETECTED,
            TrackingEventType.CANCELLED
        ];

        return criticalEvents.includes(this.eventType);
    }

    /**
     * Event'in müşteriye gösterilip gösterilmeyeceğini kontrol eder
     */
    isCustomerVisible(): boolean {
        const customerVisibleEvents = [
            TrackingEventType.LOADING_COMPLETED,
            TrackingEventType.OUT_FOR_DELIVERY,
            TrackingEventType.DELIVERED,
            TrackingEventType.DELIVERY_ATTEMPTED,
            TrackingEventType.DELIVERY_FAILED,
            TrackingEventType.DELAYED,
            TrackingEventType.DAMAGE_DETECTED
        ];

        return customerVisibleEvents.includes(this.eventType);
    }

    /**
     * Event türü için kullanıcı dostu açıklama
     */
    getEventDescription(): string {
        const descriptions: Record<string, string> = {
            [TrackingEventType.ENTRY]: 'Kapıdan giriş yapıldı',
            [TrackingEventType.EXIT]: 'Kapıdan çıkış yapıldı',
            [TrackingEventType.SORTING]: 'Sıralama işlemi başlatıldı',
            [TrackingEventType.SORTING_COMPLETED]: 'Sıralama işlemi tamamlandı',
            [TrackingEventType.STORED]: 'Depolamaya yerleştirildi',
            [TrackingEventType.RETRIEVED_FROM_STORAGE]: 'Depodan alındı',
            [TrackingEventType.LOADING_STARTED]: 'Yükleme işlemi başladı',
            [TrackingEventType.LOADING_COMPLETED]: 'Yükleme işlemi tamamlandı',
            [TrackingEventType.TRANSFER_PREPARED]: 'Transfer için hazırlandı',
            [TrackingEventType.TRANSFERRED]: 'Transfer edildi',
            [TrackingEventType.QUALITY_CHECK]: 'Kalite kontrolü yapıldı',
            [TrackingEventType.QUALITY_CHECK_PASSED]: 'Kalite kontrolü başarılı',
            [TrackingEventType.QUALITY_CHECK_FAILED]: 'Kalite kontrolü başarısız',
            [TrackingEventType.OUT_FOR_DELIVERY]: 'Teslimat için yola çıktı',
            [TrackingEventType.DELIVERED]: 'Teslim edildi',
            [TrackingEventType.DELIVERY_FAILED]: 'Teslimat başarısız',
            [TrackingEventType.DAMAGE_DETECTED]: 'Hasar tespit edildi',
            [TrackingEventType.LOST]: 'Kayboldu',
            [TrackingEventType.FOUND]: 'Bulundu'
        };

        return descriptions[this.eventType] || this.description || 'Bilinmeyen event türü';
    }
} 