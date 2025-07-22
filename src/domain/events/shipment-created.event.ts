/**
 * ShipmentCreatedEvent - Yeni gönderi oluşturulduğunda fırlatılan domain event
 * Event-driven architecture ve outbox pattern için kullanılır
 */
export class ShipmentCreatedEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly trackingNumber: string,
        public readonly senderName: string,
        public readonly receiverName: string,
        public readonly weight: number,
        public readonly volume: number,
        public readonly occurredOn: Date = new Date(),
    ) { }

    /**
     * Event türünü döner
     */
    public getEventType(): string {
        return 'ShipmentCreated';
    }

    /**
     * Event verilerini JSON formatında döner
     */
    public toJSON(): Record<string, any> {
        return {
            eventType: this.getEventType(),
            shipmentId: this.shipmentId,
            trackingNumber: this.trackingNumber,
            senderName: this.senderName,
            receiverName: this.receiverName,
            weight: this.weight,
            volume: this.volume,
            occurredOn: this.occurredOn.toISOString(),
        };
    }

    /**
     * Event'in önemli alanlarından hash oluşturur
     */
    public getEventHash(): string {
        const data = `${this.shipmentId}-${this.trackingNumber}-${this.occurredOn.toISOString()}`;
        return Buffer.from(data).toString('base64');
    }
} 