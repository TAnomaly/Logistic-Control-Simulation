import { Controller, Get, Post, Put, Body, Param, Query, HttpStatus, HttpCode, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment, AssignmentStatus } from '../../domain/entities/assignment.entity';
import { Driver } from '../../domain/entities/driver.entity';

@Controller('api/assignments')
export class AssignmentController {
    constructor(
        @InjectRepository(Assignment)
        private readonly assignmentRepository: Repository<Assignment>,
        @InjectRepository(Driver)
        private readonly driverRepository: Repository<Driver>,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createAssignment(@Body() body: { driverId: string; taskType: string; shipmentId?: string; description?: string }): Promise<Assignment> {
        const driver = await this.driverRepository.findOneByOrFail({ id: body.driverId });
        const assignment = this.assignmentRepository.create({
            driver,
            taskType: body.taskType,
            status: AssignmentStatus.ASSIGNED,
            description: body.description,
            shipment: body.shipmentId ? { id: body.shipmentId } : undefined,
        });
        return await this.assignmentRepository.save(assignment);
    }

    @Get()
    async getAssignments(): Promise<Assignment[]> {
        return await this.assignmentRepository.find({ relations: ['driver', 'shipment'] });
    }

    @Get('driver/:driverId')
    async getAssignmentsByDriver(@Param('driverId') driverId: string): Promise<Assignment[]> {
        return await this.assignmentRepository.find({ where: { driver: { id: driverId } }, relations: ['driver', 'shipment'] });
    }

    @Put(':id/status')
    async updateAssignmentStatus(@Param('id') id: string, @Body() body: { status: AssignmentStatus }): Promise<Assignment> {
        await this.assignmentRepository.update(id, { status: body.status });
        const assignment = await this.assignmentRepository.findOne({ where: { id }, relations: ['driver', 'shipment'] });
        if (!assignment) throw new Error('Assignment not found');
        return assignment;
    }

    // GÖREVİ SİL
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAssignment(@Param('id') id: string): Promise<void> {
        const result = await this.assignmentRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Assignment not found');
        }
    }

    // GÖREVİ GÜNCELLE (taskType, description, driver, shipment)
    @Put(':id')
    async updateAssignment(
        @Param('id') id: string,
        @Body() body: { taskType?: string; description?: string; driverId?: string; shipmentId?: string }
    ): Promise<Assignment> {
        const assignment = await this.assignmentRepository.findOne({ where: { id }, relations: ['driver', 'shipment'] });
        if (!assignment) throw new Error('Assignment not found');
        if (body.taskType !== undefined) assignment.taskType = body.taskType;
        if (body.description !== undefined) assignment.description = body.description;
        if (body.driverId !== undefined) {
            const driver = await this.driverRepository.findOneByOrFail({ id: body.driverId });
            assignment.driver = driver;
        }
        if (body.shipmentId !== undefined) {
            assignment.shipment = body.shipmentId ? { id: body.shipmentId } as any : undefined;
        }
        return await this.assignmentRepository.save(assignment);
    }
} 