import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RouteOptimizationService } from '../services/route-optimization.service';
import { DriverRoute } from '../domain/entities/driver-route.entity';
import { H3RouteService } from '../services/h3-route.service';
import axios from 'axios';

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

    /**
     * Driver'ın polyline'ına yeni konum ekle
     */
    @Post('update-polyline/:driverId')
    async updateDriverPolyline(
        @Param('driverId') driverId: string,
        @Body() locationData: { latitude: number; longitude: number; address?: string }
    ): Promise<{
        success: boolean;
        message: string;
        data?: {
            driverId: string;
            newLocation: { lat: number; lng: number };
            updatedRoute: DriverRoute;
        };
    }> {
        try {
            console.log(`📍 API: Driver ${driverId} polyline güncelleme isteği`);

            const newLocation = {
                lat: locationData.latitude,
                lng: locationData.longitude
            };

            const result = await this.routeOptimizationService.updateDriverPolyline(driverId, newLocation);

            if (result) {
                return {
                    success: true,
                    message: 'Polyline başarıyla güncellendi',
                    data: {
                        driverId,
                        newLocation,
                        updatedRoute: result
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Polyline güncellenemedi - aktif rota bulunamadı',
                    data: { driverId, newLocation } as any
                };
            }
        } catch (error) {
            console.error(`❌ API: Driver ${driverId} polyline güncelleme başarısız:`, error.message);

            return {
                success: false,
                message: `Polyline güncelleme başarısız: ${error.message}`
            };
        }
    }

    /**
     * Driver'ın aktif route'unu ve güncel konumunu getir (Dashboard için)
     */
    @Get('driver/:driverId/dashboard')
    async getDriverDashboardData(@Param('driverId') driverId: string): Promise<{
        success: boolean;
        message: string;
        data?: {
            driverId: string;
            currentLocation: { lat: number; lng: number; address?: string } | null;
            activeRoute: DriverRoute | null;
            polylinePoints: Array<{ lat: number; lng: number }>;
            waypoints: Array<{
                lat: number;
                lng: number;
                type: string;
                shipmentId?: string;
            }>;
        };
    }> {
        try {
            console.log(`🗺️ API: Driver ${driverId} dashboard verisi isteği`);

            // 1. Driver'ın güncel konumunu al
            let currentLocation = null;
            try {
                const driverResponse = await axios.get(`http://logistic-driver-api:3001/api/drivers`);
                const drivers = driverResponse.data;
                const driver = drivers.find((d: any) => d.id === driverId);
                if (driver && driver.currentLocation) {
                    currentLocation = {
                        lat: driver.currentLocation.latitude,
                        lng: driver.currentLocation.longitude,
                        address: driver.currentLocation.address
                    };
                }
            } catch (error) {
                console.warn(`⚠️ Driver ${driverId} konum bilgisi alınamadı:`, error.message);
            }

            // 2. Aktif route'u al
            const activeRoute = await this.routeOptimizationService.getDriverActiveRoute(driverId);

            // 3. Polyline'ı decode et
            let polylinePoints: Array<{ lat: number; lng: number }> = [];
            let waypoints: Array<{ lat: number; lng: number; type: string; shipmentId?: string }> = [];

            if (activeRoute && activeRoute.optimizedRoute) {
                // Polyline decode
                polylinePoints = this.h3RouteService.decodePolyline(activeRoute.optimizedRoute.polyline);

                // Waypoints'i düzenle
                waypoints = activeRoute.optimizedRoute.waypoints.map((wp: any) => ({
                    lat: wp.latitude,
                    lng: wp.longitude,
                    type: wp.type,
                    shipmentId: wp.shipmentId
                }));
            }

            return {
                success: true,
                message: 'Dashboard verisi başarıyla getirildi',
                data: {
                    driverId,
                    currentLocation,
                    activeRoute,
                    polylinePoints,
                    waypoints
                }
            };
        } catch (error) {
            console.error(`❌ API: Driver ${driverId} dashboard verisi getirme başarısız:`, error.message);

            return {
                success: false,
                message: `Dashboard verisi getirme başarısız: ${error.message}`
            };
        }
    }
} 