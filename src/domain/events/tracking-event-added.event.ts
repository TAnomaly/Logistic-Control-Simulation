import { TrackingEventType } from '../value-objects/tracking-event-type.vo';

/**
 * TrackingEventAddedEvent - Yeni takip eventi eklendiğinde fırlatılan domain event
 */
export class TrackingEventAddedEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly trackingEventId: string,
        public readonly trackingNumber: string,
        public readonly gateId: string,
        public readonly eventType: TrackingEventType,
        public readonly eventTimestamp: Date,
        public readonly description?: string,
        public readonly processedBy?: string,
        public readonly occurredOn: Date = new Date(),
    ) { }

    /**
     * Event türünü döner
     */
    public getEventType(): string {
        return 'TrackingEventAdded';
    }

    /**
     * Event verilerini JSON formatında döner
     */
    public toJSON(): Record<string, any> {
        return {
            eventType: this.getEventType(),
            shipmentId: this.shipmentId,
            trackingEventId: this.trackingEventId,
            trackingNumber: this.trackingNumber,
            gateId: this.gateId,
            trackingEventType: this.eventType,
            eventTimestamp: this.eventTimestamp.toISOString(),
            description: this.description,
            processedBy: this.processedBy,
            occurredOn: this.occurredOn.toISOString(),
        };
    }

    /**
     * Event'in kritik olup olmadığını kontrol eder
     */
    public isCriticalEvent(): boolean {
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
     * Event'in müşteriye bildirilmesi gereken bir event olup olmadığını kontrol eder
     */
    public shouldNotifyCustomer(): boolean {
        const customerNotificationEvents = [
            TrackingEventType.LOADING_COMPLETED,
            TrackingEventType.OUT_FOR_DELIVERY,
            TrackingEventType.DELIVERED,
            TrackingEventType.DELIVERY_ATTEMPTED,
            TrackingEventType.DELIVERY_FAILED,
            TrackingEventType.DELAYED,
            TrackingEventType.DAMAGE_DETECTED
        ];

        return customerNotificationEvents.includes(this.eventType);
    }

    /**
     * Event'in lokasyon bilgisi gerektirip gerektirmediğini kontrol eder
     */
    public requiresLocationInfo(): boolean {
        const locationRequiredEvents = [
            TrackingEventType.ENTRY,
            TrackingEventType.EXIT,
            TrackingEventType.STORED,
            TrackingEventType.TRANSFERRED,
            TrackingEventType.OUT_FOR_DELIVERY,
            TrackingEventType.DELIVERED
        ];

        return locationRequiredEvents.includes(this.eventType);
    }
} 