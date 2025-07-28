import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService, PlannerLoginDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('planner/login')
    async plannerLogin(@Body() dto: PlannerLoginDto) {
        return await this.authService.plannerLogin(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Get('validate')
    async validateToken(@Request() req: any) {
        return { valid: true, user: req.user };
    }
} 