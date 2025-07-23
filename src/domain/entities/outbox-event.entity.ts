import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * OutboxEvent - Reliable event publishing için outbox pattern implementasyonu
 * Domain event'lerin güvenilir şekilde publish edilmesini sağlar
 */
@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Event'in benzersiz identifier'ı
     */
    @Column({ unique: true })
    eventId: string;

    /**
     * Event türü
     */
    @Column()
    eventType: string;

    /**
     * Event'in ait olduğu aggregate'in ID'si
     */
    @Column()
    aggregateId: string;

    /**
     * Event verisi JSON formatında
     */
    @Column({ type: 'jsonb' })
    eventData: Record<string, any>;

    /**
     * Event'in oluşturulma zamanı
     */
    @Column({ type: 'timestamp' })
    occurredOn: Date;

    /**
     * Event'in publish edilip edilmediği
     */
    @Column({ default: false })
    isPublished: boolean;

    /**
     * Event'in publish edilme zamanı
     */
    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date | null;

    /**
     * Publish edilirken oluşan hata sayısı
     */
    @Column({ default: 0 })
    retryCount: number;

    /**
     * Son hata mesajı
     */
    @Column({ type: 'text', nullable: true })
    lastError: string | null;

    /**
     * Sonraki retry zamanı
     */
    @Column({ type: 'timestamp', nullable: true })
    nextRetryAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * Event'i publish edildi olarak işaretle
     */
    public markAsPublished(): void {
        this.isPublished = true;
        this.publishedAt = new Date();
        this.lastError = null;
        this.nextRetryAt = null;
    }

    /**
     * Publish hatası durumunda retry bilgilerini güncelle
     */
    public markRetryAttempt(error: string): void {
        this.retryCount += 1;
        this.lastError = error;

        // Exponential backoff: 2^retryCount dakika
        const delayMinutes = Math.pow(2, Math.min(this.retryCount, 10));
        this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    }

    /**
     * Event'in retry edilebilir durumda olup olmadığını kontrol et
     */
    public canRetry(): boolean {
        if (this.isPublished) return false;
        if (this.retryCount >= 10) return false; // Maksimum 10 deneme
        if (this.nextRetryAt && this.nextRetryAt > new Date()) return false;

        return true;
    }
} 