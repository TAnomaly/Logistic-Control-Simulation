import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery } from '../queries/get-shipments.query';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentsQuery)
export class GetShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    async execute(query: GetShipmentsQuery): Promise<Shipment[]> {
        if (query.status) {
            return await this.shipmentRepository.findByStatus(query.status);
        }

        if (query.driverId) {
            return await this.shipmentRepository.findByDriverId(query.driverId);
        }

        return await this.shipmentRepository.findAll();
    }
} 