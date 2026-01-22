import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import deviceRoutes from './routes/device.routes';
import roomRoutes from './routes/room.routes';
import automationRoutes from './routes/automation.routes';
// Reseller Hub routes
import resellerRoutes from './routes/reseller.routes';
import outletRoutes from './routes/outlet.routes';
import agentRoutes from './routes/agent.routes';
import inventoryRoutes from './routes/inventory.routes';
import orderRoutes from './routes/order.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';

// Import services
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { mqttService } from './services/mqtt.service';
import { WebSocketService } from './services/websocket.service';
import { emailService } from './services/email.service';
import logger from './utils/logger';

dotenv.config();

class Server {
  private app: Application;
  private httpServer: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer, path: '/ws' });
    this.port = parseInt(process.env.PORT || '4000', 10);

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    
    // CORS - allow multiple origins
    this.app.use(
      cors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });

    // Rate limiting
    this.app.use(rateLimiter);
  }

  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api/v1';

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/devices`, deviceRoutes);
    this.app.use(`${apiPrefix}/rooms`, roomRoutes);
    this.app.use(`${apiPrefix}/automations`, automationRoutes);

    // Reseller Hub API routes
    this.app.use(`${apiPrefix}/resellers`, resellerRoutes);
    this.app.use(`${apiPrefix}/outlets`, outletRoutes);
    this.app.use(`${apiPrefix}/agents`, agentRoutes);
    this.app.use(`${apiPrefix}/inventory`, inventoryRoutes);
    this.app.use(`${apiPrefix}/orders`, orderRoutes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      logger.info('Connecting to database...');
      await DatabaseService.initialize();
      logger.info('Database connected successfully');

      // Initialize Redis
      logger.info('Connecting to Redis...');
      await RedisService.initialize();
      logger.info('Redis connected successfully');

      // Initialize MQTT
      logger.info('Connecting to MQTT broker...');
      await mqttService.initialize();
      logger.info('MQTT broker connected successfully');

      // Initialize WebSocket
      logger.info('Initializing WebSocket service...');
      WebSocketService.initialize(this.wss);
      logger.info('WebSocket service initialized successfully');

      // Initialize Email service
      logger.info('Initializing email service...');
      await emailService.initialize();
      logger.info('Email service initialized');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();

      this.httpServer.listen(this.port, () => {
        logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Smart Home Platform Backend                        ║
║                                                       ║
║   Server running on: http://localhost:${this.port}        ║
║   Environment: ${process.env.NODE_ENV?.padEnd(19) || 'development'.padEnd(19)}         ║
║   WebSocket: ws://localhost:${this.port}/ws               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');

    this.httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    await DatabaseService.disconnect();
    await RedisService.disconnect();
    mqttService.disconnect();

    logger.info('All services disconnected. Goodbye!');
    process.exit(0);
  }
}

// Start server
const server = new Server();
server.start();

export default server;
