import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Shipment } from './shipment.entity';

export enum AssignmentStatus {
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/**
 * Assignment (Görev) Entity - Driver'a atanan görevler
 */
@Entity('assignments')
export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    taskType: string; // Örn: 'DELIVERY', 'PICKUP', 'TRANSFER', vs.

    @ManyToOne(() => Driver, { nullable: false })
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @ManyToOne(() => Shipment, { nullable: true })
    @JoinColumn({ name: 'shipment_id' })
    shipment: Shipment;

    @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.ASSIGNED })
    status: AssignmentStatus;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    assignedAt: Date;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 