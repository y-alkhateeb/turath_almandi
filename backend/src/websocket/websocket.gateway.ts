import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/events',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway initialized');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    this.logger.log(`CORS enabled for: ${frontendUrl}`);
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit a new transaction event to all connected clients
   * @param transaction - The transaction data to emit
   */
  emitNewTransaction(transaction: unknown): void {
    this.logger.log('Emitting new transaction event');
    this.server.emit('transaction:created', transaction);
  }

  /**
   * Emit a transaction update event to all connected clients
   * @param transaction - The updated transaction data
   */
  emitTransactionUpdate(transaction: unknown): void {
    this.logger.log('Emitting transaction update event');
    this.server.emit('transaction:updated', transaction);
  }


  /**
   * Emit a new notification event to all connected clients
   * @param notification - The notification data to emit
   */
  emitNewNotification(notification: unknown): void {
    this.logger.log('Emitting new notification event');
    this.server.emit('notification:created', notification);
  }

  /**
   * Emit a notification to a specific user
   * @param userId - The user ID to send notification to
   * @param notification - The notification data
   */
  emitNotificationToUser(userId: string, notification: unknown): void {
    this.logger.log(`Emitting notification to user: ${userId}`);
    this.server.emit(`notification:user:${userId}`, notification);
  }

  /**
   * Emit inventory update event to all connected clients
   * @param inventory - The inventory data
   */
  emitInventoryUpdate(inventory: unknown): void {
    this.logger.log('Emitting inventory update event');
    this.server.emit('inventory:updated', inventory);
  }
}
