import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';

const router = Router();

// Get user profile
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await DatabaseService.query(
      `SELECT id, email, first_name, last_name, phone_number, role, created_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phoneNumber } = req.body;

    const result = await DatabaseService.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone_number = COALESCE($3, phone_number),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, first_name, last_name, phone_number, role`,
      [firstName, lastName, phoneNumber, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await DatabaseService.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
    );

    // Update password
    await DatabaseService.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const [devicesResult, roomsResult, automationsResult] = await Promise.all([
      DatabaseService.query('SELECT COUNT(*) as count FROM devices WHERE user_id = $1', [userId]),
      DatabaseService.query('SELECT COUNT(*) as count FROM rooms WHERE user_id = $1', [userId]),
      DatabaseService.query('SELECT COUNT(*) as count FROM automations WHERE user_id = $1', [userId]),
    ]);

    res.json({
      success: true,
      data: {
        totalDevices: parseInt(devicesResult.rows[0].count, 10),
        totalRooms: parseInt(roomsResult.rows[0].count, 10),
        totalAutomations: parseInt(automationsResult.rows[0].count, 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
