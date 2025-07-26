export class ShipmentAssignedEvent {
    constructor(
        public readonly shipmentId: string,
        public readonly driverId: string,
        public readonly assignedAt: Date
    ) { }
} 