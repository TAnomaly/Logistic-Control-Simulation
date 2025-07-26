import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateDriverCommand } from '../commands/create-driver.command';
import { DriverRepository } from '../../domain/repositories/driver.repository';
import { Driver } from '../../domain/entities/driver.entity';
export declare class CreateDriverHandler implements ICommandHandler<CreateDriverCommand> {
    private readonly driverRepository;
    private readonly eventBus;
    constructor(driverRepository: DriverRepository, eventBus: EventBus);
    execute(command: CreateDriverCommand): Promise<Driver>;
}
