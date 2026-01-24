import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support Railway's DATABASE_URL format or individual env vars
const connectionString = process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'smarthome',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

const migrations = [
  // ========== AGED CARE / SAFEHOME TABLES ==========
  {
    name: '018_create_hubs_table',
    up: `
      CREATE TABLE IF NOT EXISTS hubs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) DEFAULT 'My SafeHome Hub',
        firmware_version VARCHAR(50),
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'updating', 'error')),
        last_seen_at TIMESTAMP,
        battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
        is_on_battery BOOLEAN DEFAULT false,
        wifi_strength INTEGER CHECK (wifi_strength >= -100 AND wifi_strength <= 0),
        configuration JSONB DEFAULT '{
          "check_in_time": "09:00",
          "night_mode_start": "22:00",
          "night_mode_end": "06:00",
          "alert_sensitivity": "normal",
          "voice_enabled": true,
          "privacy_mode": false
        }'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_hubs_user_id ON hubs(user_id);
      CREATE INDEX IF NOT EXISTS idx_hubs_serial ON hubs(serial_number);
      CREATE INDEX IF NOT EXISTS idx_hubs_status ON hubs(status);
    `,
  },
  {
    name: '019_create_family_members_table',
    up: `
      CREATE TABLE IF NOT EXISTS family_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        is_emergency_contact BOOLEAN DEFAULT false,
        notification_preferences JSONB DEFAULT '{
          "check_in": true,
          "emergency": true,
          "activity_alerts": true,
          "daily_summary": false,
          "push_enabled": true,
          "sms_enabled": true,
          "email_enabled": false
        }'::jsonb,
        priority_order INTEGER DEFAULT 1,
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_family_user_id ON family_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_family_emergency ON family_members(is_emergency_contact);
      CREATE INDEX IF NOT EXISTS idx_family_priority ON family_members(priority_order);
    `,
  },
  {
    name: '020_create_activity_events_table',
    up: `
      CREATE TABLE IF NOT EXISTS activity_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
        device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
          'motion_detected', 'motion_stopped', 'door_opened', 'door_closed',
          'button_pressed', 'bed_occupied', 'bed_vacant', 'appliance_on',
          'appliance_off', 'smoke_detected', 'co_detected', 'water_leak',
          'fall_detected', 'temperature_alert', 'battery_low', 'device_offline'
        )),
        room_name VARCHAR(100),
        sensor_data JSONB DEFAULT '{}'::jsonb,
        is_anomaly BOOLEAN DEFAULT false,
        anomaly_score DECIMAL(5,4),
        processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_activity_hub_id ON activity_events(hub_id);
      CREATE INDEX IF NOT EXISTS idx_activity_device_id ON activity_events(device_id);
      CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_anomaly ON activity_events(is_anomaly) WHERE is_anomaly = true;

      -- Partition-ready index for time-series queries
      CREATE INDEX IF NOT EXISTS idx_activity_hub_time ON activity_events(hub_id, created_at DESC);
    `,
  },
  {
    name: '021_create_check_ins_table',
    up: `
      CREATE TABLE IF NOT EXISTS check_ins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL,
        check_in_type VARCHAR(30) NOT NULL CHECK (check_in_type IN (
          'manual_app', 'manual_hub', 'voice', 'auto_detected', 'reminder_response'
        )),
        status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'help_needed', 'missed', 'late')),
        scheduled_time TIME,
        actual_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        family_notified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON check_ins(user_id);
      CREATE INDEX IF NOT EXISTS idx_checkins_created ON check_ins(created_at);
      CREATE INDEX IF NOT EXISTS idx_checkins_status ON check_ins(status);
      CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON check_ins(user_id, created_at DESC);
    `,
  },
  {
    name: '022_create_alerts_table',
    up: `
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL,
        activity_event_id UUID REFERENCES activity_events(id) ON DELETE SET NULL,
        alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
          'emergency_button', 'fall_detected', 'no_morning_activity',
          'extended_bathroom', 'no_activity', 'wandering', 'no_eating',
          'medication_missed', 'smoke_detected', 'co_detected', 'water_leak',
          'device_offline', 'hub_offline', 'battery_critical', 'custom'
        )),
        severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        title VARCHAR(200) NOT NULL,
        message TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled', 'escalated')),
        acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
        acknowledged_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        resolution_notes TEXT,
        escalation_level INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
      CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
      CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(user_id, status) WHERE status = 'active';
    `,
  },
  {
    name: '023_create_alert_notifications_table',
    up: `
      CREATE TABLE IF NOT EXISTS alert_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
        family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'sms', 'email', 'voice_call')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_alert_notif_alert ON alert_notifications(alert_id);
      CREATE INDEX IF NOT EXISTS idx_alert_notif_family ON alert_notifications(family_member_id);
      CREATE INDEX IF NOT EXISTS idx_alert_notif_status ON alert_notifications(status);
    `,
  },
  {
    name: '024_create_activity_baselines_table',
    up: `
      CREATE TABLE IF NOT EXISTS activity_baselines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
        room_name VARCHAR(100),
        avg_motion_events DECIMAL(10,2) DEFAULT 0,
        std_motion_events DECIMAL(10,2) DEFAULT 0,
        avg_duration_minutes DECIMAL(10,2) DEFAULT 0,
        typical_devices JSONB DEFAULT '[]'::jsonb,
        sample_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hub_id, day_of_week, hour_of_day, room_name)
      );

      CREATE INDEX IF NOT EXISTS idx_baseline_hub ON activity_baselines(hub_id);
      CREATE INDEX IF NOT EXISTS idx_baseline_schedule ON activity_baselines(hub_id, day_of_week, hour_of_day);
    `,
  },
  {
    name: '025_create_medication_schedules_table',
    up: `
      CREATE TABLE IF NOT EXISTS medication_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        medication_name VARCHAR(200) NOT NULL,
        dosage VARCHAR(100),
        instructions TEXT,
        scheduled_times JSONB DEFAULT '["08:00"]'::jsonb,
        days_of_week JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
        reminder_enabled BOOLEAN DEFAULT true,
        cabinet_sensor_id UUID REFERENCES devices(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_medication_user ON medication_schedules(user_id);
      CREATE INDEX IF NOT EXISTS idx_medication_active ON medication_schedules(is_active);
    `,
  },
  {
    name: '026_create_medication_logs_table',
    up: `
      CREATE TABLE IF NOT EXISTS medication_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMP NOT NULL,
        taken_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
        detection_method VARCHAR(30) CHECK (detection_method IN ('manual', 'cabinet_sensor', 'voice', 'reminder_ack')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_medlog_schedule ON medication_logs(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_medlog_scheduled ON medication_logs(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_medlog_status ON medication_logs(status);
    `,
  },
  {
    name: '027_add_aged_care_device_types',
    up: `
      -- Add aged care specific fields to devices table
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_category VARCHAR(50)
        CHECK (device_category IN (
          'motion_sensor', 'door_sensor', 'emergency_button', 'bed_sensor',
          'smart_plug', 'smoke_detector', 'co_detector', 'water_sensor',
          'temperature_sensor', 'video_doorbell', 'voice_assistant',
          'wearable_pendant', 'medicine_cabinet', 'smart_lock', 'camera', 'other'
        ));

      ALTER TABLE devices ADD COLUMN IF NOT EXISTS hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL;
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100);
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS alert_thresholds JSONB DEFAULT '{}'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_devices_hub_id ON devices(hub_id);
      CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(device_category);
      CREATE INDEX IF NOT EXISTS idx_devices_battery ON devices(battery_level) WHERE battery_level < 20;
    `,
  },
  {
    name: '028_add_aged_care_user_fields',
    up: `
      -- Add aged care specific fields to users table
      ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_info JSONB DEFAULT '{
        "medical_conditions": [],
        "allergies": [],
        "medications": [],
        "doctor_name": null,
        "doctor_phone": null,
        "hospital_preference": null,
        "ndis_number": null,
        "aged_care_package": null
      }'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mobility_level VARCHAR(20)
        CHECK (mobility_level IN ('independent', 'assisted', 'limited', 'wheelchair', 'bedridden'));
      ALTER TABLE users ADD COLUMN IF NOT EXISTS cognitive_level VARCHAR(20)
        CHECK (cognitive_level IN ('independent', 'mild_impairment', 'moderate_impairment', 'severe_impairment'));
      ALTER TABLE users ADD COLUMN IF NOT EXISTS care_plan JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Australia/Melbourne';
    `,
  },
];

async function runMigrations(): Promise<void> {
  console.log('Starting aged care database migrations...\n');

  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully.\n');

    for (const migration of migrations) {
      try {
        const result = await pool.query(
          `SELECT name FROM migrations WHERE name = $1`,
          [migration.name]
        ).catch(() => ({ rows: [] }));

        if (result.rows.length > 0) {
          console.log(`  [SKIP] ${migration.name} (already executed)`);
          continue;
        }

        await pool.query(migration.up);

        await pool.query(
          `INSERT INTO migrations (name) VALUES ($1)`,
          [migration.name]
        ).catch(() => {});

        console.log(`  [OK]   ${migration.name}`);
      } catch (error) {
        console.error(`  [FAIL] ${migration.name}:`, error);
        throw error;
      }
    }

    console.log('\nAged care migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
