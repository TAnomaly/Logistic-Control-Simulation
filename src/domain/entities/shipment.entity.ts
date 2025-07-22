import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TrackingEvent } from './tracking-event.entity';
import { ShipmentStatus } from '../value-objects/shipment-status.vo';

/**
 * Shipment (Gönderi) - Ana domain entity
 * Lojistik sistemde gönderilerin temel bilgilerini tutar
 */
@Entity('shipments')
export class Shipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Gönderi takip numarası - Müşterilerin takip için kullandığı benzersiz numara
     */
    @Column({ unique: true })
    trackingNumber: string;

    /**
     * Gönderici bilgileri
     */
    @Column()
    senderName: string;

    @Column()
    senderAddress: string;

    /**
     * Alıcı bilgileri  
     */
    @Column()
    receiverName: string;

    @Column()
    receiverAddress: string;

    /**
     * Gönderi durumu - Value Object olarak tanımlanır
     */
    @Column({
        type: 'enum',
        enum: ShipmentStatus,
        default: ShipmentStatus.CREATED
    })
    status: ShipmentStatus;

    /**
     * Gönderi ağırlığı (kg)
     */
    @Column('decimal', { precision: 10, scale: 2 })
    weight: number;

    /**
     * Gönderi boyutları (cm)
     */
    @Column('decimal', { precision: 10, scale: 2 })
    length: number;

    @Column('decimal', { precision: 10, scale: 2 })
    width: number;

    @Column('decimal', { precision: 10, scale: 2 })
    height: number;

    /**
 * Tahmini teslimat tarihi
 */
    @Column({ type: 'timestamp', nullable: true })
    estimatedDeliveryDate: Date | null;

    /**
 * Gerçek teslimat tarihi
 */
    @Column({ type: 'timestamp', nullable: true })
    actualDeliveryDate: Date | null;

    /**
     * Bu gönderiyle ilişkili tüm takip olayları
     */
    @OneToMany(() => TrackingEvent, trackingEvent => trackingEvent.shipment, { cascade: true })
    trackingEvents: TrackingEvent[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Gönderi durumunu güncelleyen domain method
     */
    public updateStatus(newStatus: ShipmentStatus): void {
        this.status = newStatus;
        this.updatedAt = new Date();

        // Domain event'i tetiklenebilir
        // DomainEvents.raise(new ShipmentStatusChangedEvent(this.id, newStatus));
    }

    /**
     * Teslimat işlemini tamamlayan domain method
     */
    public completeDelivery(): void {
        this.status = ShipmentStatus.DELIVERED;
        this.actualDeliveryDate = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Toplam hacmi hesaplayan business logic
     */
    public calculateVolume(): number {
        return this.length * this.width * this.height;
    }
} 