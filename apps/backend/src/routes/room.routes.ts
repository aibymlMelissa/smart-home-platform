import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all rooms for the authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await DatabaseService.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id) as device_count
       FROM rooms r
       WHERE r.user_id = $1
       ORDER BY r.name ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(room => ({
        id: room.id,
        name: room.name,
        icon: room.icon,
        color: room.color,
        deviceCount: parseInt(room.device_count, 10),
        createdAt: room.created_at,
        updatedAt: room.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get a single room with its devices
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const roomResult = await DatabaseService.query(
      'SELECT * FROM rooms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (roomResult.rows.length === 0) {
      throw new AppError('Room not found', 404);
    }

    const devicesResult = await DatabaseService.query(
      'SELECT * FROM devices WHERE room_id = $1 AND user_id = $2 ORDER BY name ASC',
      [id, userId]
    );

    const room = roomResult.rows[0];
    res.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        icon: room.icon,
        color: room.color,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
        devices: devicesResult.rows.map(device => ({
          id: device.id,
          name: device.name,
          type: device.type,
          protocol: device.protocol,
          status: device.status,
          state: device.state,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a new room
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { name, icon, color } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('Room name is required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO rooms (id, user_id, name, icon, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, name.trim(), icon || 'home', color || '#3B82F6']
    );

    const room = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        id: room.id,
        name: room.name,
        icon: room.icon,
        color: room.color,
        createdAt: room.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update a room
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const result = await DatabaseService.query(
      `UPDATE rooms
       SET name = COALESCE($1, name),
           icon = COALESCE($2, icon),
           color = COALESCE($3, color),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, icon, color, id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Room not found', 404);
    }

    const room = result.rows[0];
    res.json({
      success: true,
      message: 'Room updated successfully',
      data: {
        id: room.id,
        name: room.name,
        icon: room.icon,
        color: room.color,
        updatedAt: room.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete a room
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // First, unassign devices from this room
    await DatabaseService.query(
      'UPDATE devices SET room_id = NULL WHERE room_id = $1 AND user_id = $2',
      [id, userId]
    );

    const result = await DatabaseService.query(
      'DELETE FROM rooms WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Room not found', 404);
    }

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
