import { WebSocketServer } from 'ws';
import logger from '../utils/logger';

class WebSocket {
  private wss: WebSocketServer | null = null;

  initialize(wss: WebSocketServer): void {
    this.wss = wss;

    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket connection');

      ws.on('message', (message) => {
        logger.debug('Received WebSocket message:', message);
      });

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });
    });
  }
}

export const WebSocketService = new WebSocket();
