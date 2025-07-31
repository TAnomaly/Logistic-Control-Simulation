import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TrackingController } from './controllers/tracking.controller';
import { TrackingGateway } from './gateways/tracking.gateway';
import { DriverTrackingService } from './infrastructure/services/driver-tracking.service';
import { WebhookConsumerService } from './infrastructure/services/webhook-consumer.service';
import { UpdateDriverLocationHandler } from './application/handlers/update-driver-location.handler';
import { DriverTrackingRepository } from './domain/repositories/driver-tracking.repository';

const CommandHandlers = [UpdateDriverLocationHandler];

@Module({
    imports: [CqrsModule],
    controllers: [TrackingController],
    providers: [
        ...CommandHandlers,
        TrackingGateway,
        DriverTrackingService,
        WebhookConsumerService,
        {
            provide: 'DriverTrackingRepository',
            useClass: DriverTrackingService,
        },
    ],
})
export class TrackingModule { } 