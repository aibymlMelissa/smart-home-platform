# Smart Home Platform

A comprehensive home automation platform with a **Household Dashboard** for home users and a **Reseller Hub** for device resellers with AI-powered agent management.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Demo Accounts](#demo-accounts)

---

## Overview

The Smart Home Platform is a monorepo containing three main applications:

| Application | Description | Port |
|-------------|-------------|------|
| **Backend** | Express.js REST API with PostgreSQL and Redis | 4000 |
| **Frontend** | Household user dashboard for managing smart home devices | 3000 |
| **Reseller Hub** | Reseller portal with AI agent management for device sales | 3001 |

### User Types

The platform supports three types of users:

| User Type | Description | Access |
|-----------|-------------|--------|
| `household` | Regular home users who manage their smart home devices | Frontend (port 3000) |
| `reseller` | Device resellers who manage outlets, inventory, and AI agents | Reseller Hub (port 3001) |
| `consultant` | Smart home consultants who help households set up devices | Future feature |

---

## Architecture

```
smart-home-platform/
├── apps/
│   ├── backend/                 # Express.js API Server
│   │   ├── src/
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── routes/          # API route definitions
│   │   │   ├── services/        # Business logic (DB, Redis, Email, MQTT)
│   │   │   ├── middleware/      # Auth, validation, rate limiting
│   │   │   ├── scripts/         # Database migrations and seeds
│   │   │   └── index.ts         # Server entry point
│   │   ├── package.json
│   │   └── railway.json         # Railway deployment config
│   │
│   ├── frontend/                # Household Dashboard (React + Vite)
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── pages/           # Page components
│   │   │   ├── stores/          # Zustand state management
│   │   │   ├── services/        # API client
│   │   │   └── main.tsx         # App entry point
│   │   ├── package.json
│   │   └── vercel.json          # Vercel deployment config
│   │
│   └── reseller-hub/            # Reseller Portal (React + Vite)
│       ├── src/
│       │   ├── components/      # Reusable UI components
│       │   ├── pages/           # Page components (Dashboard, Agents, etc.)
│       │   ├── stores/          # Zustand state management
│       │   ├── services/        # API client
│       │   └── main.tsx         # App entry point
│       ├── package.json
│       └── vercel.json          # Vercel deployment config
│
├── scripts/
│   ├── start-all.sh             # Start all services
│   └── stop-all.sh              # Stop all services
│
├── package.json                 # Root package.json (npm workspaces)
└── README.md
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────┐          ┌──────────────────┐            │
│   │   Frontend       │          │   Reseller Hub   │            │
│   │   (React/Vite)   │          │   (React/Vite)   │            │
│   │   Port: 3000     │          │   Port: 3001     │            │
│   │                  │          │                  │            │
│   │   - Dashboard    │          │   - Dashboard    │            │
│   │   - Devices      │          │   - AI Agents    │            │
│   │   - Rooms        │          │   - Outlets      │            │
│   │   - Automations  │          │   - Inventory    │            │
│   │   - Settings     │          │   - Orders       │            │
│   └────────┬─────────┘          │   - Analytics    │            │
│            │                    └────────┬─────────┘            │
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
│     ┌───────────────┼───────────────┐                           │
│     │               │               │                            │
│     ▼               ▼               ▼                            │
│ ┌────────┐    ┌──────────┐    ┌──────────┐                      │
│ │PostgreSQL│   │  Redis   │    │   MQTT   │                      │
│ │          │   │ (Cache)  │    │ (Devices)│                      │
│ │ - Users  │   │          │    │          │                      │
│ │ - Devices│   │ - Sessions│   │ - Events │                      │
│ │ - Orders │   │ - Tokens │    │ - Commands│                     │
│ │ - Agents │   │          │    │          │                      │
│ └──────────┘   └──────────┘    └──────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

This section documents how information flows between the core entities in the Smart Home Platform ecosystem.

### Entity Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SMART HOME ECOSYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│   │  RESELLER   │     │   PLATFORM  │     │    USER     │                   │
│   │ (Installer) │     │   (Cloud)   │     │ (Household) │                   │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                   │
│          │                   │                   │                           │
│          │    ┌──────────────┴──────────────┐    │                           │
│          │    │                             │    │                           │
│          ▼    ▼                             ▼    ▼                           │
│      ┌────────────┐                    ┌────────────┐                        │
│      │  DATABASE  │◄──────────────────►│    HUB     │                        │
│      │ (PostgreSQL)│                   │  (Home)    │                        │
│      └────────────┘                    └────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Entity Definitions

| Entity | Description | Role in System |
|--------|-------------|----------------|
| **Reseller** | Authorized partners who purchase, install, and support smart home devices | First point of contact, device provisioning, warranty handling |
| **Platform** | Cloud-based backend (Express.js API) | Central orchestration, authentication, business logic, data persistence |
| **Database** | PostgreSQL database with Redis cache | Persistent storage, session management, data integrity |
| **User** | Household members who use smart home devices | End consumers, device control, automation setup |
| **Hub** | Physical device in the home that bridges local devices to cloud | Local device communication, offline operation, protocol translation |

---

### Data Flow Diagrams

#### 1. Device Provisioning Flow (Reseller → User)

This flow shows how a device moves from reseller inventory to an active user's home.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEVICE PROVISIONING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RESELLER                    PLATFORM                      USER              │
│  ────────                    ────────                      ────              │
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │ 1. Purchase     │                                                         │
│  │    wholesale    │─────────┐                                               │
│  │    inventory    │         │                                               │
│  └─────────────────┘         ▼                                               │
│                        ┌───────────────┐                                     │
│                        │ 2. Record in  │                                     │
│                        │   product     │                                     │
│                        │   catalog &   │                                     │
│                        │   inventory   │                                     │
│                        └───────┬───────┘                                     │
│                                │                                             │
│  ┌─────────────────┐          │                                              │
│  │ 3. Sell device  │◄─────────┘                                              │
│  │    to customer  │                                                         │
│  │    (retail      │                                                         │
│  │     order)      │─────────┐                                               │
│  └─────────────────┘         │                                               │
│                              ▼                                               │
│                        ┌───────────────┐     ┌─────────────────┐             │
│                        │ 4. Create     │     │ 5. User account │             │
│                        │   device      │────►│    linked to    │             │
│                        │   registration│     │    device       │             │
│                        └───────────────┘     └────────┬────────┘             │
│                                                       │                      │
│                                                       ▼                      │
│                                              ┌─────────────────┐             │
│                                              │ 6. Device shows │             │
│                                              │    in user's    │             │
│                                              │    dashboard    │             │
│                                              └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Database Tables Involved:**
- `wholesale_orders` → Reseller purchases from manufacturer
- `product_catalog` → Master product definitions
- `inventory` → Stock levels per outlet
- `retail_orders` → Sale to end customer
- `device_registrations` → Links serial number to customer
- `devices` → Active device in user's home
- `users` → Customer account

---

#### 2. Real-Time Device Control Flow (User ↔ Hub ↔ Platform)

This flow shows how commands travel from user action to physical device and back.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DEVICE CONTROL FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER APP              PLATFORM               HUB                DEVICE     │
│   ────────              ────────               ───                ──────     │
│                                                                              │
│   ┌──────────┐                                                               │
│   │ 1. User  │                                                               │
│   │ taps     │                                                               │
│   │ "Turn On"│                                                               │
│   └────┬─────┘                                                               │
│        │                                                                     │
│        │  HTTP POST /devices/:id/state                                       │
│        ▼                                                                     │
│   ┌──────────────────┐                                                       │
│   │ 2. API validates │                                                       │
│   │    JWT token &   │                                                       │
│   │    user owns     │                                                       │
│   │    device        │                                                       │
│   └────────┬─────────┘                                                       │
│            │                                                                 │
│            │  MQTT Publish: home/{user_id}/device/{device_id}/command        │
│            ▼                                                                 │
│   ┌──────────────────┐                                                       │
│   │ 3. Hub receives  │                                                       │
│   │    command via   │                                                       │
│   │    MQTT          │                                                       │
│   └────────┬─────────┘                                                       │
│            │                                                                 │
│            │  Protocol translation (Zigbee/Z-Wave/WiFi/BLE)                  │
│            ▼                                                                 │
│   ┌──────────────────┐                                                       │
│   │ 4. Physical      │                                                       │
│   │    device        │                                                       │
│   │    turns ON      │                                                       │
│   └────────┬─────────┘                                                       │
│            │                                                                 │
│            │  Device confirms state change                                   │
│            ▼                                                                 │
│   ┌──────────────────┐                                                       │
│   │ 5. Hub publishes │                                                       │
│   │    new state via │                                                       │
│   │    MQTT          │                                                       │
│   └────────┬─────────┘                                                       │
│            │                                                                 │
│            │  MQTT Publish: home/{user_id}/device/{device_id}/state          │
│            ▼                                                                 │
│   ┌──────────────────┐                                                       │
│   │ 6. Platform      │                                                       │
│   │    updates DB &  │──────┐                                                │
│   │    broadcasts    │      │                                                │
│   │    via WebSocket │      │  UPDATE devices SET state = ... WHERE id = ... │
│   └────────┬─────────┘      ▼                                                │
│            │           ┌──────────┐                                          │
│            │           │ DATABASE │                                          │
│            │           │ (state   │                                          │
│            │           │  saved)  │                                          │
│            │           └──────────┘                                          │
│            │                                                                 │
│            │  WebSocket: { type: 'device_state', device_id, state }          │
│            ▼                                                                 │
│   ┌──────────────────┐                                                       │
│   │ 7. User app      │                                                       │
│   │    updates UI    │                                                       │
│   │    in real-time  │                                                       │
│   └──────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Communication Protocols:**
| Segment | Protocol | Purpose |
|---------|----------|---------|
| User App ↔ Platform | HTTPS + WebSocket | Secure API calls + real-time updates |
| Platform ↔ Hub | MQTT over TLS | Lightweight pub/sub for IoT |
| Hub ↔ Device | Zigbee/Z-Wave/WiFi/BLE | Local device protocols |

---

#### 3. Reseller Support Flow (User ↔ Reseller via Platform)

This flow shows how support requests and warranty claims are handled.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPPORT & WARRANTY FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER                      PLATFORM                      RESELLER           │
│   ────                      ────────                      ────────           │
│                                                                              │
│   ┌─────────────────┐                                                        │
│   │ 1. Device       │                                                        │
│   │    malfunction  │                                                        │
│   │    reported     │─────────┐                                              │
│   └─────────────────┘         │                                              │
│                               ▼                                              │
│                         ┌───────────────┐                                    │
│                         │ 2. Platform   │                                    │
│                         │    looks up   │                                    │
│                         │    device     │                                    │
│                         │    registration│                                   │
│                         └───────┬───────┘                                    │
│                                 │                                            │
│                                 │  Query: device_registrations               │
│                                 │         → outlet_id → reseller_id          │
│                                 ▼                                            │
│                         ┌───────────────┐                                    │
│                         │ 3. Identify   │                                    │
│                         │    original   │                                    │
│                         │    reseller   │                                    │
│                         │    (installer)│                                    │
│                         └───────┬───────┘                                    │
│                                 │                                            │
│                                 │  Create support_agent task                 │
│                                 ▼                                            │
│                         ┌───────────────┐     ┌─────────────────┐            │
│                         │ 4. Assign to  │────►│ 5. Support      │            │
│                         │    reseller's │     │    Agent        │            │
│                         │    support    │     │    receives     │            │
│                         │    agent      │     │    task         │            │
│                         └───────────────┘     └────────┬────────┘            │
│                                                        │                     │
│                                                        ▼                     │
│                                               ┌─────────────────┐            │
│                                               │ 6. Agent        │            │
│                                               │    checks       │            │
│                                               │    warranty     │            │
│                                               │    status       │            │
│                                               └────────┬────────┘            │
│                                                        │                     │
│   ┌─────────────────┐                                  │                     │
│   │ 8. User         │     ┌───────────────┐           │                     │
│   │    receives     │◄────│ 7. Resolution │◄──────────┘                     │
│   │    resolution   │     │    recorded   │   (Replace/Repair/Refund)        │
│   │    notification │     │    in system  │                                  │
│   └─────────────────┘     └───────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Data Relationships:**
```sql
device_registrations.outlet_id → outlets.id → outlets.reseller_id → resellers.id
device_registrations.customer_user_id → users.id
device_registrations.warranty_end_date determines coverage
```

---

#### 4. Complete System Data Flow Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ENTITY INTERACTION MATRIX                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│              │ RESELLER      │ PLATFORM       │ DATABASE      │ USER         │ HUB           │
│ ─────────────┼───────────────┼────────────────┼───────────────┼──────────────┼───────────────│
│ RESELLER     │      -        │ API calls      │ Via Platform  │ Support      │ Initial       │
│              │               │ (HTTPS)        │ only          │ tickets      │ setup         │
│ ─────────────┼───────────────┼────────────────┼───────────────┼──────────────┼───────────────│
│ PLATFORM     │ Webhook       │      -         │ SQL queries   │ API + WS     │ MQTT          │
│              │ notifications │               │ (pg driver)   │ responses    │ broker        │
│ ─────────────┼───────────────┼────────────────┼───────────────┼──────────────┼───────────────│
│ DATABASE     │ Read by       │ Persistent     │      -        │ User data    │ Device        │
│              │ Platform      │ storage        │               │ stored       │ state sync    │
│ ─────────────┼───────────────┼────────────────┼───────────────┼──────────────┼───────────────│
│ USER         │ Purchase      │ API calls      │ Via Platform  │      -       │ Local         │
│              │ device from   │ (HTTPS)        │ only          │              │ control       │
│ ─────────────┼───────────────┼────────────────┼───────────────┼──────────────┼───────────────│
│ HUB          │ Registered    │ MQTT           │ Via Platform  │ Device       │      -        │
│              │ by reseller   │ pub/sub        │ only          │ commands     │               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### 5. Installation Journey (Complete Lifecycle)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE INSTALLATION JOURNEY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PHASE 1: PROCUREMENT                                                       │
│   ────────────────────                                                       │
│                                                                              │
│   Manufacturer ──► Reseller (wholesale_orders) ──► Outlet (inventory)        │
│                                                                              │
│   PHASE 2: SALE                                                              │
│   ─────────────                                                              │
│                                                                              │
│   Customer visits outlet                                                     │
│         │                                                                    │
│         ▼                                                                    │
│   Sales Agent (AI) creates retail_order                                      │
│         │                                                                    │
│         ▼                                                                    │
│   Inventory decremented, device_registration created                         │
│         │                                                                    │
│         ▼                                                                    │
│   Customer account created (users.user_type = 'household')                   │
│                                                                              │
│   PHASE 3: INSTALLATION (Reseller as First Installer)                        │
│   ───────────────────────────────────────────────────                        │
│                                                                              │
│   Reseller technician visits customer home                                   │
│         │                                                                    │
│         ▼                                                                    │
│   Hub physically connected to home network                                   │
│         │                                                                    │
│         ▼                                                                    │
│   Hub registers with Platform (receives hub_id, auth tokens)                 │
│         │                                                                    │
│         ▼                                                                    │
│   Devices paired to Hub (Zigbee/Z-Wave enrollment)                           │
│         │                                                                    │
│         ▼                                                                    │
│   Hub reports devices to Platform (devices table populated)                  │
│         │                                                                    │
│         ▼                                                                    │
│   devices.user_id linked to customer account                                 │
│                                                                              │
│   PHASE 4: OPERATION                                                         │
│   ──────────────────                                                         │
│                                                                              │
│   User logs into Frontend dashboard                                          │
│         │                                                                    │
│         ▼                                                                    │
│   Sees all devices, creates rooms, sets up automations                       │
│         │                                                                    │
│         ▼                                                                    │
│   Commands flow: User App → Platform → MQTT → Hub → Device                   │
│         │                                                                    │
│         ▼                                                                    │
│   State updates flow back: Device → Hub → MQTT → Platform → WebSocket → App  │
│                                                                              │
│   PHASE 5: ONGOING SUPPORT                                                   │
│   ────────────────────────                                                   │
│                                                                              │
│   Issue occurs                                                               │
│         │                                                                    │
│         ▼                                                                    │
│   Platform routes to original reseller (via device_registration.outlet_id)   │
│         │                                                                    │
│         ▼                                                                    │
│   Support Agent handles ticket, warranty lookup, resolution                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Data Storage Summary

| Entity | Primary Storage | Cache Layer | Real-time Channel |
|--------|-----------------|-------------|-------------------|
| **User accounts** | `users` table | Redis sessions | - |
| **Device state** | `devices.state` (JSONB) | Redis | WebSocket |
| **Device commands** | - | - | MQTT |
| **Inventory** | `inventory` table | - | - |
| **Orders** | `retail_orders`, `wholesale_orders` | - | - |
| **Agent tasks** | `agent_tasks` table | Redis queue | WebSocket |
| **Automations** | `automations` table | - | Evaluated on trigger |

### Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ZONES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INTERNET (Untrusted)                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  User Apps (Frontend, Mobile)    Reseller Hub                        │   │
│   └────────────────────────────────────┬────────────────────────────────┘   │
│                                        │                                     │
│                                        │ HTTPS + JWT Authentication          │
│                                        ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         API GATEWAY                                  │   │
│   │   - Rate limiting (middleware/rateLimiter.ts)                        │   │
│   │   - JWT validation (middleware/authenticate.ts)                      │   │
│   │   - Request validation (middleware/validateRequest.ts)               │   │
│   └────────────────────────────────────┬────────────────────────────────┘   │
│                                        │                                     │
│   PLATFORM (Trusted)                   │                                     │
│   ┌────────────────────────────────────▼────────────────────────────────┐   │
│   │                      Backend Services                                │   │
│   │   - Business logic in controllers                                    │   │
│   │   - Database access via DatabaseService                              │   │
│   │   - Password hashing (bcrypt)                                        │   │
│   └─────────────────────────┬─────────────────────┬─────────────────────┘   │
│                             │                     │                          │
│                             ▼                     ▼                          │
│   ┌──────────────────────────────┐  ┌──────────────────────────────────┐    │
│   │       PostgreSQL             │  │         Redis                     │    │
│   │   - Encrypted at rest        │  │   - Session tokens               │    │
│   │   - User data isolation      │  │   - Refresh tokens               │    │
│   │   - Role-based queries       │  │   - Rate limit counters          │    │
│   └──────────────────────────────┘  └──────────────────────────────────┘    │
│                                                                              │
│   HOME NETWORK (Customer Premises)                                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │   Hub ◄──── MQTT over TLS ────► Platform                             │   │
│   │     │                                                                │   │
│   │     └── Local protocols (Zigbee/Z-Wave) ──► Devices                  │   │
│   │         (No direct internet access)                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **TypeScript** | Type-safe JavaScript |
| **PostgreSQL** | Primary database |
| **Redis** | Session cache & token storage |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Zod** | Request validation |
| **Winston** | Logging |
| **Nodemailer** | Email service |
| **MQTT** | Device communication (optional) |
| **WebSocket** | Real-time updates |

### Frontend & Reseller Hub
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | State management |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |
| **React Hook Form** | Form handling |

### DevOps & Deployment
| Technology | Purpose |
|------------|---------|
| **Railway** | Backend hosting (API + PostgreSQL + Redis) |
| **Vercel** | Frontend hosting |
| **GitHub** | Version control |
| **npm Workspaces** | Monorepo management |

---

## Features

### Frontend (Household Dashboard)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of devices, quick stats, recent activity |
| **Devices** | Add, edit, delete, and control smart home devices |
| **Rooms** | Organize devices by room with custom icons and colors |
| **Automations** | Create rules to automate device behavior |
| **Settings** | Profile management, security settings, notifications |

### Reseller Hub

| Feature | Description |
|---------|-------------|
| **Dashboard** | Sales overview, agent status, inventory alerts |
| **AI Agents** | Manage autonomous AI agents that handle operations |
| **Outlets** | Manage physical stores and online sales channels |
| **Inventory** | Track stock levels, low stock alerts, reordering |
| **Orders** | Process retail and wholesale orders |
| **Analytics** | Revenue charts, sales performance, trends |

### AI Agent Types

The Reseller Hub features AI-powered agents that autonomously handle various tasks:

| Agent Type | Capabilities |
|------------|--------------|
| **Outlet Manager** | View dashboard, manage inventory, manage orders, manage agents, view analytics |
| **Sales Agent** | Create orders, process payments, register devices, customer lookup |
| **Inventory Agent** | View inventory, update stock, create reorders, transfer stock |
| **Support Agent** | View orders, process returns, warranty lookup, customer communication |
| **Analytics Agent** | View dashboard, generate reports, forecast demand, analyze trends |

---

## Database Schema

### Core Tables

```sql
-- Users (supports household, reseller, consultant types)
users
├── id (UUID, PK)
├── email (UNIQUE)
├── password_hash
├── first_name, last_name
├── user_type (household | reseller | consultant)
├── reseller_id (FK → resellers, nullable)
├── role (user | admin | guest)
└── timestamps

-- Rooms (for organizing devices)
rooms
├── id (UUID, PK)
├── user_id (FK → users)
├── name, icon, color
└── timestamps

-- Devices (smart home devices)
devices
├── id (UUID, PK)
├── user_id (FK → users)
├── room_id (FK → rooms, nullable)
├── name, type, protocol
├── status (online | offline | unknown)
├── state (JSONB)
└── timestamps

-- Automations (device automation rules)
automations
├── id (UUID, PK)
├── user_id (FK → users)
├── name, description
├── trigger (JSONB)
├── conditions (JSONB)
├── actions (JSONB)
├── is_active
└── timestamps
```

### Reseller Hub Tables

```sql
-- Resellers (reseller companies)
resellers
├── id (UUID, PK)
├── company_name
├── contact_email (UNIQUE)
├── tier (standard | silver | gold | platinum)
├── commission_rate, credit_limit
├── is_active
└── timestamps

-- Outlets (sales locations)
outlets
├── id (UUID, PK)
├── reseller_id (FK → resellers)
├── name, code (UNIQUE)
├── type (physical | online | hybrid)
├── address, city, country
├── operating_hours (JSONB)
├── is_active
└── timestamps

-- AI Agents
agents
├── id (UUID, PK)
├── reseller_id (FK → resellers)
├── outlet_id (FK → outlets, nullable)
├── name
├── agent_type (outlet_manager | sales_agent | inventory_agent | support_agent | analytics_agent)
├── model (e.g., claude-3-sonnet)
├── status (idle | busy | offline | error)
├── capabilities (JSONB array)
├── performance_metrics (JSONB)
└── timestamps

-- Agent Tasks (task queue)
agent_tasks
├── id (UUID, PK)
├── agent_id (FK → agents)
├── task_type, priority
├── status (pending | in_progress | completed | failed | cancelled)
├── input_data, output_data (JSONB)
├── error_message
└── timestamps

-- Agent Actions (audit log)
agent_actions
├── id (UUID, PK)
├── agent_id (FK → agents)
├── task_id (FK → agent_tasks, nullable)
├── action_type, description
├── success, duration_ms
├── metadata (JSONB)
└── created_at

-- Product Catalog
product_catalog
├── id (UUID, PK)
├── name, sku (UNIQUE)
├── category, brand
├── wholesale_price, retail_price
├── is_active
└── timestamps

-- Inventory (per outlet)
inventory
├── id (UUID, PK)
├── outlet_id (FK → outlets)
├── product_id (FK → product_catalog)
├── quantity, reserved_quantity
├── reorder_level, reorder_quantity
└── timestamps

-- Retail Orders
retail_orders
├── id (UUID, PK)
├── outlet_id (FK → outlets)
├── order_number (UNIQUE)
├── customer_name, customer_email
├── status, payment_status
├── subtotal, discount, tax, total
├── processed_by_agent_id (FK → agents)
└── timestamps

-- Wholesale Orders
wholesale_orders
├── id (UUID, PK)
├── reseller_id (FK → resellers)
├── order_number (UNIQUE)
├── status, total
├── ordered_by_agent_id (FK → agents)
└── timestamps

-- Device Registrations (warranty tracking)
device_registrations
├── id (UUID, PK)
├── product_id (FK → product_catalog)
├── serial_number (UNIQUE)
├── customer_user_id (FK → users, nullable)
├── outlet_id, retail_order_id
├── warranty_start_date, warranty_end_date
├── registration_status
└── timestamps
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **PostgreSQL** 14+
- **Redis** 6+
- **Git**

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aibymlMelissa/smart-home-platform.git
   cd smart-home-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment files**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   cp apps/reseller-hub/.env.example apps/reseller-hub/.env
   ```

4. **Configure backend environment** (`apps/backend/.env`)
   ```env
   NODE_ENV=development
   PORT=4000

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=smarthome
   DB_USER=your_user
   DB_PASSWORD=your_password

   # Redis
   REDIS_URL=redis://localhost:6379

   # JWT
   JWT_SECRET=your-secret-key-at-least-32-characters
   JWT_EXPIRES_IN=7d

   # CORS
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   ```

5. **Start PostgreSQL and Redis**
   ```bash
   # macOS with Homebrew
   brew services start postgresql@15
   brew services start redis

   # Create database
   createdb smarthome
   ```

6. **Run database migrations**
   ```bash
   cd apps/backend
   npm run db:migrate
   ```

7. **Start all services**
   ```bash
   # From project root
   npm run dev:all

   # Or start individually
   npm run backend:dev    # Terminal 1
   npm run frontend:dev   # Terminal 2
   npm run reseller-hub:dev  # Terminal 3
   ```

8. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **Reseller Hub**: http://localhost:3001
   - **Backend API**: http://localhost:4000
   - **Health Check**: http://localhost:4000/health

---

## Deployment

### Option B: Railway (Backend) + Vercel (Frontends)

This is the recommended deployment option for simplicity and cost-effectiveness.

#### 1. Deploy Backend to Railway

```bash
# Login to Railway
railway login

# Initialize and deploy
cd apps/backend
railway init
railway up --detach
```

In the Railway dashboard:
1. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
2. **Add Redis**: Click "New" → "Database" → "Redis"
3. **Set environment variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=https://your-frontend.vercel.app,https://your-reseller-hub.vercel.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   ```

#### 2. Deploy Frontends to Vercel

```bash
# Login to Vercel
vercel login

# Deploy Frontend
cd apps/frontend
vercel --prod --yes

# Deploy Reseller Hub
cd ../reseller-hub
vercel --prod --yes
```

Set environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-backend.railway.app/api/v1
```

#### 3. Update CORS Origins

After deploying frontends, update `CORS_ORIGIN` in Railway with your Vercel URLs.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Login and get tokens |
| POST | `/api/v1/auth/guest` | Guest login (no password required) |
| POST | `/api/v1/auth/logout` | Logout (invalidate token) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/profile` | Get user profile |
| PUT | `/api/v1/users/profile` | Update user profile |
| PUT | `/api/v1/users/password` | Change password |
| GET | `/api/v1/users/stats` | Get user statistics |

### Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/devices` | List all devices |
| POST | `/api/v1/devices` | Add new device |
| GET | `/api/v1/devices/:id` | Get device details |
| PUT | `/api/v1/devices/:id` | Update device |
| DELETE | `/api/v1/devices/:id` | Delete device |
| PATCH | `/api/v1/devices/:id/state` | Update device state |

### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rooms` | List all rooms |
| POST | `/api/v1/rooms` | Create room |
| PUT | `/api/v1/rooms/:id` | Update room |
| DELETE | `/api/v1/rooms/:id` | Delete room |

### Automations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/automations` | List automations |
| POST | `/api/v1/automations` | Create automation |
| PUT | `/api/v1/automations/:id` | Update automation |
| DELETE | `/api/v1/automations/:id` | Delete automation |
| PATCH | `/api/v1/automations/:id/toggle` | Enable/disable |

### Resellers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/resellers` | List resellers |
| POST | `/api/v1/resellers` | Create reseller |
| GET | `/api/v1/resellers/:id` | Get reseller details |
| GET | `/api/v1/resellers/:id/dashboard` | Get dashboard stats |

### Outlets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/outlets/reseller/:resellerId` | List outlets by reseller |
| POST | `/api/v1/outlets` | Create outlet |
| GET | `/api/v1/outlets/:id/dashboard` | Get outlet dashboard |

### AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agents/reseller/:resellerId` | List agents by reseller |
| POST | `/api/v1/agents` | Create agent |
| GET | `/api/v1/agents/:id` | Get agent details |
| PATCH | `/api/v1/agents/:id/status` | Update agent status |
| POST | `/api/v1/agents/:id/tasks` | Assign task to agent |
| GET | `/api/v1/agents/:id/tasks` | Get agent tasks |
| PATCH | `/api/v1/agents/tasks/:taskId` | Update task status |
| POST | `/api/v1/agents/:id/actions` | Log agent action |
| GET | `/api/v1/agents/:id/metrics` | Get agent metrics |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory/outlet/:outletId` | Get outlet inventory |
| POST | `/api/v1/inventory/outlet/:outletId` | Add product to outlet |
| PATCH | `/api/v1/inventory/:id/quantity` | Adjust quantity |
| PATCH | `/api/v1/inventory/:id/reserve` | Reserve stock |
| PATCH | `/api/v1/inventory/:id/fulfill` | Fulfill reservation |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/retail/outlet/:outletId` | List retail orders |
| POST | `/api/v1/orders/retail` | Create retail order |
| PATCH | `/api/v1/orders/retail/:id/status` | Update order status |
| GET | `/api/v1/orders/analytics/:resellerId` | Get sales analytics |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 4000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | smarthome |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `DATABASE_URL` | Full database URL (alternative) | - |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | 7d |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 30d |
| `BCRYPT_ROUNDS` | Password hash rounds | 12 |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | http://localhost:3000 |
| `SMTP_HOST` | Email SMTP host | - |
| `SMTP_PORT` | Email SMTP port | 465 |
| `SMTP_USER` | Email SMTP user | - |
| `SMTP_PASS` | Email SMTP password | - |

### Frontend (`apps/frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:4000/api/v1 |

### Reseller Hub (`apps/reseller-hub/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:4000/api/v1 |

---

## Demo Accounts

### Local Development

| Portal | Email | Password | User Type | Description |
|--------|-------|----------|-----------|-------------|
| Frontend | demo@example.com | demo123 | household | Full household user with device management |
| Frontend | guest@smarthome.service | *(none)* | guest | Guest access to explore the platform |
| Reseller Hub | demo@product.com | product123 | reseller | Reseller portal with AI agents |

### Guest Access

The platform includes a **guest landing page** at `/welcome` that explains:
- The smart home ecosystem and how it works
- The customer journey from interest to installation
- How resellers (first installers) engage with households
- The personalized consultation process

**Guest Features:**
- No password required - click "Continue as Guest" on the login page
- Access to the household dashboard to explore features
- 24-hour session expiry for security
- Introduces potential customers to the platform before signup

### Creating Demo Accounts

```bash
# Run database migrations first
cd apps/backend
npm run db:migrate

# The demo accounts are created via SQL:
psql -U your_user -d smarthome

# Insert household user
INSERT INTO users (email, password_hash, first_name, last_name, user_type)
VALUES ('demo@example.com', '$2a$10$...', 'Demo', 'User', 'household');

# Insert reseller user (linked to reseller company)
INSERT INTO users (email, password_hash, first_name, last_name, user_type, reseller_id)
VALUES ('demo@product.com', '$2a$10$...', 'Product', 'Manager', 'reseller', 'reseller-uuid');
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:all` | Start all services (backend + frontends) |
| `npm run start:all` | Same as dev:all |
| `npm run stop:all` | Stop all services |
| `npm run backend:dev` | Start backend only |
| `npm run frontend:dev` | Start frontend only |
| `npm run reseller-hub:dev` | Start reseller hub only |
| `npm run build` | Build all packages |
| `npm run lint` | Run linting |
| `npm run test` | Run tests |

---

## License

MIT License - see [LICENSE](./LICENSE)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- **Issues**: [GitHub Issues](https://github.com/aibymlMelissa/smart-home-platform/issues)
- **Documentation**: This README and inline code comments
