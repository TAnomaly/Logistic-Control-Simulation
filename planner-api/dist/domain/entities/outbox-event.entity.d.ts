export declare enum OutboxEventStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class OutboxEvent {
    id: string;
    eventType: string;
    eventData: any;
    status: OutboxEventStatus;
    routingKey: string;
    exchange: string;
    retryCount: number;
    processedAt: Date;
    errorMessage: string;
    createdAt: Date;
    updatedAt: Date;
}
