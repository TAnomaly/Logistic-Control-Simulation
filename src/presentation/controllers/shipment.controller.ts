import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateShipmentDto, CreateShipmentCommand } from '../../application/commands/create-shipment.command';
import { GetShipmentByTrackingDto } from '../../application/queries/get-shipment-by-tracking.query';
import { ShipmentTrackingDetailsDto } from '../../application/handlers/get-shipment-by-tracking.handler';
import { Shipment } from '../../domain/entities/shipment.entity';

/**
 * ShipmentController - Gönderi yönetimi için REST API endpoint'leri
 * CQRS pattern kullanarak command ve query işlemlerini yönlendirir
 */
@Controller('api/shipments')
export class ShipmentController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    /**
     * Yeni gönderi oluşturur
     * POST /api/shipments
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createShipment(
        @Body() body: any,
    ): Promise<{
        success: boolean;
        data: {
            id: string;
            trackingNumber: string;
            status: string;
        };
        message: string;
    }> {
        try {
            // Direkt Command oluştur - toCommand() metodunu atla
            const command = new CreateShipmentCommand(
                body.senderName,
                body.senderAddress,
                body.receiverName,
                body.receiverAddress,
                body.weight,
                body.length,
                body.width,
                body.height,
                body.estimatedDeliveryDate,
            );

            const shipment: Shipment = await this.commandBus.execute(command);

            return {
                success: true,
                data: {
                    id: shipment.id,
                    trackingNumber: shipment.trackingNumber,
                    status: shipment.status,
                },
                message: 'Gönderi başarıyla oluşturuldu',
            };
        } catch (error) {
            return {
                success: false,
                data: null as any,
                message: error.message || 'Gönderi oluşturulurken hata oluştu',
            };
        }
    }

    /**
     * Takip numarasına göre gönderi detaylarını getirir
     * GET /api/shipments/tracking/:trackingNumber
     */
    @Get('tracking/:trackingNumber')
    @HttpCode(HttpStatus.OK)
    async getShipmentByTracking(
        @Param('trackingNumber') trackingNumber: string,
    ): Promise<{
        success: boolean;
        data: ShipmentTrackingDetailsDto | null;
        message: string;
    }> {
        try {
            // DTO oluştur ve query'ye dönüştür
            const dto = new GetShipmentByTrackingDto();
            dto.trackingNumber = trackingNumber;

            const query = dto.toQuery();
            const shipmentDetails: ShipmentTrackingDetailsDto = await this.queryBus.execute(query);

            return {
                success: true,
                data: shipmentDetails,
                message: 'Gönderi bilgileri başarıyla alındı',
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: error.message || 'Gönderi bilgileri alınırken hata oluştu',
            };
        }
    }

    /**
     * Gönderi listesi getirir (sayfalama ile)
     * GET /api/shipments?page=1&limit=10&status=CREATED
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async getShipments(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('status') status?: string,
    ): Promise<{
        success: boolean;
        data: {
            shipments: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        } | null;
        message: string;
    }> {
        try {
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 10;

            // Bu endpoint için ayrı bir query oluşturulabilir
            // Şu an için basit bir response döneriz
            return {
                success: true,
                data: {
                    shipments: [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: 0,
                        totalPages: 0,
                    },
                },
                message: 'Gönderi listesi başarıyla alındı',
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: error.message || 'Gönderi listesi alınırken hata oluştu',
            };
        }
    }

    /**
     * Sağlık kontrolü endpoint'i
     * GET /api/shipments/health
     */
    @Get('health')
    @HttpCode(HttpStatus.OK)
    getHealth(): {
        success: boolean;
        message: string;
        timestamp: string;
    } {
        return {
            success: true,
            message: 'Shipment service is running',
            timestamp: new Date().toISOString(),
        };
    }
} 