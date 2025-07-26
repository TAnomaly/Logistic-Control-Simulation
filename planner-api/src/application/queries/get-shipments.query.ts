import { ShipmentStatus } from '../../domain/entities/shipment.entity';

export class GetShipmentsQuery {
    constructor(
        public readonly status?: ShipmentStatus,
        public readonly driverId?: string,
        public readonly limit?: number,
        public readonly offset?: number
    ) { }
} 