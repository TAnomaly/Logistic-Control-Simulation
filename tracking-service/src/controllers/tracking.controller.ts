import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { DriverTrackingService } from '../infrastructure/services/driver-tracking.service';

@Controller()
export class TrackingController {
    constructor(private readonly driverTrackingService: DriverTrackingService) { }

    @Get('health')
    async healthCheck() {
        return {
            status: 'healthy',
            service: 'Driver Tracking Service',
            timestamp: new Date().toISOString(),
            features: [
                'Real-time Driver Tracking',
                'Polyline Management',
                'WebSocket Updates',
                'Redis Storage',
                'RabbitMQ Integration'
            ]
        };
    }

    @Get('drivers')
    async getAllActiveDrivers() {
        try {
            const drivers = await this.driverTrackingService.getAllActiveDrivers();
            return {
                drivers,
                count: drivers.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get active drivers: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('drivers/:driverId')
    async getDriverById(@Param('driverId') driverId: string) {
        try {
            const driver = await this.driverTrackingService.getDriverById(driverId);
            if (!driver) {
                throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
            }
            return driver;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                `Failed to get driver: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('drivers/:driverId/polyline')
    async getDriverPolyline(@Param('driverId') driverId: string) {
        try {
            const polyline = await this.driverTrackingService.getDriverPolyline(driverId);
            if (!polyline) {
                throw new HttpException('Polyline not found', HttpStatus.NOT_FOUND);
            }
            return {
                driverId,
                polyline: polyline.getPolylineString(),
                totalDistance: polyline.totalDistance,
                startTime: polyline.startTime,
                lastUpdateTime: polyline.lastUpdateTime,
                locationCount: polyline.locations.length,
                averageSpeed: polyline.getAverageSpeed()
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                `Failed to get driver polyline: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('drivers/:driverId/status')
    async updateDriverStatus(
        @Param('driverId') driverId: string,
        @Body() body: { status: string }
    ) {
        try {
            await this.driverTrackingService.updateDriverStatus(driverId, body.status);
            return {
                message: 'Driver status updated successfully',
                driverId,
                status: body.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new HttpException(
                `Failed to update driver status: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
} 