import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userConnections = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // El frontend envía el token en auth.token
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const userId = payload.userId || payload.sub;
      client.data.userId = userId;
      client.data.role = payload.role;

      // Store connection mapping
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      // Join role-specific room
      const role = payload.role?.toLowerCase();
      if (role === 'admin' || role === 'asesor') {
        client.join('admins');
        this.logger.log(`User ${userId} joined admins room`);
      }

      this.logger.log(
        `Client ${client.id} connected (User: ${userId}, Role: ${payload.role})`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(client.id);

      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
    }

    this.logger.log(`Client ${client.id} disconnected (User: ${userId})`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date() } };
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    const roomName = `user:${userId}`;
    this.logger.log(
      `Sending notification to room: ${roomName}, event: ${event}`,
    );
    this.logger.log(
      `Connected users: ${Array.from(this.userConnections.keys()).join(', ')}`,
    );
    this.logger.log(`User ${userId} is online: ${this.isUserOnline(userId)}`);

    this.server.to(roomName).emit(event, data);
    this.logger.log(`Notification sent to user ${userId}: ${event}`);
  }

  // Send notification to all admins and advisors
  sendToAdmins(event: string, data: any) {
    this.logger.log(`Sending notification to admins room, event: ${event}`);
    this.server.to('admins').emit(event, data);
    this.logger.log(`Notification sent to admins: ${event}`);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcast notification: ${event}`);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return (
      this.userConnections.has(userId) &&
      this.userConnections.get(userId).size > 0
    );
  }
}
