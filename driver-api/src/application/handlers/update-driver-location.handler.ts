import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { UpdateDriverLocationCommand } from '../commands/update-driver-location.command';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { DriverLocationUpdatedEvent } from '../../domain/events/driver-location-updated.event';
import { RedisService } from '../../infrastructure/redis/redis.service';

@CommandHandler(UpdateDriverLocationCommand)
export class UpdateDriverLocationHandler implements ICommandHandler<UpdateDriverLocationCommand> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository,
        private readonly eventBus: EventBus,
        private readonly redisService: RedisService,
    ) { }

    async execute(command: UpdateDriverLocationCommand): Promise<void> {
        const { driverId, latitude, longitude, address } = command;

        // Update driver location in database
        await this.driverRepository.updateLocation(driverId, latitude, longitude, address || '');

        // Update location in Redis cache
        await this.redisService.set(`driver:${driverId}:location`, {
            latitude,
            longitude,
            address: address || '',
            timestamp: new Date().toISOString(),
        });

        // Publish domain event
        const event = new DriverLocationUpdatedEvent(driverId, latitude, longitude, address || '');
        this.eventBus.publish(event);

        console.log(`📍 Driver location updated: ${driverId} at ${latitude}, ${longitude}`);
    }
} 