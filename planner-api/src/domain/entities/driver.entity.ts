import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DriverAssignment } from './driver-assignment.entity';

export enum VehicleType {
    KAMYON = 'KAMYON',
    KAMYONET = 'KAMYONET',
    PICKUP = 'PICKUP',
    MINIBUS = 'MINIBUS'
}

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

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    licenseNumber: string;

    @Column({ type: 'varchar', length: 20 })
    phoneNumber: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    address: string;

    @Column({
        type: 'enum',
        enum: DriverStatus,
        default: DriverStatus.AVAILABLE
    })
    status: DriverStatus;

    @Column({ type: 'jsonb', nullable: true })
    currentLocation: { latitude: number; longitude: number } | null;

    @Column({ type: 'timestamp', nullable: true })
    lastActiveAt: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000.00 })
    maxCapacity: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 10.00 })
    maxVolume: string;

    @Column({ type: 'int', default: 5 })
    maxDeliveries: number;

    @Column({
        type: 'enum',
        enum: VehicleType,
        default: VehicleType.KAMYON
    })
    vehicleType: VehicleType;

    @Column({ type: 'varchar', length: 20, nullable: true })
    licensePlate: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => DriverAssignment, assignment => assignment.driver)
    assignments: DriverAssignment[];
} 