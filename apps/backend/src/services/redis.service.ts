import Redis from 'ioredis';
import logger from '../utils/logger';

class RedisClient {
  private client: Redis | null = null;

  async initialize(): Promise<void> {
    try {
      // Support Railway's REDIS_URL format or individual env vars
      const redisUrl = process.env.REDIS_URL?.trim();

      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      } else {
        this.client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
      });

      await this.client.ping();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Redis not initialized');
    
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not initialized');
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.client) throw new Error('Redis not initialized');
    await this.client.del(key);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis disconnected');
    }
  }
}

export const RedisService = new RedisClient();
