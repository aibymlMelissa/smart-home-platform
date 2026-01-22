import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get inventory for an outlet
router.get('/outlet/:outletId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { outletId } = req.params;
    const { lowStock } = req.query;

    let query = `
      SELECT i.*, p.sku, p.name as product_name, p.category, p.device_type, p.retail_price, p.wholesale_price
      FROM inventory i
      JOIN product_catalog p ON i.product_id = p.id
      WHERE i.outlet_id = $1
    `;

    if (lowStock === 'true') {
      query += ' AND i.quantity <= i.reorder_level';
    }

    query += ' ORDER BY p.name ASC';

    const result = await DatabaseService.query(query, [outletId]);

    res.json({
      success: true,
      data: result.rows.map(i => ({
        id: i.id,
        outletId: i.outlet_id,
        productId: i.product_id,
        sku: i.sku,
        productName: i.product_name,
        category: i.category,
        deviceType: i.device_type,
        quantity: i.quantity,
        reservedQuantity: i.reserved_quantity,
        availableQuantity: i.quantity - i.reserved_quantity,
        reorderLevel: i.reorder_level,
        reorderQuantity: i.reorder_quantity,
        retailPrice: parseFloat(i.retail_price),
        wholesalePrice: parseFloat(i.wholesale_price),
        location: i.location,
        isLowStock: i.quantity <= i.reorder_level,
        lastRestockAt: i.last_restock_at,
        updatedAt: i.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get product catalog
router.get('/products', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;

    let query = 'SELECT * FROM product_catalog WHERE is_active = true';
    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
    }

    query += ' ORDER BY name ASC';

    const result = await DatabaseService.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        deviceType: p.device_type,
        brand: p.brand,
        wholesalePrice: parseFloat(p.wholesale_price),
        retailPrice: parseFloat(p.retail_price),
        specifications: p.specifications,
        images: p.images,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Create product in catalog
router.post('/products', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { sku, name, description, category, deviceType, brand, wholesalePrice, retailPrice, specifications, images } = req.body;

    if (!sku || !name || !category || !wholesalePrice || !retailPrice) {
      throw new AppError('SKU, name, category, wholesale price, and retail price are required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO product_catalog (id, sku, name, description, category, device_type, brand, wholesale_price, retail_price, specifications, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, sku, name, description || null, category, deviceType || null, brand || null, wholesalePrice, retailPrice, JSON.stringify(specifications || {}), JSON.stringify(images || [])]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Add product to outlet inventory
router.post('/outlet/:outletId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { outletId } = req.params;
    const { productId, quantity, reorderLevel, reorderQuantity, location } = req.body;

    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO inventory (id, outlet_id, product_id, quantity, reorder_level, reorder_quantity, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (outlet_id, product_id)
       DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = NOW()
       RETURNING *`,
      [id, outletId, productId, quantity || 0, reorderLevel || 10, reorderQuantity || 50, location || null]
    );

    res.status(201).json({
      success: true,
      message: 'Inventory updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Update inventory quantity
router.patch('/:id/quantity', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (adjustment === undefined || adjustment === 0) {
      throw new AppError('Adjustment amount is required', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE inventory
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [adjustment, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({
      success: true,
      message: `Inventory adjusted by ${adjustment > 0 ? '+' : ''}${adjustment}`,
      data: {
        id: result.rows[0].id,
        quantity: result.rows[0].quantity,
        reason,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Reserve inventory (for orders)
router.patch('/:id/reserve', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    // Check available quantity
    const current = await DatabaseService.query(
      'SELECT quantity, reserved_quantity FROM inventory WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      throw new AppError('Inventory item not found', 404);
    }

    const available = current.rows[0].quantity - current.rows[0].reserved_quantity;
    if (available < quantity) {
      throw new AppError(`Insufficient stock. Available: ${available}`, 400);
    }

    const result = await DatabaseService.query(
      `UPDATE inventory
       SET reserved_quantity = reserved_quantity + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    res.json({
      success: true,
      message: `Reserved ${quantity} units`,
      data: {
        id: result.rows[0].id,
        quantity: result.rows[0].quantity,
        reservedQuantity: result.rows[0].reserved_quantity,
        availableQuantity: result.rows[0].quantity - result.rows[0].reserved_quantity,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Release reserved inventory
router.patch('/:id/release', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE inventory
       SET reserved_quantity = GREATEST(reserved_quantity - $1, 0), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({
      success: true,
      message: `Released ${quantity} units`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Fulfill reserved inventory (convert reserved to sold)
router.patch('/:id/fulfill', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE inventory
       SET quantity = quantity - $1,
           reserved_quantity = GREATEST(reserved_quantity - $1, 0),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({
      success: true,
      message: `Fulfilled ${quantity} units`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Restock inventory
router.post('/:id/restock', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE inventory
       SET quantity = quantity + $1, last_restock_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({
      success: true,
      message: `Restocked ${quantity} units`,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get low stock alerts across all outlets for a reseller
router.get('/alerts/:resellerId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId } = req.params;

    const result = await DatabaseService.query(
      `SELECT i.*, p.sku, p.name as product_name, o.name as outlet_name
       FROM inventory i
       JOIN product_catalog p ON i.product_id = p.id
       JOIN outlets o ON i.outlet_id = o.id
       WHERE o.reseller_id = $1 AND i.quantity <= i.reorder_level
       ORDER BY (i.reorder_level - i.quantity) DESC`,
      [resellerId]
    );

    res.json({
      success: true,
      data: result.rows.map(i => ({
        id: i.id,
        outletId: i.outlet_id,
        outletName: i.outlet_name,
        productId: i.product_id,
        sku: i.sku,
        productName: i.product_name,
        quantity: i.quantity,
        reorderLevel: i.reorder_level,
        reorderQuantity: i.reorder_quantity,
        deficit: i.reorder_level - i.quantity,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
