import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all resellers (admin only)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await DatabaseService.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM outlets o WHERE o.reseller_id = r.id) as outlet_count,
        (SELECT COUNT(*) FROM agents a WHERE a.reseller_id = r.id) as agent_count
       FROM resellers r
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        companyName: r.company_name,
        contactEmail: r.contact_email,
        contactPhone: r.contact_phone,
        address: r.address,
        city: r.city,
        country: r.country,
        tier: r.tier,
        commissionRate: parseFloat(r.commission_rate),
        creditLimit: parseFloat(r.credit_limit),
        isActive: r.is_active,
        outletCount: parseInt(r.outlet_count, 10),
        agentCount: parseInt(r.agent_count, 10),
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single reseller
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM outlets o WHERE o.reseller_id = r.id) as outlet_count,
        (SELECT COUNT(*) FROM agents a WHERE a.reseller_id = r.id) as agent_count,
        (SELECT COALESCE(SUM(wo.total), 0) FROM wholesale_orders wo WHERE wo.reseller_id = r.id AND wo.status = 'delivered') as total_purchases
       FROM resellers r
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Reseller not found', 404);
    }

    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        companyName: r.company_name,
        contactEmail: r.contact_email,
        contactPhone: r.contact_phone,
        address: r.address,
        city: r.city,
        country: r.country,
        tier: r.tier,
        commissionRate: parseFloat(r.commission_rate),
        creditLimit: parseFloat(r.credit_limit),
        isActive: r.is_active,
        metadata: r.metadata,
        outletCount: parseInt(r.outlet_count, 10),
        agentCount: parseInt(r.agent_count, 10),
        totalPurchases: parseFloat(r.total_purchases),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create reseller
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { companyName, contactEmail, contactPhone, address, city, country, tier, commissionRate, creditLimit } = req.body;

    if (!companyName || !contactEmail) {
      throw new AppError('Company name and contact email are required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO resellers (id, company_name, contact_email, contact_phone, address, city, country, tier, commission_rate, credit_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, companyName, contactEmail, contactPhone || null, address || null, city || null, country || null, tier || 'standard', commissionRate || 10.00, creditLimit || 10000.00]
    );

    const r = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Reseller created successfully',
      data: {
        id: r.id,
        companyName: r.company_name,
        contactEmail: r.contact_email,
        tier: r.tier,
        createdAt: r.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update reseller
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { companyName, contactEmail, contactPhone, address, city, country, tier, commissionRate, creditLimit, isActive } = req.body;

    const result = await DatabaseService.query(
      `UPDATE resellers
       SET company_name = COALESCE($1, company_name),
           contact_email = COALESCE($2, contact_email),
           contact_phone = COALESCE($3, contact_phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           country = COALESCE($6, country),
           tier = COALESCE($7, tier),
           commission_rate = COALESCE($8, commission_rate),
           credit_limit = COALESCE($9, credit_limit),
           is_active = COALESCE($10, is_active),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [companyName, contactEmail, contactPhone, address, city, country, tier, commissionRate, creditLimit, isActive, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Reseller not found', 404);
    }

    res.json({
      success: true,
      message: 'Reseller updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete reseller
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      'DELETE FROM resellers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Reseller not found', 404);
    }

    res.json({
      success: true,
      message: 'Reseller deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get reseller dashboard stats
router.get('/:id/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [outlets, agents, orders, inventory] = await Promise.all([
      DatabaseService.query('SELECT COUNT(*) as count FROM outlets WHERE reseller_id = $1 AND is_active = true', [id]),
      DatabaseService.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'busy\' THEN 1 ELSE 0 END) as active FROM agents WHERE reseller_id = $1', [id]),
      DatabaseService.query(`
        SELECT
          COUNT(*) FILTER (WHERE ro.status = 'pending') as pending,
          COUNT(*) FILTER (WHERE ro.status = 'completed') as completed,
          COALESCE(SUM(ro.total) FILTER (WHERE ro.status = 'completed' AND ro.created_at > NOW() - INTERVAL '30 days'), 0) as revenue_30d
        FROM retail_orders ro
        JOIN outlets o ON ro.outlet_id = o.id
        WHERE o.reseller_id = $1
      `, [id]),
      DatabaseService.query(`
        SELECT COUNT(*) as low_stock
        FROM inventory i
        JOIN outlets o ON i.outlet_id = o.id
        WHERE o.reseller_id = $1 AND i.quantity <= i.reorder_level
      `, [id]),
    ]);

    res.json({
      success: true,
      data: {
        outlets: parseInt(outlets.rows[0].count, 10),
        agents: {
          total: parseInt(agents.rows[0].total, 10),
          active: parseInt(agents.rows[0].active || 0, 10),
        },
        orders: {
          pending: parseInt(orders.rows[0].pending, 10),
          completed: parseInt(orders.rows[0].completed, 10),
          revenue30d: parseFloat(orders.rows[0].revenue_30d),
        },
        lowStockItems: parseInt(inventory.rows[0].low_stock, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
