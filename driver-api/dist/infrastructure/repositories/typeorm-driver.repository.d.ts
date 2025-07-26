import { Repository } from 'typeorm';
import { DriverRepository } from '../../domain/repositories/driver.repository';
import { Driver, DriverStatus } from '../../domain/entities/driver.entity';
export declare class TypeOrmDriverRepository implements DriverRepository {
    private readonly repository;
    constructor(repository: Repository<Driver>);
    save(driver: Driver): Promise<Driver>;
    findById(id: string): Promise<Driver | null>;
    findByLicenseNumber(licenseNumber: string): Promise<Driver | null>;
    findByStatus(status: DriverStatus): Promise<Driver[]>;
    findAll(): Promise<Driver[]>;
    delete(id: string): Promise<void>;
    updateStatus(id: string, status: DriverStatus): Promise<Driver>;
    updateLocation(id: string, latitude: number, longitude: number, address?: string): Promise<Driver>;
}
