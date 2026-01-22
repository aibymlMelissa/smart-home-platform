import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generate order number
function generateOrderNumber(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ==================== RETAIL ORDERS ====================

// Get retail orders for an outlet
router.get('/retail/outlet/:outletId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { outletId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ro.*, a.name as agent_name,
        (SELECT COALESCE(json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', p.name,
          'sku', p.sku,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'total', oi.total
        )), '[]')
        FROM order_items oi
        JOIN product_catalog p ON oi.product_id = p.id
        WHERE oi.retail_order_id = ro.id) as items
      FROM retail_orders ro
      LEFT JOIN agents a ON ro.processed_by_agent_id = a.id
      WHERE ro.outlet_id = $1
    `;
    const params: any[] = [outletId];

    if (status) {
      params.push(status);
      query += ` AND ro.status = $${params.length}`;
    }

    query += ` ORDER BY ro.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await DatabaseService.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        outletId: o.outlet_id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        status: o.status,
        subtotal: parseFloat(o.subtotal),
        discount: parseFloat(o.discount),
        tax: parseFloat(o.tax),
        total: parseFloat(o.total),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        notes: o.notes,
        processedByAgentId: o.processed_by_agent_id,
        processedByAgentName: o.agent_name,
        items: o.items,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single retail order
router.get('/retail/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      `SELECT ro.*, o.name as outlet_name, a.name as agent_name
       FROM retail_orders ro
       JOIN outlets o ON ro.outlet_id = o.id
       LEFT JOIN agents a ON ro.processed_by_agent_id = a.id
       WHERE ro.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const items = await DatabaseService.query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN product_catalog p ON oi.product_id = p.id
       WHERE oi.retail_order_id = $1`,
      [id]
    );

    const o = result.rows[0];
    res.json({
      success: true,
      data: {
        id: o.id,
        orderNumber: o.order_number,
        outletId: o.outlet_id,
        outletName: o.outlet_name,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        status: o.status,
        subtotal: parseFloat(o.subtotal),
        discount: parseFloat(o.discount),
        tax: parseFloat(o.tax),
        total: parseFloat(o.total),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        notes: o.notes,
        processedByAgentId: o.processed_by_agent_id,
        processedByAgentName: o.agent_name,
        items: items.rows.map(i => ({
          id: i.id,
          productId: i.product_id,
          productName: i.product_name,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unit_price),
          discount: parseFloat(i.discount),
          total: parseFloat(i.total),
          serialNumbers: i.serial_numbers,
        })),
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create retail order
router.post('/retail', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { outletId, customerName, customerEmail, customerPhone, items, paymentMethod, discount, notes, processedByAgentId } = req.body;

    if (!outletId || !items || items.length === 0) {
      throw new AppError('Outlet ID and at least one item are required', 400);
    }

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber('RO');

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await DatabaseService.query(
        'SELECT id, retail_price FROM product_catalog WHERE id = $1',
        [item.productId]
      );

      if (product.rows.length === 0) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      const unitPrice = item.unitPrice || parseFloat(product.rows[0].retail_price);
      const itemTotal = unitPrice * item.quantity - (item.discount || 0);
      subtotal += itemTotal;

      orderItems.push({
        id: uuidv4(),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: item.discount || 0,
        total: itemTotal,
        serialNumbers: item.serialNumbers || [],
      });
    }

    const taxRate = 0.1; // 10% tax
    const tax = subtotal * taxRate;
    const total = subtotal - (discount || 0) + tax;

    // Create order
    await DatabaseService.query(
      `INSERT INTO retail_orders (id, outlet_id, order_number, customer_name, customer_email, customer_phone, subtotal, discount, tax, total, payment_method, notes, processed_by_agent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [orderId, outletId, orderNumber, customerName || null, customerEmail || null, customerPhone || null, subtotal, discount || 0, tax, total, paymentMethod || null, notes || null, processedByAgentId || null]
    );

    // Create order items
    for (const item of orderItems) {
      await DatabaseService.query(
        `INSERT INTO order_items (id, retail_order_id, product_id, quantity, unit_price, discount, total, serial_numbers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, orderId, item.productId, item.quantity, item.unitPrice, item.discount, item.total, JSON.stringify(item.serialNumbers)]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: orderId,
        orderNumber,
        subtotal,
        discount: discount || 0,
        tax,
        total,
        itemCount: orderItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update retail order status
router.patch('/retail/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (paymentStatus) {
      params.push(paymentStatus);
      updates.push(`payment_status = $${params.length}`);
    }

    if (updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await DatabaseService.query(
      `UPDATE retail_orders SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: {
        id: result.rows[0].id,
        orderNumber: result.rows[0].order_number,
        status: result.rows[0].status,
        paymentStatus: result.rows[0].payment_status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== WHOLESALE ORDERS ====================

// Get wholesale orders for a reseller
router.get('/wholesale/reseller/:resellerId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT wo.*, a.name as agent_name
      FROM wholesale_orders wo
      LEFT JOIN agents a ON wo.ordered_by_agent_id = a.id
      WHERE wo.reseller_id = $1
    `;
    const params: any[] = [resellerId];

    if (status) {
      params.push(status);
      query += ` AND wo.status = $${params.length}`;
    }

    query += ` ORDER BY wo.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await DatabaseService.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        resellerId: o.reseller_id,
        status: o.status,
        subtotal: parseFloat(o.subtotal),
        discount: parseFloat(o.discount),
        tax: parseFloat(o.tax),
        total: parseFloat(o.total),
        shippingAddress: o.shipping_address,
        notes: o.notes,
        orderedByAgentId: o.ordered_by_agent_id,
        orderedByAgentName: o.agent_name,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Create wholesale order
router.post('/wholesale', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId, items, shippingAddress, notes, orderedByAgentId } = req.body;

    if (!resellerId || !items || items.length === 0) {
      throw new AppError('Reseller ID and at least one item are required', 400);
    }

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber('WO');

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await DatabaseService.query(
        'SELECT id, wholesale_price FROM product_catalog WHERE id = $1',
        [item.productId]
      );

      if (product.rows.length === 0) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      const unitPrice = parseFloat(product.rows[0].wholesale_price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        id: uuidv4(),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total: itemTotal,
      });
    }

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Create order
    await DatabaseService.query(
      `INSERT INTO wholesale_orders (id, reseller_id, order_number, subtotal, tax, total, shipping_address, notes, ordered_by_agent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [orderId, resellerId, orderNumber, subtotal, tax, total, shippingAddress || null, notes || null, orderedByAgentId || null]
    );

    // Create order items
    for (const item of orderItems) {
      await DatabaseService.query(
        `INSERT INTO order_items (id, wholesale_order_id, product_id, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, orderId, item.productId, item.quantity, item.unitPrice, item.total]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Wholesale order created successfully',
      data: {
        id: orderId,
        orderNumber,
        subtotal,
        tax,
        total,
        itemCount: orderItems.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update wholesale order status
router.patch('/wholesale/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE wholesale_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: {
        id: result.rows[0].id,
        orderNumber: result.rows[0].order_number,
        status: result.rows[0].status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get order analytics for reseller
router.get('/analytics/:resellerId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId } = req.params;
    const { period = '30' } = req.query;

    const days = parseInt(period as string, 10);

    const result = await DatabaseService.query(`
      SELECT
        DATE(ro.created_at) as date,
        COUNT(*) as order_count,
        SUM(ro.total) as revenue,
        SUM(CASE WHEN ro.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN ro.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM retail_orders ro
      JOIN outlets o ON ro.outlet_id = o.id
      WHERE o.reseller_id = $1 AND ro.created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(ro.created_at)
      ORDER BY date DESC
    `, [resellerId]);

    const totals = await DatabaseService.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM retail_orders ro
      JOIN outlets o ON ro.outlet_id = o.id
      WHERE o.reseller_id = $1 AND ro.created_at > NOW() - INTERVAL '${days} days' AND ro.status = 'completed'
    `, [resellerId]);

    res.json({
      success: true,
      data: {
        period: days,
        daily: result.rows.map(r => ({
          date: r.date,
          orderCount: parseInt(r.order_count, 10),
          revenue: parseFloat(r.revenue),
          completed: parseInt(r.completed, 10),
          cancelled: parseInt(r.cancelled, 10),
        })),
        totals: {
          totalOrders: parseInt(totals.rows[0].total_orders, 10),
          totalRevenue: parseFloat(totals.rows[0].total_revenue),
          avgOrderValue: parseFloat(totals.rows[0].avg_order_value),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
