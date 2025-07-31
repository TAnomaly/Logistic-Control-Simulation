import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateDriverLocationCommand } from '../commands/update-driver-location.command';
import { DriverTrackingRepository } from '../../domain/repositories/driver-tracking.repository';
import { DriverLocation } from '../../domain/entities/driver-track.entity';

@CommandHandler(UpdateDriverLocationCommand)
export class UpdateDriverLocationHandler implements ICommandHandler<UpdateDriverLocationCommand> {
    constructor(
        @Inject('DriverTrackingRepository')
        private readonly driverTrackingRepository: DriverTrackingRepository
    ) { }

    async execute(command: UpdateDriverLocationCommand): Promise<void> {
        const location = new DriverLocation(
            command.driverId,
            command.coordinates,
            command.timestamp,
            command.speed,
            command.heading,
            command.accuracy
        );

        await this.driverTrackingRepository.saveDriverLocation(command.driverId, location);
    }
} 