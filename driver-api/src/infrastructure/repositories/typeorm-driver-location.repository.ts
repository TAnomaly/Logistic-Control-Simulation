import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverLocationRepository } from '../../domain/repositories/driver-location.repository';
import { DriverLocation } from '../../domain/entities/driver-location.entity';

@Injectable()
export class TypeOrmDriverLocationRepository implements DriverLocationRepository {
    constructor(
        @InjectRepository(DriverLocation)
        private readonly repository: Repository<DriverLocation>
    ) { }

    async save(location: DriverLocation): Promise<DriverLocation> {
        return await this.repository.save(location);
    }

    async findByDriverId(driverId: string): Promise<DriverLocation[]> {
        return await this.repository.find({
            where: { driverId },
            order: { recordedAt: 'DESC' }
        });
    }

    async findLatestByDriverId(driverId: string): Promise<DriverLocation | null> {
        return await this.repository.findOne({
            where: { driverId },
            order: { recordedAt: 'DESC' }
        });
    }

    async deleteByDriverId(driverId: string): Promise<void> {
        await this.repository.delete({ driverId });
    }
} 