# Smart Home Platform - Build Status

## Project Overview
A home automation platform with TypeScript backend (Express) and React frontend.

## Current Status: Basic Structure Complete

### What Has Been Built

#### Backend (`apps/backend/`)
- **Entry point**: `src/index.ts` - Express server with middleware setup
- **Authentication**: Full JWT auth flow in `src/controllers/auth.controller.ts`
- **Routes**:
  - `src/routes/auth.routes.ts` - signup, login, logout, refresh, me
  - `src/routes/device.routes.ts` - full CRUD for devices
  - `src/routes/room.routes.ts` - full CRUD for rooms
  - `src/routes/user.routes.ts` - profile, password change, stats
- **Middleware**: authenticate, errorHandler, rateLimiter, validateRequest, auth.validators
- **Services**: database (PostgreSQL), redis, mqtt, websocket
- **Scripts**: `src/scripts/migrate.ts`, `src/scripts/seed.ts`
- **Config**: package.json, tsconfig.json, .env.example

#### Frontend (`apps/frontend/`)
- **Entry**: `src/main.tsx` with React Router
- **Pages** (all in `src/pages/`):
  - LoginPage.tsx - full login form with validation
  - SignupPage.tsx - full signup form with validation
  - DashboardPage.tsx - stats cards, device list
  - DevicesPage.tsx - device grid, add/toggle/delete devices
  - RoomsPage.tsx - room cards, add/edit/delete rooms
  - AutomationsPage.tsx - sample automations display
  - SettingsPage.tsx - profile, security, notifications tabs
- **Components**: `src/components/Layout.tsx` - sidebar navigation
- **State**: `src/stores/authStore.ts` - Zustand auth store
- **API**: `src/services/api.ts` - Axios client with interceptors
- **Styles**: `src/styles/index.css` - Tailwind imports
- **Config**: package.json, tsconfig.json, vite.config.ts, tailwind.config.js, .env.example

#### Database Schema (in migrate.ts)
Tables: users, rooms, devices, automations, migrations

#### SafeHome Aged Care Backend (`apps/backend/src/`)
- **Routes**: `src/routes/care.routes.ts` - check-in, emergency, family, alerts, activity, medications
- **Services**:
  - `src/services/hub-mqtt.service.ts` - MQTT communication with SafeHome hubs
  - `src/services/activity-detection.service.ts` - Anomaly detection and activity patterns
  - `src/services/alert.service.ts` - Alert management and family notifications
  - `src/services/websocket.service.ts` - Real-time updates (enhanced)
- **Types**: `src/types/aged-care.types.ts` - Device categories, alerts, check-ins, activity types
- **Migration**: `src/scripts/migrate-aged-care.ts` - Aged care database tables

#### Aged Care Database Tables (in migrate-aged-care.ts)
- `hubs` - SafeHome hub devices (serial, status, battery, configuration)
- `family_members` - Family circle with notification preferences
- `activity_events` - Motion, door, appliance events from sensors
- `check_ins` - Daily check-in records
- `alerts` - Emergency alerts and anomaly notifications
- `alert_notifications` - Notification delivery tracking
- `activity_baselines` - Normal activity patterns per time/room
- `medication_schedules` - Medication reminders
- `medication_logs` - Medication compliance tracking

### What Still Needs To Be Done

1. **Install dependencies**: Run `npm install` at root
2. **Database setup**:
   - Create PostgreSQL database
   - Copy `.env.example` to `.env` and configure
   - Run `npm run db:migrate`
3. **Optional**: Run `npm run db:seed` for demo data
4. **Test the app**: Start both servers and verify

### Commands
```bash
# From project root
npm install

# Backend (terminal 1)
cd apps/backend
cp .env.example .env  # Edit with your DB credentials
npm run db:migrate           # Core tables
npm run db:migrate:care      # Aged care tables
npm run dev

# Frontend (terminal 2)
cd apps/frontend
cp .env.example .env
npm run dev
```

### MQTT Topics (Hub Communication)
- `safehome/{hubSerial}/status` - Hub status updates (online/offline, battery, firmware)
- `safehome/{hubSerial}/event` - Device events (motion, door, buttons, sensors)
- `safehome/{hubSerial}/emergency` - Emergency alerts from hub/pendant
- `safehome/{hubSerial}/checkin` - Check-in confirmations from hub
- `safehome/{hubSerial}/command` - Commands to hub (announce, config, reboot)

### API Endpoints

#### Auth & User
- POST `/api/v1/auth/signup` - Register user
- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/logout` - Logout (requires auth)
- POST `/api/v1/auth/refresh` - Refresh token
- GET `/api/v1/auth/me` - Get current user (requires auth)
- GET/PUT `/api/v1/users/profile` - User profile
- PUT `/api/v1/users/password` - Change password
- GET `/api/v1/users/stats` - User statistics

#### Devices & Rooms
- GET/POST/PUT/DELETE `/api/v1/devices` - Device CRUD
- PATCH `/api/v1/devices/:id/state` - Update device state
- GET/POST/PUT/DELETE `/api/v1/rooms` - Room CRUD

#### SafeHome Aged Care
- POST `/api/v1/care/check-in` - Record daily check-in
- GET `/api/v1/care/check-ins` - Get check-in history
- GET `/api/v1/care/check-in/status` - Get today's check-in status
- POST `/api/v1/care/emergency` - Trigger or cancel emergency alert
- GET/POST/PUT/DELETE `/api/v1/care/family` - Family member management
- GET `/api/v1/care/alerts` - Get alert history
- GET `/api/v1/care/alerts/active` - Get active alerts
- PUT `/api/v1/care/alerts/:id/acknowledge` - Acknowledge an alert
- PUT `/api/v1/care/alerts/:id/resolve` - Resolve an alert
- GET `/api/v1/care/activity/today` - Today's activity summary
- GET `/api/v1/care/activity/week` - Weekly activity summary
- GET `/api/v1/care/activity/recent` - Recent activity events
- GET `/api/v1/care/home-status` - Current home status for dashboard
- GET `/api/v1/care/medications` - Get medication schedules
- GET `/api/v1/care/medications/today` - Today's medication schedule
- POST `/api/v1/care/medications/:id/taken` - Mark medication as taken

#### Health
- GET `/health` - Health check

### Tech Stack
- Backend: Node.js, Express, TypeScript, PostgreSQL, Redis, JWT
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Axios
- Monorepo: npm workspaces + Turborepo

### Demo & Admin Credentials (seeded by `npm run db:seed`)

| Portal | Email/Username | Password | Role |
|--------|---------------|----------|------|
| SafeHome Frontend | `demo@example.com` | `Demo123456` | User |
| SafeHome Frontend | *(Try Demo button)* | *(no password)* | Guest |
| Reseller Hub | `demo@product.com` | `product123` | Reseller |
| Admin (all portals) | `EdmundLam` | `Admin2@26` | Admin/Consultant |

### File Structure Reference
See README.md for the expected project structure.
