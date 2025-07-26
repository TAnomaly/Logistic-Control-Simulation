import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDriversQuery } from '../queries/get-drivers.query';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { Driver } from '../../domain/entities/driver.entity';

@QueryHandler(GetDriversQuery)
export class GetDriversHandler implements IQueryHandler<GetDriversQuery> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository
    ) { }

    async execute(query: GetDriversQuery): Promise<Driver[]> {
        if (query.status) {
            return await this.driverRepository.findByStatus(query.status);
        }

        return await this.driverRepository.findAll();
    }
} 