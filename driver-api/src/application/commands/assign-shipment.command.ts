export class AssignShipmentCommand {
    constructor(
        public readonly driverId: string,
        public readonly shipmentId: string,
        public readonly estimatedDuration?: number,
        public readonly notes?: string
    ) { }
} 