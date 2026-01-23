import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { EventEmitter } from 'events';
import logger from '../utils/logger';
import {
  HubStatusMessage,
  DeviceEventMessage,
  EmergencyMessage,
  CheckInMessage,
  DeviceCategory,
  ActivityEventType,
} from '../types/aged-care.types';

// MQTT Topic Structure:
// safehome/{hubSerialNumber}/status       - Hub status updates
// safehome/{hubSerialNumber}/event        - Device events
// safehome/{hubSerialNumber}/emergency    - Emergency alerts
// safehome/{hubSerialNumber}/checkin      - Check-in confirmations
// safehome/{hubSerialNumber}/command      - Commands to hub (outbound)

interface MQTTTopics {
  STATUS: string;
  EVENT: string;
  EMERGENCY: string;
  CHECKIN: string;
  COMMAND: string;
}

class HubMQTTService extends EventEmitter {
  private client: MqttClient | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private subscribedHubs: Set<string> = new Set();

  private readonly BASE_TOPIC = 'safehome';

  getTopics(hubSerial: string): MQTTTopics {
    return {
      STATUS: `${this.BASE_TOPIC}/${hubSerial}/status`,
      EVENT: `${this.BASE_TOPIC}/${hubSerial}/event`,
      EMERGENCY: `${this.BASE_TOPIC}/${hubSerial}/emergency`,
      CHECKIN: `${this.BASE_TOPIC}/${hubSerial}/checkin`,
      COMMAND: `${this.BASE_TOPIC}/${hubSerial}/command`,
    };
  }

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

      const options: IClientOptions = {
        clientId: `safehome-backend-${process.env.NODE_ENV || 'dev'}-${Date.now()}`,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        keepalive: 60,
        clean: true,
      };

      try {
        logger.info(`Connecting to MQTT broker at ${brokerUrl}`);
        this.client = mqtt.connect(brokerUrl, options);

        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            logger.warn('MQTT broker not available - continuing without MQTT');
            resolve();
          }
        }, 10000);

        this.client.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          logger.info('MQTT broker connected successfully');

          // Subscribe to wildcard topic for all hubs
          this.subscribeToAllHubs();

          resolve();
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        this.client.on('error', (error) => {
          logger.error('MQTT error:', error.message);
        });

        this.client.on('close', () => {
          this.connected = false;
          logger.warn('MQTT connection closed');
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          logger.info(`MQTT reconnecting (attempt ${this.reconnectAttempts})`);
        });

        this.client.on('offline', () => {
          logger.warn('MQTT client offline');
        });
      } catch (error) {
        logger.warn('MQTT initialization failed - continuing without MQTT');
        resolve();
      }
    });
  }

  private subscribeToAllHubs(): void {
    if (!this.client || !this.connected) return;

    // Subscribe to all SafeHome topics using wildcard
    const wildcardTopic = `${this.BASE_TOPIC}/+/+`;
    this.client.subscribe(wildcardTopic, { qos: 1 }, (err) => {
      if (err) {
        logger.error('Failed to subscribe to MQTT topics:', err);
      } else {
        logger.info(`Subscribed to MQTT topic: ${wildcardTopic}`);
      }
    });
  }

  subscribeToHub(hubSerial: string): void {
    if (this.subscribedHubs.has(hubSerial)) return;

    this.subscribedHubs.add(hubSerial);
    logger.info(`Tracking hub: ${hubSerial}`);
  }

  unsubscribeFromHub(hubSerial: string): void {
    this.subscribedHubs.delete(hubSerial);
    logger.info(`Stopped tracking hub: ${hubSerial}`);
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const parts = topic.split('/');
      if (parts.length !== 3 || parts[0] !== this.BASE_TOPIC) return;

      const hubSerial = parts[1];
      const messageType = parts[2];
      const payload = JSON.parse(message.toString());

      logger.debug(`MQTT message received: ${topic}`, { type: messageType, hubSerial });

      switch (messageType) {
        case 'status':
          this.handleHubStatus(hubSerial, payload);
          break;
        case 'event':
          this.handleDeviceEvent(hubSerial, payload);
          break;
        case 'emergency':
          this.handleEmergency(hubSerial, payload);
          break;
        case 'checkin':
          this.handleCheckIn(hubSerial, payload);
          break;
        default:
          logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  private handleHubStatus(hubSerial: string, payload: any): void {
    const status: HubStatusMessage = {
      hubId: payload.hubId || hubSerial,
      serialNumber: hubSerial,
      status: payload.status || 'online',
      firmwareVersion: payload.firmwareVersion,
      batteryLevel: payload.batteryLevel,
      isOnBattery: payload.isOnBattery || false,
      wifiStrength: payload.wifiStrength,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    this.emit('hub:status', status);
  }

  private handleDeviceEvent(hubSerial: string, payload: any): void {
    const event: DeviceEventMessage = {
      hubId: payload.hubId || hubSerial,
      deviceId: payload.deviceId,
      deviceCategory: payload.deviceCategory as DeviceCategory,
      eventType: payload.eventType as ActivityEventType,
      roomName: payload.roomName,
      sensorData: payload.sensorData || {},
      batteryLevel: payload.batteryLevel,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    this.emit('device:event', event);
  }

  private handleEmergency(hubSerial: string, payload: any): void {
    const emergency: EmergencyMessage = {
      hubId: payload.hubId || hubSerial,
      userId: payload.userId,
      source: payload.source || 'hub_button',
      location: payload.location,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    logger.warn('EMERGENCY received:', emergency);
    this.emit('emergency', emergency);
  }

  private handleCheckIn(hubSerial: string, payload: any): void {
    const checkIn: CheckInMessage = {
      hubId: payload.hubId || hubSerial,
      userId: payload.userId,
      type: payload.type || 'manual_hub',
      status: payload.status || 'ok',
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    this.emit('checkin', checkIn);
  }

  // Send commands to hub
  async sendCommand(hubSerial: string, command: string, data: any = {}): Promise<boolean> {
    if (!this.client || !this.connected) {
      logger.warn('Cannot send command - MQTT not connected');
      return false;
    }

    const topic = this.getTopics(hubSerial).COMMAND;
    const payload = JSON.stringify({
      command,
      data,
      timestamp: new Date().toISOString(),
    });

    return new Promise((resolve) => {
      this.client!.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to send command to hub ${hubSerial}:`, err);
          resolve(false);
        } else {
          logger.debug(`Command sent to hub ${hubSerial}: ${command}`);
          resolve(true);
        }
      });
    });
  }

  // Hub commands
  async triggerVoiceAnnouncement(hubSerial: string, message: string): Promise<boolean> {
    return this.sendCommand(hubSerial, 'announce', { message });
  }

  async requestCheckIn(hubSerial: string, reminder: boolean = true): Promise<boolean> {
    return this.sendCommand(hubSerial, 'request_checkin', { reminder });
  }

  async setPrivacyMode(hubSerial: string, enabled: boolean): Promise<boolean> {
    return this.sendCommand(hubSerial, 'privacy_mode', { enabled });
  }

  async updateConfiguration(hubSerial: string, config: any): Promise<boolean> {
    return this.sendCommand(hubSerial, 'update_config', config);
  }

  async rebootHub(hubSerial: string): Promise<boolean> {
    return this.sendCommand(hubSerial, 'reboot', {});
  }

  async requestStatusUpdate(hubSerial: string): Promise<boolean> {
    return this.sendCommand(hubSerial, 'status_request', {});
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.connected = false;
      logger.info('MQTT disconnected');
    }
  }
}

export const hubMqttService = new HubMQTTService();
