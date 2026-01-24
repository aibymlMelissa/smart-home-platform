# SafeHome Platform - Development Guide

## Project Structure

```
smart-home-platform/
├── apps/
│   ├── backend/          # Express.js API (Port 4000)
│   ├── frontend/         # Household Dashboard (Port 3000)
│   └── reseller-hub/     # Reseller Portal (Port 3001)
├── docs/                 # Detailed documentation
├── Reference/            # Hub integration files
└── HubSetUp.md          # Physical hub setup guide
```

## Quick Commands

```bash
# Development
npm install              # Install all dependencies
npm run dev:all          # Start all services
npm run backend:dev      # Backend only
npm run frontend:dev     # Frontend only

# Database
cd apps/backend
npm run db:migrate       # Run core migrations
npm run db:migrate:care  # Run aged care migrations
npm run db:seed          # Seed demo data

# Build
npm run build            # Build all packages
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=4000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api/v1
```

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | User login |
| `POST /api/v1/auth/guest` | Guest login |
| `GET /api/v1/devices` | List devices |
| `POST /api/v1/care/check-in` | Daily check-in |
| `POST /api/v1/care/emergency` | Emergency alert |
| `GET /health` | Health check |

## MQTT Topics (Hub Communication)

```
safehome/{serial}/status     # Hub status
safehome/{serial}/event      # Device events
safehome/{serial}/emergency  # Emergency alerts
safehome/{serial}/checkin    # Check-in confirmations
safehome/{serial}/command    # Commands to hub
```

## Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Frontend | demo@example.com | Demo123456 |
| Reseller | demo@product.com | product123 |
| Admin | EdmundLam | Admin2@26 |

## Deployment

- **Backend**: Railway (PostgreSQL + Redis included)
- **Frontend**: Vercel
- **Reseller Hub**: Vercel

## Detailed Documentation

See [docs/CLAUDE_detail.md](./docs/CLAUDE_detail.md) for complete reference.
