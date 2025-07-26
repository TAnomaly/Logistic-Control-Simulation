import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';

export enum TrackingEventType {
    CREATED = 'created',
    ASSIGNED = 'assigned',
    PICKED_UP = 'picked_up',
    IN_TRANSIT = 'in_transit',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    FAILED_DELIVERY = 'failed_delivery',
    CANCELLED = 'cancelled'
}

@Entity('tracking_events')
export class TrackingEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    shipmentId: string;

    @ManyToOne(() => Shipment, shipment => shipment.trackingEvents)
    @JoinColumn({ name: 'shipmentId' })
    shipment: Shipment;

    @Column({
        type: 'enum',
        enum: TrackingEventType
    })
    eventType: TrackingEventType;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };

    @Column({ nullable: true })
    driverId: string;

    @Column({ type: 'timestamp' })
    eventTimestamp: Date;

    @CreateDateColumn()
    createdAt: Date;
} 