import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'Hello from Driver API!';
    }

    getHealth(): { status: string; timestamp: string } {
        return {
            status: 'OK',
            timestamp: new Date().toISOString()
        };
    }
} 