import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetShipmentByIdQuery } from '../queries/get-shipment-by-id.query';
import { Shipment } from '../../domain/entities/shipment.entity';

@QueryHandler(GetShipmentByIdQuery)
export class GetShipmentByIdHandler implements IQueryHandler<GetShipmentByIdQuery> {
    constructor() { }

    async execute(query: GetShipmentByIdQuery): Promise<Shipment | null> {
        // For now, return null
        console.log(`Getting shipment by id: ${query.id}`);
        return null;
    }
} 