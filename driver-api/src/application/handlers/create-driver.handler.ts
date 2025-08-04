import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateDriverCommand } from '../commands/create-driver.command';
import { TypeOrmDriverRepository } from '../../infrastructure/repositories/typeorm-driver.repository';
import { TypeOrmOutboxEventRepository } from '../../infrastructure/repositories/typeorm-outbox-event.repository';
import { Driver, DriverStatus } from '../../domain/entities/driver.entity';
import { DriverCreatedEvent } from '../../domain/events/driver-created.event';
import { OutboxEvent, OutboxEventStatus } from '../../domain/entities/outbox-event.entity';

@CommandHandler(CreateDriverCommand)
export class CreateDriverHandler implements ICommandHandler<CreateDriverCommand> {
    constructor(
        private readonly driverRepository: TypeOrmDriverRepository,
        private readonly outboxEventRepository: TypeOrmOutboxEventRepository,
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

        // Save to outbox for reliable message delivery
        const outboxEvent = new OutboxEvent();
        outboxEvent.eventType = 'DriverCreated';
        outboxEvent.eventData = {
            driverId: event.driverId,
            name: event.name,
            licenseNumber: event.licenseNumber,
            status: event.status,
            createdAt: event.createdAt
        };
        outboxEvent.status = OutboxEventStatus.PENDING;
        outboxEvent.routingKey = 'driver.created';
        outboxEvent.exchange = 'logistics';

        await this.outboxEventRepository.save(outboxEvent);

        // Also publish locally for immediate processing
        this.eventBus.publish(event);

        return savedDriver;
    }
} 