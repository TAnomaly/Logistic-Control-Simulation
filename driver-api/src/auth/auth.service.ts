import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './jwt.strategy';

export class DriverLoginDto {
    licenseNumber: string;
    phoneNumber: string;
}

export class AdminLoginDto {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async driverLogin(dto: DriverLoginDto) {
        // Burada gerçek driver authentication yapılacak
        // Şimdilik basit bir kontrol
        if (dto.licenseNumber && dto.phoneNumber) {
            const payload = {
                sub: `driver-${dto.licenseNumber}`,
                email: `${dto.licenseNumber}@driver.com`,
                role: UserRole.DRIVER,
                driverId: `driver-${dto.licenseNumber}`,
                permissions: ['location:update', 'shipment:read'],
            };
            return {
                access_token: await this.jwtService.signAsync(payload),
                driver: {
                    id: `driver-${dto.licenseNumber}`,
                    licenseNumber: dto.licenseNumber,
                    role: UserRole.DRIVER,
                },
            };
        }
        throw new UnauthorizedException('Invalid credentials');
    }

    async adminLogin(dto: AdminLoginDto) {
        // Admin credentials - production'da database'den kontrol edilecek
        if (dto.email === 'admin@logistic.com' && dto.password === 'admin123') {
            const payload = {
                sub: 'admin-001',
                email: dto.email,
                role: UserRole.ADMIN,
                adminId: 'admin-001',
                permissions: ['driver:create', 'driver:read', 'driver:update', 'shipment:assign'],
            };
            return {
                access_token: await this.jwtService.signAsync(payload),
                admin: {
                    id: 'admin-001',
                    email: dto.email,
                    role: UserRole.ADMIN,
                },
            };
        }
        throw new UnauthorizedException('Invalid credentials');
    }

    async validateToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
} 