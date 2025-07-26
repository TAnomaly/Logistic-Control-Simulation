export declare enum AssignmentStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class DriverAssignment {
    id: string;
    driverId: string;
    shipmentId: string;
    status: AssignmentStatus;
    assignedAt: Date;
    acceptedAt: Date;
    startedAt: Date;
    completedAt: Date;
    notes: string;
    estimatedDuration: number;
    actualDuration: number;
    createdAt: Date;
    updatedAt: Date;
}
