import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDriverByIdQuery } from '../queries/get-driver-by-id.query';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { Driver } from '../../domain/entities/driver.entity';

@QueryHandler(GetDriverByIdQuery)
export class GetDriverByIdHandler implements IQueryHandler<GetDriverByIdQuery> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository
    ) { }

    async execute(query: GetDriverByIdQuery): Promise<Driver> {
        const driver = await this.driverRepository.findById(query.driverId);

        if (!driver) {
            throw new Error(`Driver with ID ${query.driverId} not found`);
        }

        return driver;
    }
} 