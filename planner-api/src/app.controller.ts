import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { AppService } from './app.service';

interface Shipment {
    id?: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    description?: string;
    weight: number;
    volume: number;
    status?: string;
    assignedDriverId?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

@Controller()
export class AppController {
    private shipments: Shipment[] = [];

    constructor(private readonly appService: AppService) { }

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('health')
    getHealth(): { status: string; timestamp: string } {
        return this.appService.getHealth();
    }

    @Post('shipments')
    createShipment(@Body() shipmentData: Shipment): Shipment {
        const newShipment: Shipment = {
            id: Date.now().toString(),
            trackingNumber: shipmentData.trackingNumber,
            origin: shipmentData.origin,
            destination: shipmentData.destination,
            description: shipmentData.description,
            weight: shipmentData.weight || 0,
            volume: shipmentData.volume || 0,
            status: 'PENDING',
            estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.shipments.push(newShipment);
        console.log(`📦 Shipment created: ${newShipment.trackingNumber} (${newShipment.origin} → ${newShipment.destination})`);

        return newShipment;
    }

    @Get('shipments')
    getShipments(): Shipment[] {
        return this.shipments;
    }

    @Get('shipments/:id')
    getShipment(@Param('id') id: string): Shipment | { error: string } {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }
        return shipment;
    }

    @Put('shipments/:id/assign')
    assignDriver(
        @Param('id') id: string,
        @Body() assignmentData: { driverId: string }
    ): Shipment | { error: string } {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }

        shipment.assignedDriverId = assignmentData.driverId;
        shipment.status = 'ASSIGNED';
        shipment.updatedAt = new Date();

        console.log(`🚗 Shipment assigned: ${shipment.trackingNumber} → Driver ${assignmentData.driverId}`);

        return shipment;
    }

    @Put('shipments/:id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() statusData: { status: string }
    ): Shipment | { error: string } {
        const shipment = this.shipments.find(s => s.id === id);
        if (!shipment) {
            return { error: 'Shipment not found' };
        }

        shipment.status = statusData.status;
        shipment.updatedAt = new Date();

        if (statusData.status === 'DELIVERED') {
            shipment.actualDeliveryDate = new Date();
        }

        console.log(`📦 Shipment status updated: ${shipment.trackingNumber} → ${statusData.status}`);

        return shipment;
    }
} 