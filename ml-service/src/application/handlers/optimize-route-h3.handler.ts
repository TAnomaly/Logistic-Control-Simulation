import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { OptimizeRouteH3Command } from '../commands/optimize-route-h3.command';
import { H3RouteOptimization } from '../../domain/entities/h3-route.entity';
import { H3RouteOptimizationRepository } from '../../domain/repositories/h3-route-optimization.repository';

@CommandHandler(OptimizeRouteH3Command)
export class OptimizeRouteH3Handler implements ICommandHandler<OptimizeRouteH3Command> {
    constructor(
        @Inject('H3RouteOptimizationRepository')
        private readonly h3RouteOptimizationRepository: H3RouteOptimizationRepository
    ) { }

    async execute(command: OptimizeRouteH3Command): Promise<H3RouteOptimization> {
        return this.h3RouteOptimizationRepository.optimizeRouteWithH3(
            command.driverId,
            command.driverLocation,
            command.deliveries,
            command.h3Resolution,
            command.algorithm,
            command.vehicleCapacity,
            command.vehicleVolume
        );
    }
} 