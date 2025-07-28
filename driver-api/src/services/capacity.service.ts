import { Injectable } from '@nestjs/common';
import { TypeOrmDriverRepository } from '../infrastructure/repositories/typeorm-driver.repository';
import { TypeOrmShipmentRepository } from '../infrastructure/repositories/typeorm-shipment.repository';

export interface CapacityCheckResult {
    canAssign: boolean;
    currentWeight: number;
    currentVolume: number;
    currentDeliveries: number;
    maxWeight: number;
    maxVolume: number;
    maxDeliveries: number;
    remainingWeight: number;
    remainingVolume: number;
    remainingDeliveries: number;
    reason?: string;
}

@Injectable()
export class CapacityService {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository,
        private readonly shipmentRepository: TypeOrmShipmentRepository
    ) { }

    async checkDriverCapacity(driverId: string, newShipmentWeight?: number, newShipmentVolume?: number): Promise<CapacityCheckResult> {
        // Get driver
        const driver = await this.driverRepository.findById(driverId);
        if (!driver) {
            return {
                canAssign: false,
                currentWeight: 0,
                currentVolume: 0,
                currentDeliveries: 0,
                maxWeight: 0,
                maxVolume: 0,
                maxDeliveries: 0,
                remainingWeight: 0,
                remainingVolume: 0,
                remainingDeliveries: 0,
                reason: 'Driver not found'
            };
        }

        // Get current assignments
        const currentShipments = await this.shipmentRepository.findByDriverId(driverId, 'assigned');

        // Calculate current usage
        const currentWeight = currentShipments.reduce((sum, shipment) => sum + Number(shipment.weight), 0);
        const currentVolume = currentShipments.reduce((sum, shipment) => sum + Number(shipment.volume), 0);
        const currentDeliveries = currentShipments.length;

        // Calculate remaining capacity
        const remainingWeight = driver.maxCapacity - currentWeight - (newShipmentWeight || 0);
        const remainingVolume = driver.maxVolume - currentVolume - (newShipmentVolume || 0);
        const remainingDeliveries = driver.maxDeliveries - currentDeliveries - 1;

        // Check if assignment is possible
        const canAssign = remainingWeight >= 0 && remainingVolume >= 0 && remainingDeliveries >= 0;

        let reason: string | undefined;
        if (!canAssign) {
            if (remainingWeight < 0) {
                reason = `Weight capacity exceeded. Available: ${driver.maxCapacity - currentWeight}kg, Required: ${newShipmentWeight}kg`;
            } else if (remainingVolume < 0) {
                reason = `Volume capacity exceeded. Available: ${driver.maxVolume - currentVolume}m³, Required: ${newShipmentVolume}m³`;
            } else if (remainingDeliveries < 0) {
                reason = `Delivery limit exceeded. Available: ${driver.maxDeliveries - currentDeliveries}, Required: 1`;
            }
        }

        return {
            canAssign,
            currentWeight,
            currentVolume,
            currentDeliveries,
            maxWeight: driver.maxCapacity,
            maxVolume: driver.maxVolume,
            maxDeliveries: driver.maxDeliveries,
            remainingWeight: Math.max(0, remainingWeight),
            remainingVolume: Math.max(0, remainingVolume),
            remainingDeliveries: Math.max(0, remainingDeliveries),
            reason
        };
    }

    async getDriverCapacityInfo(driverId: string): Promise<CapacityCheckResult> {
        return this.checkDriverCapacity(driverId);
    }
} 