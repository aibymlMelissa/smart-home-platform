# SafeHome Hub Integration Guide

This guide explains how to connect a physical Raspberry Pi hub with Home Assistant to the SafeHome platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Raspberry Pi Hub                          │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │ Home Assistant  │───▶│  SafeHome MQTT Bridge           │ │
│  │ - Device Control│    │  (Publishes to Cloud MQTT)      │ │
│  │ - Automations   │    └─────────────────────────────────┘ │
│  └─────────────────┘                                        │
│           │                                                  │
│  ┌────────┴────────┐                                        │
│  │ Zigbee/Z-Wave   │                                        │
│  │ Coordinator     │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
           │
           │ Zigbee/Z-Wave/WiFi
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Smart Devices                             │
│  - Motion Sensors (Aqara, Philips Hue, etc.)                │
│  - Door/Window Sensors                                       │
│  - Emergency Button / Panic Button                          │
│  - Smart Plugs (activity monitoring)                        │
│  - Temperature/Humidity Sensors                             │
└─────────────────────────────────────────────────────────────┘
           │
           │ MQTT (TLS)
           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Cloud MQTT Broker                            │
│  (HiveMQ Cloud, CloudMQTT, AWS IoT, or self-hosted)         │
└─────────────────────────────────────────────────────────────┘
           │
           │ MQTT Subscribe
           ▼
┌─────────────────────────────────────────────────────────────┐
│              SafeHome Backend (Railway)                      │
│  - Receives device events                                    │
│  - Activity pattern detection                                │
│  - Anomaly detection                                        │
│  - Alert generation                                         │
│  - Family notifications                                     │
└─────────────────────────────────────────────────────────────┘
           │
           │ WebSocket / API
           ▼
┌─────────────────────────────────────────────────────────────┐
│              Family Dashboard (Vercel)                       │
│  - Real-time activity view                                  │
│  - Alert management                                         │
│  - Check-in status                                          │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Hardware
- Raspberry Pi 4 (recommended) or Pi 3B+
- MicroSD card (32GB+ recommended)
- Power supply
- Zigbee coordinator (e.g., Sonoff Zigbee 3.0 USB Dongle Plus)
- Compatible sensors (see device list below)

### Software
- Home Assistant OS or Home Assistant Container
- Mosquitto MQTT Broker (add-on or external)
- Cloud MQTT broker account (for internet connectivity)

## Quick Start

### Step 1: Set Up Home Assistant

1. **Flash Home Assistant OS** to your SD card using [Raspberry Pi Imager](https://www.raspberrypi.com/software/)

2. **Initial Setup**: Connect to `http://homeassistant.local:8123`

3. **Install Add-ons**:
   - Mosquitto broker
   - File editor
   - Terminal & SSH (optional)

### Step 2: Configure Cloud MQTT Broker

You need a cloud MQTT broker for the hub to communicate with the SafeHome backend. Options:

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/) | 100 connections | Recommended |
| [CloudMQTT](https://www.cloudmqtt.com/) | 5 connections | Limited |
| [AWS IoT Core](https://aws.amazon.com/iot-core/) | 250k messages/month | Enterprise |
| Self-hosted | N/A | Requires server |

**Example: HiveMQ Cloud Setup**
1. Create account at hivemq.com
2. Create a free cluster
3. Note your credentials:
   - Broker URL: `xxxxx.hivemq.cloud`
   - Port: `8883` (TLS)
   - Username: (generated)
   - Password: (generated)

### Step 3: Configure SafeHome Backend

Add these environment variables to your Railway backend:

```
MQTT_BROKER_URL=mqtts://xxxxx.hivemq.cloud:8883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
```

### Step 4: Add Home Assistant Configuration

Copy the contents of `home-assistant/safehome_config.yaml` to your Home Assistant configuration.

Edit `secrets.yaml`:
```yaml
mqtt_username: your-hivemq-username
mqtt_password: your-hivemq-password
```

Edit `configuration.yaml` to include:
```yaml
# Include SafeHome package
homeassistant:
  packages:
    safehome: !include safehome_config.yaml
```

### Step 5: Register Hub in SafeHome

1. Log in to SafeHome admin panel
2. Go to Hubs → Register New Hub
3. Enter your hub serial number (e.g., `SH-HUB-001`)
4. Assign to a resident/user

## MQTT Topic Reference

### Hub → Backend (Inbound)

| Topic | Purpose | Payload Example |
|-------|---------|-----------------|
| `safehome/{serial}/status` | Hub heartbeat | `{"status": "online", "batteryLevel": 100}` |
| `safehome/{serial}/event` | Device events | `{"eventType": "motion_detected", "roomName": "Living Room"}` |
| `safehome/{serial}/emergency` | Emergency alerts | `{"source": "physical_button"}` |
| `safehome/{serial}/checkin` | Daily check-ins | `{"type": "manual", "status": "okay"}` |

### Backend → Hub (Outbound)

| Topic | Purpose | Payload Example |
|-------|---------|-----------------|
| `safehome/{serial}/command` | Commands to hub | `{"action": "play_sound", "sound": "reminder"}` |

## Recommended Devices

### Motion Sensors
- **Aqara Motion Sensor P1** - Zigbee, good range, pets immune option
- **Philips Hue Motion Sensor** - Zigbee, temperature included
- **IKEA TRADFRI Motion Sensor** - Budget-friendly

### Door/Window Sensors
- **Aqara Door/Window Sensor** - Zigbee, reliable
- **Sonoff SNZB-04** - Budget Zigbee option

### Emergency Buttons
- **Aqara Wireless Mini Switch** - Zigbee, can be used as panic button
- **IKEA TRADFRI Shortcut Button** - Budget option
- **Custom 3D-printed big red button** with smart button inside

### Smart Plugs (Activity Monitoring)
- **TP-Link Kasa Smart Plug** - WiFi, power monitoring
- **IKEA TRADFRI Smart Plug** - Zigbee

### Environmental Sensors
- **Aqara Temperature/Humidity Sensor** - Zigbee
- **Sonoff SNZB-02** - Budget option

## Troubleshooting

### Hub Not Connecting
1. Check MQTT broker credentials
2. Verify firewall allows outbound port 8883
3. Check Home Assistant logs: `Settings → System → Logs`

### Events Not Appearing in SafeHome
1. Verify MQTT topic format matches backend expectations
2. Check backend logs in Railway
3. Use MQTT Explorer to debug message flow

### High Latency
1. Use a cloud MQTT broker geographically close to Railway region
2. Reduce heartbeat frequency if needed
3. Check Raspberry Pi network connection

## Security Considerations

1. **Always use TLS** (port 8883) for MQTT connections
2. Use strong, unique passwords for MQTT broker
3. Keep Home Assistant and all add-ons updated
4. Consider setting up a VPN for additional security
5. Regularly rotate MQTT credentials
