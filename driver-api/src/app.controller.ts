import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { AppService } from './app.service';

interface Driver {
    id?: string;
    name: string;
    licenseNumber: string;
    phoneNumber: string;
    address?: string;
    status?: string;
    currentLocation?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

@Controller()
export class AppController {
    private drivers: Driver[] = [];

    constructor(private readonly appService: AppService) { }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('health')
    getHealth(): { status: string; timestamp: string } {
        return this.appService.getHealth();
    }

    @Post('drivers')
    createDriver(@Body() driverData: Driver): Driver {
        const newDriver: Driver = {
            id: Date.now().toString(),
            name: driverData.name,
            licenseNumber: driverData.licenseNumber,
            phoneNumber: driverData.phoneNumber,
            address: driverData.address,
            status: 'AVAILABLE',
            currentLocation: {
                latitude: 0,
                longitude: 0,
                address: ''
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.drivers.push(newDriver);
        console.log(`🚗 Driver created: ${newDriver.name} (${newDriver.licenseNumber})`);

        return newDriver;
    }

    @Get('drivers')
    getDrivers(): Driver[] {
        return this.drivers;
    }

    @Get('drivers/:id')
    getDriver(@Param('id') id: string): Driver | { error: string } {
        const driver = this.drivers.find(d => d.id === id);
        if (!driver) {
            return { error: 'Driver not found' };
        }
        return driver;
    }

    @Put('drivers/:id/location')
    updateDriverLocation(
        @Param('id') id: string,
        @Body() locationData: { latitude: number; longitude: number; address?: string }
    ): Driver | { error: string } {
        const driver = this.drivers.find(d => d.id === id);
        if (!driver) {
            return { error: 'Driver not found' };
        }

        driver.currentLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address || ''
        };
        driver.updatedAt = new Date();

        console.log(`📍 Driver location updated: ${driver.name} at ${locationData.latitude}, ${locationData.longitude}`);

        return driver;
    }
} 