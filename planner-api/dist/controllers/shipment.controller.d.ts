import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Shipment, ShipmentStatus } from '../domain/entities/shipment.entity';
export declare class CreateShipmentDto {
    trackingNumber: string;
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    estimatedDeliveryDate?: Date;
}
export declare class AssignShipmentDto {
    driverId: string;
}
export declare class ShipmentController {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    createShipment(dto: CreateShipmentDto): Promise<Shipment>;
    assignShipment(id: string, dto: AssignShipmentDto): Promise<Shipment>;
    getShipments(status?: ShipmentStatus, driverId?: string): Promise<Shipment[]>;
    getShipmentById(id: string): Promise<Shipment | null>;
    getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
}
