"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateShipmentCommand = void 0;
class CreateShipmentCommand {
    constructor(trackingNumber, origin, destination, description, weight = 0, volume = 0, estimatedDeliveryDate) {
        this.trackingNumber = trackingNumber;
        this.origin = origin;
        this.destination = destination;
        this.description = description;
        this.weight = weight;
        this.volume = volume;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }
}
exports.CreateShipmentCommand = CreateShipmentCommand;
//# sourceMappingURL=create-shipment.command.js.map