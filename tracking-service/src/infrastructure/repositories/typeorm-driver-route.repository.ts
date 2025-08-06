import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverRouteRepository } from '../../domain/repositories/driver-route.repository';
import { DriverRoute } from '../../domain/entities/driver-route.entity';

@Injectable()
export class TypeOrmDriverRouteRepository implements DriverRouteRepository {
    constructor(
        @InjectRepository(DriverRoute)
        private readonly repository: Repository<DriverRoute>
    ) { }

    async save(driverRoute: DriverRoute): Promise<DriverRoute> {
        return await this.repository.save(driverRoute);
    }

    async findById(id: string): Promise<DriverRoute | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async findByDriverId(driverId: string): Promise<DriverRoute[]> {
        return await this.repository.find({
            where: { driverId },
            order: { createdAt: 'DESC' }
        });
    }

    async findActiveByDriverId(driverId: string): Promise<DriverRoute[]> {
        return this.repository.find({
            where: {
                driverId,
                status: 'planned'
            }
        });
    }

    async updateStatus(id: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled'): Promise<void> {
        await this.repository.update(id, { status });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async findAll(): Promise<DriverRoute[]> {
        return await this.repository.find({
            order: { createdAt: 'DESC' }
        });
    }
} 