import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JWTPayload {
    sub: string;           // User ID
    email: string;         // User email
    role: UserRole;        // User role
    plannerId?: string;    // Planner ID (if planner)
    permissions: string[]; // Specific permissions
    iat: number;          // Issued at
    exp: number;          // Expiration time
}

export enum UserRole {
    ADMIN = 'admin',
    DISPATCHER = 'dispatcher',
    DRIVER = 'driver',
    CUSTOMER = 'customer',
    WAREHOUSE_MANAGER = 'warehouse_manager',
    PLANNER = 'planner'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', 'your-super-secret-key-here'),
        });
    }

    async validate(payload: JWTPayload) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            plannerId: payload.plannerId,
            permissions: payload.permissions,
        };
    }
} 