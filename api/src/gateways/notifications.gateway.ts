import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload?.sub || payload?.userId;
      if (!userId) {
        this.logger.warn(`Client ${client.id} provided token without user id`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      void client.join(`user_${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `WebSocket authentication failed for ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(
        `Client ${client.id} disconnected for user ${client.userId}`,
      );
    }
  }

  @SubscribeMessage('subscribe:api')
  handleApiSubscription(
    @MessageBody() data: { apiId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      void client.join(`api_${data.apiId}`);
      this.logger.log(`User ${client.userId} subscribed to API ${data.apiId}`);
    }
  }

  @SubscribeMessage('unsubscribe:api')
  handleApiUnsubscription(
    @MessageBody() data: { apiId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (client.userId) {
      void client.leave(`api_${data.apiId}`);
      this.logger.log(
        `User ${client.userId} unsubscribed from API ${data.apiId}`,
      );
    }
  }

  @SubscribeMessage('subscribe:user_apis')
  handleUserApisSubscription(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      void client.join(`user_apis_${client.userId}`);
      this.logger.log(`User ${client.userId} subscribed to all their APIs`);
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  sendToApiSubscribers(apiId: string, event: string, data: any) {
    this.server.to(`api_${apiId}`).emit(event, data);
  }

  sendToAllUserApis(userId: string, event: string, data: any) {
    this.server.to(`user_apis_${userId}`).emit(event, data);
  }

  broadcastNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification:new', notification);
  }

  broadcastAPIUpdate(apiId: string, userId: string, update: any) {
    this.sendToApiSubscribers(apiId, 'api:update', update);
    this.sendToUser(userId, 'api:update', update);
  }

  broadcastAPIChange(apiId: string, userId: string, change: any) {
    this.sendToApiSubscribers(apiId, 'api:change', change);
    this.sendToUser(userId, 'api:change', change);
  }

  broadcastMetricsUpdate(apiId: string, userId: string, metrics: any) {
    this.sendToApiSubscribers(apiId, 'metrics:update', metrics);
    this.sendToUser(userId, 'metrics:update', metrics);
  }
}
