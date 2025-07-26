import { AppService } from './app.service';
interface Driver {
    id?: string;
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    address?: string;
    status?: string;
    currentLocation?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class AppController {
    private readonly appService;
    private drivers;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    createDriver(driverData: Driver): Driver;
    getDrivers(): Driver[];
    getDriver(id: string): Driver | {
        error: string;
    };
    updateDriverLocation(id: string, locationData: {
        latitude: number;
        longitude: number;
        address?: string;
    }): Driver | {
        error: string;
    };
}
export {};
