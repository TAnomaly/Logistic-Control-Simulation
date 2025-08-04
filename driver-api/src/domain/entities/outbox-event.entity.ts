import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OutboxEventStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PROCESSED = 'PROCESSED',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    eventType: string;

    @Column('json')
    eventData: any;

    @Column({ nullable: true })
    routingKey?: string;

    @Column({ nullable: true })
    exchange?: string;

    @Column({
        type: 'enum',
        enum: OutboxEventStatus,
        default: OutboxEventStatus.PENDING,
    })
    status: OutboxEventStatus;

    @Column({ nullable: true })
    errorMessage?: string;

    @Column({ default: 0 })
    retryCount: number;

    @Column({ nullable: true })
    processedAt?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 