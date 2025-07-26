import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Assignment } from '../../shared/assignment.entity';

@Injectable()
export class AssignmentListener {
    private assignments: Assignment[] = [];

    @RabbitSubscribe({
        exchange: 'assignment-exchange',
        routingKey: 'assignment.created',
        queue: 'driver-assignment-queue',
    })
    async handleAssignmentCreated(msg: Assignment) {
        this.assignments.push(msg);
        console.log('Yeni görev alındı:', msg);
    }

    getAssignments(): Assignment[] {
        return this.assignments;
    }
} 