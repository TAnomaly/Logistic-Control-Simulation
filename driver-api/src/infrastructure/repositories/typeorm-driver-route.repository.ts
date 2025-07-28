import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverRoute, RouteStatus } from '../../domain/entities/driver-route.entity';

@Injectable()
export class TypeOrmDriverRouteRepository {
    constructor(
        @InjectRepository(DriverRoute)
        private readonly repository: Repository<DriverRoute>
    ) { }

    async save(route: DriverRoute): Promise<DriverRoute> {
        return await this.repository.save(route);
    }

    async findById(id: string): Promise<DriverRoute | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['driver']
        });
    }

    async findByDriverId(driverId: string): Promise<DriverRoute[]> {
        return await this.repository.find({
            where: { driverId },
            relations: ['driver'],
            order: { createdAt: 'DESC' }
        });
    }

    async findActiveRouteByDriverId(driverId: string): Promise<DriverRoute | null> {
        return await this.repository.findOne({
            where: {
                driverId,
                status: RouteStatus.IN_PROGRESS
            },
            relations: ['driver']
        });
    }

    async updateStatus(id: string, status: RouteStatus): Promise<void> {
        await this.repository.update(id, { status });
    }

    async updateCurrentLocation(id: string, latitude: number, longitude: number, address: string): Promise<void> {
        await this.repository.update(id, {
            currentLocation: { latitude, longitude, address }
        });
    }

    async incrementCompletedDeliveries(id: string): Promise<void> {
        await this.repository.increment({ id }, 'completedDeliveries', 1);
    }

    async startRoute(id: string): Promise<void> {
        await this.repository.update(id, {
            status: RouteStatus.IN_PROGRESS,
            startedAt: new Date()
        });
    }

    async completeRoute(id: string): Promise<void> {
        await this.repository.update(id, {
            status: RouteStatus.COMPLETED,
            completedAt: new Date()
        });
    }
} 