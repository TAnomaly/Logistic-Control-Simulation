import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './jwt.strategy';

export class PlannerLoginDto {
    email: string;
    password: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async plannerLogin(dto: PlannerLoginDto) {
        // Basit planner authentication (gerçek uygulamada veritabanından kontrol edilir)
        if (dto.email === 'planner@logistic.com' && dto.password === 'planner123') {
            const payload = {
                sub: 'planner-001',
                email: dto.email,
                role: UserRole.PLANNER,
                plannerId: 'planner-001',
                permissions: ['shipment:read', 'shipment:create', 'shipment:assign'],
            };

            return {
                access_token: await this.jwtService.signAsync(payload),
                planner: {
                    id: 'planner-001',
                    email: dto.email,
                    role: UserRole.PLANNER,
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