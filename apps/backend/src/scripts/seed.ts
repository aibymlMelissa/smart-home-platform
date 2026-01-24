import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Support Railway's DATABASE_URL format or individual env vars
const connectionString = process.env.DATABASE_URL?.trim();

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

async function seed(): Promise<void> {
  console.log('Starting database seeding...\n');

  try {
    // Create admin user (EdmundLam)
    const adminId = uuidv4();
    const adminHashedPassword = await bcrypt.hash('Admin2@26', 12);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [adminId, 'EdmundLam', adminHashedPassword, 'Edmund', 'Lam', 'admin', 'consultant']
    );
    console.log('  [OK] Created admin user (EdmundLam / Admin2@26)');

    // Create demo user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('Demo123456', 12);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [userId, 'demo@example.com', hashedPassword, 'Demo', 'User', 'user']
    );
    console.log('  [OK] Created demo user (demo@example.com / Demo123456)');

    // Create demo reseller company first
    const resellerId = uuidv4();
    await pool.query(
      `INSERT INTO resellers (id, company_name, contact_email, contact_phone, city, country, tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (contact_email) DO NOTHING`,
      [resellerId, 'Demo Products Pty Ltd', 'contact@product.com', '03 9000 0000', 'Melbourne', 'Australia', 'gold']
    );
    console.log('  [OK] Created demo reseller company (Demo Products Pty Ltd)');

    // Get reseller ID (in case it already existed)
    const resellerResult = await pool.query(
      `SELECT id FROM resellers WHERE contact_email = 'contact@product.com'`
    );
    const actualResellerId = resellerResult.rows[0]?.id || resellerId;

    // Create demo reseller user
    const resellerUserId = uuidv4();
    const resellerHashedPassword = await bcrypt.hash('product123', 12);

    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, user_type, reseller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING`,
      [resellerUserId, 'demo@product.com', resellerHashedPassword, 'Demo', 'Reseller', 'user', 'reseller', actualResellerId]
    );
    console.log('  [OK] Created demo reseller user (demo@product.com / product123)');

    // Get the user ID (in case it already existed)
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = 'demo@example.com'`
    );
    const actualUserId = userResult.rows[0].id;

    // Create sample rooms
    const rooms = [
      { name: 'Living Room', icon: 'sofa', color: '#3B82F6' },
      { name: 'Bedroom', icon: 'bed', color: '#8B5CF6' },
      { name: 'Kitchen', icon: 'utensils', color: '#F59E0B' },
      { name: 'Bathroom', icon: 'bath', color: '#06B6D4' },
    ];

    const roomIds: string[] = [];
    for (const room of rooms) {
      const roomId = uuidv4();
      await pool.query(
        `INSERT INTO rooms (id, user_id, name, icon, color)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [roomId, actualUserId, room.name, room.icon, room.color]
      );
      roomIds.push(roomId);
    }
    console.log(`  [OK] Created ${rooms.length} sample rooms`);

    // Create sample devices
    const devices = [
      { name: 'Main Light', type: 'light', protocol: 'zigbee', roomIndex: 0, state: { on: false, brightness: 100 } },
      { name: 'Floor Lamp', type: 'light', protocol: 'wifi', roomIndex: 0, state: { on: true, brightness: 75 } },
      { name: 'Smart TV', type: 'media', protocol: 'wifi', roomIndex: 0, state: { on: false } },
      { name: 'Bedroom Light', type: 'light', protocol: 'zigbee', roomIndex: 1, state: { on: false, brightness: 50 } },
      { name: 'Smart Plug', type: 'switch', protocol: 'wifi', roomIndex: 1, state: { on: false } },
      { name: 'Kitchen Light', type: 'light', protocol: 'wifi', roomIndex: 2, state: { on: false, brightness: 100 } },
      { name: 'Coffee Maker', type: 'appliance', protocol: 'wifi', roomIndex: 2, state: { on: false } },
      { name: 'Motion Sensor', type: 'sensor', protocol: 'zigbee', roomIndex: 3, state: { motion: false } },
      { name: 'Temperature Sensor', type: 'sensor', protocol: 'zigbee', roomIndex: 0, state: { temperature: 22.5, humidity: 45 } },
      { name: 'Front Door Lock', type: 'lock', protocol: 'zwave', roomIndex: null, state: { locked: true } },
    ];

    for (const device of devices) {
      await pool.query(
        `INSERT INTO devices (id, user_id, room_id, name, type, protocol, status, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          uuidv4(),
          actualUserId,
          device.roomIndex !== null ? roomIds[device.roomIndex] : null,
          device.name,
          device.type,
          device.protocol,
          'online',
          JSON.stringify(device.state),
        ]
      );
    }
    console.log(`  [OK] Created ${devices.length} sample devices`);

    // Create sample automation
    await pool.query(
      `INSERT INTO automations (id, user_id, name, description, trigger, conditions, actions, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        actualUserId,
        'Motion Light',
        'Turn on living room light when motion detected',
        JSON.stringify({ type: 'device_state', deviceType: 'sensor', condition: { motion: true } }),
        JSON.stringify([]),
        JSON.stringify([{ type: 'device_control', target: 'Living Room Light', action: { on: true } }]),
        true,
      ]
    );
    console.log('  [OK] Created sample automation');

    console.log('\nSeeding completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
