import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DriverLocation } from './driver-location.entity';

export enum DriverStatus {
    AVAILABLE = 'available',
    BUSY = 'busy',
    OFFLINE = 'offline',
    ON_DELIVERY = 'on_delivery'
}

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    licenseNumber: string;

    @Column()
    phoneNumber: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({
        type: 'enum',
        enum: DriverStatus,
        default: DriverStatus.AVAILABLE
    })
    status: DriverStatus;

    @Column({ type: 'jsonb', nullable: true })
    currentLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };

    @Column({ type: 'timestamp', nullable: true })
    lastActiveAt: Date;

    @OneToMany(() => DriverLocation, location => location.driver)
    locationHistory: DriverLocation[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 