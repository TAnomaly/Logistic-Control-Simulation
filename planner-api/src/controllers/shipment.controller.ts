import { Controller, Post, Body, Get, Param, UseGuards, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateShipmentCommand } from '../application/commands/create-shipment.command';
import { AssignShipmentCommand } from '../application/commands/assign-shipment.command';
import { GetShipmentsQuery } from '../application/queries/get-shipments.query';
import { GetShipmentByIdQuery } from '../application/queries/get-shipment-by-id.query';
import { Shipment, ShipmentStatus } from '../domain/entities/shipment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/jwt.strategy';
import { GeocodingService } from '../services/geocoding.service';

export class CreateShipmentDto {
    trackingNumber: string;
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    estimatedDeliveryDate?: Date;
}

export class SimpleCreateShipmentDto {
    customerName: string;
    pickupLocation: {
        latitude: number;
        longitude: number;
    };
    deliveryLocation: {
        latitude: number;
        longitude: number;
    };
    pickupAddress: string;
    deliveryAddress: string;
    weight: number;
    priority?: string;
}

export class AssignShipmentDto {
    driverId: string;
}

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly geocodingService: GeocodingService
    ) { }

    // @UseGuards(JwtAuthGuard, RolesGuard) // Geçici olarak devre dışı
    // @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER) // Geçici olarak devre dışı
    @Post()
    async createShipment(@Body() dto: CreateShipmentDto): Promise<Shipment> {
        console.log(`🔍 Starting geocoding for: ${dto.origin} → ${dto.destination}`);

        // Şehir isimlerini koordinatlara çevir
        const originCoords = await this.geocodingService.geocodeTurkishCity(dto.origin);
        console.log(`📍 Origin coords:`, originCoords);

        const destinationCoords = await this.geocodingService.geocodeTurkishCity(dto.destination);
        console.log(`📍 Destination coords:`, destinationCoords);

        if (!originCoords || !destinationCoords) {
            throw new Error(`Geocoding failed for origin: ${dto.origin} or destination: ${dto.destination}`);
        }

        const command = new CreateShipmentCommand(
            dto.trackingNumber,
            dto.origin,
            dto.destination,
            dto.description,
            dto.weight,
            dto.volume,
            dto.estimatedDeliveryDate,
            originCoords.latitude,
            originCoords.longitude,
            destinationCoords.latitude,
            destinationCoords.longitude
        );

        return await this.commandBus.execute(command);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard) // Geçici olarak devre dışı
    // @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.PLANNER) // Geçici olarak devre dışı
    @Put(':id/assign')
    async assignShipment(
        @Param('id') id: string,
        @Body() dto: AssignShipmentDto
    ): Promise<Shipment> {
        const command = new AssignShipmentCommand(id, dto.driverId);
        return await this.commandBus.execute(command);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard) // Geçici olarak devre dışı
    // @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER) // Geçici olarak devre dışı
    @Get()
    async getShipments(
        @Query('status') status?: ShipmentStatus,
        @Query('driverId') driverId?: string
    ): Promise<Shipment[]> {
        const query = new GetShipmentsQuery(status, driverId);
        return await this.queryBus.execute(query);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard) // Geçici olarak devre dışı
    // @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER) // Geçici olarak devre dışı
    @Get(':id')
    async getShipmentById(@Param('id') id: string): Promise<Shipment | null> {
        const query = new GetShipmentByIdQuery(id);
        return await this.queryBus.execute(query);
    }

    // @UseGuards(JwtAuthGuard, RolesGuard) // Geçici olarak devre dışı
    // @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER) // Geçici olarak devre dışı
    @Get('tracking/:trackingNumber')
    async getShipmentByTrackingNumber(@Param('trackingNumber') trackingNumber: string): Promise<Shipment | null> {
        // This would need a separate query handler
        const query = new GetShipmentByIdQuery(trackingNumber);
        return await this.queryBus.execute(query);
    }

    // Basit sipariş oluşturma endpoint'i
    @Post('simple')
    async createSimpleShipment(@Body() dto: SimpleCreateShipmentDto): Promise<any> {
        try {
            console.log(`📦 Basit sipariş oluşturuluyor: ${dto.customerName}`);

            // Benzersiz tracking number oluştur
            const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

            const command = new CreateShipmentCommand(
                trackingNumber,
                dto.pickupAddress,
                dto.deliveryAddress,
                `${dto.customerName} - ${dto.pickupAddress} → ${dto.deliveryAddress}`,
                dto.weight,
                1.0, // Varsayılan volume
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün sonra
                dto.pickupLocation?.latitude,
                dto.pickupLocation?.longitude,
                dto.deliveryLocation?.latitude,
                dto.deliveryLocation?.longitude
            );

            const shipment = await this.commandBus.execute(command);

            console.log(`✅ Sipariş oluşturuldu: ${shipment.id}`);

            return {
                success: true,
                message: 'Sipariş başarıyla oluşturuldu',
                data: shipment
            };
        } catch (error) {
            console.error(`❌ Sipariş oluşturma hatası:`, error.message);
            return {
                success: false,
                message: `Sipariş oluşturulamadı: ${error.message}`
            };
        }
    }

} 