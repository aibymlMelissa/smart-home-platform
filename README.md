# SafeHome Platform

A smart home automation platform with aged care monitoring, designed for the Melbourne market. Please click on either the UserInterface know how Households interface with the safe home services or Reseller how resellers work with their hub and link with purchase, installation, remote monitoring and maintenance services with UseInterface.


## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Raspberry Pi Hub                          │
│                                                                │
│  ┌──────────────────┐     ┌────────────────────────────────┐   │
│  │  Home Assistant  │────▶│  SafeHome Bridge (Python)      │   │
│  │  + Zigbee2MQTT   │     │  - Listens to device events    │   │
│  │  + Mosquitto     │     │  - Publishes to Cloud MQTT     |   |
|  │                  │     |  - AI Pattern Recongise Alert  |   |
│  └──────────────────┘     └────────────────────────────────┘   │
│          │                              │                      │
│  ┌───────┴───────┐                      │                      │
│  │ Zigbee Dongle │                      │ MQTT over TLS        │
│  │ (Coordinator) │                      │ (Port 8883)          │
│  └───────────────┘                      │                      │
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


```
┌──────────────────────────────────────────────────────────-───────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────-┤
│                                                                  │
│   ┌──────────────────┐          ┌──────────────────┐             │
│   │   Frontend       │          │   Reseller Hub   │             │
│   │   (React/Vite)   │          │   (React/Vite)   │             │
│   │   Port: 3000     │          │   Port: 3001     │             │
│   │                  │          │                  │             │
│   │   - Dashboard    │          │   - Dashboard    │             │
│   │   - Devices      │          │   - AI Agents    │             │
│   │   - Rooms        │          │   - Outlets      │             │
│   │   - Automations  │          │   - Inventory    │             │
│   │   - Settings     │          │   - Orders       │             │
│   └────────┬─────────┘          │   - Analytics    │             │
│            │                    └────────┬─────────┘             │
│            │                             │                       │
│            └──────────┬──────────────────┘                       │
│                       │                                          │
│                       ▼                                          │
│            ┌──────────────────┐                                  │
│            │   Backend API    │                                  │
│            │   (Express.js)   │                                  │
│            │   Port: 4000     │                                  │
│            │                  │                                  │
│            │   - Auth         │                                  │
│            │   - Users        │                                  │
│            │   - Devices      │                                  │
│            │   - Resellers    │                                  │
│            │   - Agents       │                                  │
│            │   - Orders       │                                  │
│            └────────┬─────────┘                                  │
│                     │                                            │
├─────────────────────┼────────────────────────────────────────────┤
│                     │           DATA LAYER                       │
│     ┌───────────────┼───────────────┐                            │
│     │               │               │                            │
│     ▼               ▼               ▼                            │
│ ┌───────--─┐   ┌─────────-─┐    ┌-──────────┐                    │
│ │PostgreSQL│   │  Redis    │    │   MQTT    │                    │
│ │          │   │ (Cache)   │    │ (Devices) │                    │
│ │ - Users  │   │           │    │           │                    │
│ │ - Devices│   │ - Sessions│    │ - Events  |                    │
│ │ - Orders │   │ - Tokens  │    │ - Commands│                    │
│ │ - Agents │   │           │    │           |                    │
│ └──────────┘   └──────────-┘    └──────────-┘                    │
│                                                                  │
└──────────────────────────────────────────────────────-───────────┘
```
---
## Applications

| App | Description | URL |
|-----|-------------|-----|
| **System** | Express.js REST API | [Railway](https://smart-home-platform-production.up.railway.app) |
| **User Interface (Login & HomePage)** | Household Dashboard | [Vercel](https://frontend-aibymlcom.vercel.app) |
| **Reseller Hub** | Reseller Portal | [Vercel](https://reseller-hub-sandy.vercel.app) |

## Quick Start

```bash
# Install dependencies
npm install

# Start all services
npm run dev:all

# Or individually
npm run backend:dev      # http://localhost:4000
npm run frontend:dev     # http://localhost:3000
npm run reseller-hub:dev # http://localhost:3001
```

## Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| User Interface | demo@example.com | Demo123456 |
| Reseller Hub | demo@product.com | product123 |
| Admin | EdmundLam | Admin2@26 |

## Tech Stack

- **(System) Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **(User Interface) Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **Deployment**: Railway (backend), Vercel (frontends)

## Documentation

| Document | Description |
|----------|-------------|
| README_detail.md | Full documentation with architecture diagrams |
| CLAUDE_detail.md | Detailed development guide |
| HubSetUp.md | Raspberry Pi hub integration guide |

## Key Features

### Household Dashboard
- Device management (lights, sensors, locks)
- Room organization
- Automation rules
- Real-time device control

### SafeHome Aged Care
- Daily "I'm Okay" check-ins
- Emergency panic button
- Activity monitoring & anomaly detection
- Family notifications
- Medication reminders

### Reseller Hub
- AI-powered sales agents
- Inventory management
- Order processing
- Analytics dashboard

## API Health Check

```bash
curl https://smart-home-platform-production.up.railway.app/health
```

## License

MIT License
