import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus, VehicleType } from '../../domain/entities/driver.entity';
import { DriverAssignment, AssignmentStatus } from '../../domain/entities/driver-assignment.entity';
import { Shipment } from '../../domain/entities/shipment.entity';

interface CreateDriverData {
    name: string;
    phoneNumber: string;
    vehicleType: string;
    licensePlate?: string;
    address?: string;
    currentLocation?: {
        latitude: number;
        longitude: number;
    };
}

interface AssignmentData {
    assignedAt: Date;
    notes?: string;
}

@Injectable()
export class DriverService {
    constructor(
        @InjectRepository(Driver)
        private readonly driverRepository: Repository<Driver>,
        @InjectRepository(DriverAssignment)
        private readonly assignmentRepository: Repository<DriverAssignment>,
        @InjectRepository(Shipment)
        private readonly shipmentRepository: Repository<Shipment>
    ) { }

    /**
     * Yeni sürücü oluştur
     */
    async createDriver(data: CreateDriverData): Promise<Driver> {
        console.log(`🚗 Sürücü oluşturuluyor: ${data.name}`);

        // Benzersiz lisans numarası oluştur
        const licenseNumber = `DRV${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const driver = this.driverRepository.create({
            name: data.name,
            phoneNumber: data.phoneNumber,
            licenseNumber: licenseNumber,
            vehicleType: data.vehicleType as VehicleType,
            licensePlate: data.licensePlate,
            address: data.address,
            status: DriverStatus.AVAILABLE,
            currentLocation: data.currentLocation ? {
                latitude: data.currentLocation.latitude,
                longitude: data.currentLocation.longitude
            } : null,
            lastActiveAt: new Date()
        });

        const savedDriver = await this.driverRepository.save(driver);
        console.log(`✅ Sürücü oluşturuldu: ${savedDriver.id}`);

        return savedDriver;
    }

    /**
     * Tüm sürücüleri getir
     */
    async getAllDrivers(): Promise<Driver[]> {
        return await this.driverRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * ID'ye göre sürücü getir
     */
    async getDriverById(id: string): Promise<Driver | null> {
        return await this.driverRepository.findOne({
            where: { id },
            relations: ['assignments', 'assignments.shipment']
        });
    }

    /**
     * Sürücüye sipariş ata
     */
    async assignShipmentToDriver(
        driverId: string,
        shipmentId: string,
        assignmentData: AssignmentData
    ): Promise<DriverAssignment> {
        console.log(`📦 Sürücü ${driverId}'ye sipariş ${shipmentId} atanıyor`);

        // Sürücüyü kontrol et
        const driver = await this.driverRepository.findOne({
            where: { id: driverId }
        });

        if (!driver) {
            throw new Error(`Sürücü bulunamadı: ${driverId}`);
        }

        // Siparişi kontrol et
        const shipment = await this.shipmentRepository.findOne({
            where: { id: shipmentId }
        });

        if (!shipment) {
            throw new Error(`Sipariş bulunamadı: ${shipmentId}`);
        }

        // Mevcut atama var mı kontrol et
        const existingAssignment = await this.assignmentRepository.findOne({
            where: { shipmentId }
        });

        if (existingAssignment) {
            throw new Error(`Sipariş zaten atanmış: ${shipmentId}`);
        }

        // Yeni atama oluştur
        const assignment = this.assignmentRepository.create({
            driverId,
            shipmentId,
            status: AssignmentStatus.ASSIGNED,
            assignedAt: assignmentData.assignedAt,
            notes: assignmentData.notes
        });

        const savedAssignment = await this.assignmentRepository.save(assignment);

        // Sürücü durumunu güncelle
        await this.driverRepository.update(driverId, {
            status: DriverStatus.BUSY
        });

        console.log(`✅ Sipariş atandı: ${savedAssignment.id}`);

        return savedAssignment;
    }

    /**
     * Sürücünün atamalarını getir
     */
    async getDriverAssignments(driverId: string): Promise<DriverAssignment[]> {
        return await this.assignmentRepository.find({
            where: { driverId },
            relations: ['shipment'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Sürücü konumunu güncelle
     */
    async updateDriverLocation(
        driverId: string,
        latitude: number,
        longitude: number
    ): Promise<Driver> {
        console.log(`📍 Sürücü ${driverId} konumu güncelleniyor: ${latitude}, ${longitude}`);

        const driver = await this.driverRepository.findOne({
            where: { id: driverId }
        });

        if (!driver) {
            throw new Error(`Sürücü bulunamadı: ${driverId}`);
        }

        driver.currentLocation = { latitude, longitude };
        driver.lastActiveAt = new Date();

        const updatedDriver = await this.driverRepository.save(driver);
        console.log(`✅ Sürücü konumu güncellendi: ${driverId}`);

        return updatedDriver;
    }

    /**
     * Müsait sürücüleri getir
     */
    async getAvailableDrivers(): Promise<Driver[]> {
        return await this.driverRepository.find({
            where: { status: DriverStatus.AVAILABLE },
            order: { lastActiveAt: 'DESC' }
        });
    }

    /**
     * Sürücü durumunu güncelle
     */
    async updateDriverStatus(driverId: string, status: DriverStatus): Promise<Driver> {
        const driver = await this.driverRepository.findOne({
            where: { id: driverId }
        });

        if (!driver) {
            throw new Error(`Sürücü bulunamadı: ${driverId}`);
        }

        driver.status = status;
        return await this.driverRepository.save(driver);
    }
} 