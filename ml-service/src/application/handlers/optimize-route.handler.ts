import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { OptimizeRouteCommand } from '../commands/optimize-route.command';
import { RouteOptimization } from '../../domain/entities/route-optimization.entity';
import { RouteOptimizationRepository } from '../../domain/repositories/route-optimization.repository';

@CommandHandler(OptimizeRouteCommand)
export class OptimizeRouteHandler implements ICommandHandler<OptimizeRouteCommand> {
    constructor(
        @Inject('RouteOptimizationRepository')
        private readonly routeOptimizationRepository: RouteOptimizationRepository
    ) { }

    async execute(command: OptimizeRouteCommand): Promise<RouteOptimization> {
        return this.routeOptimizationRepository.optimizeRoute(
            command.driverId,
            command.driverLocation,
            command.deliveries,
            command.vehicleCapacity,
            command.vehicleVolume
        );
    }
} 