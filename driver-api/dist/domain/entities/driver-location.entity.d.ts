import { Driver } from './driver.entity';
export declare class DriverLocation {
    id: string;
    driverId: string;
    driver: Driver;
    latitude: number;
    longitude: number;
    address: string;
    recordedAt: Date;
    speed: number;
    heading: number;
    createdAt: Date;
}
