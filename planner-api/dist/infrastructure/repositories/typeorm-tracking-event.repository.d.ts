import { Repository } from 'typeorm';
import { TrackingEventRepository } from '../../domain/repositories/tracking-event.repository';
import { TrackingEvent, TrackingEventType } from '../../domain/entities/tracking-event.entity';
export declare class TypeOrmTrackingEventRepository implements TrackingEventRepository {
    private readonly repository;
    constructor(repository: Repository<TrackingEvent>);
    save(trackingEvent: TrackingEvent): Promise<TrackingEvent>;
    findById(id: string): Promise<TrackingEvent | null>;
    findByShipmentId(shipmentId: string): Promise<TrackingEvent[]>;
    findByEventType(eventType: TrackingEventType): Promise<TrackingEvent[]>;
    findByDriverId(driverId: string): Promise<TrackingEvent[]>;
    findLatestByShipmentId(shipmentId: string): Promise<TrackingEvent | null>;
    findAll(): Promise<TrackingEvent[]>;
}
