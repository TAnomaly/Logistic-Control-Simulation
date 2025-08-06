import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ShipmentStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

@Entity('shipments')
export class Shipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    trackingNumber: string;

    @Column()
    origin: string;

    @Column()
    destination: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    weight: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    volume: number;

    @Column({
        type: 'enum',
        enum: ShipmentStatus,
        default: ShipmentStatus.PENDING
    })
    status: ShipmentStatus;

    // @Column({ nullable: true })
    // assignedDriverId: string;

    @Column({ type: 'timestamp', nullable: true })
    estimatedDeliveryDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    actualDeliveryDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    pickupLatitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    pickupLongitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    deliveryLatitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    deliveryLongitude: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}