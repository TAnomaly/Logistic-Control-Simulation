import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

export class CreateShipmentDto {
    trackingNumber: string;
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    estimatedDeliveryDate?: Date;
}

export class AssignShipmentDto {
    driverId: string;
}

@Controller('shipments')
export class ShipmentController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus
    ) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER)
    @Post()
    async createShipment(@Body() dto: CreateShipmentDto): Promise<Shipment> {
        const command = new CreateShipmentCommand(
            dto.trackingNumber,
            dto.origin,
            dto.destination,
            dto.description,
            dto.weight,
            dto.volume,
            dto.estimatedDeliveryDate
        );

        return await this.commandBus.execute(command);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.PLANNER)
    @Put(':id/assign')
    async assignShipment(
        @Param('id') id: string,
        @Body() dto: AssignShipmentDto
    ): Promise<Shipment> {
        const command = new AssignShipmentCommand(id, dto.driverId);
        return await this.commandBus.execute(command);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER)
    @Get()
    async getShipments(
        @Query('status') status?: ShipmentStatus,
        @Query('driverId') driverId?: string
    ): Promise<Shipment[]> {
        const query = new GetShipmentsQuery(status, driverId);
        return await this.queryBus.execute(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER)
    @Get(':id')
    async getShipmentById(@Param('id') id: string): Promise<Shipment | null> {
        const query = new GetShipmentByIdQuery(id);
        return await this.queryBus.execute(query);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLANNER, UserRole.ADMIN, UserRole.DISPATCHER, UserRole.CUSTOMER)
    @Get('tracking/:trackingNumber')
    async getShipmentByTrackingNumber(@Param('trackingNumber') trackingNumber: string): Promise<Shipment | null> {
        // This would need a separate query handler
        const query = new GetShipmentByIdQuery(trackingNumber);
        return await this.queryBus.execute(query);
    }
} 