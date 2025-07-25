import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Assignment } from '../../shared/assignment.entity';
export declare class AssignmentController {
    private readonly amqp;
    constructor(amqp: AmqpConnection);
    createAssignment(body: Omit<Assignment, 'id' | 'assignedAt' | 'status'>): Promise<Assignment>;
}
