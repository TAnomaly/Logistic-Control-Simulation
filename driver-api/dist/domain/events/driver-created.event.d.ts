import { Driver } from '../entities/driver.entity';
export declare class DriverCreatedEvent {
    readonly driverId: string;
    readonly name: string;
    readonly licenseNumber: string;
    readonly status: string;
    readonly createdAt: Date;
    constructor(driverId: string, name: string, licenseNumber: string, status: string, createdAt: Date);
    static fromDriver(driver: Driver): DriverCreatedEvent;
}
