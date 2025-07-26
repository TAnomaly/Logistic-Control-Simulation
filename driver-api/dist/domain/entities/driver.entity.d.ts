import { DriverLocation } from './driver-location.entity';
export declare enum DriverStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    OFFLINE = "offline",
    ON_DELIVERY = "on_delivery"
}
export declare class Driver {
    id: string;
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    address: string;
    status: DriverStatus;
    currentLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    lastActiveAt: Date;
    locationHistory: DriverLocation[];
    createdAt: Date;
    updatedAt: Date;
}
