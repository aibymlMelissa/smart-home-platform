#!/usr/bin/env python3
"""
SafeHome Bridge for Home Assistant

This script bridges Home Assistant events to the SafeHome cloud platform via MQTT.
It can run as a standalone service or as a Home Assistant add-on.

Usage:
    python3 safehome_bridge.py --config config.yaml
"""

import json
import os
import ssl
import time
import logging
from datetime import datetime
from typing import Optional, Dict, Any
import paho.mqtt.client as mqtt
import requests
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('SafeHomeBridge')


class SafeHomeBridge:
    """Bridges Home Assistant to SafeHome cloud platform via MQTT."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.hub_serial = config.get('hub_serial', 'SH-HUB-001')

        # Home Assistant API
        self.ha_url = config.get('home_assistant', {}).get('url', 'http://localhost:8123')
        self.ha_token = config.get('home_assistant', {}).get('token', '')

        # Cloud MQTT (for SafeHome backend)
        self.cloud_mqtt_config = config.get('cloud_mqtt', {})
        self.cloud_client: Optional[mqtt.Client] = None

        # Local MQTT (Home Assistant)
        self.local_mqtt_config = config.get('local_mqtt', {})
        self.local_client: Optional[mqtt.Client] = None

        # Device mappings
        self.device_mappings = config.get('device_mappings', {})

        # State tracking
        self.last_heartbeat = 0
        self.heartbeat_interval = config.get('heartbeat_interval', 300)  # 5 minutes

    def start(self):
        """Start the bridge."""
        logger.info(f"Starting SafeHome Bridge for hub: {self.hub_serial}")

        # Connect to cloud MQTT (SafeHome backend)
        self._connect_cloud_mqtt()

        # Connect to local MQTT (Home Assistant)
        if self.local_mqtt_config.get('enabled', True):
            self._connect_local_mqtt()

        # Start main loop
        self._main_loop()

    def _connect_cloud_mqtt(self):
        """Connect to the cloud MQTT broker for SafeHome backend."""
        broker = self.cloud_mqtt_config.get('broker', 'localhost')
        port = self.cloud_mqtt_config.get('port', 8883)
        username = self.cloud_mqtt_config.get('username')
        password = self.cloud_mqtt_config.get('password')

        self.cloud_client = mqtt.Client(
            client_id=f"safehome-hub-{self.hub_serial}",
            protocol=mqtt.MQTTv311
        )

        if username and password:
            self.cloud_client.username_pw_set(username, password)

        # Use TLS for secure connection
        if port == 8883:
            self.cloud_client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)

        self.cloud_client.on_connect = self._on_cloud_connect
        self.cloud_client.on_message = self._on_cloud_message
        self.cloud_client.on_disconnect = self._on_cloud_disconnect

        logger.info(f"Connecting to cloud MQTT broker: {broker}:{port}")
        self.cloud_client.connect(broker, port, keepalive=60)
        self.cloud_client.loop_start()

    def _connect_local_mqtt(self):
        """Connect to local MQTT broker (Home Assistant)."""
        broker = self.local_mqtt_config.get('broker', 'localhost')
        port = self.local_mqtt_config.get('port', 1883)
        username = self.local_mqtt_config.get('username')
        password = self.local_mqtt_config.get('password')

        self.local_client = mqtt.Client(
            client_id=f"safehome-bridge-local",
            protocol=mqtt.MQTTv311
        )

        if username and password:
            self.local_client.username_pw_set(username, password)

        self.local_client.on_connect = self._on_local_connect
        self.local_client.on_message = self._on_local_message

        logger.info(f"Connecting to local MQTT broker: {broker}:{port}")
        self.local_client.connect(broker, port, keepalive=60)
        self.local_client.loop_start()

    def _on_cloud_connect(self, client, userdata, flags, rc):
        """Handle cloud MQTT connection."""
        if rc == 0:
            logger.info("Connected to cloud MQTT broker")
            # Subscribe to command topic
            command_topic = f"safehome/{self.hub_serial}/command"
            client.subscribe(command_topic)
            logger.info(f"Subscribed to: {command_topic}")
            # Send initial status
            self._send_hub_status()
        else:
            logger.error(f"Cloud MQTT connection failed with code: {rc}")

    def _on_cloud_disconnect(self, client, userdata, rc):
        """Handle cloud MQTT disconnection."""
        logger.warning(f"Disconnected from cloud MQTT (code: {rc})")

    def _on_cloud_message(self, client, userdata, msg):
        """Handle messages from SafeHome backend (commands)."""
        try:
            payload = json.loads(msg.payload.decode())
            logger.info(f"Received command: {payload}")
            self._handle_command(payload)
        except Exception as e:
            logger.error(f"Error handling cloud message: {e}")

    def _on_local_connect(self, client, userdata, flags, rc):
        """Handle local MQTT connection."""
        if rc == 0:
            logger.info("Connected to local MQTT broker")
            # Subscribe to Home Assistant state changes
            client.subscribe("homeassistant/binary_sensor/+/state")
            client.subscribe("homeassistant/sensor/+/state")
            client.subscribe("homeassistant/switch/+/state")
            # Also subscribe to zigbee2mqtt if used
            client.subscribe("zigbee2mqtt/+")
        else:
            logger.error(f"Local MQTT connection failed with code: {rc}")

    def _on_local_message(self, client, userdata, msg):
        """Handle messages from Home Assistant."""
        try:
            topic = msg.topic
            payload = msg.payload.decode()

            # Parse based on topic structure
            if topic.startswith("zigbee2mqtt/"):
                self._handle_zigbee2mqtt_message(topic, payload)
            elif topic.startswith("homeassistant/"):
                self._handle_ha_state_message(topic, payload)

        except Exception as e:
            logger.error(f"Error handling local message: {e}")

    def _handle_zigbee2mqtt_message(self, topic: str, payload: str):
        """Handle Zigbee2MQTT device messages."""
        try:
            device_name = topic.split('/')[1]
            data = json.loads(payload) if payload.startswith('{') else {}

            # Check device mappings
            mapping = self.device_mappings.get(device_name, {})
            device_type = mapping.get('type', 'unknown')
            room = mapping.get('room', 'Unknown')

            event_type = None
            sensor_data = {}

            # Motion sensor
            if 'occupancy' in data:
                if data['occupancy']:
                    event_type = 'motion_detected'
                    sensor_data = {'motion': True, 'occupancy': True}
                else:
                    event_type = 'motion_cleared'
                    sensor_data = {'motion': False, 'occupancy': False}

            # Door/window sensor
            elif 'contact' in data:
                if not data['contact']:  # contact=false means open
                    event_type = 'door_opened'
                    sensor_data = {'open': True}
                else:
                    event_type = 'door_closed'
                    sensor_data = {'open': False}

            # Temperature/humidity
            elif 'temperature' in data or 'humidity' in data:
                event_type = 'environment_reading'
                sensor_data = {
                    'temperature': data.get('temperature'),
                    'humidity': data.get('humidity')
                }

            # Button press (emergency button)
            elif 'action' in data:
                action = data['action']
                if action in ['single', 'press', 'on']:
                    if mapping.get('is_emergency_button'):
                        self._send_emergency(device_name, room)
                        return
                    elif mapping.get('is_checkin_button'):
                        self._send_checkin('button', 'okay')
                        return

            # Send event if we have one
            if event_type:
                self._send_device_event(
                    device_id=device_name,
                    event_type=event_type,
                    room_name=room,
                    sensor_data=sensor_data
                )

        except Exception as e:
            logger.error(f"Error processing zigbee2mqtt message: {e}")

    def _handle_ha_state_message(self, topic: str, payload: str):
        """Handle Home Assistant state change messages."""
        # Parse topic: homeassistant/{domain}/{entity}/state
        parts = topic.split('/')
        if len(parts) >= 3:
            domain = parts[1]
            entity = parts[2]
            state = payload

            # Process based on domain
            if domain == 'binary_sensor':
                self._process_binary_sensor(entity, state)
            elif domain == 'sensor':
                self._process_sensor(entity, state)

    def _process_binary_sensor(self, entity: str, state: str):
        """Process binary sensor state changes."""
        mapping = self.device_mappings.get(entity, {})
        room = mapping.get('room', 'Unknown')
        sensor_type = mapping.get('sensor_type', 'motion')

        if state == 'on':
            if sensor_type == 'motion':
                self._send_device_event(entity, 'motion_detected', room, {'motion': True})
            elif sensor_type == 'door':
                self._send_device_event(entity, 'door_opened', room, {'open': True})

    def _process_sensor(self, entity: str, state: str):
        """Process sensor state changes."""
        try:
            value = float(state)
            mapping = self.device_mappings.get(entity, {})
            room = mapping.get('room', 'Unknown')
            sensor_type = mapping.get('sensor_type', 'temperature')

            sensor_data = {sensor_type: value}
            self._send_device_event(entity, 'environment_reading', room, sensor_data)
        except ValueError:
            pass

    def _send_hub_status(self):
        """Send hub status to SafeHome backend."""
        status_payload = {
            "serialNumber": self.hub_serial,
            "status": "online",
            "firmwareVersion": "1.0.0",
            "batteryLevel": 100,
            "isOnBattery": False,
            "wifiStrength": 85,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        topic = f"safehome/{self.hub_serial}/status"
        self.cloud_client.publish(topic, json.dumps(status_payload), retain=True)
        self.last_heartbeat = time.time()
        logger.debug("Sent hub status")

    def _send_device_event(self, device_id: str, event_type: str, room_name: str, sensor_data: Dict):
        """Send device event to SafeHome backend."""
        event_payload = {
            "hubId": self.hub_serial,
            "deviceId": device_id,
            "eventType": event_type,
            "roomName": room_name,
            "sensorData": sensor_data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        topic = f"safehome/{self.hub_serial}/event"
        self.cloud_client.publish(topic, json.dumps(event_payload))
        logger.info(f"Sent event: {event_type} from {device_id} in {room_name}")

    def _send_emergency(self, source: str, location: str):
        """Send emergency alert to SafeHome backend."""
        emergency_payload = {
            "hubId": self.hub_serial,
            "source": source,
            "location": location,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        topic = f"safehome/{self.hub_serial}/emergency"
        self.cloud_client.publish(topic, json.dumps(emergency_payload), qos=2)
        logger.warning(f"EMERGENCY sent from {source} at {location}")

    def _send_checkin(self, check_type: str, status: str):
        """Send check-in to SafeHome backend."""
        checkin_payload = {
            "hubId": self.hub_serial,
            "type": check_type,
            "status": status,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        topic = f"safehome/{self.hub_serial}/checkin"
        self.cloud_client.publish(topic, json.dumps(checkin_payload))
        logger.info(f"Sent check-in: {status}")

    def _handle_command(self, command: Dict):
        """Handle commands from SafeHome backend."""
        action = command.get('action')

        if action == 'play_sound':
            sound = command.get('sound', 'notification')
            self._play_sound(sound)
        elif action == 'request_checkin':
            self._play_sound('checkin_reminder')
        elif action == 'test':
            logger.info("Test command received")

    def _play_sound(self, sound: str):
        """Play a sound on the hub (via Home Assistant media player)."""
        # This would call Home Assistant API to play a sound
        logger.info(f"Would play sound: {sound}")

    def _main_loop(self):
        """Main loop for the bridge."""
        try:
            while True:
                # Send heartbeat
                if time.time() - self.last_heartbeat > self.heartbeat_interval:
                    self._send_hub_status()

                time.sleep(1)

        except KeyboardInterrupt:
            logger.info("Shutting down...")
            if self.cloud_client:
                self.cloud_client.loop_stop()
                self.cloud_client.disconnect()
            if self.local_client:
                self.local_client.loop_stop()
                self.local_client.disconnect()


def load_config(config_path: str) -> Dict[str, Any]:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='SafeHome Bridge for Home Assistant')
    parser.add_argument('--config', default='config.yaml', help='Path to config file')
    args = parser.parse_args()

    # Load config
    config_path = args.config
    if os.path.exists(config_path):
        config = load_config(config_path)
    else:
        # Default config for development
        config = {
            'hub_serial': os.environ.get('SAFEHOME_HUB_SERIAL', 'SH-HUB-001'),
            'cloud_mqtt': {
                'broker': os.environ.get('MQTT_BROKER', 'localhost'),
                'port': int(os.environ.get('MQTT_PORT', '8883')),
                'username': os.environ.get('MQTT_USERNAME'),
                'password': os.environ.get('MQTT_PASSWORD'),
            },
            'local_mqtt': {
                'enabled': True,
                'broker': os.environ.get('LOCAL_MQTT_BROKER', 'localhost'),
                'port': int(os.environ.get('LOCAL_MQTT_PORT', '1883')),
            },
            'device_mappings': {},
            'heartbeat_interval': 300,
        }

    # Start bridge
    bridge = SafeHomeBridge(config)
    bridge.start()
