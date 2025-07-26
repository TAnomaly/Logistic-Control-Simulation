import { ShipmentStatus } from '../../domain/entities/shipment.entity';
export declare class GetShipmentsQuery {
    readonly status?: ShipmentStatus | undefined;
    readonly driverId?: string | undefined;
    readonly limit?: number | undefined;
    readonly offset?: number | undefined;
    constructor(status?: ShipmentStatus | undefined, driverId?: string | undefined, limit?: number | undefined, offset?: number | undefined);
}
