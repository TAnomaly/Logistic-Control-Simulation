import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('driver_routes')
export class DriverRoute {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    driverId: string;

    @Column('json')
    optimizedRoute: {
        polyline: string; // H3 polyline encoded route
        waypoints: Array<{
            latitude: number;
            longitude: number;
            h3Index: string;
            shipmentId?: string;
            type: 'pickup' | 'delivery' | 'waypoint';
        }>;
        totalDistance: number; // meters
        totalDuration: number; // seconds
        optimizedOrder: string[]; // shipment ID'lerin optimize edilmiş sırası
    };

    @Column('numeric', { precision: 10, scale: 2 })
    totalDistance: number;

    @Column('int')
    totalTime: number;

    @Column('numeric', { precision: 10, scale: 2 })
    fuelEstimate: number;

    @Column('numeric', { precision: 5, scale: 2 })
    efficiency: number;

    @Column('json', { nullable: true })
    currentLocation: { latitude: number; longitude: number } | null;

    @Column('int', { default: 0 })
    completedDeliveries: number;

    @Column({
        type: 'enum',
        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
        default: 'planned'
    })
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';

    @Column({ nullable: true })
    startedAt?: Date;

    @Column({ nullable: true })
    completedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 