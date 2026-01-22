# Smart Home Platform - Setup Guide

## Prerequisites Installation

### 1. Install Node.js and npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### 2. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
postgres=# CREATE DATABASE smarthome;
postgres=# CREATE USER smarthome_user WITH ENCRYPTED PASSWORD 'your_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE smarthome TO smarthome_user;
postgres=# \q
```

### 3. Install Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### 4. Install MQTT Broker (Mosquitto)
```bash
# Ubuntu/Debian
sudo apt install mosquitto mosquitto-clients

# Start Mosquitto service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test MQTT
mosquitto_sub -t test &
mosquitto_pub -t test -m "Hello"
```

## Project Setup

### 1. Clone and Install Dependencies
```bash
cd smart-home-platform
npm install
```

### 2. Configure Backend Environment
```bash
cd apps/backend
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Update these critical values in `.env`:
```env
DATABASE_URL=postgresql://smarthome_user:your_password@localhost:5432/smarthome
JWT_SECRET=generate-a-secure-random-string-here
REDIS_PASSWORD=your-redis-password-if-set
```

### 3. Configure Frontend Environment
```bash
cd apps/frontend
cp .env.example .env

# No changes needed for local development
```

### 4. Run Database Migrations
```bash
cd apps/backend
npm run db:migrate
```

### 5. Start Development Servers

#### Terminal 1 - Backend
```bash
cd apps/backend
npm run dev
```

Backend will start on: http://localhost:4000

#### Terminal 2 - Frontend
```bash
cd apps/frontend
npm run dev
```

Frontend will start on: http://localhost:3000

### 6. Create Your First User
Open your browser and navigate to:
- http://localhost:3000/signup

Create an account with:
- Email: your@email.com
- Password: Must be 8+ chars, with uppercase, lowercase, and number
- First Name: Your first name
- Last Name: Your last name

## Testing the Setup

### Test Backend API
```bash
# Health check
curl http://localhost:4000/health

# Response should be:
# {"status":"healthy","timestamp":"...","uptime":...,"environment":"development"}
```

### Test Authentication
```bash
# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourPassword123"
  }'

# Should return user data and tokens
```

### Test Database Connection
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Connect to database
psql -U smarthome_user -d smarthome -h localhost

# List tables
\dt

# Should see: users, rooms, devices, automations, etc.
```

### Test Redis Connection
```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> keys *
```

## Directory Structure

```
smart-home-platform/
├── apps/
│   ├── backend/                    # Node.js Express API
│   │   ├── src/
│   │   │   ├── controllers/        # Request handlers
│   │   │   ├── routes/             # API endpoints
│   │   │   ├── services/           # Business logic
│   │   │   ├── middleware/         # Auth, validation, etc.
│   │   │   ├── database/           # Migrations, seeds
│   │   │   ├── types/              # TypeScript types
│   │   │   ├── utils/              # Helper functions
│   │   │   └── index.ts            # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── frontend/                   # React TypeScript UI
│       ├── src/
│       │   ├── components/         # Reusable components
│       │   ├── pages/              # Route pages
│       │   ├── services/           # API calls
│       │   ├── store/              # State management
│       │   ├── hooks/              # Custom React hooks
│       │   ├── types/              # TypeScript types
│       │   ├── utils/              # Helper functions
│       │   ├── main.tsx            # Entry point
│       │   └── index.css           # Global styles
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── .env.example
│
├── package.json                    # Root package.json
├── turbo.json                      # Monorepo config
└── README.md                       # This file
```

## Available Scripts

### Root Level
```bash
npm run dev              # Start both backend and frontend
npm run build            # Build all packages
npm run backend:dev      # Start only backend
npm run frontend:dev     # Start only frontend
npm run clean            # Clean all build artifacts
```

### Backend (apps/backend)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run lint             # Lint code
npm run test             # Run tests
```

### Frontend (apps/frontend)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
npm run test             # Run tests
```

## API Documentation

### Authentication Endpoints

**POST /api/v1/auth/signup**
- Create new user account
- Body: { email, password, firstName, lastName, phoneNumber? }
- Returns: { user, tokens: { accessToken, refreshToken } }

**POST /api/v1/auth/login**
- Login existing user
- Body: { email, password }
- Returns: { user, tokens: { accessToken, refreshToken } }

**POST /api/v1/auth/refresh**
- Refresh access token
- Body: { refreshToken }
- Returns: { accessToken, refreshToken }

**POST /api/v1/auth/logout**
- Logout user (requires auth)
- Headers: Authorization: Bearer <token>
- Returns: { success: true }

**GET /api/v1/auth/me**
- Get current user profile (requires auth)
- Headers: Authorization: Bearer <token>
- Returns: { user }

### Protected Routes
All routes except auth endpoints require authentication.
Include header: `Authorization: Bearer <your-access-token>`

## Troubleshooting

### Backend won't start
```bash
# Check if ports are already in use
lsof -i :4000
lsof -i :4001

# Kill process if needed
kill -9 <PID>

# Check database connection
npm run db:migrate
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env match database
psql -U smarthome_user -d smarthome -h localhost

# Reset database if needed
sudo -u postgres psql
DROP DATABASE smarthome;
CREATE DATABASE smarthome;
```

### Redis connection errors
```bash
# Check Redis is running
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server

# Test connection
redis-cli ping
```

## Next Steps

1. **Add Device Integration**
   - Implement device discovery
   - Add protocol handlers (Zigbee, Z-Wave, etc.)
   - Create device control interfaces

2. **Build Automation Engine**
   - Implement trigger system
   - Add condition evaluation
   - Create action executors

3. **Add Real-time Features**
   - Implement WebSocket broadcasting
   - Add device state subscriptions
   - Create real-time notifications

4. **Enhance Security**
   - Add 2FA support
   - Implement API rate limiting
   - Add audit logging

5. **Deploy to Production**
   - Set up reverse proxy (Nginx)
   - Configure SSL certificates
   - Set up monitoring and logging

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `apps/backend/logs/`
3. Check GitHub issues
4. Contact support

## License

MIT License - see LICENSE file
