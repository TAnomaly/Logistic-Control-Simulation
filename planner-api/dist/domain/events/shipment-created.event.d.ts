import { Shipment } from '../entities/shipment.entity';
export declare class ShipmentCreatedEvent {
    readonly shipmentId: string;
    readonly trackingNumber: string;
    readonly origin: string;
    readonly destination: string;
    readonly createdAt: Date;
    constructor(shipmentId: string, trackingNumber: string, origin: string, destination: string, createdAt: Date);
    static fromShipment(shipment: Shipment): ShipmentCreatedEvent;
}
