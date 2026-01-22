import { DatabaseService } from '../services/database.service';
import logger from '../utils/logger';

const migrations = [
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        phone_number VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'guest')),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
    `,
    down: 'DROP TABLE IF EXISTS users CASCADE;',
  },
  {
    name: '002_create_rooms_table',
    up: `
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        floor_level INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_rooms_user_id ON rooms(user_id);
    `,
    down: 'DROP TABLE IF EXISTS rooms CASCADE;',
  },
  {
    name: '003_create_devices_table',
    up: `
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        manufacturer VARCHAR(100),
        model VARCHAR(100),
        protocol VARCHAR(20) CHECK (protocol IN ('zigbee', 'zwave', 'wifi', 'bluetooth', 'mqtt', 'http')),
        mac_address VARCHAR(17),
        ip_address VARCHAR(45),
        is_online BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_seen TIMESTAMP,
        capabilities JSONB DEFAULT '[]'::jsonb,
        state JSONB DEFAULT '{}'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_devices_user_id ON devices(user_id);
      CREATE INDEX idx_devices_room_id ON devices(room_id);
      CREATE INDEX idx_devices_type ON devices(device_type);
      CREATE INDEX idx_devices_protocol ON devices(protocol);
      CREATE INDEX idx_devices_is_online ON devices(is_online);
    `,
    down: 'DROP TABLE IF EXISTS devices CASCADE;',
  },
  {
    name: '004_create_automations_table',
    up: `
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT true,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_config JSONB NOT NULL,
        conditions JSONB DEFAULT '[]'::jsonb,
        actions JSONB NOT NULL,
        last_triggered TIMESTAMP,
        trigger_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_automations_user_id ON automations(user_id);
      CREATE INDEX idx_automations_enabled ON automations(is_enabled);
    `,
    down: 'DROP TABLE IF EXISTS automations CASCADE;',
  },
  {
    name: '005_create_device_logs_table',
    up: `
      CREATE TABLE IF NOT EXISTS device_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_device_logs_device_id ON device_logs(device_id);
      CREATE INDEX idx_device_logs_timestamp ON device_logs(timestamp);
      CREATE INDEX idx_device_logs_event_type ON device_logs(event_type);
    `,
    down: 'DROP TABLE IF EXISTS device_logs CASCADE;',
  },
  {
    name: '006_create_scenes_table',
    up: `
      CREATE TABLE IF NOT EXISTS scenes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        actions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_scenes_user_id ON scenes(user_id);
    `,
    down: 'DROP TABLE IF EXISTS scenes CASCADE;',
  },
  {
    name: '007_create_notifications_table',
    up: `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) CHECK (type IN ('info', 'warning', 'error', 'success')),
        is_read BOOLEAN DEFAULT false,
        related_entity_type VARCHAR(50),
        related_entity_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    `,
    down: 'DROP TABLE IF EXISTS notifications CASCADE;',
  },
  {
    name: '008_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: 'DROP TABLE IF EXISTS migrations;',
  },
];

async function runMigrations(): Promise<void> {
  try {
    await DatabaseService.initialize();
    logger.info('Starting database migrations...');

    for (const migration of migrations) {
      try {
        // Check if migration already ran
        const result = await DatabaseService.query(
          `SELECT name FROM migrations WHERE name = $1`,
          [migration.name]
        ).catch(() => ({ rows: [] }));

        if (result.rows.length > 0) {
          logger.info(`Migration ${migration.name} already executed, skipping...`);
          continue;
        }

        // Run migration
        await DatabaseService.query(migration.up);
        
        // Record migration
        await DatabaseService.query(
          `INSERT INTO migrations (name) VALUES ($1)`,
          [migration.name]
        ).catch(() => {});

        logger.info(`✓ Migration ${migration.name} completed successfully`);
      } catch (error) {
        logger.error(`✗ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }

    logger.info('All migrations completed successfully!');
    await DatabaseService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    await DatabaseService.disconnect();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
