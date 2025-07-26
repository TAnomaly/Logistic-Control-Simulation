import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverRepository } from '../../domain/repositories/driver.repository';
import { Driver, DriverStatus } from '../../domain/entities/driver.entity';

@Injectable()
export class TypeOrmDriverRepository implements DriverRepository {
    constructor(
        @InjectRepository(Driver)
        private readonly repository: Repository<Driver>
    ) { }

    async save(driver: Driver): Promise<Driver> {
        return await this.repository.save(driver);
    }

    async findById(id: string): Promise<Driver | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['locationHistory']
        });
    }

    async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
        return await this.repository.findOne({
            where: { licenseNumber },
            relations: ['locationHistory']
        });
    }

    async findByStatus(status: DriverStatus): Promise<Driver[]> {
        return await this.repository.find({
            where: { status },
            relations: ['locationHistory']
        });
    }

    async findAll(): Promise<Driver[]> {
        return await this.repository.find({
            relations: ['locationHistory']
        });
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
        await this.repository.update(id, {
            status,
            lastActiveAt: new Date()
        });
        const driver = await this.findById(id);
        if (!driver) {
            throw new Error('Driver not found');
        }
        return driver;
    }

    async updateLocation(id: string, latitude: number, longitude: number, address?: string): Promise<Driver> {
        const currentLocation = {
            latitude,
            longitude,
            address: address || ''
        };

        await this.repository.update(id, {
            currentLocation,
            lastActiveAt: new Date()
        });

        const driver = await this.findById(id);
        if (!driver) {
            throw new Error('Driver not found');
        }
        return driver;
    }
} 