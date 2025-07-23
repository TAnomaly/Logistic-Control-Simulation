import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Logger, UseFilters } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateGateCommand } from '../../application/commands/create-gate.command';
import { UpdateGateCommand } from '../../application/commands/update-gate.command';
import { GetGateByIdQuery } from '../../application/queries/get-gate-by-id.query';
import { GetGatesQuery } from '../../application/queries/get-gates.query';
import { CreateGateDto } from '../dtos/create-gate.dto';
import { UpdateGateDto } from '../dtos/update-gate.dto';
import { GateResponseDto } from '../dtos/gate-response.dto';
import { PaginationDto } from '../dtos/pagination.dto';
import { Cache } from '../../infrastructure/redis/cache.decorator';
import { RedisService } from '../../infrastructure/redis/redis.service';

/**
 * GateController - Gate (Kapı/Geçit) yönetimi için REST API endpoint'leri
 * CQRS pattern kullanarak command ve query işlemlerini yönetir
 */
@Controller('api/gates')
export class GateController {
    private readonly logger = new Logger(GateController.name);

    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly redisService: RedisService,
    ) { }

    /**
     * Yeni kapı oluştur
     * POST /api/gates
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createGate(@Body() createGateDto: CreateGateDto): Promise<GateResponseDto> {
        this.logger.log(`Yeni kapı oluşturma isteği: ${createGateDto.gateCode}`);

        try {
            const command = new CreateGateCommand(
                createGateDto.gateCode,
                createGateDto.name,
                createGateDto.gateType,
                createGateDto.locationName,
                createGateDto.address,
                createGateDto.latitude,
                createGateDto.longitude,
                createGateDto.hourlyCapacity,
                createGateDto.operatingHoursStart,
                createGateDto.operatingHoursEnd
            );

            const gate = await this.commandBus.execute(command);

            this.logger.log(`Kapı başarıyla oluşturuldu: ${gate.gateCode}`);
            return new GateResponseDto(gate);

        } catch (error) {
            this.logger.error(`Kapı oluşturma hatası: ${createGateDto.gateCode}`, error);
            throw error;
        }
    }

    /**
     * Kapı ID'si ile kapı bilgilerini getir
     * GET /api/gates/:id
     */
    @Get(':id')
    async getGateById(@Param('id') id: string): Promise<GateResponseDto> {
        this.logger.log(`Kapı bilgileri istendi: ${id}`);

        try {
            const query = new GetGateByIdQuery(id);
            const gate = await this.queryBus.execute(query);

            return new GateResponseDto(gate);

        } catch (error) {
            this.logger.error(`Kapı bilgileri alma hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Tüm kapıları listele (sayfalama ile)
     * GET /api/gates
     */
    @Get()
    @Cache(300, 'gates')
    async getGates(@Query() paginationDto: PaginationDto): Promise<{
        gates: GateResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        this.logger.log(`Kapı listesi istendi - Sayfa: ${paginationDto.page}, Limit: ${paginationDto.limit}`);

        try {
            const query = new GetGatesQuery(
                paginationDto.page || 1,
                paginationDto.limit || 10,
                paginationDto.gateType,
                paginationDto.isActive,
                paginationDto.locationName
            );

            const result = await this.queryBus.execute(query);

            return {
                gates: result.gates.map(gate => new GateResponseDto(gate)),
                total: result.total,
                page: paginationDto.page || 1,
                limit: paginationDto.limit || 10
            };

        } catch (error) {
            this.logger.error('Kapı listesi alma hatası', error);
            throw error;
        }
    }

    /**
     * Kapı bilgilerini güncelle
     * PUT /api/gates/:id
     */
    @Put(':id')
    async updateGate(
        @Param('id') id: string,
        @Body() updateGateDto: UpdateGateDto
    ): Promise<GateResponseDto> {
        this.logger.log(`Kapı güncelleme isteği: ${id}`);

        try {
            const command = new UpdateGateCommand(
                id,
                updateGateDto.name,
                updateGateDto.gateType,
                updateGateDto.locationName,
                updateGateDto.address,
                updateGateDto.latitude,
                updateGateDto.longitude,
                updateGateDto.isActive,
                updateGateDto.hourlyCapacity,
                updateGateDto.operatingHoursStart,
                updateGateDto.operatingHoursEnd
            );

            const gate = await this.commandBus.execute(command);

            this.logger.log(`Kapı başarıyla güncellendi: ${gate.gateCode}`);
            return new GateResponseDto(gate);

        } catch (error) {
            this.logger.error(`Kapı güncelleme hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Kapıyı sil
     * DELETE /api/gates/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteGate(@Param('id') id: string): Promise<void> {
        this.logger.log(`Kapı silme isteği: ${id}`);

        try {
            // Soft delete için UpdateGateCommand kullan
            const command = new UpdateGateCommand(
                id,
                undefined, // name
                undefined, // gateType
                undefined, // locationName
                undefined, // address
                undefined, // latitude
                undefined, // longitude
                false,     // isActive - soft delete
                undefined, // hourlyCapacity
                undefined, // operatingHoursStart
                undefined  // operatingHoursEnd
            );

            await this.commandBus.execute(command);

            this.logger.log(`Kapı başarıyla silindi: ${id}`);

        } catch (error) {
            this.logger.error(`Kapı silme hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Kapının aktif/pasif durumunu değiştir
     * PUT /api/gates/:id/toggle-status
     */
    @Put(':id/toggle-status')
    async toggleGateStatus(@Param('id') id: string): Promise<GateResponseDto> {
        this.logger.log(`Kapı durum değiştirme isteği: ${id}`);

        try {
            // Önce mevcut kapıyı al
            const gateQuery = new GetGateByIdQuery(id);
            const existingGate = await this.queryBus.execute(gateQuery);

            // Status'u tersine çevir
            const command = new UpdateGateCommand(
                id,
                undefined, // name
                undefined, // gateType
                undefined, // locationName
                undefined, // address
                undefined, // latitude
                undefined, // longitude
                !existingGate.isActive, // isActive'i tersine çevir
                undefined, // hourlyCapacity
                undefined, // operatingHoursStart
                undefined  // operatingHoursEnd
            );

            const gate = await this.commandBus.execute(command);

            this.logger.log(`Kapı durumu değiştirildi: ${gate.gateCode} - ${gate.isActive ? 'Aktif' : 'Pasif'}`);
            return new GateResponseDto(gate);

        } catch (error) {
            this.logger.error(`Kapı durum değiştirme hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Kapının çalışma saatlerini kontrol et
     * GET /api/gates/:id/operating-status
     */
    @Get(':id/operating-status')
    async getOperatingStatus(@Param('id') id: string): Promise<{
        gateId: string;
        gateCode: string;
        isActive: boolean;
        isCurrentlyOperating: boolean;
        nextOperatingTime?: string;
        operatingHours: {
            start: string;
            end: string;
        };
    }> {
        this.logger.log(`Kapı çalışma durumu istendi: ${id}`);

        try {
            const query = new GetGateByIdQuery(id);
            const gate = await this.queryBus.execute(query);

            const now = new Date();
            const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

            let isCurrentlyOperating = gate.isActive;
            let nextOperatingTime: string | undefined;

            if (gate.operatingHoursStart && gate.operatingHoursEnd) {
                isCurrentlyOperating = gate.isActive &&
                    currentTime >= gate.operatingHoursStart &&
                    currentTime <= gate.operatingHoursEnd;

                // Eğer şu an çalışmıyorsa, bir sonraki çalışma zamanını hesapla
                if (!isCurrentlyOperating && gate.isActive) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    if (currentTime > gate.operatingHoursEnd) {
                        // Bugün çalışma saati geçmiş, yarın başlayacak
                        nextOperatingTime = `${tomorrow.toISOString().split('T')[0]}T${gate.operatingHoursStart}:00`;
                    } else {
                        // Bugün henüz başlamamış
                        nextOperatingTime = `${now.toISOString().split('T')[0]}T${gate.operatingHoursStart}:00`;
                    }
                }
            }

            return {
                gateId: gate.id,
                gateCode: gate.gateCode,
                isActive: gate.isActive,
                isCurrentlyOperating,
                nextOperatingTime,
                operatingHours: {
                    start: gate.operatingHoursStart || '00:00',
                    end: gate.operatingHoursEnd || '23:59'
                }
            };

        } catch (error) {
            this.logger.error(`Kapı çalışma durumu alma hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Kapı istatistiklerini getir
     * GET /api/gates/:id/statistics
     */
    @Get(':id/statistics')
    async getGateStatistics(@Param('id') id: string): Promise<{
        gateId: string;
        gateCode: string;
        totalShipments: number;
        todayShipments: number;
        averageProcessingTime: number;
        lastActivity?: Date;
        utilizationRate: number;
    }> {
        this.logger.log(`Kapı istatistikleri istendi: ${id}`);

        try {
            const query = new GetGateByIdQuery(id);
            const gate = await this.queryBus.execute(query);

            // Bu implementasyon örnek, gerçek projede ayrı bir query handler'da olacak
            return {
                gateId: gate.id,
                gateCode: gate.gateCode,
                totalShipments: 0, // TODO: TrackingEvent'lerden hesapla
                todayShipments: 0, // TODO: Bugünkü event'leri say
                averageProcessingTime: 0, // TODO: Ortalama işlem süresini hesapla
                lastActivity: undefined, // TODO: Son event tarihini getir
                utilizationRate: 0 // TODO: Kapasite kullanım oranını hesapla
            };

        } catch (error) {
            this.logger.error(`Kapı istatistikleri alma hatası: ${id}`, error);
            throw error;
        }
    }

    /**
     * Sistem sağlık kontrolü
     * GET /api/gates/health
     */
    @Get('health')
    async healthCheck(): Promise<{ status: string; timestamp: string; message: string }> {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            message: 'Gate service sağlıklı çalışıyor'
        };
    }
} 