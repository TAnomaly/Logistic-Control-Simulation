import { Controller, Post, Get, Put, Param, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { DriverService } from '../application/services/driver.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface CreateDriverRequest {
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

interface AssignShipmentRequest {
    shipmentId: string;
    assignedAt?: string;
    notes?: string;
}

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriverController {
    constructor(private readonly driverService: DriverService) { }

    /**
     * Yeni sürücü oluştur
     */
    @Post()
    async createDriver(@Body() request: CreateDriverRequest) {
        try {
            console.log(`🚗 Yeni sürücü oluşturuluyor: ${request.name}`);

            const driver = await this.driverService.createDriver({
                name: request.name,
                phoneNumber: request.phoneNumber,
                vehicleType: request.vehicleType,
                licensePlate: request.licensePlate,
                address: request.address,
                currentLocation: request.currentLocation
            });

            console.log(`✅ Sürücü başarıyla oluşturuldu: ${driver.id}`);

            return {
                success: true,
                message: 'Sürücü başarıyla oluşturuldu',
                data: driver
            };
        } catch (error) {
            console.error(`❌ Sürücü oluşturma hatası:`, error.message);
            throw new HttpException(
                `Sürücü oluşturulamadı: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Tüm sürücüleri listele
     */
    @Get()
    async getAllDrivers() {
        try {
            console.log(`📋 Tüm sürücüler listeleniyor`);

            const drivers = await this.driverService.getAllDrivers();

            return {
                success: true,
                data: {
                    totalDrivers: drivers.length,
                    drivers: drivers
                }
            };
        } catch (error) {
            console.error(`❌ Sürücü listeleme hatası:`, error.message);
            throw new HttpException(
                `Sürücüler listelenemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Sürücü bilgilerini getir
     */
    @Get(':id')
    async getDriverById(@Param('id') id: string) {
        try {
            console.log(`📋 Sürücü bilgileri getiriliyor: ${id}`);

            const driver = await this.driverService.getDriverById(id);

            if (!driver) {
                throw new HttpException(
                    `Sürücü bulunamadı: ${id}`,
                    HttpStatus.NOT_FOUND
                );
            }

            return {
                success: true,
                data: driver
            };
        } catch (error) {
            console.error(`❌ Sürücü getirme hatası:`, error.message);
            throw new HttpException(
                `Sürücü getirilemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Sürücüye sipariş ata
     */
    @Post(':id/assignments')
    async assignShipment(
        @Param('id') driverId: string,
        @Body() request: AssignShipmentRequest
    ) {
        try {
            console.log(`📦 Sürücü ${driverId}'ye sipariş atanıyor: ${request.shipmentId}`);

            const assignment = await this.driverService.assignShipmentToDriver(
                driverId,
                request.shipmentId,
                {
                    assignedAt: request.assignedAt ? new Date(request.assignedAt) : new Date(),
                    notes: request.notes
                }
            );

            console.log(`✅ Sipariş başarıyla atandı: ${assignment.id}`);

            return {
                success: true,
                message: 'Sipariş başarıyla sürücüye atandı',
                data: assignment
            };
        } catch (error) {
            console.error(`❌ Sipariş atama hatası:`, error.message);
            throw new HttpException(
                `Sipariş atanamadı: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Sürücünün atamalarını getir
     */
    @Get(':id/assignments')
    async getDriverAssignments(@Param('id') driverId: string) {
        try {
            console.log(`📋 Sürücü atamaları getiriliyor: ${driverId}`);

            const assignments = await this.driverService.getDriverAssignments(driverId);

            return {
                success: true,
                data: {
                    driverId: driverId,
                    totalAssignments: assignments.length,
                    assignments: assignments
                }
            };
        } catch (error) {
            console.error(`❌ Sürücü atamaları getirme hatası:`, error.message);
            throw new HttpException(
                `Sürücü atamaları getirilemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Sürücü konumunu güncelle
     */
    @Put(':id/location')
    async updateDriverLocation(
        @Param('id') driverId: string,
        @Body() location: { latitude: number; longitude: number }
    ) {
        try {
            console.log(`📍 Sürücü konumu güncelleniyor: ${driverId}`);

            const updatedDriver = await this.driverService.updateDriverLocation(
                driverId,
                location.latitude,
                location.longitude
            );

            console.log(`✅ Sürücü konumu güncellendi: ${driverId}`);

            return {
                success: true,
                message: 'Sürücü konumu başarıyla güncellendi',
                data: {
                    driverId: updatedDriver.id,
                    currentLocation: updatedDriver.currentLocation,
                    lastActiveAt: updatedDriver.lastActiveAt
                }
            };
        } catch (error) {
            console.error(`❌ Sürücü konum güncelleme hatası:`, error.message);
            throw new HttpException(
                `Sürücü konumu güncellenemedi: ${error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }
} 