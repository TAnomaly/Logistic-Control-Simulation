import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RouteOptimizationController } from './controllers/route-optimization.controller';
import { RouteOptimizationService } from './infrastructure/services/route-optimization.service';
import { H3RouteOptimizationService } from './infrastructure/services/h3-route-optimization.service';
import { WebhookConsumerService } from './infrastructure/services/webhook-consumer.service';
import { OptimizeRouteHandler } from './application/handlers/optimize-route.handler';
import { OptimizeRouteH3Handler } from './application/handlers/optimize-route-h3.handler';
import { RouteOptimizationRepository } from './domain/repositories/route-optimization.repository';
import { H3RouteOptimizationRepository } from './domain/repositories/h3-route-optimization.repository';

const CommandHandlers = [OptimizeRouteHandler, OptimizeRouteH3Handler];

@Module({
    imports: [CqrsModule],
    controllers: [RouteOptimizationController],
    providers: [
        ...CommandHandlers,
        RouteOptimizationService,
        H3RouteOptimizationService,
        WebhookConsumerService,
        {
            provide: 'RouteOptimizationRepository',
            useClass: RouteOptimizationService,
        },
        {
            provide: 'H3RouteOptimizationRepository',
            useClass: H3RouteOptimizationService,
        },
    ],
})
export class MlModule { } 