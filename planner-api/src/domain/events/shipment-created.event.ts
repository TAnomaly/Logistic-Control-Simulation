import { Shipment } from '../entities/shipment.entity';

export class ShipmentCreatedEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly trackingNumber: string,
        public readonly origin: string,
        public readonly destination: string,
        public readonly createdAt: Date
    ) { }

    static fromShipment(shipment: Shipment): ShipmentCreatedEvent {
        return new ShipmentCreatedEvent(
            shipment.id,
            shipment.trackingNumber,
            shipment.origin,
            shipment.destination,
            shipment.createdAt
        );
    }
} 