import { Injectable } from '@nestjs/common';
import { H3RouteOptimizationRepository, H3OptimizationAlgorithm } from '../../domain/repositories/h3-route-optimization.repository';
import {
    H3RouteOptimization,
    H3OptimizedRoutePoint,
    H3DeliveryPoint,
    Coordinates,
    H3TrafficAnalysis,
    H3WeatherAnalysis,
    TrafficLevel,
    WeatherCondition,
    H3TrafficHotspot,
    TrafficCongestionSummary,
    H3WeatherZone,
    WeatherAlert,
    WeatherSummary
} from '../../domain/entities/h3-route.entity';
import {
    latLngToCell,
    cellToLatLng,
    gridDisk,
    cellArea,
    edgeLength,
    H3Index,
    getRes0Cells,
    cellToParent,
    cellToChildren
} from 'h3-js';

@Injectable()
export class H3RouteOptimizationService implements H3RouteOptimizationRepository {
    private readonly EARTH_RADIUS = 6371; // km
    private readonly BASE_SPEED = 50; // km/h
    private readonly BASE_FUEL_RATE = 8; // km/liter

    async optimizeRouteWithH3(
        driverId: string,
        driverLocation: Coordinates,
        deliveries: H3DeliveryPoint[],
        h3Resolution: number = 9,
        algorithm: H3OptimizationAlgorithm = H3OptimizationAlgorithm.GREEDY,
        vehicleCapacity: number = 1000,
        vehicleVolume: number = 10
    ): Promise<H3RouteOptimization> {
        const startTime = Date.now();

        if (!deliveries || deliveries.length === 0) {
            return new H3RouteOptimization(
                driverId,
                [],
                0,
                0,
                0,
                100,
                `H3 ${algorithm.toUpperCase()} Algorithm`,
                h3Resolution,
                undefined,
                undefined,
                100,
                'No deliveries to optimize'
            );
        }

        // Convert driver location to H3
        const driverH3Index = latLngToCell(driverLocation.latitude, driverLocation.longitude, h3Resolution);

        // Create H3 grid for optimization
        const optimizationGrid = this.createOptimizationGrid(driverLocation, deliveries, h3Resolution);

        // Solve TSP using H3-based algorithm
        const route = await this.solveTspWithH3(optimizationGrid, algorithm);

        // Build optimized route with H3 data
        const optimizedRoute: H3OptimizedRoutePoint[] = [];
        let totalDistance = 0;
        let totalTime = 0;
        let cumulativeDistance = 0;
        let cumulativeTime = 0;

        for (let i = 0; i < route.length - 1; i++) {
            const pointIndex = route[i + 1];
            const delivery = deliveries[pointIndex - 1];

            let distanceFromPrevious: number;
            if (i === 0) {
                distanceFromPrevious = this.calculateH3Distance(driverH3Index, delivery.h3Index);
            } else {
                const prevDelivery = deliveries[route[i] - 1];
                distanceFromPrevious = this.calculateH3Distance(prevDelivery.h3Index, delivery.h3Index);
            }

            // Apply traffic and weather factors
            const trafficFactor = this.getTrafficFactor(delivery.h3Index);
            const weatherFactor = this.getWeatherFactor(delivery.h3Index);
            const adjustedDistance = distanceFromPrevious * trafficFactor * weatherFactor;

            const estimatedTime = Math.round(adjustedDistance * 60 / this.BASE_SPEED);

            cumulativeDistance += adjustedDistance;
            cumulativeTime += estimatedTime;
            totalDistance += adjustedDistance;
            totalTime += estimatedTime;

            const routePoint = new H3OptimizedRoutePoint(
                i + 1,
                delivery.id,
                delivery.address,
                delivery.coordinates,
                delivery.h3Index,
                Math.round(adjustedDistance * 100) / 100,
                estimatedTime,
                Math.round(cumulativeDistance * 100) / 100,
                cumulativeTime,
                this.getTrafficLevel(delivery.h3Index),
                this.getWeatherCondition(delivery.h3Index)
            );

            optimizedRoute.push(routePoint);
        }

        // Calculate fuel estimate with H3 factors
        const fuelEstimate = this.calculateH3FuelEstimate(totalDistance, vehicleCapacity, vehicleVolume);

        // Calculate efficiency with H3 optimization
        const efficiency = this.calculateH3Efficiency(totalDistance, deliveries.length, h3Resolution);

        // Calculate sustainability score
        const sustainabilityScore = await this.calculateSustainabilityScore(optimizedRoute, 'medium_truck', 0.7);

        // Analyze traffic and weather
        const trafficAnalysis = await this.analyzeTraffic(driverLocation.latitude, driverLocation.longitude, 50, h3Resolution);
        const weatherAnalysis = await this.analyzeWeather(driverLocation.latitude, driverLocation.longitude, 50, h3Resolution);

        const processingTime = Date.now() - startTime;

        return new H3RouteOptimization(
            driverId,
            optimizedRoute,
            Math.round(totalDistance * 100) / 100,
            totalTime,
            Math.round(fuelEstimate * 100) / 100,
            Math.round(efficiency * 10) / 10,
            `H3 ${algorithm.toUpperCase()} Algorithm`,
            h3Resolution,
            trafficAnalysis,
            weatherAnalysis,
            Math.round(sustainabilityScore * 10) / 10,
            `H3 route optimized in ${processingTime}ms`
        );
    }

    async analyzeTraffic(
        centerLat: number,
        centerLng: number,
        radiusKm: number,
        h3Resolution: number
    ): Promise<H3TrafficAnalysis> {
        const centerH3 = latLngToCell(centerLat, centerLng, h3Resolution);
        const radiusCells = Math.ceil(radiusKm / edgeLength(h3Resolution as any, 'km'));
        const nearbyCells = gridDisk(centerH3, radiusCells);

        const trafficHotspots: H3TrafficHotspot[] = [];
        let lightCount = 0, moderateCount = 0, heavyCount = 0, congestedCount = 0;

        for (const h3Index of nearbyCells) {
            const [lat, lng] = cellToLatLng(h3Index);
            const trafficLevel = this.getTrafficLevel(h3Index);
            const congestionScore = this.getCongestionScore(h3Index);

            trafficHotspots.push(new H3TrafficHotspot(
                h3Index,
                trafficLevel,
                congestionScore,
                new Coordinates(lat, lng)
            ));

            switch (trafficLevel) {
                case TrafficLevel.LIGHT: lightCount++; break;
                case TrafficLevel.MODERATE: moderateCount++; break;
                case TrafficLevel.HEAVY: heavyCount++; break;
                case TrafficLevel.CONGESTED: congestedCount++; break;
            }
        }

        const congestionSummary = new TrafficCongestionSummary(lightCount, moderateCount, heavyCount, congestedCount);

        return new H3TrafficAnalysis(
            centerH3,
            nearbyCells.length,
            trafficHotspots,
            congestionSummary
        );
    }

    async analyzeWeather(
        centerLat: number,
        centerLng: number,
        radiusKm: number,
        h3Resolution: number
    ): Promise<H3WeatherAnalysis> {
        const centerH3 = latLngToCell(centerLat, centerLng, h3Resolution);
        const radiusCells = Math.ceil(radiusKm / edgeLength(h3Resolution as any, 'km'));
        const nearbyCells = gridDisk(centerH3, radiusCells);

        const weatherZones: H3WeatherZone[] = [];
        const weatherAlerts: WeatherAlert[] = [];
        let clearCount = 0, cloudyCount = 0, rainCount = 0, snowCount = 0, fogCount = 0;

        for (const h3Index of nearbyCells) {
            const [lat, lng] = cellToLatLng(h3Index);
            const weatherCondition = this.getWeatherCondition(h3Index);
            const temperature = this.getTemperature(h3Index);
            const humidity = this.getHumidity(h3Index);

            weatherZones.push(new H3WeatherZone(
                h3Index,
                weatherCondition,
                temperature,
                humidity,
                new Coordinates(lat, lng)
            ));

            switch (weatherCondition) {
                case WeatherCondition.CLEAR: clearCount++; break;
                case WeatherCondition.CLOUDY: cloudyCount++; break;
                case WeatherCondition.RAIN: rainCount++; break;
                case WeatherCondition.SNOW: snowCount++; break;
                case WeatherCondition.FOG: fogCount++; break;
            }
        }

        const weatherSummary = new WeatherSummary(clearCount, cloudyCount, rainCount, snowCount, fogCount);

        return new H3WeatherAnalysis(
            centerH3,
            nearbyCells.length,
            weatherZones,
            weatherAlerts,
            weatherSummary
        );
    }

    async calculateSustainabilityScore(
        route: H3OptimizedRoutePoint[],
        vehicleType: string,
        loadFactor: number
    ): Promise<number> {
        const baseScore = 100;
        let deductions = 0;

        // Distance-based deduction
        const totalDistance = route.reduce((sum, point) => sum + point.distanceFromPrevious, 0);
        deductions += totalDistance * 0.5;

        // Traffic-based deduction
        const trafficDeductions = route.map(point => {
            switch (point.trafficLevel) {
                case TrafficLevel.LIGHT: return 0;
                case TrafficLevel.MODERATE: return 2;
                case TrafficLevel.HEAVY: return 5;
                case TrafficLevel.CONGESTED: return 10;
                default: return 0;
            }
        }).reduce((sum, deduction) => sum + deduction, 0);

        deductions += trafficDeductions;

        // Weather-based deduction
        const weatherDeductions = route.map(point => {
            switch (point.weatherCondition) {
                case WeatherCondition.CLEAR: return 0;
                case WeatherCondition.CLOUDY: return 1;
                case WeatherCondition.RAIN: return 3;
                case WeatherCondition.SNOW: return 8;
                case WeatherCondition.FOG: return 5;
                default: return 0;
            }
        }).reduce((sum, deduction) => sum + deduction, 0);

        deductions += weatherDeductions;

        // Vehicle type bonus
        const vehicleBonus = vehicleType === 'electric' ? 20 : vehicleType === 'hybrid' ? 10 : 0;

        return Math.max(0, Math.min(100, baseScore - deductions + vehicleBonus));
    }

    private createOptimizationGrid(
        driverLocation: Coordinates,
        deliveries: H3DeliveryPoint[],
        h3Resolution: number
    ): H3Index[] {
        const grid: H3Index[] = [];
        const centerH3 = latLngToCell(driverLocation.latitude, driverLocation.longitude, h3Resolution);

        // Add driver location
        grid.push(centerH3);

        // Add delivery points
        deliveries.forEach(delivery => {
            grid.push(delivery.h3Index);
        });

        return grid;
    }

    private async solveTspWithH3(
        grid: H3Index[],
        algorithm: H3OptimizationAlgorithm
    ): Promise<number[]> {
        // Validate H3 indices
        const validGrid = grid.filter(h3Index => {
            try {
                // Test if H3 index is valid
                cellToLatLng(h3Index);
                return true;
            } catch (error) {
                console.warn(`Invalid H3 index: ${h3Index}`);
                return false;
            }
        });

        if (validGrid.length === 0) {
            throw new Error('No valid H3 indices found');
        }

        switch (algorithm) {
            case H3OptimizationAlgorithm.GREEDY:
                return this.solveTspGreedy(validGrid);
            case H3OptimizationAlgorithm.TWO_OPT:
                return this.solveTspTwoOpt(validGrid);
            case H3OptimizationAlgorithm.GENETIC:
                return this.solveTspGenetic(validGrid);
            case H3OptimizationAlgorithm.ANT_COLONY:
                return this.solveTspAntColony(validGrid);
            default:
                return this.solveTspGreedy(validGrid);
        }
    }

    private solveTspGreedy(grid: H3Index[]): number[] {
        const n = grid.length;
        const unvisited = new Set<number>();
        for (let i = 1; i < n; i++) {
            unvisited.add(i);
        }

        const route: number[] = [0];
        let current = 0;

        while (unvisited.size > 0) {
            let nearest = -1;
            let minDistance = Infinity;

            for (const point of unvisited) {
                const distance = this.calculateH3Distance(grid[current], grid[point]);
                if (distance < minDistance) {
                    minDistance = distance;
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

    private solveTspTwoOpt(grid: H3Index[]): number[] {
        // Start with greedy solution
        let route = this.solveTspGreedy(grid);
        const n = route.length;
        let improved = true;
        let iterations = 0;
        const maxIterations = 100;

        while (improved && iterations < maxIterations) {
            improved = false;
            for (let i = 1; i < n - 2; i++) {
                for (let j = i + 1; j < n; j++) {
                    if (j - i === 1) continue;

                    const newRoute = this.twoOptSwap(route, i, j);
                    const currentDistance = this.calculateRouteDistance(route, grid);
                    const newDistance = this.calculateRouteDistance(newRoute, grid);

                    if (newDistance < currentDistance) {
                        route = newRoute;
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
            iterations++;
        }

        return route;
    }

    private solveTspGenetic(grid: H3Index[]): number[] {
        // Simplified genetic algorithm
        const populationSize = 50;
        const generations = 100;
        let population: number[][] = [];

        // Initialize population
        for (let i = 0; i < populationSize; i++) {
            population.push(this.generateRandomRoute(grid.length));
        }

        // Evolution
        for (let gen = 0; gen < generations; gen++) {
            population = this.evolvePopulation(population, grid);
        }

        // Return best route
        return this.getBestRoute(population, grid);
    }

    private solveTspAntColony(grid: H3Index[]): number[] {
        // Simplified ant colony optimization
        const antCount = 30;
        const iterations = 50;
        const evaporationRate = 0.1;
        const pheromoneWeight = 1.0;
        const distanceWeight = 2.0;

        const n = grid.length;
        let pheromone: number[][] = Array(n).fill(null).map(() => Array(n).fill(1.0));

        let bestRoute: number[] = [];
        let bestDistance = Infinity;

        for (let iter = 0; iter < iterations; iter++) {
            const antRoutes: number[][] = [];

            // Generate ant routes
            for (let ant = 0; ant < antCount; ant++) {
                const route = this.generateAntRoute(grid, pheromone, pheromoneWeight, distanceWeight);
                antRoutes.push(route);
                const distance = this.calculateRouteDistance(route, grid);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestRoute = [...route];
                }
            }

            // Update pheromone
            this.updatePheromone(pheromone, antRoutes, grid, evaporationRate);
        }

        return bestRoute;
    }

    private calculateH3Distance(h3Index1: H3Index, h3Index2: H3Index): number {
        try {
            const [lat1, lng1] = cellToLatLng(h3Index1);
            const [lat2, lng2] = cellToLatLng(h3Index2);
            return this.calculateDistanceHaversine(lat1, lng1, lat2, lng2);
        } catch (error) {
            console.warn(`Error calculating H3 distance: ${error.message}`);
            return 0;
        }
    }

    private calculateDistanceHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.asin(Math.sqrt(a));
        return this.EARTH_RADIUS * c;
    }

    private calculateRouteDistance(route: number[], grid: H3Index[]): number {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.calculateH3Distance(grid[route[i]], grid[route[i + 1]]);
        }
        return totalDistance;
    }

    private twoOptSwap(route: number[], i: number, j: number): number[] {
        const newRoute = route.slice(0, i + 1);
        newRoute.push(...route.slice(i + 1, j + 1).reverse());
        newRoute.push(...route.slice(j + 1));
        return newRoute;
    }

    private generateRandomRoute(length: number): number[] {
        const route = [0];
        const unvisited = Array.from({ length: length - 1 }, (_, i) => i + 1);

        while (unvisited.length > 0) {
            const randomIndex = Math.floor(Math.random() * unvisited.length);
            route.push(unvisited[randomIndex]);
            unvisited.splice(randomIndex, 1);
        }

        return route;
    }

    private evolvePopulation(population: number[][], grid: H3Index[]): number[][] {
        const newPopulation: number[][] = [];

        // Keep best 10%
        const sortedPopulation = population.sort((a, b) =>
            this.calculateRouteDistance(a, grid) - this.calculateRouteDistance(b, grid)
        );

        const eliteCount = Math.floor(population.length * 0.1);
        newPopulation.push(...sortedPopulation.slice(0, eliteCount));

        // Generate rest through crossover and mutation
        while (newPopulation.length < population.length) {
            const parent1 = this.selectParent(population, grid);
            const parent2 = this.selectParent(population, grid);
            const child = this.crossover(parent1, parent2);
            const mutatedChild = this.mutate(child);
            newPopulation.push(mutatedChild);
        }

        return newPopulation;
    }

    private selectParent(population: number[][], grid: H3Index[]): number[] {
        // Tournament selection
        const tournamentSize = 3;
        let best = population[Math.floor(Math.random() * population.length)];

        for (let i = 1; i < tournamentSize; i++) {
            const candidate = population[Math.floor(Math.random() * population.length)];
            if (this.calculateRouteDistance(candidate, grid) < this.calculateRouteDistance(best, grid)) {
                best = candidate;
            }
        }

        return best;
    }

    private crossover(parent1: number[], parent2: number[]): number[] {
        // Order crossover
        const start = Math.floor(Math.random() * (parent1.length - 1));
        const end = start + Math.floor(Math.random() * (parent1.length - start));

        const child = new Array(parent1.length).fill(-1);

        // Copy segment from parent1
        for (let i = start; i <= end; i++) {
            child[i] = parent1[i];
        }

        // Fill remaining positions from parent2
        let parent2Index = 0;
        for (let i = 0; i < child.length; i++) {
            if (child[i] === -1) {
                while (child.includes(parent2[parent2Index])) {
                    parent2Index++;
                }
                child[i] = parent2[parent2Index];
                parent2Index++;
            }
        }

        return child;
    }

    private mutate(route: number[]): number[] {
        const mutationRate = 0.01;
        const newRoute = [...route];

        for (let i = 1; i < newRoute.length; i++) {
            if (Math.random() < mutationRate) {
                const j = Math.floor(Math.random() * (newRoute.length - 1)) + 1;
                [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
            }
        }

        return newRoute;
    }

    private getBestRoute(population: number[][], grid: H3Index[]): number[] {
        return population.reduce((best, current) =>
            this.calculateRouteDistance(current, grid) < this.calculateRouteDistance(best, grid) ? current : best
        );
    }

    private generateAntRoute(
        grid: H3Index[],
        pheromone: number[][],
        pheromoneWeight: number,
        distanceWeight: number
    ): number[] {
        const n = grid.length;
        const route: number[] = [0];
        const unvisited = new Set<number>();
        for (let i = 1; i < n; i++) {
            unvisited.add(i);
        }

        let current = 0;
        while (unvisited.size > 0) {
            const probabilities: number[] = [];
            const candidates: number[] = [];

            for (const next of unvisited) {
                const distance = this.calculateH3Distance(grid[current], grid[next]);
                const pheromoneLevel = pheromone[current][next];
                const probability = (pheromoneLevel ** pheromoneWeight) * ((1 / distance) ** distanceWeight);
                probabilities.push(probability);
                candidates.push(next);
            }

            // Roulette wheel selection
            const totalProbability = probabilities.reduce((sum, p) => sum + p, 0);
            let random = Math.random() * totalProbability;
            let selectedIndex = 0;

            for (let i = 0; i < probabilities.length; i++) {
                random -= probabilities[i];
                if (random <= 0) {
                    selectedIndex = i;
                    break;
                }
            }

            const next = candidates[selectedIndex];
            route.push(next);
            unvisited.delete(next);
            current = next;
        }

        return route;
    }

    private updatePheromone(
        pheromone: number[][],
        antRoutes: number[][],
        grid: H3Index[],
        evaporationRate: number
    ): void {
        const n = grid.length;

        // Evaporate pheromone
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                pheromone[i][j] *= (1 - evaporationRate);
            }
        }

        // Add pheromone from ant routes
        for (const route of antRoutes) {
            const distance = this.calculateRouteDistance(route, grid);
            const pheromoneToAdd = 1 / distance;

            for (let i = 0; i < route.length - 1; i++) {
                const from = route[i];
                const to = route[i + 1];
                pheromone[from][to] += pheromoneToAdd;
                pheromone[to][from] += pheromoneToAdd;
            }
        }
    }

    private calculateH3FuelEstimate(distance: number, capacity: number, volume: number): number {
        const baseFuelRate = this.BASE_FUEL_RATE;
        const loadEfficiency = 1.0 - (capacity / 1000) * 0.2;
        return distance / (baseFuelRate * loadEfficiency);
    }

    private calculateH3Efficiency(distance: number, deliveryCount: number, resolution: number): number {
        const baseEfficiency = 100 - (distance / deliveryCount * 2);
        const resolutionBonus = (10 - resolution) * 2; // Higher resolution = better efficiency
        return Math.max(0, Math.min(100, baseEfficiency + resolutionBonus));
    }

    private getTrafficFactor(h3Index: H3Index): number {
        const trafficLevel = this.getTrafficLevel(h3Index);
        switch (trafficLevel) {
            case TrafficLevel.LIGHT: return 1.0;
            case TrafficLevel.MODERATE: return 1.2;
            case TrafficLevel.HEAVY: return 1.5;
            case TrafficLevel.CONGESTED: return 2.0;
            default: return 1.0;
        }
    }

    private getWeatherFactor(h3Index: H3Index): number {
        const weatherCondition = this.getWeatherCondition(h3Index);
        switch (weatherCondition) {
            case WeatherCondition.CLEAR: return 1.0;
            case WeatherCondition.CLOUDY: return 1.1;
            case WeatherCondition.RAIN: return 1.3;
            case WeatherCondition.SNOW: return 1.8;
            case WeatherCondition.FOG: return 1.4;
            default: return 1.0;
        }
    }

    private getTrafficLevel(h3Index: H3Index): TrafficLevel {
        // Simulate traffic based on H3 index
        const hash = this.hashH3Index(h3Index);
        const trafficValue = hash % 100;

        if (trafficValue < 60) return TrafficLevel.LIGHT;
        if (trafficValue < 80) return TrafficLevel.MODERATE;
        if (trafficValue < 95) return TrafficLevel.HEAVY;
        return TrafficLevel.CONGESTED;
    }

    private getWeatherCondition(h3Index: H3Index): WeatherCondition {
        // Simulate weather based on H3 index
        const hash = this.hashH3Index(h3Index);
        const weatherValue = hash % 100;

        if (weatherValue < 70) return WeatherCondition.CLEAR;
        if (weatherValue < 85) return WeatherCondition.CLOUDY;
        if (weatherValue < 95) return WeatherCondition.RAIN;
        if (weatherValue < 98) return WeatherCondition.SNOW;
        return WeatherCondition.FOG;
    }

    private getCongestionScore(h3Index: H3Index): number {
        const hash = this.hashH3Index(h3Index);
        return (hash % 100) / 100;
    }

    private getTemperature(h3Index: H3Index): number {
        const hash = this.hashH3Index(h3Index);
        return 15 + (hash % 30) - 15; // -15 to +15 degrees
    }

    private getHumidity(h3Index: H3Index): number {
        const hash = this.hashH3Index(h3Index);
        return 40 + (hash % 40); // 40-80%
    }

    private hashH3Index(h3Index: H3Index): number {
        let hash = 0;
        for (let i = 0; i < h3Index.length; i++) {
            const char = h3Index.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
} 