export class CreateShipmentCommand {
    constructor(
        public readonly trackingNumber: string,
        public readonly origin: string,
        public readonly destination: string,
        public readonly description?: string,
        public readonly weight: number = 0,
        public readonly volume: number = 0,
        public readonly estimatedDeliveryDate?: Date
    ) { }
} 