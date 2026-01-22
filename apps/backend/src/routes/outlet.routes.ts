import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all outlets for a reseller
router.get('/reseller/:resellerId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId } = req.params;

    const result = await DatabaseService.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM agents a WHERE a.outlet_id = o.id) as agent_count,
        (SELECT COUNT(*) FROM inventory i WHERE i.outlet_id = o.id) as product_count,
        (SELECT COUNT(*) FROM retail_orders ro WHERE ro.outlet_id = o.id AND ro.status = 'pending') as pending_orders
       FROM outlets o
       WHERE o.reseller_id = $1
       ORDER BY o.name ASC`,
      [resellerId]
    );

    res.json({
      success: true,
      data: result.rows.map(o => ({
        id: o.id,
        resellerId: o.reseller_id,
        name: o.name,
        code: o.code,
        type: o.type,
        address: o.address,
        city: o.city,
        country: o.country,
        phone: o.phone,
        email: o.email,
        operatingHours: o.operating_hours,
        isActive: o.is_active,
        agentCount: parseInt(o.agent_count, 10),
        productCount: parseInt(o.product_count, 10),
        pendingOrders: parseInt(o.pending_orders, 10),
        createdAt: o.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single outlet
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      `SELECT o.*, r.company_name as reseller_name
       FROM outlets o
       JOIN resellers r ON o.reseller_id = r.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Outlet not found', 404);
    }

    const o = result.rows[0];
    res.json({
      success: true,
      data: {
        id: o.id,
        resellerId: o.reseller_id,
        resellerName: o.reseller_name,
        name: o.name,
        code: o.code,
        type: o.type,
        address: o.address,
        city: o.city,
        country: o.country,
        phone: o.phone,
        email: o.email,
        operatingHours: o.operating_hours,
        isActive: o.is_active,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create outlet
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId, name, code, type, address, city, country, phone, email, operatingHours } = req.body;

    if (!resellerId || !name || !code) {
      throw new AppError('Reseller ID, name, and code are required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO outlets (id, reseller_id, name, code, type, address, city, country, phone, email, operating_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, resellerId, name, code, type || 'physical', address || null, city || null, country || null, phone || null, email || null, JSON.stringify(operatingHours || {})]
    );

    const o = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      data: {
        id: o.id,
        name: o.name,
        code: o.code,
        type: o.type,
        createdAt: o.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update outlet
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, type, address, city, country, phone, email, operatingHours, isActive } = req.body;

    const result = await DatabaseService.query(
      `UPDATE outlets
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           country = COALESCE($5, country),
           phone = COALESCE($6, phone),
           email = COALESCE($7, email),
           operating_hours = COALESCE($8, operating_hours),
           is_active = COALESCE($9, is_active),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, type, address, city, country, phone, email, operatingHours ? JSON.stringify(operatingHours) : null, isActive, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Outlet not found', 404);
    }

    res.json({
      success: true,
      message: 'Outlet updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete outlet
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      'DELETE FROM outlets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Outlet not found', 404);
    }

    res.json({
      success: true,
      message: 'Outlet deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get outlet dashboard stats
router.get('/:id/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [orders, inventory, agents] = await Promise.all([
      DatabaseService.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '1 day') as today,
          COALESCE(SUM(total) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '1 day'), 0) as revenue_today,
          COALESCE(SUM(total) FILTER (WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'), 0) as revenue_30d
        FROM retail_orders
        WHERE outlet_id = $1
      `, [id]),
      DatabaseService.query(`
        SELECT
          COUNT(*) as total_products,
          SUM(quantity) as total_units,
          COUNT(*) FILTER (WHERE quantity <= reorder_level) as low_stock
        FROM inventory
        WHERE outlet_id = $1
      `, [id]),
      DatabaseService.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'busy') as busy,
          COUNT(*) FILTER (WHERE status = 'idle') as idle
        FROM agents
        WHERE outlet_id = $1 AND is_active = true
      `, [id]),
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: parseInt(orders.rows[0].total, 10),
          pending: parseInt(orders.rows[0].pending, 10),
          todayCount: parseInt(orders.rows[0].today, 10),
          revenueToday: parseFloat(orders.rows[0].revenue_today),
          revenue30d: parseFloat(orders.rows[0].revenue_30d),
        },
        inventory: {
          totalProducts: parseInt(inventory.rows[0].total_products || 0, 10),
          totalUnits: parseInt(inventory.rows[0].total_units || 0, 10),
          lowStock: parseInt(inventory.rows[0].low_stock || 0, 10),
        },
        agents: {
          total: parseInt(agents.rows[0].total, 10),
          busy: parseInt(agents.rows[0].busy, 10),
          idle: parseInt(agents.rows[0].idle, 10),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
