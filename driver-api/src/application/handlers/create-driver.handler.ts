import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateDriverCommand } from '../commands/create-driver.command';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { Driver, DriverStatus } from '../../domain/entities/driver.entity';
import { DriverCreatedEvent } from '../../domain/events/driver-created.event';

@CommandHandler(CreateDriverCommand)
export class CreateDriverHandler implements ICommandHandler<CreateDriverCommand> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository,
        private readonly eventBus: EventBus
    ) { }

    async execute(command: CreateDriverCommand): Promise<Driver> {
        const driver = new Driver();
        driver.name = command.name;
        driver.licenseNumber = command.licenseNumber;
        driver.phoneNumber = command.phoneNumber;
        driver.address = command.address || '';
        driver.status = DriverStatus.AVAILABLE;
        driver.lastActiveAt = new Date();

        const savedDriver = await this.driverRepository.save(driver);

        // Create domain event
        const event = DriverCreatedEvent.fromDriver(savedDriver);

        // Publish event locally
        this.eventBus.publish(event);

        return savedDriver;
    }
} 