import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Driver } from '../domain/entities/driver.entity';
import { TypeOrmDriverRepository } from '../infrastructure/repositories/typeorm-driver.repository';

@Module({
    imports: [
        ConfigModule.forRoot(),
        PassportModule,
        TypeOrmModule.forFeature([Driver]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET', 'your-super-secret-key-here'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
                },

            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard, TypeOrmDriverRepository],
    exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { } 