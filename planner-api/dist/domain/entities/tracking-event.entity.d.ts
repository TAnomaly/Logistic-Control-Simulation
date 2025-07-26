import { Shipment } from './shipment.entity';
export declare enum TrackingEventType {
    CREATED = "created",
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    FAILED_DELIVERY = "failed_delivery",
    CANCELLED = "cancelled"
}
export declare class TrackingEvent {
    id: string;
    shipmentId: string;
    shipment: Shipment;
    eventType: TrackingEventType;
    description: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    driverId: string;
    eventTimestamp: Date;
    createdAt: Date;
}
