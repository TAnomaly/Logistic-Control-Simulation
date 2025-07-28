import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService, DriverLoginDto, AdminLoginDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('driver/login')
    async driverLogin(@Body() dto: DriverLoginDto) {
        return await this.authService.driverLogin(dto);
    }

    @Post('admin/login')
    async adminLogin(@Body() dto: AdminLoginDto) {
        return await this.authService.adminLogin(dto);
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