import { Controller, Post, Body } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Assignment } from '../../shared/assignment.entity';
import { v4 as uuidv4 } from 'uuid';

@Controller('assignments')
export class AssignmentController {
    constructor(private readonly amqp: AmqpConnection) { }

    @Post()
    async createAssignment(@Body() body: Omit<Assignment, 'id' | 'assignedAt' | 'status'>): Promise<Assignment> {
        const assignment: Assignment = {
            id: uuidv4(),
            assignedAt: new Date(),
            status: 'ASSIGNED',
            ...body,
        };
        // RabbitMQ'ya event publish
        await this.amqp.publish('assignment-exchange', 'assignment.created', assignment);
        return assignment;
    }
} 