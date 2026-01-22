# Smart Home Platform - Home Assistant System

A comprehensive home automation platform built with TypeScript, featuring device integration, user authentication, and real-time control.

## 📋 Hardware Requirements

### Minimum Server Requirements
- **CPU**: 2 cores (x86_64 or ARM64)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 32GB minimum (SSD recommended)
- **Network**: Ethernet connection (recommended) or Wi-Fi with stable connection

### Recommended Hardware Options

#### Option 1: Raspberry Pi (Budget-Friendly)
- **Model**: Raspberry Pi 4 Model B (4GB or 8GB RAM)
- **Storage**: 64GB microSD card (Class 10, UHS-1) or USB SSD
- **Power**: Official 5V 3A USB-C power supply
- **Cost**: ~$75-120

#### Option 2: Intel NUC (Performance)
- **Model**: Intel NUC 11 or newer
- **RAM**: 8GB DDR4
- **Storage**: 256GB NVMe SSD
- **Cost**: ~$300-500

#### Option 3: Dedicated Server
- **CPU**: Intel Core i3 or equivalent
- **RAM**: 8GB+
- **Storage**: 500GB SSD
- **Cost**: ~$400-800

### Additional Hardware

#### Communication Dongles (Choose based on your devices)
1. **Zigbee Coordinator**
   - Sonoff Zigbee 3.0 USB Dongle Plus (~$15)
   - ConBee II (~$40)
   - Texas Instruments CC2652P (~$25)

2. **Z-Wave Controller**
   - Aeotec Z-Stick 7 (~$50)
   - Zooz ZST10 700 (~$35)

3. **Bluetooth Adapter** (if not built-in)
   - Any USB Bluetooth 5.0+ adapter (~$10-20)

## 🔌 Supported Device Standards

### Wireless Protocols
- **Zigbee 3.0** - Sensors, lights, switches, locks
- **Z-Wave** (500/700 series) - Switches, dimmers, sensors
- **Wi-Fi** (2.4GHz/5GHz) - Cameras, smart plugs, bulbs
- **Bluetooth/BLE** - Proximity sensors, locks, thermometers
- **Thread/Matter** - Next-gen unified standard (upcoming)

### Wired Protocols
- **Ethernet/IP** - Cameras, PoE devices
- **RS-485/Modbus** - Industrial sensors, HVAC
- **KNX** - Professional building automation

### Cloud Integration APIs
- Philips Hue, LIFX (Lighting)
- Nest, Ecobee (Thermostats)
- Ring, Arlo (Security cameras)
- Sonos, Spotify (Media)

## 🏗️ Project Structure

```
smart-home-platform/
├── apps/
│   ├── backend/           # Node.js + Express API server
│   └── frontend/          # React + TypeScript UI
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   ├── database/          # Database schemas and migrations
│   └── device-protocols/  # Device communication libraries
├── docs/                  # Documentation
├── docker/                # Docker configuration
└── scripts/               # Setup and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+ (for sessions)
- Git

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd smart-home-platform
npm install
```

2. **Setup Environment**
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Edit .env files with your configuration
```

3. **Database Setup**
```bash
cd apps/backend
npm run db:migrate
npm run db:seed
```

4. **Start Development**
```bash
# Terminal 1 - Backend
npm run backend:dev

# Terminal 2 - Frontend
npm run frontend:dev
```

5. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

## 📱 Device Compatibility Matrix

### Lighting
| Brand | Protocol | Status |
|-------|----------|--------|
| Philips Hue | Zigbee/Wi-Fi | ✅ Supported |
| LIFX | Wi-Fi | ✅ Supported |
| IKEA Trådfri | Zigbee | ✅ Supported |
| TP-Link Kasa | Wi-Fi | ✅ Supported |

### Sensors
| Type | Protocol | Status |
|------|----------|--------|
| Motion | Zigbee/Z-Wave | ✅ Supported |
| Door/Window | Zigbee/Z-Wave | ✅ Supported |
| Temperature | Zigbee/BLE | ✅ Supported |
| Humidity | Zigbee/BLE | ✅ Supported |

### Security
| Type | Protocol | Status |
|------|----------|--------|
| Smart Locks | Z-Wave/Zigbee | ✅ Supported |
| Cameras | Wi-Fi/RTSP | ✅ Supported |
| Doorbells | Wi-Fi | 🔄 In Progress |

### Climate
| Type | Protocol | Status |
|------|----------|--------|
| Thermostats | Wi-Fi/Zigbee | ✅ Supported |
| Smart Vents | Z-Wave | ✅ Supported |

## 🔐 Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- End-to-end encryption for sensitive data
- 2FA support (TOTP)
- API rate limiting
- SSL/TLS required for production

## 📚 Documentation
- [API Documentation](./docs/API.md)
- [Device Integration Guide](./docs/DEVICE_INTEGRATION.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🤝 Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License
MIT License - see [LICENSE](./LICENSE)
