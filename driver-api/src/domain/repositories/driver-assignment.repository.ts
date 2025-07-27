import { DriverAssignment } from '../entities/driver-assignment.entity';

export interface DriverAssignmentRepository {
    save(assignment: DriverAssignment): Promise<DriverAssignment>;
    findByDriverId(driverId: string): Promise<DriverAssignment[]>;
    findByShipmentId(shipmentId: string): Promise<DriverAssignment | null>;
    findActiveByDriverId(driverId: string): Promise<DriverAssignment | null>;
    updateStatus(id: string, status: string): Promise<DriverAssignment>;
    delete(id: string): Promise<void>;
} 