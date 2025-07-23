import { Controller, Get, Post, Put, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../../domain/entities/driver.entity';

@Controller('api/drivers')
export class DriverController {
    constructor(
        @InjectRepository(Driver)
        private readonly driverRepository: Repository<Driver>,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createDriver(@Body() body: Partial<Driver>): Promise<Driver> {
        const driver = this.driverRepository.create(body);
        return await this.driverRepository.save(driver);
    }

    @Get()
    async getDrivers(): Promise<Driver[]> {
        return await this.driverRepository.find();
    }

    @Get(':id')
    async getDriverById(@Param('id') id: string): Promise<Driver> {
        return await this.driverRepository.findOneByOrFail({ id });
    }

    @Put(':id')
    async updateDriver(@Param('id') id: string, @Body() body: Partial<Driver>): Promise<Driver> {
        await this.driverRepository.update(id, body);
        return await this.driverRepository.findOneByOrFail({ id });
    }

    @Put(':id/location')
    async updateLocation(
        @Param('id') id: string,
        @Body() body: { latitude: number; longitude: number }
    ): Promise<Driver> {
        await this.driverRepository.update(id, {
            lastLatitude: body.latitude,
            lastLongitude: body.longitude,
            lastLocationUpdate: new Date(),
        });
        return await this.driverRepository.findOneByOrFail({ id });
    }
} 