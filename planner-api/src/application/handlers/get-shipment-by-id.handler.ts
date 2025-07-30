import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentByIdQuery } from '../queries/get-shipment-by-id.query';
import { TypeOrmShipmentRepository } from '../../infrastructure/repositories/typeorm-shipment.repository';
import { Shipment } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentByIdQuery)
export class GetShipmentByIdHandler implements IQueryHandler<GetShipmentByIdQuery> {
    constructor(
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    async execute(query: GetShipmentByIdQuery): Promise<Shipment | null> {
        return await this.shipmentRepository.findById(query.id);
    }
} 