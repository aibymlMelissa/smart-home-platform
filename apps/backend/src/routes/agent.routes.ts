import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

const router = Router();

// Agent capability definitions
const AGENT_CAPABILITIES = {
  outlet_manager: [
    'view_dashboard',
    'manage_inventory',
    'manage_orders',
    'manage_agents',
    'view_analytics',
    'approve_refunds',
    'set_pricing',
  ],
  sales_agent: [
    'create_order',
    'process_payment',
    'register_device',
    'view_inventory',
    'apply_discount',
    'customer_lookup',
  ],
  inventory_agent: [
    'view_inventory',
    'update_stock',
    'create_reorder',
    'receive_shipment',
    'stock_audit',
    'transfer_stock',
  ],
  support_agent: [
    'view_orders',
    'process_return',
    'warranty_lookup',
    'create_ticket',
    'escalate_issue',
    'customer_communication',
  ],
  analytics_agent: [
    'view_dashboard',
    'generate_reports',
    'forecast_demand',
    'analyze_trends',
    'export_data',
  ],
};

// Get all agents for a reseller
router.get('/reseller/:resellerId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId } = req.params;

    const result = await DatabaseService.query(
      `SELECT a.*, o.name as outlet_name,
        (SELECT COUNT(*) FROM agent_tasks t WHERE t.agent_id = a.id AND t.status = 'completed') as tasks_completed,
        (SELECT COUNT(*) FROM agent_tasks t WHERE t.agent_id = a.id AND t.status = 'pending') as tasks_pending
       FROM agents a
       LEFT JOIN outlets o ON a.outlet_id = o.id
       WHERE a.reseller_id = $1
       ORDER BY a.created_at DESC`,
      [resellerId]
    );

    res.json({
      success: true,
      data: result.rows.map(a => ({
        id: a.id,
        resellerId: a.reseller_id,
        outletId: a.outlet_id,
        outletName: a.outlet_name,
        name: a.name,
        agentType: a.agent_type,
        model: a.model,
        status: a.status,
        capabilities: a.capabilities,
        performanceMetrics: a.performance_metrics,
        lastActiveAt: a.last_active_at,
        isActive: a.is_active,
        tasksCompleted: parseInt(a.tasks_completed, 10),
        tasksPending: parseInt(a.tasks_pending, 10),
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get agents for an outlet
router.get('/outlet/:outletId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { outletId } = req.params;

    const result = await DatabaseService.query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM agent_tasks t WHERE t.agent_id = a.id AND t.status IN ('pending', 'in_progress')) as active_tasks
       FROM agents a
       WHERE a.outlet_id = $1 AND a.is_active = true
       ORDER BY a.agent_type, a.name`,
      [outletId]
    );

    res.json({
      success: true,
      data: result.rows.map(a => ({
        id: a.id,
        name: a.name,
        agentType: a.agent_type,
        model: a.model,
        status: a.status,
        capabilities: a.capabilities,
        activeTasks: parseInt(a.active_tasks, 10),
        lastActiveAt: a.last_active_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single agent with details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [agentResult, recentTasks, recentActions] = await Promise.all([
      DatabaseService.query(
        `SELECT a.*, o.name as outlet_name, r.company_name as reseller_name
         FROM agents a
         LEFT JOIN outlets o ON a.outlet_id = o.id
         JOIN resellers r ON a.reseller_id = r.id
         WHERE a.id = $1`,
        [id]
      ),
      DatabaseService.query(
        `SELECT * FROM agent_tasks WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [id]
      ),
      DatabaseService.query(
        `SELECT * FROM agent_actions WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [id]
      ),
    ]);

    if (agentResult.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }

    const a = agentResult.rows[0];
    res.json({
      success: true,
      data: {
        id: a.id,
        resellerId: a.reseller_id,
        resellerName: a.reseller_name,
        outletId: a.outlet_id,
        outletName: a.outlet_name,
        name: a.name,
        agentType: a.agent_type,
        model: a.model,
        status: a.status,
        capabilities: a.capabilities,
        configuration: a.configuration,
        performanceMetrics: a.performance_metrics,
        lastActiveAt: a.last_active_at,
        isActive: a.is_active,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        recentTasks: recentTasks.rows.map(t => ({
          id: t.id,
          taskType: t.task_type,
          status: t.status,
          priority: t.priority,
          createdAt: t.created_at,
          completedAt: t.completed_at,
        })),
        recentActions: recentActions.rows.map(ac => ({
          id: ac.id,
          actionType: ac.action_type,
          description: ac.description,
          success: ac.success,
          durationMs: ac.duration_ms,
          createdAt: ac.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create agent
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { resellerId, outletId, name, agentType, model, configuration } = req.body;

    if (!resellerId || !name || !agentType) {
      throw new AppError('Reseller ID, name, and agent type are required', 400);
    }

    if (!AGENT_CAPABILITIES[agentType as keyof typeof AGENT_CAPABILITIES]) {
      throw new AppError('Invalid agent type', 400);
    }

    const capabilities = AGENT_CAPABILITIES[agentType as keyof typeof AGENT_CAPABILITIES];

    const id = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO agents (id, reseller_id, outlet_id, name, agent_type, model, capabilities, configuration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, resellerId, outletId || null, name, agentType, model || 'claude-3-sonnet', JSON.stringify(capabilities), JSON.stringify(configuration || {})]
    );

    const a = result.rows[0];
    logger.info(`Agent created: ${a.name} (${a.agent_type}) for reseller ${resellerId}`);

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: {
        id: a.id,
        name: a.name,
        agentType: a.agent_type,
        capabilities: a.capabilities,
        status: a.status,
        createdAt: a.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update agent
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, outletId, model, configuration, isActive } = req.body;

    const result = await DatabaseService.query(
      `UPDATE agents
       SET name = COALESCE($1, name),
           outlet_id = $2,
           model = COALESCE($3, model),
           configuration = COALESCE($4, configuration),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, outletId, model, configuration ? JSON.stringify(configuration) : null, isActive, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Update agent status
router.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['idle', 'busy', 'offline', 'error'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE agents
       SET status = $1, last_active_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }

    res.json({
      success: true,
      message: 'Agent status updated',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Delete agent
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await DatabaseService.query(
      'DELETE FROM agents WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }

    logger.info(`Agent deleted: ${result.rows[0].name}`);

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Assign task to agent
router.post('/:id/tasks', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { taskType, priority, inputData, scheduledAt } = req.body;

    if (!taskType) {
      throw new AppError('Task type is required', 400);
    }

    // Verify agent exists and is active
    const agentResult = await DatabaseService.query(
      'SELECT id, status, is_active FROM agents WHERE id = $1',
      [id]
    );

    if (agentResult.rows.length === 0) {
      throw new AppError('Agent not found', 404);
    }

    if (!agentResult.rows[0].is_active) {
      throw new AppError('Agent is not active', 400);
    }

    const taskId = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO agent_tasks (id, agent_id, task_type, priority, input_data, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [taskId, id, taskType, priority || 5, JSON.stringify(inputData || {}), scheduledAt || new Date()]
    );

    logger.info(`Task assigned to agent ${id}: ${taskType}`);

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        id: result.rows[0].id,
        taskType: result.rows[0].task_type,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        scheduledAt: result.rows[0].scheduled_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get agent tasks
router.get('/:id/tasks', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    let query = 'SELECT * FROM agent_tasks WHERE agent_id = $1';
    const params: any[] = [id];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY priority DESC, scheduled_at ASC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string, 10));

    const result = await DatabaseService.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(t => ({
        id: t.id,
        taskType: t.task_type,
        priority: t.priority,
        status: t.status,
        inputData: t.input_data,
        outputData: t.output_data,
        errorMessage: t.error_message,
        scheduledAt: t.scheduled_at,
        startedAt: t.started_at,
        completedAt: t.completed_at,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Update task status (for agent execution)
router.patch('/tasks/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { status, outputData, errorMessage } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);

      if (status === 'in_progress') {
        updates.push(`started_at = NOW()`);
      } else if (status === 'completed' || status === 'failed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (outputData) {
      updates.push(`output_data = $${paramIndex++}`);
      params.push(JSON.stringify(outputData));
    }

    if (errorMessage) {
      updates.push(`error_message = $${paramIndex++}`);
      params.push(errorMessage);
    }

    if (updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    params.push(taskId);
    const result = await DatabaseService.query(
      `UPDATE agent_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Task not found', 404);
    }

    res.json({
      success: true,
      message: 'Task updated',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Log agent action
router.post('/:id/actions', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { taskId, actionType, entityType, entityId, description, inputData, outputData, success, durationMs } = req.body;

    if (!actionType) {
      throw new AppError('Action type is required', 400);
    }

    const actionId = uuidv4();
    const result = await DatabaseService.query(
      `INSERT INTO agent_actions (id, agent_id, task_id, action_type, entity_type, entity_id, description, input_data, output_data, success, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [actionId, id, taskId || null, actionType, entityType || null, entityId || null, description || null, JSON.stringify(inputData || {}), JSON.stringify(outputData || {}), success !== false, durationMs || null]
    );

    // Update agent last active
    await DatabaseService.query(
      'UPDATE agents SET last_active_at = NOW() WHERE id = $1',
      [id]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        actionType: result.rows[0].action_type,
        success: result.rows[0].success,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get agent actions/activity log
router.get('/:id/actions', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const result = await DatabaseService.query(
      `SELECT * FROM agent_actions
       WHERE agent_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit as string, 10), parseInt(offset as string, 10)]
    );

    res.json({
      success: true,
      data: result.rows.map(a => ({
        id: a.id,
        taskId: a.task_id,
        actionType: a.action_type,
        entityType: a.entity_type,
        entityId: a.entity_id,
        description: a.description,
        inputData: a.input_data,
        outputData: a.output_data,
        success: a.success,
        durationMs: a.duration_ms,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get agent performance metrics
router.get('/:id/metrics', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [tasks, actions, agent] = await Promise.all([
      DatabaseService.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE completed_at IS NOT NULL) as avg_duration_seconds
        FROM agent_tasks
        WHERE agent_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      `, [id]),
      DatabaseService.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE success = true) as successful,
          AVG(duration_ms) as avg_duration_ms
        FROM agent_actions
        WHERE agent_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      `, [id]),
      DatabaseService.query('SELECT performance_metrics FROM agents WHERE id = $1', [id]),
    ]);

    const taskStats = tasks.rows[0];
    const actionStats = actions.rows[0];

    res.json({
      success: true,
      data: {
        last30Days: {
          tasks: {
            total: parseInt(taskStats.total, 10),
            completed: parseInt(taskStats.completed, 10),
            failed: parseInt(taskStats.failed, 10),
            successRate: taskStats.total > 0 ? (taskStats.completed / taskStats.total * 100).toFixed(2) : 0,
            avgDurationSeconds: parseFloat(taskStats.avg_duration_seconds || 0).toFixed(2),
          },
          actions: {
            total: parseInt(actionStats.total, 10),
            successful: parseInt(actionStats.successful, 10),
            successRate: actionStats.total > 0 ? (actionStats.successful / actionStats.total * 100).toFixed(2) : 0,
            avgDurationMs: parseFloat(actionStats.avg_duration_ms || 0).toFixed(2),
          },
        },
        customMetrics: agent.rows[0]?.performance_metrics || {},
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
