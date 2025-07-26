export declare class ShipmentAssignedEvent {
    readonly shipmentId: string;
    readonly driverId: string;
    readonly assignedAt: Date;
    constructor(shipmentId: string, driverId: string, assignedAt: Date);
}
