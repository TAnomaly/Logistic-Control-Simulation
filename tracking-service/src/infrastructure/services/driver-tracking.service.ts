import { Injectable, Logger } from '@nestjs/common';
import { DriverTrackingRepository } from '../../domain/repositories/driver-tracking.repository';
import { DriverLocation, DriverPolyline, ActiveDriver, DriverStatus } from '../../domain/entities/driver-track.entity';
import { createClient } from 'redis';

@Injectable()
export class DriverTrackingService implements DriverTrackingRepository {
    private readonly logger = new Logger(DriverTrackingService.name);
    private readonly redis = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379'
    });

    constructor() {
        this.redis.connect().catch(err => {
            this.logger.error('Failed to connect to Redis:', err);
        });
    }

    async saveDriverLocation(driverId: string, location: DriverLocation): Promise<void> {
        try {
            // Get existing polyline or create new one
            let polyline = await this.getDriverPolyline(driverId);

            if (!polyline) {
                polyline = new DriverPolyline(
                    driverId,
                    [],
                    0,
                    location.timestamp,
                    location.timestamp,
                    true
                );
            }

            // Add new location to polyline
            const updatedPolyline = polyline.addLocation(location);

            // Save to Redis
            const polylineKey = `driver:${driverId}:polyline`;
            await this.redis.set(polylineKey, JSON.stringify(updatedPolyline));

            // Update active drivers list
            await this.updateActiveDriver(driverId, location, updatedPolyline);

            this.logger.log(`📍 Location updated for driver ${driverId}: ${location.coordinates.latitude}, ${location.coordinates.longitude}`);
        } catch (error) {
            this.logger.error(`Failed to save driver location: ${error.message}`);
            throw error;
        }
    }

    async getDriverPolyline(driverId: string): Promise<DriverPolyline | null> {
        try {
            const polylineKey = `driver:${driverId}:polyline`;
            const polylineData = await this.redis.get(polylineKey);

            if (!polylineData) return null;

            const data = JSON.parse(polylineData);
            return new DriverPolyline(
                data.driverId,
                data.locations.map(loc => new DriverLocation(
                    loc.driverId,
                    loc.coordinates,
                    new Date(loc.timestamp),
                    loc.speed,
                    loc.heading,
                    loc.accuracy
                )),
                data.totalDistance,
                new Date(data.startTime),
                new Date(data.lastUpdateTime),
                data.isActive
            );
        } catch (error) {
            this.logger.error(`Failed to get driver polyline: ${error.message}`);
            return null;
        }
    }

    async getAllActiveDrivers(): Promise<ActiveDriver[]> {
        try {
            const activeDriversKey = 'active_drivers';
            const activeDriversData = await this.redis.get(activeDriversKey);

            if (!activeDriversData) return [];

            const drivers = JSON.parse(activeDriversData);
            return drivers.map(driver => new ActiveDriver(
                driver.driverId,
                driver.name,
                driver.licenseNumber,
                new DriverLocation(
                    driver.currentLocation.driverId,
                    driver.currentLocation.coordinates,
                    new Date(driver.currentLocation.timestamp),
                    driver.currentLocation.speed,
                    driver.currentLocation.heading,
                    driver.currentLocation.accuracy
                ),
                driver.polyline,
                driver.status,
                new Date(driver.lastActiveAt)
            ));
        } catch (error) {
            this.logger.error(`Failed to get active drivers: ${error.message}`);
            return [];
        }
    }

    async getDriverById(driverId: string): Promise<ActiveDriver | null> {
        try {
            const activeDrivers = await this.getAllActiveDrivers();
            return activeDrivers.find(driver => driver.driverId === driverId) || null;
        } catch (error) {
            this.logger.error(`Failed to get driver by ID: ${error.message}`);
            return null;
        }
    }

    async updateDriverStatus(driverId: string, status: string): Promise<void> {
        try {
            const driver = await this.getDriverById(driverId);
            if (!driver) return;

            const updatedDriver = new ActiveDriver(
                driver.driverId,
                driver.name,
                driver.licenseNumber,
                driver.currentLocation,
                driver.polyline,
                status as DriverStatus,
                new Date()
            );

            await this.updateActiveDriverInList(driverId, updatedDriver);
            this.logger.log(`🔄 Status updated for driver ${driverId}: ${status}`);
        } catch (error) {
            this.logger.error(`Failed to update driver status: ${error.message}`);
            throw error;
        }
    }

    async removeDriver(driverId: string): Promise<void> {
        try {
            const polylineKey = `driver:${driverId}:polyline`;
            await this.redis.del(polylineKey);

            const activeDrivers = await this.getAllActiveDrivers();
            const filteredDrivers = activeDrivers.filter(driver => driver.driverId !== driverId);

            const activeDriversKey = 'active_drivers';
            await this.redis.set(activeDriversKey, JSON.stringify(filteredDrivers));

            this.logger.log(`🗑️ Driver ${driverId} removed from tracking`);
        } catch (error) {
            this.logger.error(`Failed to remove driver: ${error.message}`);
            throw error;
        }
    }

    private async updateActiveDriver(driverId: string, location: DriverLocation, polyline: DriverPolyline): Promise<void> {
        try {
            // Get driver info from Driver API (simulated for now)
            const driverInfo = await this.getDriverInfo(driverId);

            const activeDriver = new ActiveDriver(
                driverId,
                driverInfo.name,
                driverInfo.licenseNumber,
                location,
                polyline,
                DriverStatus.AVAILABLE,
                new Date()
            );

            await this.updateActiveDriverInList(driverId, activeDriver);
        } catch (error) {
            this.logger.error(`Failed to update active driver: ${error.message}`);
        }
    }

    private async updateActiveDriverInList(driverId: string, updatedDriver: ActiveDriver): Promise<void> {
        try {
            const activeDrivers = await this.getAllActiveDrivers();
            const existingIndex = activeDrivers.findIndex(driver => driver.driverId === driverId);

            if (existingIndex >= 0) {
                activeDrivers[existingIndex] = updatedDriver;
            } else {
                activeDrivers.push(updatedDriver);
            }

            const activeDriversKey = 'active_drivers';
            await this.redis.set(activeDriversKey, JSON.stringify(activeDrivers));
        } catch (error) {
            this.logger.error(`Failed to update active driver in list: ${error.message}`);
        }
    }

    private async getDriverInfo(driverId: string): Promise<{ name: string; licenseNumber: string }> {
        // Simulated driver info - in real implementation, this would call Driver API
        return {
            name: `Driver ${driverId}`,
            licenseNumber: `LIC-${driverId}`
        };
    }
} 