# SafeHome Hub Setup Guide

This guide explains how to set up a physical Raspberry Pi hub with Home Assistant to connect to the SafeHome aged care monitoring platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [Step 1: Set Up Raspberry Pi](#step-1-set-up-raspberry-pi)
- [Step 2: Install Zigbee Coordinator](#step-2-install-zigbee-coordinator)
- [Step 3: Set Up Cloud MQTT Broker](#step-3-set-up-cloud-mqtt-broker)
- [Step 4: Configure SafeHome Backend](#step-4-configure-safehome-backend)
- [Step 5: Install SafeHome Bridge](#step-5-install-safehome-bridge)
- [Step 6: Pair Smart Devices](#step-6-pair-smart-devices)
- [Step 7: Register Hub in SafeHome](#step-7-register-hub-in-safehome)
- [MQTT Topic Reference](#mqtt-topic-reference)
- [Recommended Devices](#recommended-devices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The SafeHome hub acts as a bridge between smart home devices (motion sensors, door sensors, emergency buttons) and the SafeHome cloud platform. It monitors daily activity patterns and alerts family members when anomalies are detected.

**Key Features:**
- Activity monitoring via motion and door sensors
- Emergency panic button support
- Daily "I'm Okay" check-in system
- Environmental monitoring (temperature, humidity)
- Appliance usage tracking via smart plugs

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Raspberry Pi Hub                           │
│                                                                  │
│  ┌──────────────────┐     ┌────────────────────────────────┐   │
│  │  Home Assistant  │────▶│  SafeHome Bridge (Python)      │   │
│  │  + Zigbee2MQTT   │     │  - Listens to device events    │   │
│  │  + Mosquitto     │     │  - Publishes to Cloud MQTT     │   │
│  └──────────────────┘     └────────────────────────────────┘   │
│          │                              │                       │
│  ┌───────┴───────┐                      │                       │
│  │ Zigbee Dongle │                      │ MQTT over TLS         │
│  │ (Coordinator) │                      │ (Port 8883)           │
│  └───────────────┘                      │                       │
└────────────────────────────────────────────────────────────────┘
           │                              │
           │ Zigbee Protocol              │
           ▼                              ▼
┌─────────────────────┐       ┌─────────────────────────────────┐
│   Smart Devices     │       │   Cloud MQTT Broker             │
│   - Motion Sensors  │       │   (HiveMQ Cloud / CloudMQTT)    │
│   - Door Sensors    │       └─────────────────────────────────┘
│   - Panic Button    │                   │
│   - Temp Sensors    │                   │ MQTT Subscribe
│   - Smart Plugs     │                   ▼
└─────────────────────┘       ┌─────────────────────────────────┐
                              │   SafeHome Backend (Railway)    │
                              │   - Activity detection          │
                              │   - Anomaly detection           │
                              │   - Alert generation            │
                              │   - Family notifications        │
                              └─────────────────────────────────┘
                                          │
                                          │ WebSocket / REST API
                                          ▼
                              ┌─────────────────────────────────┐
                              │   Family Dashboard (Vercel)     │
                              │   - Real-time activity view     │
                              │   - Alert management            │
                              │   - Check-in status             │
                              └─────────────────────────────────┘
```

---

## Hardware Requirements

### Essential

| Item | Description | Recommended Model | Approx. Cost |
|------|-------------|-------------------|--------------|
| Raspberry Pi | Hub computer | Raspberry Pi 4 (2GB+) | $45-75 AUD |
| MicroSD Card | Storage | 32GB+ Class 10 | $15 AUD |
| Power Supply | Pi power | Official USB-C 5V/3A | $20 AUD |
| Zigbee Coordinator | Device communication | Sonoff Zigbee 3.0 USB Dongle Plus | $30 AUD |
| Ethernet Cable | Network (recommended) | Cat 6 | $10 AUD |

### Optional but Recommended

| Item | Description | Purpose |
|------|-------------|---------|
| Case with Fan | Cooling | Prevents thermal throttling |
| UPS/Battery Backup | Power backup | Maintains operation during outages |

---

## Software Requirements

- **Home Assistant OS** - Smart home platform
- **Zigbee2MQTT** - Zigbee device integration
- **Mosquitto** - Local MQTT broker
- **Python 3.9+** - For SafeHome bridge script
- **Cloud MQTT Account** - HiveMQ Cloud (free tier available)

---

## Step 1: Set Up Raspberry Pi

### 1.1 Flash Home Assistant OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)

2. Insert your MicroSD card

3. In Raspberry Pi Imager:
   - Click "Choose OS" → "Other specific-purpose OS" → "Home assistants and home automation" → "Home Assistant"
   - Select your Pi model (e.g., "Home Assistant OS 12.x (RPi 4/400)")
   - Click "Choose Storage" → Select your SD card
   - Click "Write"

4. Insert SD card into Raspberry Pi and power on

### 1.2 Initial Home Assistant Setup

1. Wait 5-10 minutes for first boot

2. Open browser and go to: `http://homeassistant.local:8123`
   - If that doesn't work, try: `http://<pi-ip-address>:8123`

3. Create your admin account

4. Complete the onboarding wizard

### 1.3 Install Required Add-ons

Go to **Settings** → **Add-ons** → **Add-on Store**

Install these add-ons:

1. **Mosquitto broker** (Official)
   - Click Install → Start → Enable "Start on boot"

2. **Zigbee2MQTT** (Community)
   - First add the repository: Click ⋮ menu → Repositories → Add: `https://github.com/zigbee2mqtt/hassio-zigbee2mqtt`
   - Then install Zigbee2MQTT

3. **File editor** (Official)
   - For editing configuration files

4. **Terminal & SSH** (Official, optional)
   - For command-line access

---

## Step 2: Install Zigbee Coordinator

### 2.1 Connect the Dongle

1. Plug the Sonoff Zigbee 3.0 USB Dongle into a USB port on the Pi
   - Use a USB extension cable to reduce interference

2. In Home Assistant, go to **Settings** → **System** → **Hardware** → **All Hardware**

3. Find your dongle (usually `/dev/ttyUSB0` or `/dev/ttyACM0`)

### 2.2 Configure Zigbee2MQTT

1. Go to **Settings** → **Add-ons** → **Zigbee2MQTT** → **Configuration**

2. Set the serial port:
   ```yaml
   serial:
     port: /dev/ttyUSB0  # or your detected port
   ```

3. Set MQTT settings:
   ```yaml
   mqtt:
     server: mqtt://core-mosquitto:1883
     user: ""
     password: ""
   ```

4. Click **Save** and **Start** the add-on

5. Access Zigbee2MQTT dashboard: **Sidebar** → **Zigbee2MQTT**

---

## Step 3: Set Up Cloud MQTT Broker

The cloud MQTT broker enables communication between your local hub and the SafeHome backend running on Railway.

### Option A: HiveMQ Cloud (Recommended)

1. Go to [HiveMQ Cloud](https://www.hivemq.com/mqtt-cloud-broker/)

2. Sign up for a free account

3. Create a new cluster (free tier: 100 connections)

4. Note your credentials:
   ```
   Broker URL: xxxxxxxx.s1.eu.hivemq.cloud
   Port: 8883 (TLS)
   Username: (create in Access Management)
   Password: (create in Access Management)
   ```

### Option B: CloudMQTT

1. Go to [CloudMQTT](https://www.cloudmqtt.com/)
2. Sign up for free "Cute Cat" plan (5 connections)
3. Create an instance and note credentials

### Option C: AWS IoT Core

For enterprise deployments with higher volume requirements.

---

## Step 4: Configure SafeHome Backend

Add these environment variables to your Railway backend service:

| Variable | Value | Example |
|----------|-------|---------|
| `MQTT_BROKER_URL` | Your cloud MQTT URL | `mqtts://xxxxx.hivemq.cloud:8883` |
| `MQTT_USERNAME` | MQTT username | `safehome-backend` |
| `MQTT_PASSWORD` | MQTT password | `your-secure-password` |

### In Railway Dashboard:

1. Go to your **smart-home-platform** service
2. Click **Variables** tab
3. Add the MQTT variables
4. Railway will auto-redeploy

---

## Step 5: Install SafeHome Bridge

The SafeHome Bridge is a Python script that runs on your Raspberry Pi and forwards Home Assistant events to the SafeHome cloud.

### 5.1 Access Terminal

In Home Assistant:
- Go to **Settings** → **Add-ons** → **Terminal & SSH** → **Open Web UI**

Or SSH directly:
```bash
ssh root@homeassistant.local
```

### 5.2 Install the Bridge

```bash
# Navigate to config directory
cd /config

# Create bridge directory
mkdir -p safehome-bridge
cd safehome-bridge

# Download bridge files (or copy from Reference/hub-integration/safehome-bridge/)
# Option 1: Clone from repo
git clone https://github.com/aibymlMelissa/smart-home-platform.git temp
cp temp/Reference/hub-integration/safehome-bridge/* .
rm -rf temp

# Option 2: Create files manually (see below)

# Install dependencies
pip3 install paho-mqtt requests PyYAML

# Create configuration
cp config.example.yaml config.yaml
```

### 5.3 Configure the Bridge

Edit `config.yaml`:

```yaml
# Unique hub serial number (register this in SafeHome)
hub_serial: "SH-HUB-001"

# Cloud MQTT Broker (SafeHome backend connection)
cloud_mqtt:
  broker: "xxxxxxxx.s1.eu.hivemq.cloud"  # Your HiveMQ URL
  port: 8883
  username: "your-mqtt-username"
  password: "your-mqtt-password"

# Local MQTT (Home Assistant Mosquitto)
local_mqtt:
  enabled: true
  broker: "localhost"
  port: 1883

# Heartbeat interval (seconds)
heartbeat_interval: 300

# Map your devices to rooms
device_mappings:
  # Motion sensors - use your Zigbee2MQTT device names
  "0x00158d0004234567":  # Living room motion sensor
    type: "motion_sensor"
    room: "Living Room"
    sensor_type: "motion"

  "0x00158d0004234568":  # Bedroom motion sensor
    type: "motion_sensor"
    room: "Bedroom"
    sensor_type: "motion"

  # Door sensors
  "0x00158d0004234569":  # Front door sensor
    type: "door_sensor"
    room: "Entrance"
    sensor_type: "door"

  # Emergency button
  "0x00158d000423456a":
    type: "button"
    room: "Living Room"
    is_emergency_button: true

  # Check-in button
  "0x00158d000423456b":
    type: "button"
    room: "Living Room"
    is_checkin_button: true
```

### 5.4 Run the Bridge

**Test run:**
```bash
python3 safehome_bridge.py --config config.yaml
```

**Run as a service (persistent):**

Create `/etc/systemd/system/safehome-bridge.service`:
```ini
[Unit]
Description=SafeHome Bridge
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/config/safehome-bridge
ExecStart=/usr/bin/python3 safehome_bridge.py --config config.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable safehome-bridge
systemctl start safehome-bridge
```

---

## Step 6: Pair Smart Devices

### 6.1 Enable Pairing Mode

In Zigbee2MQTT dashboard:
1. Click **Permit join (All)** button
2. You have 255 seconds to pair devices

### 6.2 Pair Each Device

**Motion Sensor (e.g., Aqara P1):**
1. Press and hold the reset button for 5 seconds
2. LED will flash, device appears in Zigbee2MQTT

**Door/Window Sensor:**
1. Press reset button for 5 seconds
2. Separate the sensor to trigger pairing

**Button (for Emergency/Check-in):**
1. Press and hold for 5 seconds until LED flashes
2. Test with single press after pairing

### 6.3 Rename Devices

In Zigbee2MQTT:
1. Click on the device
2. Click the pencil icon next to the name
3. Give it a friendly name (e.g., "living_room_motion")

### 6.4 Update Bridge Configuration

Add each device to your `config.yaml` device_mappings using either:
- The Zigbee IEEE address (e.g., `0x00158d0004234567`)
- The friendly name (e.g., `living_room_motion`)

---

## Step 7: Register Hub in SafeHome

### 7.1 Log in to SafeHome Admin

1. Go to your SafeHome frontend
2. Log in with admin credentials:
   - Username: `EdmundLam`
   - Password: `Admin2@26`

### 7.2 Register the Hub

1. Navigate to **Hubs** → **Register New Hub**

2. Enter hub details:
   - **Serial Number:** `SH-HUB-001` (must match config.yaml)
   - **Name:** "Mum's SafeHome Hub"
   - **Assign to User:** Select the resident

3. Click **Register**

### 7.3 Verify Connection

1. Check the hub status shows "Online"
2. Trigger a motion sensor - event should appear in activity log
3. Press emergency button - alert should be generated

---

## MQTT Topic Reference

### Hub → Backend (Inbound Messages)

| Topic | Purpose | Payload Example |
|-------|---------|-----------------|
| `safehome/{serial}/status` | Hub heartbeat (every 5 min) | `{"status": "online", "batteryLevel": 100, "wifiStrength": 85}` |
| `safehome/{serial}/event` | Device events | `{"eventType": "motion_detected", "roomName": "Living Room", "deviceId": "sensor1"}` |
| `safehome/{serial}/emergency` | Emergency button pressed | `{"source": "physical_button", "location": "Living Room"}` |
| `safehome/{serial}/checkin` | Daily check-in | `{"type": "manual", "status": "okay"}` |

### Backend → Hub (Outbound Commands)

| Topic | Purpose | Payload Example |
|-------|---------|-----------------|
| `safehome/{serial}/command` | Commands to hub | `{"action": "play_sound", "sound": "reminder"}` |

### Event Types

| Event Type | Trigger | Description |
|------------|---------|-------------|
| `motion_detected` | Motion sensor ON | Person detected in room |
| `motion_cleared` | Motion sensor OFF | No motion for timeout period |
| `door_opened` | Door sensor opens | Door/window opened |
| `door_closed` | Door sensor closes | Door/window closed |
| `environment_reading` | Periodic | Temperature/humidity update |
| `appliance_on` | Smart plug power > threshold | Appliance turned on |
| `appliance_off` | Smart plug power < threshold | Appliance turned off |

---

## Recommended Devices

### Motion Sensors

| Device | Protocol | Features | Price |
|--------|----------|----------|-------|
| **Aqara Motion Sensor P1** | Zigbee | 7m range, pet immune option | $35 AUD |
| Philips Hue Motion | Zigbee | Temperature included | $55 AUD |
| IKEA TRADFRI Motion | Zigbee | Budget option | $15 AUD |

### Door/Window Sensors

| Device | Protocol | Features | Price |
|--------|----------|----------|-------|
| **Aqara Door/Window Sensor** | Zigbee | Reliable, small | $25 AUD |
| Sonoff SNZB-04 | Zigbee | Budget option | $12 AUD |

### Emergency/Check-in Buttons

| Device | Protocol | Features | Price |
|--------|----------|----------|-------|
| **Aqara Wireless Mini Switch** | Zigbee | Single/double/hold actions | $20 AUD |
| IKEA TRADFRI Shortcut Button | Zigbee | Large button | $10 AUD |

### Smart Plugs (Activity Monitoring)

| Device | Protocol | Features | Price |
|--------|----------|----------|-------|
| **TP-Link Kasa KP115** | WiFi | Power monitoring | $30 AUD |
| IKEA TRADFRI Smart Plug | Zigbee | No power monitoring | $12 AUD |

### Environmental Sensors

| Device | Protocol | Features | Price |
|--------|----------|----------|-------|
| **Aqara Temperature/Humidity** | Zigbee | Temp + humidity | $25 AUD |
| Sonoff SNZB-02 | Zigbee | Budget option | $12 AUD |

### Recommended Starter Kit

For a typical aged care setup (1-bedroom unit):

| Qty | Device | Location | Cost |
|-----|--------|----------|------|
| 1 | Raspberry Pi 4 + accessories | - | $100 |
| 1 | Sonoff Zigbee USB Dongle | - | $30 |
| 3 | Aqara Motion Sensor P1 | Living, Bedroom, Bathroom | $105 |
| 1 | Aqara Door Sensor | Front door | $25 |
| 2 | Aqara Mini Switch | Emergency + Check-in | $40 |
| 1 | Aqara Temp/Humidity | Living room | $25 |
| **Total** | | | **$325 AUD** |

---

## Troubleshooting

### Hub Not Connecting to Cloud MQTT

**Symptoms:** Hub shows offline in SafeHome dashboard

**Solutions:**
1. Check cloud MQTT credentials in config.yaml
2. Verify firewall allows outbound port 8883
3. Test connection:
   ```bash
   mosquitto_pub -h your-broker.hivemq.cloud -p 8883 \
     -u username -P password --capath /etc/ssl/certs \
     -t test -m "hello"
   ```
4. Check bridge logs:
   ```bash
   journalctl -u safehome-bridge -f
   ```

### Devices Not Pairing

**Symptoms:** Device not appearing in Zigbee2MQTT

**Solutions:**
1. Move device closer to coordinator during pairing
2. Try factory reset on device (usually hold button 10+ seconds)
3. Check Zigbee2MQTT logs for errors
4. Ensure permit_join is enabled

### Events Not Appearing in SafeHome

**Symptoms:** Motion detected locally but not in cloud dashboard

**Solutions:**
1. Verify device is in config.yaml device_mappings
2. Check bridge is running: `systemctl status safehome-bridge`
3. Verify MQTT topics match expected format
4. Check backend logs in Railway

### High Latency

**Symptoms:** Delays between local event and cloud notification

**Solutions:**
1. Use cloud MQTT broker geographically close to Railway region
2. Check Raspberry Pi network connection (prefer Ethernet)
3. Reduce heartbeat_interval if needed

### Bridge Crashes

**Symptoms:** Bridge stops running

**Solutions:**
1. Check logs: `journalctl -u safehome-bridge -n 100`
2. Ensure Python dependencies are installed
3. Verify config.yaml syntax is valid
4. Restart: `systemctl restart safehome-bridge`

---

## Security Best Practices

1. **Always use TLS** (port 8883) for cloud MQTT connections
2. **Use strong passwords** for MQTT broker access
3. **Keep software updated** - Home Assistant, Zigbee2MQTT, bridge script
4. **Use a separate network** for IoT devices if possible (VLAN)
5. **Rotate credentials** periodically
6. **Enable Home Assistant 2FA** for admin access
7. **Use the official power supply** to prevent SD card corruption

---

## Support

For issues with:
- **SafeHome Platform:** Check [GitHub Issues](https://github.com/aibymlMelissa/smart-home-platform/issues)
- **Home Assistant:** Visit [Home Assistant Community](https://community.home-assistant.io/)
- **Zigbee2MQTT:** Check [Zigbee2MQTT Documentation](https://www.zigbee2mqtt.io/)

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 SafeHome Hub Quick Reference                 │
├─────────────────────────────────────────────────────────────┤
│ Home Assistant:    http://homeassistant.local:8123          │
│ Zigbee2MQTT:       Sidebar → Zigbee2MQTT                    │
│ Bridge Config:     /config/safehome-bridge/config.yaml      │
│                                                              │
│ Commands:                                                    │
│   Check bridge:    systemctl status safehome-bridge          │
│   Restart bridge:  systemctl restart safehome-bridge         │
│   View logs:       journalctl -u safehome-bridge -f          │
│                                                              │
│ MQTT Topics:                                                 │
│   Status:          safehome/{serial}/status                  │
│   Events:          safehome/{serial}/event                   │
│   Emergency:       safehome/{serial}/emergency               │
│   Check-in:        safehome/{serial}/checkin                 │
└─────────────────────────────────────────────────────────────┘
```
