import { Controller, Get } from '@nestjs/common';
import { AssignmentListener } from './assignment.listener';
import { Assignment } from '../../shared/assignment.entity';

@Controller('assignments')
export class AssignmentController {
    constructor(private readonly assignmentListener: AssignmentListener) { }

    @Get()
    getAssignments(): Assignment[] {
        return this.assignmentListener.getAssignments();
    }
} 