import { DriverLocation, DriverPolyline, ActiveDriver } from '../entities/driver-track.entity';

export interface DriverTrackingRepository {
    saveDriverLocation(driverId: string, location: DriverLocation): Promise<void>;
    getDriverPolyline(driverId: string): Promise<DriverPolyline | null>;
    getAllActiveDrivers(): Promise<ActiveDriver[]>;
    getDriverById(driverId: string): Promise<ActiveDriver | null>;
    updateDriverStatus(driverId: string, status: string): Promise<void>;
    removeDriver(driverId: string): Promise<void>;
} 