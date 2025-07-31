import { Injectable } from '@nestjs/common';
import { RouteOptimizationRepository } from '../../domain/repositories/route-optimization.repository';
import { RouteOptimization, OptimizedRoutePoint, DeliveryPoint, Coordinates } from '../../domain/entities/route-optimization.entity';

@Injectable()
export class RouteOptimizationService implements RouteOptimizationRepository {
    private readonly EARTH_RADIUS = 6371; // km
    private readonly BASE_SPEED = 50; // km/h
    private readonly BASE_FUEL_RATE = 8; // km/liter

    async optimizeRoute(
        driverId: string,
        driverLocation: Coordinates,
        deliveries: DeliveryPoint[],
        vehicleCapacity: number = 1000,
        vehicleVolume: number = 10
    ): Promise<RouteOptimization> {
        const startTime = Date.now();

        if (!deliveries || deliveries.length === 0) {
            return new RouteOptimization(
                driverId,
                [],
                0,
                0,
                0,
                100,
                'Greedy TSP + Haversine',
                'No deliveries to optimize'
            );
        }

        // Create distance matrix
        const distanceMatrix = this.createDistanceMatrix(driverLocation, deliveries);

        // Solve TSP using greedy algorithm
        const route = this.solveTspGreedy(distanceMatrix);

        // Build optimized route
        const optimizedRoute: OptimizedRoutePoint[] = [];
        let totalDistance = 0;
        let totalTime = 0;
        let cumulativeDistance = 0;
        let cumulativeTime = 0;

        for (let i = 0; i < route.length - 1; i++) {
            const pointIndex = route[i + 1];
            const delivery = deliveries[pointIndex - 1];

            let distanceFromPrevious: number;
            if (i === 0) {
                distanceFromPrevious = distanceMatrix[0][pointIndex];
            } else {
                const prevPointIndex = route[i];
                distanceFromPrevious = distanceMatrix[prevPointIndex][pointIndex];
            }

            const estimatedTime = Math.round(distanceFromPrevious * 60 / this.BASE_SPEED);

            cumulativeDistance += distanceFromPrevious;
            cumulativeTime += estimatedTime;
            totalDistance += distanceFromPrevious;
            totalTime += estimatedTime;

            const routePoint = new OptimizedRoutePoint(
                i + 1,
                delivery.id,
                delivery.address,
                delivery.coordinates,
                Math.round(distanceFromPrevious * 100) / 100,
                estimatedTime,
                Math.round(cumulativeDistance * 100) / 100,
                cumulativeTime
            );

            optimizedRoute.push(routePoint);
        }

        // Calculate fuel estimate
        const fuelEstimate = totalDistance / this.BASE_FUEL_RATE;

        // Calculate efficiency
        const efficiency = Math.max(0, 100 - (totalDistance / deliveries.length * 2));

        const processingTime = Date.now() - startTime;

        return new RouteOptimization(
            driverId,
            optimizedRoute,
            Math.round(totalDistance * 100) / 100,
            totalTime,
            Math.round(fuelEstimate * 100) / 100,
            Math.round(efficiency * 10) / 10,
            'Greedy TSP + Haversine',
            `Route optimized in ${processingTime}ms`
        );
    }

    private calculateDistanceHaversine(coord1: Coordinates, coord2: Coordinates): number {
        const lat1 = this.toRadians(coord1.latitude);
        const lon1 = this.toRadians(coord1.longitude);
        const lat2 = this.toRadians(coord2.latitude);
        const lon2 = this.toRadians(coord2.longitude);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.asin(Math.sqrt(a));

        return this.EARTH_RADIUS * c;
    }

    private createDistanceMatrix(driverLocation: Coordinates, deliveries: DeliveryPoint[]): number[][] {
        const points = [driverLocation, ...deliveries.map(d => d.coordinates)];
        const n = points.length;
        const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    matrix[i][j] = this.calculateDistanceHaversine(points[i], points[j]);
                }
            }
        }

        return matrix;
    }

    private solveTspGreedy(distanceMatrix: number[][]): number[] {
        const n = distanceMatrix.length;
        const unvisited = new Set<number>();
        for (let i = 1; i < n; i++) {
            unvisited.add(i);
        }

        const route: number[] = [0]; // Start from driver location
        let current = 0;

        while (unvisited.size > 0) {
            let nearest = -1;
            let minDistance = Infinity;

            for (const point of unvisited) {
                if (distanceMatrix[current][point] < minDistance) {
                    minDistance = distanceMatrix[current][point];
                    nearest = point;
                }
            }

            if (nearest !== -1) {
                route.push(nearest);
                unvisited.delete(nearest);
                current = nearest;
            }
        }

        return route;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
} 