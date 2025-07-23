import { Controller, Get, Post, Body, Param, Query, HttpStatus, HttpCode, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddTrackingEventCommand } from '../../application/commands/add-tracking-event.command';
import { GetTrackingEventsByShipmentQuery } from '../../application/queries/get-tracking-events-by-shipment.query';
import { GetTrackingEventsByGateQuery } from '../../application/queries/get-tracking-events-by-gate.query';
import { AddTrackingEventDto } from '../dtos/add-tracking-event.dto';
import { TrackingEventResponseDto } from '../dtos/tracking-event-response.dto';
import { PaginationDto } from '../dtos/pagination.dto';

/**
 * TrackingEventController - Takip eventi yönetimi için REST API endpoint'leri
 */
@Controller('api/tracking-events')
export class TrackingEventController {
    private readonly logger = new Logger(TrackingEventController.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    /**
     * Yeni takip eventi ekle
     * POST /api/tracking-events
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async addTrackingEvent(@Body() addEventDto: AddTrackingEventDto): Promise<TrackingEventResponseDto> {
        this.logger.log(`Yeni takip eventi ekleme isteği: ${addEventDto.shipmentId} - ${addEventDto.eventType}`);

        try {
            const command = new AddTrackingEventCommand(
                addEventDto.shipmentId,
                addEventDto.gateId,
                addEventDto.eventType,
                addEventDto.description,
                addEventDto.processedBy,
                addEventDto.processingDurationMinutes,
                addEventDto.measuredWeight,
                addEventDto.temperature,
                addEventDto.humidity,
                addEventDto.eventTimestamp ? new Date(addEventDto.eventTimestamp) : new Date()
            );

            const trackingEvent = await this.commandBus.execute(command);

            this.logger.log(`Takip eventi başarıyla eklendi: ${trackingEvent.id}`);
            return new TrackingEventResponseDto(trackingEvent);

        } catch (error) {
            this.logger.error(`Takip eventi ekleme hatası: ${addEventDto.shipmentId}`, error);
            throw error;
        }
    }

    /**
     * Gönderi ID'sine göre takip eventlerini getir
     * GET /api/tracking-events/shipment/:shipmentId
     */
    @Get('shipment/:shipmentId')
    async getEventsByShipment(
        @Param('shipmentId') shipmentId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<{
        events: TrackingEventResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        this.logger.log(`Gönderi takip eventleri istendi: ${shipmentId}`);

        try {
            const query = new GetTrackingEventsByShipmentQuery(
                shipmentId,
                paginationDto.page || 1,
                paginationDto.limit || 10
            );

            const result = await this.queryBus.execute(query);

            return {
                events: result.events.map(event => new TrackingEventResponseDto(event)),
                total: result.total,
                page: paginationDto.page || 1,
                limit: paginationDto.limit || 10
            };

        } catch (error) {
            this.logger.error(`Gönderi takip eventleri alma hatası: ${shipmentId}`, error);
            throw error;
        }
    }

    /**
     * Kapı ID'sine göre takip eventlerini getir
     * GET /api/tracking-events/gate/:gateId
     */
    @Get('gate/:gateId')
    async getEventsByGate(
        @Param('gateId') gateId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<{
        events: TrackingEventResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        this.logger.log(`Kapı takip eventleri istendi: ${gateId}`);

        try {
            const query = new GetTrackingEventsByGateQuery(
                gateId,
                paginationDto.page || 1,
                paginationDto.limit || 10
            );

            const result = await this.queryBus.execute(query);

            return {
                events: result.events.map(event => new TrackingEventResponseDto(event)),
                total: result.total,
                page: paginationDto.page || 1,
                limit: paginationDto.limit || 10
            };

        } catch (error) {
            this.logger.error(`Kapı takip eventleri alma hatası: ${gateId}`, error);
            throw error;
        }
    }

    /**
     * Takip numarasına göre eventleri getir
     * GET /api/tracking-events/tracking/:trackingNumber
     */
    @Get('tracking/:trackingNumber')
    async getEventsByTrackingNumber(
        @Param('trackingNumber') trackingNumber: string
    ): Promise<{
        events: TrackingEventResponseDto[];
        timeline: Array<{
            eventType: string;
            timestamp: Date;
            location: string;
            description: string;
        }>;
    }> {
        this.logger.log(`Takip numarası eventleri istendi: ${trackingNumber}`);

        try {
            // Önce gönderiyi bul, sonra eventlerini getir
            const query = new GetTrackingEventsByShipmentQuery(
                trackingNumber, // Bu durumda tracking number ile shipment bulunmalı
                1,
                100 // Tüm eventleri getir
            );

            const result = await this.queryBus.execute(query);

            // Timeline formatında düzenle
            const timeline = result.events.map(event => ({
                eventType: event.eventType,
                timestamp: event.eventTimestamp,
                location: event.gate ? `${event.gate.name} - ${event.gate.locationName}` : 'Bilinmeyen Lokasyon',
                description: event.description || this.getEventDescription(event.eventType)
            }));

            return {
                events: result.events.map(event => new TrackingEventResponseDto(event)),
                timeline: timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            };

        } catch (error) {
            this.logger.error(`Takip numarası eventleri alma hatası: ${trackingNumber}`, error);
            throw error;
        }
    }

    /**
     * Bugünkü tüm eventleri getir (operasyonel dashboard için)
     * GET /api/tracking-events/today
     */
    @Get('today')
    async getTodaysEvents(@Query() paginationDto: PaginationDto): Promise<{
        events: TrackingEventResponseDto[];
        total: number;
        summary: {
            totalEvents: number;
            entriesCount: number;
            exitsCount: number;
            deliveriesCount: number;
            issuesCount: number;
        };
    }> {
        this.logger.log('Bugünkü takip eventleri istendi');

        try {
            // Bu query için ayrı bir handler gerekebilir
            // Şimdilik basit implementation
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // TODO: GetTodaysTrackingEventsQuery implement et
            return {
                events: [],
                total: 0,
                summary: {
                    totalEvents: 0,
                    entriesCount: 0,
                    exitsCount: 0,
                    deliveriesCount: 0,
                    issuesCount: 0
                }
            };

        } catch (error) {
            this.logger.error('Bugünkü eventler alma hatası', error);
            throw error;
        }
    }

    /**
     * Event türlerine göre istatistikler
     * GET /api/tracking-events/statistics
     */
    @Get('statistics')
    async getEventStatistics(@Query('days') days: string = '7'): Promise<{
        period: string;
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsByGate: Record<string, number>;
        trendsData: Array<{
            date: string;
            eventCount: number;
        }>;
    }> {
        this.logger.log(`Takip eventi istatistikleri istendi: ${days} gün`);

        try {
            // TODO: GetTrackingEventStatisticsQuery implement et
            return {
                period: `${days} gün`,
                totalEvents: 0,
                eventsByType: {},
                eventsByGate: {},
                trendsData: []
            };

        } catch (error) {
            this.logger.error('Event istatistikleri alma hatası', error);
            throw error;
        }
    }

    /**
     * Sistem sağlık kontrolü
     * GET /api/tracking-events/health
     */
    @Get('health')
    async healthCheck(): Promise<{ status: string; timestamp: string; message: string }> {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            message: 'Tracking event service sağlıklı çalışıyor'
        };
    }

    /**
     * Event type için açıklama getir
     */
    private getEventDescription(eventType: string): string {
        const descriptions: Record<string, string> = {
            'ENTRY': 'Kapıdan giriş yapıldı',
            'EXIT': 'Kapıdan çıkış yapıldı',
            'SORTING': 'Sıralama işlemi başlatıldı',
            'SORTING_COMPLETED': 'Sıralama işlemi tamamlandı',
            'STORED': 'Depolamaya yerleştirildi',
            'RETRIEVED_FROM_STORAGE': 'Depodan alındı',
            'LOADING_STARTED': 'Yükleme işlemi başladı',
            'LOADING_COMPLETED': 'Yükleme işlemi tamamlandı',
            'TRANSFER_PREPARED': 'Transfer için hazırlandı',
            'TRANSFERRED': 'Transfer edildi',
            'QUALITY_CHECK': 'Kalite kontrolü yapıldı',
            'QUALITY_CHECK_PASSED': 'Kalite kontrolü başarılı',
            'QUALITY_CHECK_FAILED': 'Kalite kontrolü başarısız',
            'CUSTOMS_PROCESSING': 'Gümrük işlemleri',
            'CUSTOMS_CLEARED': 'Gümrük onaylandı',
            'CUSTOMS_PENDING': 'Gümrük beklemede',
            'MAINTENANCE': 'Bakım işlemi',
            'MAINTENANCE_COMPLETED': 'Bakım tamamlandı',
            'OUT_FOR_DELIVERY': 'Teslimat için yola çıktı',
            'DELIVERY_ATTEMPTED': 'Teslimat denendi',
            'DELIVERED': 'Teslim edildi',
            'DELIVERY_FAILED': 'Teslimat başarısız',
            'RETURNED': 'İade edildi',
            'CANCELLED': 'İptal edildi',
            'ON_HOLD': 'Beklemede',
            'DELAYED': 'Gecikti',
            'DAMAGE_DETECTED': 'Hasar tespit edildi',
            'LOST': 'Kayboldu',
            'FOUND': 'Bulundu',
            'SECURITY_CHECK': 'Güvenlik kontrolü',
            'ROUTE_UPDATED': 'Rota güncellendi'
        };

        return descriptions[eventType] || 'Bilinmeyen event türü';
    }
} 