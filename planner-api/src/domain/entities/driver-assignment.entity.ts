import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Shipment } from './shipment.entity';

export enum AssignmentStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

@Entity('driver_assignments')
export class DriverAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    driverId: string;

    @Column({ type: 'uuid' })
    shipmentId: string;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.PENDING
    })
    status: AssignmentStatus;

    @Column({ type: 'timestamp', nullable: true })
    assignedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Driver, driver => driver.assignments)
    @JoinColumn({ name: 'driverId' })
    driver: Driver;

    @ManyToOne(() => Shipment)
    @JoinColumn({ name: 'shipmentId' })
    shipment: Shipment;
} 