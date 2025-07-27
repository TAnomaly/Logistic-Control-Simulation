import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateDriverLocationCommand } from '../commands/update-driver-location.command';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { DriverLocationUpdatedEvent } from '../../domain/events/driver-location-updated.event';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { DriverLocation } from '../../domain/entities/driver-location.entity';
import { RabbitMQService } from '../../infrastructure/rabbitmq/rabbitmq.service';

@CommandHandler(UpdateDriverLocationCommand)
export class UpdateDriverLocationHandler implements ICommandHandler<UpdateDriverLocationCommand> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository,
        @InjectRepository(DriverLocation)
        private readonly driverLocationRepository: Repository<DriverLocation>,
        private readonly eventBus: EventBus,
        private readonly redisService: RedisService,
        private readonly rabbitmqService: RabbitMQService,
    ) { }

    async execute(command: UpdateDriverLocationCommand): Promise<void> {
        const { driverId, latitude, longitude, address } = command;

        try {
            console.log(`🔍 Starting location update for driver: ${driverId}`);

            // Update driver location in main driver table
            await this.driverRepository.updateLocation(driverId, latitude, longitude, address || '');

            // Save location history to driver_locations table
            console.log(`💾 Creating location record...`);
            const locationRecord = this.driverLocationRepository.create({
                driverId,
                latitude,
                longitude,
                address: address || '',
                recordedAt: new Date(),
            });
            console.log(`💾 Location record created:`, locationRecord);

            console.log(`💾 Saving to database...`);
            const savedLocation = await this.driverLocationRepository.save(locationRecord);
            console.log(`✅ Location saved with ID:`, savedLocation.id);

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

            // Publish event to RabbitMQ for ML service
            await this.rabbitmqService.publishEvent('driver.location.updated', {
                driver_id: driverId,
                latitude,
                longitude,
                address: address || '',
                timestamp: new Date().toISOString()
            }, 'driver.location.updated');

            console.log(`📍 Driver location updated: ${driverId} at ${latitude}, ${longitude}`);
        } catch (error) {
            console.error(`❌ Error updating driver location:`, error);
            throw error;
        }
    }
} 