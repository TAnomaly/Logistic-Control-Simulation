import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DriverTrackingService } from '../infrastructure/services/driver-tracking.service';

@WebSocketGateway({
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TrackingGateway.name);
    private connectedClients = new Map<string, Socket>();

    constructor(private readonly driverTrackingService: DriverTrackingService) {
        // Broadcast driver updates every 5 seconds
        setInterval(async () => {
            await this.broadcastDriverUpdates();
        }, 5000);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.connectedClients.set(client.id, client);

        // Send initial data
        this.sendInitialData(client);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }

    @SubscribeMessage('subscribe_to_drivers')
    async handleSubscribeToDrivers(client: Socket) {
        this.logger.log(`Client ${client.id} subscribed to driver updates`);
        client.join('drivers');

        // Send current active drivers
        const drivers = await this.driverTrackingService.getAllActiveDrivers();
        client.emit('drivers_update', {
            drivers,
            timestamp: new Date().toISOString()
        });
    }

    @SubscribeMessage('subscribe_to_driver')
    async handleSubscribeToDriver(client: Socket, payload: { driverId: string }) {
        const { driverId } = payload;
        this.logger.log(`Client ${client.id} subscribed to driver ${driverId}`);
        client.join(`driver_${driverId}`);

        // Send current driver data
        const driver = await this.driverTrackingService.getDriverById(driverId);
        if (driver) {
            client.emit('driver_update', {
                driver,
                timestamp: new Date().toISOString()
            });
        }
    }

    @SubscribeMessage('unsubscribe_from_driver')
    handleUnsubscribeFromDriver(client: Socket, payload: { driverId: string }) {
        const { driverId } = payload;
        this.logger.log(`Client ${client.id} unsubscribed from driver ${driverId}`);
        client.leave(`driver_${driverId}`);
    }

    async broadcastDriverUpdates() {
        try {
            const drivers = await this.driverTrackingService.getAllActiveDrivers();

            this.server.to('drivers').emit('drivers_update', {
                drivers,
                timestamp: new Date().toISOString()
            });

            // Broadcast individual driver updates
            for (const driver of drivers) {
                this.server.to(`driver_${driver.driverId}`).emit('driver_update', {
                    driver,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            this.logger.error('Failed to broadcast driver updates:', error);
        }
    }

    private async sendInitialData(client: Socket) {
        try {
            const drivers = await this.driverTrackingService.getAllActiveDrivers();
            client.emit('initial_data', {
                drivers,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.logger.error('Failed to send initial data:', error);
        }
    }

    // Method to broadcast driver location update (called from webhook consumer)
    async broadcastDriverLocationUpdate(driverId: string, location: any) {
        this.server.to(`driver_${driverId}`).emit('location_update', {
            driverId,
            location,
            timestamp: new Date().toISOString()
        });
    }
} 