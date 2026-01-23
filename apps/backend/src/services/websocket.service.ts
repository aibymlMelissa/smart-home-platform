import { WebSocketServer, WebSocket as WS } from 'ws';
import { IncomingMessage } from 'http';
import logger from '../utils/logger';

interface ExtendedWebSocket extends WS {
  userId?: string;
  rooms?: Set<string>;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketServiceClass {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<ExtendedWebSocket>> = new Map();
  private rooms: Map<string, Set<ExtendedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(wss: WebSocketServer): void {
    this.wss = wss;

    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      logger.info('New WebSocket connection');

      ws.isAlive = true;
      ws.rooms = new Set();

      // Handle authentication from URL query params
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const userId = url.searchParams.get('userId');

      if (userId) {
        this.registerClient(ws, userId);
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
        logger.info('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws: ExtendedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleMessage(ws: ExtendedWebSocket, message: any): void {
    switch (message.type) {
      case 'auth':
        if (message.userId) {
          this.registerClient(ws, message.userId);
          this.send(ws, { type: 'auth:success', data: { userId: message.userId } });
        }
        break;

      case 'join':
        if (message.room) {
          this.joinRoom(ws, message.room);
          this.send(ws, { type: 'room:joined', data: { room: message.room } });
        }
        break;

      case 'leave':
        if (message.room) {
          this.leaveRoom(ws, message.room);
          this.send(ws, { type: 'room:left', data: { room: message.room } });
        }
        break;

      case 'ping':
        this.send(ws, { type: 'pong', data: { timestamp: Date.now() } });
        break;

      default:
        logger.debug('Unknown WebSocket message type:', message.type);
    }
  }

  private registerClient(ws: ExtendedWebSocket, userId: string): void {
    ws.userId = userId;

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    // Auto-join user's personal room
    this.joinRoom(ws, `user:${userId}`);

    logger.debug(`Client registered for user: ${userId}`);
  }

  private removeClient(ws: ExtendedWebSocket): void {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }

    // Remove from all rooms
    ws.rooms?.forEach(room => {
      this.rooms.get(room)?.delete(ws);
    });
  }

  private joinRoom(ws: ExtendedWebSocket, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws);
    ws.rooms?.add(room);
    logger.debug(`Client joined room: ${room}`);
  }

  private leaveRoom(ws: ExtendedWebSocket, room: string): void {
    this.rooms.get(room)?.delete(ws);
    ws.rooms?.delete(room);
    logger.debug(`Client left room: ${room}`);
  }

  private send(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WS.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send message to all connections for a specific user
   */
  sendToUser(userId: string, message: WebSocketMessage): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(ws => {
        this.send(ws, message);
      });
      logger.debug(`Message sent to user ${userId}: ${message.type}`);
    }
  }

  /**
   * Broadcast message to all clients in a room
   */
  broadcastToRoom(room: string, message: WebSocketMessage): void {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.forEach(ws => {
        this.send(ws, message);
      });
      logger.debug(`Message broadcast to room ${room}: ${message.type}`);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    this.wss?.clients.forEach((ws: ExtendedWebSocket) => {
      this.send(ws, message);
    });
    logger.debug(`Message broadcast to all: ${message.type}`);
  }

  /**
   * Get count of connected clients
   */
  getClientCount(): number {
    return this.wss?.clients.size || 0;
  }

  /**
   * Get count of clients for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return (this.clients.get(userId)?.size || 0) > 0;
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss?.clients.forEach(ws => ws.close());
    this.clients.clear();
    this.rooms.clear();
  }
}

export const WebSocketService = new WebSocketServiceClass();
export const websocketService = WebSocketService;
