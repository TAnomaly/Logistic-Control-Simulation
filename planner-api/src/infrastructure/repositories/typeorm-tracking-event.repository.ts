import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingEvent, TrackingEventType } from '../../domain/entities/tracking-event.entity';
import { TrackingEventRepository } from '../../domain/repositories/tracking-event.repository';

@Injectable()
export class TypeOrmTrackingEventRepository implements TrackingEventRepository {
    constructor(
        @InjectRepository(TrackingEvent)
        private readonly repository: Repository<TrackingEvent>,
    ) { }

    async save(trackingEvent: TrackingEvent): Promise<TrackingEvent> {
        return this.repository.save(trackingEvent);
    }

    async findById(id: string): Promise<TrackingEvent | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findByShipmentId(shipmentId: string): Promise<TrackingEvent[]> {
        return this.repository.find({
            where: { shipment: { id: shipmentId } },
            order: { createdAt: 'ASC' }
        });
    }

    async findByEventType(eventType: TrackingEventType): Promise<TrackingEvent[]> {
        return this.repository.find({
            where: { eventType },
            relations: ['shipment']
        });
    }

    async findByDriverId(driverId: string): Promise<TrackingEvent[]> {
        return this.repository.find({
            where: { driverId },
            relations: ['shipment'],
            order: { createdAt: 'DESC' }
        });
    }

    async findLatestByShipmentId(shipmentId: string): Promise<TrackingEvent | null> {
        return this.repository.findOne({
            where: { shipment: { id: shipmentId } },
            relations: ['shipment'],
            order: { createdAt: 'DESC' }
        });
    }

    async findAll(): Promise<TrackingEvent[]> {
        return this.repository.find({ relations: ['shipment'] });
    }
} 