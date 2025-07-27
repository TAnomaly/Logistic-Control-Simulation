import { DriverLocation } from '../entities/driver-location.entity';

export interface DriverLocationRepository {
    save(location: DriverLocation): Promise<DriverLocation>;
    findByDriverId(driverId: string): Promise<DriverLocation[]>;
    findLatestByDriverId(driverId: string): Promise<DriverLocation | null>;
    deleteByDriverId(driverId: string): Promise<void>;
} 