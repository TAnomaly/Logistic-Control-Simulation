import { AppService } from './app.service';
interface Shipment {
    id?: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    status?: string;
    assignedDriverId?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class AppController {
    private readonly appService;
    private shipments;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    createShipment(shipmentData: Shipment): Shipment;
    getShipments(): Shipment[];
    getShipment(id: string): Shipment | {
        error: string;
    };
    assignDriver(id: string, assignmentData: {
        driverId: string;
    }): Shipment | {
        error: string;
    };
    updateStatus(id: string, statusData: {
        status: string;
    }): Shipment | {
        error: string;
    };
}
export {};
