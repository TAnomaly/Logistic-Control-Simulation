import { TrackingEvent } from './tracking-event.entity';
export declare enum ShipmentStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Shipment {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    description: string;
    weight: number;
    volume: number;
    status: ShipmentStatus;
    assignedDriverId: string;
    estimatedDeliveryDate: Date;
    actualDeliveryDate: Date;
    trackingEvents: TrackingEvent[];
    createdAt: Date;
    updatedAt: Date;
}
