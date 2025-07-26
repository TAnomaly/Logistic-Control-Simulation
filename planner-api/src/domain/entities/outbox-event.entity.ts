import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OutboxEventStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    eventType: string;

    @Column({ type: 'jsonb' })
    eventData: any;

    @Column({
        type: 'enum',
        enum: OutboxEventStatus,
        default: OutboxEventStatus.PENDING
    })
    status: OutboxEventStatus;

    @Column({ nullable: true })
    routingKey: string;

    @Column({ nullable: true })
    exchange: string;

    @Column({ type: 'int', default: 0 })
    retryCount: number;

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 