import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TrackingEvent } from './tracking-event.entity';
import { GateType } from '../value-objects/gate-type.vo';

/**
 * Gate (Geçit/Kapı) Entity - Lojistik ağdaki kontrol noktalarını temsil eder
 * Her gate, gönderilerin geçtiği fiziksel veya sanal kontrol noktalarıdır
 */
@Entity('gates')
export class Gate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Kapının benzersiz kodu (örn: IST-GATE-001, ANK-DIST-CENTER-EXIT)
     */
    @Column({ unique: true })
    gateCode: string;

    /**
     * Kapının insan tarafından okunabilir adı
     */
    @Column()
    name: string;

    /**
     * Kapının türü - Giriş, Çıkış, Transfer vb.
     */
    @Column({
        type: 'enum',
        enum: GateType
    })
    gateType: GateType;

    /**
     * Kapının bulunduğu lokasyon bilgileri
     */
    @Column()
    locationName: string;

    @Column()
    address: string;

    /**
     * Coğrafi koordinatlar
     */
    @Column('decimal', { precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 11, scale: 8, nullable: true })
    longitude: number;

    /**
     * Kapının aktif durumu
     */
    @Column({ default: true })
    isActive: boolean;

    /**
     * Kapının kapasitesi (saat bazında işleyebileceği gönderi sayısı)
     */
    @Column({ nullable: true })
    hourlyCapacity: number;

    /**
     * Çalışma saatleri
     */
    @Column({ nullable: true })
    operatingHoursStart: string; // Örn: "09:00"

    @Column({ nullable: true })
    operatingHoursEnd: string;   // Örn: "18:00"

    /**
     * Bu kapıdan geçen tüm tracking eventları
     */
    @OneToMany(() => TrackingEvent, trackingEvent => trackingEvent.gate)
    trackingEvents: TrackingEvent[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Kapının çalışma saatlerinde olup olmadığını kontrol eder
     */
    public isOperatingHours(time: Date = new Date()): boolean {
        if (!this.operatingHoursStart || !this.operatingHoursEnd) {
            return true; // 24 saat açık kabul et
        }

        const currentTime = time.toTimeString().slice(0, 5); // "HH:MM" formatı
        return currentTime >= this.operatingHoursStart && currentTime <= this.operatingHoursEnd;
    }

    /**
     * Kapının mevcut durumda işlem yapabilir olup olmadığını kontrol eder
     */
    public canProcessShipment(time: Date = new Date()): boolean {
        return this.isActive && this.isOperatingHours(time);
    }

    /**
     * Kapı tipine göre sonraki olası hedef kapıları belirler
     */
    public getNextPossibleGateTypes(): GateType[] {
        switch (this.gateType) {
            case GateType.ENTRY:
                return [GateType.SORTING, GateType.STORAGE];
            case GateType.SORTING:
                return [GateType.STORAGE, GateType.LOADING];
            case GateType.STORAGE:
                return [GateType.LOADING, GateType.SORTING];
            case GateType.LOADING:
                return [GateType.EXIT, GateType.TRANSFER];
            case GateType.EXIT:
                return [GateType.ENTRY]; // Başka tesiste
            case GateType.TRANSFER:
                return [GateType.ENTRY]; // Transfer sonrası giriş
            case GateType.DELIVERY:
                return []; // Terminal nokta
            default:
                return [];
        }
    }

    /**
     * İki nokta arasındaki mesafeyi hesaplar (kilometre)
     */
    public calculateDistanceTo(otherGate: Gate): number {
        if (!this.latitude || !this.longitude || !otherGate.latitude || !otherGate.longitude) {
            return 0;
        }

        const R = 6371; // Dünya yarıçapı (km)
        const dLat = this.toRadians(otherGate.latitude - this.latitude);
        const dLon = this.toRadians(otherGate.longitude - this.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(this.latitude)) * Math.cos(this.toRadians(otherGate.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
} 