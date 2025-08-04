import { Injectable } from '@nestjs/common';
import { TrackingEvent, TrackingEventType } from '../../domain/entities/tracking-event.entity';
import { TrackingEventRepository } from '../../domain/repositories/tracking-event.repository';

@Injectable()
export class TypeOrmTrackingEventRepository implements TrackingEventRepository {
    private trackingEvents: TrackingEvent[] = [];

    constructor() { }

    async save(trackingEvent: TrackingEvent): Promise<TrackingEvent> {
        if (!trackingEvent.id) {
            trackingEvent.id = Math.random().toString(36).substr(2, 9);
            trackingEvent.createdAt = new Date();
        }
        // trackingEvent.updatedAt = new Date(); // TrackingEvent doesn't have updatedAt

        const existingIndex = this.trackingEvents.findIndex(e => e.id === trackingEvent.id);
        if (existingIndex >= 0) {
            this.trackingEvents[existingIndex] = trackingEvent;
        } else {
            this.trackingEvents.push(trackingEvent);
        }

        return trackingEvent;
    }

    async findById(id: string): Promise<TrackingEvent | null> {
        return this.trackingEvents.find(e => e.id === id) || null;
    }

    async findByShipmentId(shipmentId: string): Promise<TrackingEvent[]> {
        return this.trackingEvents
            .filter(e => e.shipmentId === shipmentId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    async findByEventType(eventType: TrackingEventType): Promise<TrackingEvent[]> {
        return this.trackingEvents.filter(e => e.eventType === eventType);
    }

    async findByDriverId(driverId: string): Promise<TrackingEvent[]> {
        return this.trackingEvents
            .filter(e => e.driverId === driverId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async findLatestByShipmentId(shipmentId: string): Promise<TrackingEvent | null> {
        const events = this.trackingEvents
            .filter(e => e.shipmentId === shipmentId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return events[0] || null;
    }

    async findAll(): Promise<TrackingEvent[]> {
        return [...this.trackingEvents];
    }
} 