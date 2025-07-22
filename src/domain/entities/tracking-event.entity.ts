import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';
import { Gate } from './gate.entity';
import { TrackingEventType } from '../value-objects/tracking-event-type.vo';

/**
 * TrackingEvent (İzleme Olayı) Entity - Gönderilerin lojistik ağdaki hareketlerini kaydeder
 * Bu entity, bir gönderinin hangi kapıdan ne zaman geçtiğini ve ne tür bir işlem yapıldığını tutar
 */
@Entity('tracking_events')
export class TrackingEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Bu olayın ait olduğu gönderi
     */
    @ManyToOne(() => Shipment, shipment => shipment.trackingEvents, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'shipment_id' })
    shipment: Shipment;

    /**
     * Olayın gerçekleştiği kapı
     */
    @ManyToOne(() => Gate, gate => gate.trackingEvents, {
        nullable: false
    })
    @JoinColumn({ name: 'gate_id' })
    gate: Gate;

    /**
     * Olay türü - Giriş, çıkış, işleme vb.
     */
    @Column({
        type: 'enum',
        enum: TrackingEventType
    })
    eventType: TrackingEventType;

    /**
     * Olayın gerçekleştiği tarih ve saat
     */
    @Column({ type: 'timestamp' })
    eventTimestamp: Date;

    /**
     * Olay ile ilgili açıklama veya notlar
     */
    @Column({ type: 'text', nullable: true })
    description: string;

    /**
     * İşlem yapan kullanıcı veya sistem
     */
    @Column({ nullable: true })
    processedBy: string;

    /**
     * İşlem süresi (dakika cinsinden)
     */
    @Column({ nullable: true })
    processingDurationMinutes: number;

    /**
     * Gönderi ağırlığı (bu olay sırasında ölçülen)
     */
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    measuredWeight: number;

    /**
     * Sıcaklık kayıt değeri (özel gönderiler için)
     */
    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    temperature: number;

    /**
     * Nem oranı kayıt değeri (özel gönderiler için)
     */
    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    humidity: number;

    /**
     * GPS koordinatları (mobil cihazlardan alınabilir)
     */
    @Column('decimal', { precision: 10, scale: 8, nullable: true })
    gpsLatitude: number;

    @Column('decimal', { precision: 11, scale: 8, nullable: true })
    gpsLongitude: number;

    /**
     * Olayla ilgili ek JSON verileri
     */
    @Column({ type: 'jsonb', nullable: true })
    additionalData: Record<string, any>;

    /**
     * Sistem tarafından otomatik oluşturulup oluşturulmadığı
     */
    @Column({ default: false })
    isSystemGenerated: boolean;

    @CreateDateColumn()
    createdAt: Date;

    /**
     * Olayın süresini hesaplar (bir önceki olay ile arasındaki fark)
     */
    public calculateDurationFromPreviousEvent(previousEvent: TrackingEvent): number {
        if (!previousEvent) {
            return 0;
        }

        const diffMs = this.eventTimestamp.getTime() - previousEvent.eventTimestamp.getTime();
        return Math.floor(diffMs / (1000 * 60)); // Dakika cinsinden
    }

    /**
     * Olayın coğrafi lokasyonu ile kayıtlı gate lokasyonu arasındaki farkı kontrol eder
     */
    public validateLocationAccuracy(): { isAccurate: boolean; distanceKm?: number } {
        if (!this.gpsLatitude || !this.gpsLongitude || !this.gate.latitude || !this.gate.longitude) {
            return { isAccurate: true }; // GPS verisi yoksa geçerli kabul et
        }

        const distance = this.calculateDistance(
            this.gpsLatitude,
            this.gpsLongitude,
            this.gate.latitude,
            this.gate.longitude
        );

        // 1 km'den fazla farklılık varsa hatalı kabul et
        const isAccurate = distance <= 1.0;

        return {
            isAccurate,
            distanceKm: distance
        };
    }

    /**
     * İki GPS koordinatı arasındaki mesafeyi hesaplar
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Dünya yarıçapı (km)
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Olayın iş kurallarına uygun olup olmadığını kontrol eder
     */
    public validateBusinessRules(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Gelecek tarihli olay kontrolü
        if (this.eventTimestamp > new Date()) {
            errors.push('Olay tarihi gelecekte olamaz');
        }

        // İşlem süresinin mantıklılık kontrolü
        if (this.processingDurationMinutes && this.processingDurationMinutes < 0) {
            errors.push('İşlem süresi negatif olamaz');
        }

        if (this.processingDurationMinutes && this.processingDurationMinutes > 1440) { // 24 saat
            errors.push('İşlem süresi 24 saati geçemez');
        }

        // Ağırlık kontrolü
        if (this.measuredWeight && this.measuredWeight <= 0) {
            errors.push('Ölçülen ağırlık pozitif olmalıdır');
        }

        // Sıcaklık kontrolü
        if (this.temperature && (this.temperature < -50 || this.temperature > 70)) {
            errors.push('Sıcaklık değeri -50°C ile 70°C arasında olmalıdır');
        }

        // Nem oranı kontrolü
        if (this.humidity && (this.humidity < 0 || this.humidity > 100)) {
            errors.push('Nem oranı 0% ile 100% arasında olmalıdır');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
} 