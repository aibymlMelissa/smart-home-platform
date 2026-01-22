import mqtt, { MqttClient } from 'mqtt';
import logger from '../utils/logger';

class MQTTService {
  private client: MqttClient | null = null;
  private connected: boolean = false;

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
          clientId: process.env.MQTT_CLIENT_ID || 'smarthome-backend',
          username: process.env.MQTT_USERNAME,
          password: process.env.MQTT_PASSWORD,
          connectTimeout: 5000,
          reconnectPeriod: 0, // Disable auto-reconnect for initial connection
        });

        const timeout = setTimeout(() => {
          logger.warn('MQTT broker not available - continuing without MQTT');
          this.client?.end();
          this.client = null;
          resolve();
        }, 5000);

        this.client.on('connect', () => {
          clearTimeout(timeout);
          this.connected = true;
          logger.info('MQTT broker connected');
          resolve();
        });

        this.client.on('error', (error) => {
          clearTimeout(timeout);
          logger.warn('MQTT connection failed - continuing without MQTT:', error.message);
          this.client?.end();
          this.client = null;
          resolve();
        });
      } catch (error) {
        logger.warn('MQTT initialization failed - continuing without MQTT');
        resolve();
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      logger.info('MQTT disconnected');
    }
  }
}

export const mqttService = new MQTTService();
