"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentCreatedEvent = void 0;
class ShipmentCreatedEvent {
    constructor(shipmentId, trackingNumber, origin, destination, createdAt) {
        this.shipmentId = shipmentId;
        this.trackingNumber = trackingNumber;
        this.origin = origin;
        this.destination = destination;
        this.createdAt = createdAt;
    }
    static fromShipment(shipment) {
        return new ShipmentCreatedEvent(shipment.id, shipment.trackingNumber, shipment.origin, shipment.destination, shipment.createdAt);
    }
}
exports.ShipmentCreatedEvent = ShipmentCreatedEvent;
//# sourceMappingURL=shipment-created.event.js.map