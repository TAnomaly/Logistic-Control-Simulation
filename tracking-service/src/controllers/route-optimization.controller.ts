import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { DriverRoute } from '../domain/entities/driver-route.entity';
import { H3RouteService } from '../services/h3-route.service';

@Controller('routes')
export class RouteOptimizationController {
    constructor(
        private readonly routeOptimizationService: RouteOptimizationService,
        private readonly h3RouteService: H3RouteService
    ) { }

    /**
     * Belirli bir driver için optimize route hesapla
     */
    @Post('optimize/:driverId')
    async optimizeDriverRoute(@Param('driverId') driverId: string): Promise<{
        success: boolean;
        message: string;
        data?: DriverRoute;
    }> {
        try {
            console.log(`🚀 API: Driver ${driverId} için route optimizasyonu isteği`);

            const optimizedRoute = await this.routeOptimizationService.optimizeAndSaveRoute(driverId);

            return {
                success: true,
                message: 'Route başarıyla optimize edildi ve kaydedildi',
                data: optimizedRoute
            };
        } catch (error) {
            console.error(`❌ API: Driver ${driverId} için route optimizasyonu başarısız:`, error.message);

            return {
                success: false,
                message: `Route optimizasyonu başarısız: ${error.message}`
            };
        }
    }

    /**
     * Tüm driver'lar için optimize route hesapla
     */
    @Post('optimize-all')
    async optimizeAllRoutes(): Promise<{
        success: boolean;
        message: string;
        data?: DriverRoute[];
        count?: number;
    }> {
        try {
            console.log(`🚀 API: Tüm driver'lar için route optimizasyonu isteği`);

            const optimizedRoutes = await this.routeOptimizationService.optimizeAllDriverRoutes();

            return {
                success: true,
                message: `${optimizedRoutes.length} driver için route başarıyla optimize edildi`,
                data: optimizedRoutes,
                count: optimizedRoutes.length
            };
        } catch (error) {
            console.error(`❌ API: Toplu route optimizasyonu başarısız:`, error.message);

            return {
                success: false,
                message: `Toplu route optimizasyonu başarısız: ${error.message}`
            };
        }
    }

    /**
     * Driver'ın aktif route'unu getir
     */
    @Get('driver/:driverId/active')
    async getDriverActiveRoute(@Param('driverId') driverId: string): Promise<{
        success: boolean;
        message: string;
        data?: DriverRoute;
    }> {
        try {
            console.log(`🔍 API: Driver ${driverId} aktif route'u isteği`);

            const activeRoute = await this.routeOptimizationService.getDriverActiveRoute(driverId);

            if (!activeRoute) {
                return {
                    success: false,
                    message: 'Driver için aktif route bulunamadı'
                };
            }

            return {
                success: true,
                message: 'Driver aktif route\'u başarıyla getirildi',
                data: activeRoute
            };
        } catch (error) {
            console.error(`❌ API: Driver ${driverId} aktif route getirme başarısız:`, error.message);

            return {
                success: false,
                message: `Aktif route getirme başarısız: ${error.message}`
            };
        }
    }

    /**
     * Driver'ın tüm route'larını getir
     */
    @Get('driver/:driverId')
    async getDriverRoutes(@Param('driverId') driverId: string): Promise<{
        success: boolean;
        message: string;
        data?: DriverRoute[];
        count?: number;
    }> {
        try {
            console.log(`🔍 API: Driver ${driverId} tüm route'ları isteği`);

            const routes = await this.routeOptimizationService.getDriverRoutes(driverId);

            return {
                success: true,
                message: `${routes.length} route başarıyla getirildi`,
                data: routes,
                count: routes.length
            };
        } catch (error) {
            console.error(`❌ API: Driver ${driverId} route'ları getirme başarısız:`, error.message);

            return {
                success: false,
                message: `Route'lar getirme başarısız: ${error.message}`
            };
        }
    }

    /**
     * Tüm route'ları getir
     */
    @Get()
    async getAllRoutes(): Promise<{
        success: boolean;
        message: string;
        data?: DriverRoute[];
        count?: number;
    }> {
        try {
            console.log(`🔍 API: Tüm route'lar isteği`);

            const routes = await this.routeOptimizationService.getAllRoutes();

            return {
                success: true,
                message: `${routes.length} route başarıyla getirildi`,
                data: routes,
                count: routes.length
            };
        } catch (error) {
            console.error(`❌ API: Tüm route'lar getirme başarısız:`, error.message);

            return {
                success: false,
                message: `Route'lar getirme başarısız: ${error.message}`
            };
        }
    }

    /**
     * Polyline decode et
     */
    @Post('decode-polyline')
    async decodePolyline(@Body() body: { polyline: string }): Promise<{
        success: boolean;
        message: string;
        data?: {
            points: Array<{ lat: number; lng: number }>;
            count: number;
        };
    }> {
        try {
            console.log(`🔍 API: Polyline decode isteği`);

            const points = this.h3RouteService.decodePolyline(body.polyline);

            return {
                success: true,
                message: `${points.length} nokta başarıyla decode edildi`,
                data: {
                    points,
                    count: points.length
                }
            };
        } catch (error) {
            console.error(`❌ API: Polyline decode başarısız:`, error.message);

            return {
                success: false,
                message: `Polyline decode başarısız: ${error.message}`
            };
        }
    }
} 