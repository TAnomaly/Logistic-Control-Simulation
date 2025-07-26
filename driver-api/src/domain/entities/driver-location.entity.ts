import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity('driver_locations')
export class DriverLocation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    driverId: string;

    @ManyToOne(() => Driver, driver => driver.locationHistory)
    @JoinColumn({ name: 'driverId' })
    driver: Driver;

    @Column({ type: 'decimal', precision: 10, scale: 8 })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8 })
    longitude: number;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'timestamp' })
    recordedAt: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    speed: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    heading: number;

    @CreateDateColumn()
    createdAt: Date;
} 