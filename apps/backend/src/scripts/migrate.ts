import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'smarthome',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const migrations = [
  {
    name: '001_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '002_create_users_table',
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

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `,
  },
  {
    name: '003_create_rooms_table',
    up: `
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) DEFAULT 'home',
        color VARCHAR(20) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
    `,
  },
  {
    name: '004_create_devices_table',
    up: `
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        protocol VARCHAR(20) DEFAULT 'wifi' CHECK (protocol IN ('zigbee', 'zwave', 'wifi', 'bluetooth', 'mqtt', 'http', 'thread')),
        status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'unknown')),
        state JSONB DEFAULT '{}'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
      CREATE INDEX IF NOT EXISTS idx_devices_room_id ON devices(room_id);
      CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
      CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    `,
  },
  {
    name: '005_create_automations_table',
    up: `
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        trigger JSONB NOT NULL DEFAULT '{}'::jsonb,
        conditions JSONB DEFAULT '[]'::jsonb,
        actions JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        last_triggered TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
      CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);
    `,
  },
  // ========== RESELLER HUB TABLES ==========
  {
    name: '006_create_resellers_table',
    up: `
      CREATE TABLE IF NOT EXISTS resellers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(200) NOT NULL,
        contact_email VARCHAR(255) UNIQUE NOT NULL,
        contact_phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        tier VARCHAR(20) DEFAULT 'standard' CHECK (tier IN ('standard', 'silver', 'gold', 'platinum')),
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        credit_limit DECIMAL(12,2) DEFAULT 10000.00,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_resellers_tier ON resellers(tier);
      CREATE INDEX IF NOT EXISTS idx_resellers_is_active ON resellers(is_active);
    `,
  },
  {
    name: '007_create_outlets_table',
    up: `
      CREATE TABLE IF NOT EXISTS outlets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(20) DEFAULT 'physical' CHECK (type IN ('physical', 'online', 'hybrid')),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        operating_hours JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_outlets_reseller_id ON outlets(reseller_id);
      CREATE INDEX IF NOT EXISTS idx_outlets_code ON outlets(code);
      CREATE INDEX IF NOT EXISTS idx_outlets_is_active ON outlets(is_active);
    `,
  },
  {
    name: '008_create_agents_table',
    up: `
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
        outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('outlet_manager', 'sales_agent', 'inventory_agent', 'support_agent', 'analytics_agent')),
        model VARCHAR(100) DEFAULT 'claude-3-sonnet',
        status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'offline', 'error')),
        capabilities JSONB DEFAULT '[]'::jsonb,
        configuration JSONB DEFAULT '{}'::jsonb,
        performance_metrics JSONB DEFAULT '{}'::jsonb,
        last_active_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_agents_reseller_id ON agents(reseller_id);
      CREATE INDEX IF NOT EXISTS idx_agents_outlet_id ON agents(outlet_id);
      CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type);
      CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
    `,
  },
  {
    name: '009_create_agent_tasks_table',
    up: `
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
        input_data JSONB DEFAULT '{}'::jsonb,
        output_data JSONB DEFAULT '{}'::jsonb,
        error_message TEXT,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority ON agent_tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_scheduled_at ON agent_tasks(scheduled_at);
    `,
  },
  {
    name: '010_create_agent_actions_table',
    up: `
      CREATE TABLE IF NOT EXISTS agent_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        description TEXT,
        input_data JSONB DEFAULT '{}'::jsonb,
        output_data JSONB DEFAULT '{}'::jsonb,
        success BOOLEAN DEFAULT true,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_id ON agent_actions(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_actions_task_id ON agent_actions(task_id);
      CREATE INDEX IF NOT EXISTS idx_agent_actions_type ON agent_actions(action_type);
      CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at);
    `,
  },
  {
    name: '011_create_product_catalog_table',
    up: `
      CREATE TABLE IF NOT EXISTS product_catalog (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        device_type VARCHAR(50),
        brand VARCHAR(100),
        wholesale_price DECIMAL(10,2) NOT NULL,
        retail_price DECIMAL(10,2) NOT NULL,
        specifications JSONB DEFAULT '{}'::jsonb,
        images JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_product_catalog_sku ON product_catalog(sku);
      CREATE INDEX IF NOT EXISTS idx_product_catalog_category ON product_catalog(category);
      CREATE INDEX IF NOT EXISTS idx_product_catalog_device_type ON product_catalog(device_type);
    `,
  },
  {
    name: '012_create_inventory_table',
    up: `
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES product_catalog(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 0,
        reserved_quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        reorder_quantity INTEGER DEFAULT 50,
        location VARCHAR(100),
        last_restock_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(outlet_id, product_id)
      );

      CREATE INDEX IF NOT EXISTS idx_inventory_outlet_id ON inventory(outlet_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= reorder_level;
    `,
  },
  {
    name: '013_create_wholesale_orders_table',
    up: `
      CREATE TABLE IF NOT EXISTS wholesale_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        subtotal DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        tax DECIMAL(12,2) DEFAULT 0,
        total DECIMAL(12,2) DEFAULT 0,
        shipping_address TEXT,
        notes TEXT,
        ordered_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_wholesale_orders_reseller_id ON wholesale_orders(reseller_id);
      CREATE INDEX IF NOT EXISTS idx_wholesale_orders_status ON wholesale_orders(status);
      CREATE INDEX IF NOT EXISTS idx_wholesale_orders_number ON wholesale_orders(order_number);
    `,
  },
  {
    name: '014_create_retail_orders_table',
    up: `
      CREATE TABLE IF NOT EXISTS retail_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(200),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded')),
        subtotal DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        notes TEXT,
        processed_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_retail_orders_outlet_id ON retail_orders(outlet_id);
      CREATE INDEX IF NOT EXISTS idx_retail_orders_status ON retail_orders(status);
      CREATE INDEX IF NOT EXISTS idx_retail_orders_number ON retail_orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_retail_orders_customer_email ON retail_orders(customer_email);
    `,
  },
  {
    name: '015_create_order_items_table',
    up: `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wholesale_order_id UUID REFERENCES wholesale_orders(id) ON DELETE CASCADE,
        retail_order_id UUID REFERENCES retail_orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES product_catalog(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        serial_numbers JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (wholesale_order_id IS NOT NULL OR retail_order_id IS NOT NULL)
      );

      CREATE INDEX IF NOT EXISTS idx_order_items_wholesale ON order_items(wholesale_order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_retail ON order_items(retail_order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
    `,
  },
  {
    name: '016_create_device_registrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS device_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
        product_id UUID NOT NULL REFERENCES product_catalog(id) ON DELETE RESTRICT,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
        retail_order_id UUID REFERENCES retail_orders(id) ON DELETE SET NULL,
        customer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        warranty_start_date DATE,
        warranty_end_date DATE,
        registration_status VARCHAR(20) DEFAULT 'sold' CHECK (registration_status IN ('in_stock', 'sold', 'registered', 'warranty_claim', 'returned')),
        registered_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_device_reg_serial ON device_registrations(serial_number);
      CREATE INDEX IF NOT EXISTS idx_device_reg_outlet ON device_registrations(outlet_id);
      CREATE INDEX IF NOT EXISTS idx_device_reg_customer ON device_registrations(customer_user_id);
      CREATE INDEX IF NOT EXISTS idx_device_reg_status ON device_registrations(registration_status);
    `,
  },
  {
    name: '017_add_user_type_column',
    up: `
      -- Add user_type column to distinguish household users, resellers, and consultants
      ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'household'
        CHECK (user_type IN ('household', 'reseller', 'consultant'));

      -- Add reseller_id to link reseller users to their company
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL;

      -- Create index for user_type lookups
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_users_reseller_id ON users(reseller_id);
    `,
  },
];

async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully.\n');

    for (const migration of migrations) {
      try {
        // Check if migration already ran
        const result = await pool.query(
          `SELECT name FROM migrations WHERE name = $1`,
          [migration.name]
        ).catch(() => ({ rows: [] }));

        if (result.rows.length > 0) {
          console.log(`  [SKIP] ${migration.name} (already executed)`);
          continue;
        }

        // Run migration
        await pool.query(migration.up);

        // Record migration
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

    console.log('\nAll migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\nMigration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
