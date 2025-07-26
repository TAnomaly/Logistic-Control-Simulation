import { TrackingEvent, TrackingEventType } from '../entities/tracking-event.entity';
export interface TrackingEventRepository {
    save(trackingEvent: TrackingEvent): Promise<TrackingEvent>;
    findById(id: string): Promise<TrackingEvent | null>;
    findByShipmentId(shipmentId: string): Promise<TrackingEvent[]>;
    findByEventType(eventType: TrackingEventType): Promise<TrackingEvent[]>;
    findByDriverId(driverId: string): Promise<TrackingEvent[]>;
    findLatestByShipmentId(shipmentId: string): Promise<TrackingEvent | null>;
    findAll(): Promise<TrackingEvent[]>;
}
