import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AssignmentStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

@Entity('driver_assignments')
export class DriverAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    driverId: string;

    @Column()
    shipmentId: string;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.PENDING
    })
    status: AssignmentStatus;

    @Column({ type: 'timestamp' })
    assignedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    acceptedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    estimatedDuration: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    actualDuration: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 