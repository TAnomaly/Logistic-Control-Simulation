import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Driver (Sürücü) Entity - Araç kullanan ve teslimat yapan personel
 */
@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ unique: true })
    licensePlate: string;

    @Column({ default: true })
    isActive: boolean;

    @Column('decimal', { precision: 10, scale: 8, nullable: true })
    lastLatitude: number;

    @Column('decimal', { precision: 11, scale: 8, nullable: true })
    lastLongitude: number;

    @Column({ type: 'timestamp', nullable: true })
    lastLocationUpdate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 