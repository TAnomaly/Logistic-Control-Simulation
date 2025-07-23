import { ShipmentStatus } from '../value-objects/shipment-status.vo';

/**
 * ShipmentStatusUpdatedEvent - Gönderi durumu güncellendiğinde fırlatılan domain event
 */
export class ShipmentStatusUpdatedEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly trackingNumber: string,
        public readonly oldStatus: ShipmentStatus,
        public readonly newStatus: ShipmentStatus,
        public readonly updatedBy: string,
        public readonly reason?: string,
        public readonly occurredOn: Date = new Date(),
    ) { }

    /**
     * Event türünü döner
     */
    public getEventType(): string {
        return 'ShipmentStatusUpdated';
    }

    /**
     * Event verilerini JSON formatında döner
     */
    public toJSON(): Record<string, any> {
        return {
            eventType: this.getEventType(),
            shipmentId: this.shipmentId,
            trackingNumber: this.trackingNumber,
            oldStatus: this.oldStatus,
            newStatus: this.newStatus,
            updatedBy: this.updatedBy,
            reason: this.reason,
            occurredOn: this.occurredOn.toISOString(),
        };
    }

    /**
     * Durum değişikliğinin kritik olup olmadığını kontrol eder
     */
    public isCriticalStatusChange(): boolean {
        const criticalStatuses = [
            ShipmentStatus.DELIVERED,
            ShipmentStatus.CANCELLED,
            ShipmentStatus.RETURNED,
            ShipmentStatus.DELIVERY_FAILED
        ];

        return criticalStatuses.includes(this.newStatus);
    }

    /**
     * İlerleme yönünü döner
     */
    public getProgressDirection(): 'forward' | 'backward' | 'neutral' {
        const statusOrder = [
            ShipmentStatus.CREATED,
            ShipmentStatus.PICKED_UP,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.AT_DISTRIBUTION_CENTER,
            ShipmentStatus.AT_DELIVERY_GATE,
            ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.DELIVERED
        ];

        const oldIndex = statusOrder.indexOf(this.oldStatus);
        const newIndex = statusOrder.indexOf(this.newStatus);

        if (oldIndex === -1 || newIndex === -1) return 'neutral';
        if (newIndex > oldIndex) return 'forward';
        if (newIndex < oldIndex) return 'backward';
        return 'neutral';
    }
} 