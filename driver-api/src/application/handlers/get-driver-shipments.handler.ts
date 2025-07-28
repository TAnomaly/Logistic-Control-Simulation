import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDriverShipmentsQuery } from '../queries/get-driver-shipments.query';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';

export interface DriverShipmentDto {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: string;
    weight: number;
    volume: number;
    estimatedDeliveryDate: Date;
    assignedDriverId: string;
    createdAt: Date;
    updatedAt: Date;
}

@QueryHandler(GetDriverShipmentsQuery)
export class GetDriverShipmentsHandler implements IQueryHandler<GetDriverShipmentsQuery> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    async execute(query: GetDriverShipmentsQuery): Promise<DriverShipmentDto[]> {
        const shipments = await this.shipmentRepository.findByDriverId(query.driverId, query.status);

        return shipments.map(shipment => ({
            id: shipment.id,
            trackingNumber: shipment.trackingNumber,
            origin: shipment.origin,
            destination: shipment.destination,
            status: shipment.status,
            weight: shipment.weight,
            volume: shipment.volume,
            estimatedDeliveryDate: shipment.estimatedDeliveryDate,
            assignedDriverId: shipment.assignedDriverId,
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt
        }));
    }
} 