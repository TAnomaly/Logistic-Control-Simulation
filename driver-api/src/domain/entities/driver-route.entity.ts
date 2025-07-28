import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';

export enum RouteStatus {
    PLANNED = 'planned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

@Entity('driver_routes')
export class DriverRoute {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    driverId: string;

    @ManyToOne(() => Driver, driver => driver.routes)
    @JoinColumn({ name: 'driverId' })
    driver: Driver;

    @Column({ type: 'json' })
    optimizedRoute: any; // Route optimization result

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalDistance: number;

    @Column({ type: 'int' })
    totalTime: number; // in minutes

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    fuelEstimate: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    efficiency: number;

    @Column({
        type: 'enum',
        enum: RouteStatus,
        default: RouteStatus.PLANNED
    })
    status: RouteStatus;

    @Column({ type: 'json', nullable: true })
    currentLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };

    @Column({ type: 'int', default: 0 })
    completedDeliveries: number;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 