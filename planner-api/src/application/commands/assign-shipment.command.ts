export class AssignShipmentCommand {
    constructor(
        public readonly shipmentId: string,
        public readonly driverId: string
    ) { }
} 