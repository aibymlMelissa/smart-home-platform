# Quick Start Guide

## Fast Setup (5 minutes)

### 1. Prerequisites Check
```bash
node --version  # Need v18+
npm --version   # Need v9+
psql --version  # Need PostgreSQL
redis-cli ping  # Should return PONG
```

If missing, see SETUP_GUIDE.md for installation instructions.

### 2. Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE smarthome;"
sudo -u postgres psql -c "CREATE USER smarthome_user WITH PASSWORD 'dev123';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE smarthome TO smarthome_user;"
```

### 3. Install Dependencies
```bash
cd smart-home-platform
npm install
```

### 4. Configure Environment
```bash
# Backend
cd apps/backend
cp .env.example .env

# Update these in .env:
# DATABASE_URL=postgresql://smarthome_user:dev123@localhost:5432/smarthome
# JWT_SECRET=your-secret-key-here-change-in-production

# Frontend
cd ../frontend
cp .env.example .env
```

### 5. Initialize Database
```bash
cd apps/backend
npm run db:migrate
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
# Backend running at http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
# Frontend running at http://localhost:3000
```

### 7. Create Your Account
1. Open http://localhost:3000/signup
2. Fill in the form:
   - Email: test@example.com
   - Password: Test123456 (must have uppercase, lowercase, number)
   - First Name: Test
   - Last Name: User
3. Click "Create Account"
4. You'll be logged in automatically!

## Verify Installation

### Test Backend Health
```bash
curl http://localhost:4000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...
}
```

### Test Frontend
Open browser to: http://localhost:3000

You should see the login page with a modern dark UI.

## Common Issues

**Port already in use:**
```bash
# Kill process on port 4000
lsof -i :4000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Redis connection failed:**
```bash
# Check Redis is running
sudo systemctl status redis-server
sudo systemctl start redis-server
```

## What's Next?

Once you're up and running, explore:

1. **Dashboard** (/) - Overview of your smart home
2. **Devices** (/devices) - Manage connected devices
3. **Rooms** (/rooms) - Organize devices by room
4. **Automations** (/automations) - Create smart automations
5. **Settings** (/settings) - Configure your account

For detailed documentation, see:
- SETUP_GUIDE.md - Complete installation guide
- README.md - Project overview and hardware requirements

## Development Workflow

```bash
# Start both servers (from root)
npm run dev

# Or start individually:
npm run backend:dev   # Backend only
npm run frontend:dev  # Frontend only

# Build for production
npm run build

# Run tests
npm run test
```

## API Endpoints

Base URL: http://localhost:4000/api/v1

- POST /auth/signup - Create account
- POST /auth/login - Login
- POST /auth/logout - Logout
- GET /auth/me - Get current user
- GET /devices - List devices (requires auth)
- GET /rooms - List rooms (requires auth)

Include auth header for protected routes:
```bash
Authorization: Bearer <your-access-token>
```

## Need Help?

1. Check SETUP_GUIDE.md for detailed instructions
2. Review error logs in terminal
3. Verify all services are running
4. Check .env configuration

Happy coding! 🚀
