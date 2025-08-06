import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../domain/entities/driver.entity';
import { DriverAssignment } from '../domain/entities/driver-assignment.entity';
import { Shipment } from '../domain/entities/shipment.entity';
import { DriverRoute } from '../domain/entities/driver-route.entity';
import { RouteStatus } from '../domain/entities/driver-route.entity';

@Injectable()
export class DriverService {
    constructor(
        @InjectRepository(Driver) private driverRepo: Repository<Driver>,
        @InjectRepository(DriverAssignment) private assignmentRepo: Repository<DriverAssignment>,
        @InjectRepository(Shipment) private shipmentRepo: Repository<Shipment>,
        @InjectRepository(DriverRoute) private routeRepo: Repository<DriverRoute>,
    ) { }

    async getDriverShipments(driverId: string) {
        try {
            // Aktif ve geçmiş tüm atamalar
            const assignments = await this.assignmentRepo.find({ where: { driverId } });

            if (assignments.length === 0) {
                return [];
            }

            const shipmentIds = assignments.map(a => a.shipmentId);
            const shipments = await this.shipmentRepo.find({
                where: shipmentIds.map(id => ({ id }))
            });

            return shipments;
        } catch (error) {
            console.error(`❌ getDriverShipments error for driver ${driverId}:`, error);
            return [];
        }
    }

    async getDriverOptimizedRoute(driverId: string) {
        // En güncel planned/in_progress route
        const route = await this.routeRepo.findOne({ where: { driverId, status: RouteStatus.PLANNED } });
        return route;
    }

    async getDriverProfile(driverId: string) {
        return await this.driverRepo.findOne({ where: { id: driverId } });
    }
}