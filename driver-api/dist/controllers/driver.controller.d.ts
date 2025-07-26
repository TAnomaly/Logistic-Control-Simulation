import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Driver, DriverStatus } from '../domain/entities/driver.entity';
export declare class CreateDriverDto {
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    address?: string;
}
export declare class UpdateLocationDto {
    latitude: number;
    longitude: number;
    address?: string;
    speed?: number;
    heading?: number;
}
export declare class DriverController {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    createDriver(dto: CreateDriverDto): Promise<Driver>;
    updateLocation(id: string, dto: UpdateLocationDto): Promise<Driver>;
    getDrivers(status?: DriverStatus): Promise<Driver[]>;
    getAvailableDrivers(): Promise<Driver[]>;
}
