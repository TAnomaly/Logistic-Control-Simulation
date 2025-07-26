import { Driver } from '../entities/driver.entity';

export class DriverCreatedEvent {
    constructor(
        public readonly driverId: string,
        public readonly name: string,
        public readonly licenseNumber: string,
        public readonly status: string,
        public readonly createdAt: Date
    ) { }

    static fromDriver(driver: Driver): DriverCreatedEvent {
        return new DriverCreatedEvent(
            driver.id,
            driver.name,
            driver.licenseNumber,
            driver.status,
            driver.createdAt
        );
    }
} 