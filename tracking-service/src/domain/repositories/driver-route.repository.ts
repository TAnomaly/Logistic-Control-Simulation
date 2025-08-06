import { DriverRoute } from '../entities/driver-route.entity';

export interface DriverRouteRepository {
    save(route: DriverRoute): Promise<DriverRoute>;
    findById(id: string): Promise<DriverRoute | null>;
    findByDriverId(driverId: string): Promise<DriverRoute[]>;
    findActiveByDriverId(driverId: string): Promise<DriverRoute[]>;
    updateStatus(id: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled'): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(): Promise<DriverRoute[]>;
} 