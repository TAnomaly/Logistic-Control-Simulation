import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Shipment } from '../../domain/entities/shipment.entity';
import { TrackingEvent } from '../../domain/entities/tracking-event.entity';
import { Gate } from '../../domain/entities/gate.entity';
import { OutboxEvent } from '../../domain/entities/outbox-event.entity';
import { Driver } from '../../domain/entities/driver.entity';
import { Assignment } from '../../domain/entities/assignment.entity';

/** ??? Config ?!
 * TypeORM veritabanı konfigürasyonu
 * Environment variable'ları kullanarak dinamik konfigürasyon sağlar
 */
export const createTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    // DATABASE_URL varsa onu kullan, yoksa ayrı ayrı parametreleri kullan
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
        return {
            type: 'postgres',
            url: databaseUrl,
            ssl: false,
            entities: [Shipment, TrackingEvent, Gate, OutboxEvent, Driver, Assignment],
            synchronize: configService.get<boolean>('DB_SYNC', false),
            logging: configService.get<boolean>('DB_LOGGING', false),
            extra: {
                ssl: false
            }
        };
    }

    return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'logistic_control'),
        entities: [Shipment, TrackingEvent, Gate, OutboxEvent, Driver, Assignment],
        synchronize: configService.get<boolean>('DB_SYNC', false),
        logging: configService.get<boolean>('DB_LOGGING', false),
        extra: {
            connectionLimit: 10,
            idleTimeoutMillis: 30000,
            ssl: false,
            sslmode: 'disable',
        },

        // Retry logic
        retryAttempts: 3,
        retryDelay: 3000,

        // Migration ayarları
        migrations: ['dist/infrastructure/database/migrations/*.js'],
        migrationsRun: false,
        migrationsTableName: 'migrations',

        // SSL tamamen kapalı (development için)
        ssl: false,
    };
};

/**
 * Test environment için özel konfigürasyon
 */
export const createTestTypeOrmConfig = (): TypeOrmModuleOptions => {
    return {
        type: 'postgres',
        host: 'localhost',
        port: 5433, // Test için farklı port
        username: 'test_user',
        password: 'test_password',
        database: 'logistic_control_test',
        entities: [Shipment, TrackingEvent, Gate],
        synchronize: true, // Test için otomatik schema oluşturma
        logging: false,
        dropSchema: true, // Her test öncesi temizle
    };
}; 