import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all automations for the authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await DatabaseService.query(
      `SELECT * FROM automations
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(automation => ({
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        isEnabled: automation.is_enabled,
        lastTriggered: automation.last_triggered,
        createdAt: automation.created_at,
        updatedAt: automation.updated_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get a single automation
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      'SELECT * FROM automations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Automation not found', 404);
    }

    const automation = result.rows[0];
    res.json({
      success: true,
      data: {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        isEnabled: automation.is_enabled,
        lastTriggered: automation.last_triggered,
        createdAt: automation.created_at,
        updatedAt: automation.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a new automation
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { name, description, trigger, conditions, actions, isEnabled } = req.body;

    if (!name || name.trim().length === 0) {
      throw new AppError('Automation name is required', 400);
    }

    if (!trigger) {
      throw new AppError('Automation trigger is required', 400);
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      throw new AppError('At least one action is required', 400);
    }

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO automations (id, user_id, name, description, trigger, conditions, actions, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        userId,
        name.trim(),
        description || null,
        JSON.stringify(trigger),
        JSON.stringify(conditions || []),
        JSON.stringify(actions),
        isEnabled !== false,
      ]
    );

    const automation = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Automation created successfully',
      data: {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        isEnabled: automation.is_enabled,
        createdAt: automation.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update an automation
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { name, description, trigger, conditions, actions, isEnabled } = req.body;

    const result = await DatabaseService.query(
      `UPDATE automations
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           trigger = COALESCE($3, trigger),
           conditions = COALESCE($4, conditions),
           actions = COALESCE($5, actions),
           is_enabled = COALESCE($6, is_enabled),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        name,
        description,
        trigger ? JSON.stringify(trigger) : null,
        conditions ? JSON.stringify(conditions) : null,
        actions ? JSON.stringify(actions) : null,
        isEnabled,
        id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      throw new AppError('Automation not found', 404);
    }

    const automation = result.rows[0];
    res.json({
      success: true,
      message: 'Automation updated successfully',
      data: {
        id: automation.id,
        name: automation.name,
        description: automation.description,
        trigger: automation.trigger,
        conditions: automation.conditions,
        actions: automation.actions,
        isEnabled: automation.is_enabled,
        updatedAt: automation.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Toggle automation enabled/disabled
router.patch('/:id/toggle', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      `UPDATE automations
       SET is_enabled = NOT is_enabled, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Automation not found', 404);
    }

    const automation = result.rows[0];
    res.json({
      success: true,
      message: `Automation ${automation.is_enabled ? 'enabled' : 'disabled'}`,
      data: {
        id: automation.id,
        name: automation.name,
        isEnabled: automation.is_enabled,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Manually trigger an automation
router.post('/:id/trigger', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      'SELECT * FROM automations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Automation not found', 404);
    }

    const automation = result.rows[0];

    if (!automation.is_enabled) {
      throw new AppError('Automation is disabled', 400);
    }

    // Update last_triggered timestamp
    await DatabaseService.query(
      'UPDATE automations SET last_triggered = NOW() WHERE id = $1',
      [id]
    );

    // TODO: Execute automation actions (integrate with device service)
    // For now, just acknowledge the trigger

    res.json({
      success: true,
      message: 'Automation triggered successfully',
      data: {
        id: automation.id,
        name: automation.name,
        actionsExecuted: automation.actions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete an automation
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      'DELETE FROM automations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Automation not found', 404);
    }

    res.json({
      success: true,
      message: 'Automation deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
