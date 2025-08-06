export class CreateShipmentCommand {
    constructor(
        public readonly trackingNumber: string,
        public readonly origin: string,
        public readonly destination: string,
        public readonly description?: string,
        public readonly weight: number = 0,
        public readonly volume: number = 0,
        public readonly estimatedDeliveryDate?: Date,
        public readonly pickupLatitude?: number,
        public readonly pickupLongitude?: number,
        public readonly deliveryLatitude?: number,
        public readonly deliveryLongitude?: number
    ) { }
} 