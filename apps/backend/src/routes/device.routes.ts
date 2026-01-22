import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all devices for the authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const result = await DatabaseService.query(
      `SELECT d.*, r.name as room_name
       FROM devices d
       LEFT JOIN rooms r ON d.room_id = r.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol,
        status: device.status,
        state: device.state,
        roomId: device.room_id,
        roomName: device.room_name,
        metadata: device.metadata,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get a single device
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      `SELECT d.*, r.name as room_name
       FROM devices d
       LEFT JOIN rooms r ON d.room_id = r.id
       WHERE d.id = $1 AND d.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = result.rows[0];
    res.json({
      success: true,
      data: {
        id: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol,
        status: device.status,
        state: device.state,
        roomId: device.room_id,
        roomName: device.room_name,
        metadata: device.metadata,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a new device
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { name, type, protocol, roomId, metadata } = req.body;

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO devices (id, user_id, room_id, name, type, protocol, status, state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, userId, roomId || null, name, type, protocol || 'wifi', 'offline', {}, metadata || {}]
    );

    const device = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: {
        id: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol,
        status: device.status,
        state: device.state,
        roomId: device.room_id,
        metadata: device.metadata,
        createdAt: device.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update a device
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, roomId, metadata } = req.body;

    const result = await DatabaseService.query(
      `UPDATE devices
       SET name = COALESCE($1, name),
           room_id = $2,
           metadata = COALESCE($3, metadata),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, roomId, metadata ? JSON.stringify(metadata) : null, id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = result.rows[0];
    res.json({
      success: true,
      message: 'Device updated successfully',
      data: {
        id: device.id,
        name: device.name,
        type: device.type,
        protocol: device.protocol,
        status: device.status,
        state: device.state,
        roomId: device.room_id,
        metadata: device.metadata,
        updatedAt: device.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update device state (e.g., turn on/off)
router.patch('/:id/state', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { state } = req.body;

    const result = await DatabaseService.query(
      `UPDATE devices
       SET state = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [JSON.stringify(state), id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Device not found', 404);
    }

    const device = result.rows[0];
    res.json({
      success: true,
      message: 'Device state updated',
      data: {
        id: device.id,
        name: device.name,
        state: device.state,
        updatedAt: device.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete a device
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      'DELETE FROM devices WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Device not found', 404);
    }

    res.json({
      success: true,
      message: 'Device deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
