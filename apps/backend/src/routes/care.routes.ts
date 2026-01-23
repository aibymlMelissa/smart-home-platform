import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../services/database.service';
import { alertService } from '../services/alert.service';
import { activityDetectionService } from '../services/activity-detection.service';
import { hubMqttService } from '../services/hub-mqtt.service';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import { CheckInStatus, CheckInType } from '../types/aged-care.types';

const router = Router();

// =====================
// CHECK-IN ENDPOINTS
// =====================

/**
 * POST /api/v1/care/check-in
 * Record a check-in from the resident
 */
router.post('/check-in', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { type = 'manual_app', status = 'ok', notes } = req.body as {
      type?: CheckInType;
      status?: CheckInStatus;
      notes?: string;
    };

    // Get user's hub
    const hubResult = await DatabaseService.query(
      `SELECT id, serial_number FROM hubs WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    const hubId = hubResult.rows[0]?.id;

    // Record the check-in
    const result = await DatabaseService.query(
      `INSERT INTO check_ins (user_id, hub_id, check_in_type, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, hubId, type, status, notes || null]
    );

    const checkIn = result.rows[0];

    // Notify family members
    if (status === 'ok') {
      await notifyFamilyOfCheckIn(userId!, checkIn.id);
    } else if (status === 'help_needed') {
      // Create alert for help needed
      await alertService.createAlert({
        userId: userId!,
        hubId,
        alertType: 'custom',
        severity: 'medium',
        title: 'Help Requested via Check-in',
        message: notes || 'Resident indicated they need help during check-in',
      });
    }

    res.status(201).json({
      success: true,
      message: status === 'ok' ? "Check-in recorded. Your family has been notified." : "Help request sent. Someone will reach out soon.",
      data: {
        id: checkIn.id,
        type: checkIn.check_in_type,
        status: checkIn.status,
        time: checkIn.actual_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/check-ins
 * Get check-in history for the resident
 */
router.get('/check-ins', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { limit = 7, offset = 0 } = req.query;

    const result = await DatabaseService.query(
      `SELECT * FROM check_ins
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        type: row.check_in_type,
        status: row.status,
        time: row.actual_time,
        notes: row.notes,
        familyNotified: row.family_notified,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/check-in/status
 * Get today's check-in status
 */
router.get('/check-in/status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await DatabaseService.query(
      `SELECT * FROM check_ins
       WHERE user_id = $1 AND created_at >= $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, today]
    );

    const checkedIn = result.rows.length > 0 && result.rows[0].status === 'ok';

    res.json({
      success: true,
      data: {
        checkedInToday: checkedIn,
        lastCheckIn: result.rows[0] ? {
          time: result.rows[0].actual_time,
          status: result.rows[0].status,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// EMERGENCY ENDPOINTS
// =====================

/**
 * POST /api/v1/care/emergency
 * Trigger an emergency alert
 */
router.post('/emergency', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { source = 'app', location, cancelled = false, alertId } = req.body;

    // If this is a cancellation
    if (cancelled && alertId) {
      await alertService.cancelAlert(alertId, userId!, 'Emergency cancelled by resident');
      return res.json({
        success: true,
        message: 'Emergency cancelled. Your family has been notified.',
      });
    }

    // Get user's hub
    const hubResult = await DatabaseService.query(
      `SELECT id, serial_number FROM hubs WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    const hubId = hubResult.rows[0]?.id;

    // Create emergency alert
    const alert = await alertService.handleEmergency(
      userId!,
      hubId,
      source,
      location
    );

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent. Help is on the way.',
      data: {
        alertId: alert.id,
        status: alert.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// FAMILY MEMBER ENDPOINTS
// =====================

/**
 * GET /api/v1/care/family
 * Get family members for the resident
 */
router.get('/family', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await DatabaseService.query(
      `SELECT * FROM family_members
       WHERE user_id = $1
       ORDER BY priority_order`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        relationship: row.relationship,
        phone: row.phone,
        email: row.email,
        isEmergencyContact: row.is_emergency_contact,
        avatar: row.avatar,
        notificationPreferences: row.notification_preferences,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/care/family
 * Add a family member
 */
router.post('/family', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const {
      name,
      relationship,
      phone,
      email,
      isEmergencyContact = false,
      avatar,
      notificationPreferences,
    } = req.body;

    // Get next priority order
    const orderResult = await DatabaseService.query(
      `SELECT COALESCE(MAX(priority_order), 0) + 1 as next_order
       FROM family_members WHERE user_id = $1`,
      [userId]
    );
    const priorityOrder = orderResult.rows[0].next_order;

    const result = await DatabaseService.query(
      `INSERT INTO family_members
       (user_id, name, relationship, phone, email, is_emergency_contact, avatar, notification_preferences, priority_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        name,
        relationship,
        phone || null,
        email || null,
        isEmergencyContact,
        avatar || name.charAt(0).toUpperCase(),
        JSON.stringify(notificationPreferences || {}),
        priorityOrder,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        relationship: result.rows[0].relationship,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/care/family/:id
 * Update a family member
 */
router.put('/family/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updates = req.body;

    const setClauses: string[] = [];
    const params: any[] = [id, userId];
    let paramIndex = 3;

    const allowedFields = ['name', 'relationship', 'phone', 'email', 'is_emergency_contact', 'avatar', 'notification_preferences', 'priority_order'];

    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(dbKey)) {
        setClauses.push(`${dbKey} = $${paramIndex}`);
        params.push(dbKey === 'notification_preferences' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const result = await DatabaseService.query(
      `UPDATE family_members
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Family member not found', 404);
    }

    res.json({
      success: true,
      message: 'Family member updated',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/care/family/:id
 * Remove a family member
 */
router.delete('/family/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await DatabaseService.query(
      `DELETE FROM family_members WHERE id = $1 AND user_id = $2 RETURNING id, name`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Family member not found', 404);
    }

    res.json({
      success: true,
      message: `${result.rows[0].name} removed from your family circle`,
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// ALERT ENDPOINTS
// =====================

/**
 * GET /api/v1/care/alerts
 * Get alerts for the user
 */
router.get('/alerts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { status, limit = 20, offset = 0 } = req.query;

    const { alerts, total } = await alertService.getAlertHistory(userId!, {
      status: status as any,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/alerts/active
 * Get active alerts
 */
router.get('/alerts/active', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const alerts = await alertService.getActiveAlerts(userId!);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/care/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/alerts/:id/acknowledge', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const alert = await alertService.acknowledgeAlert(id, userId!);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/care/alerts/:id/resolve
 * Resolve an alert
 */
router.put('/alerts/:id/resolve', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const alert = await alertService.resolveAlert(id, userId!, notes);

    res.json({
      success: true,
      message: 'Alert resolved',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// ACTIVITY ENDPOINTS
// =====================

/**
 * GET /api/v1/care/activity/today
 * Get today's activity summary
 */
router.get('/activity/today', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    // Get user's hub
    const hubResult = await DatabaseService.query(
      `SELECT id FROM hubs WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (hubResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No hub configured',
      });
    }

    const hubId = hubResult.rows[0].id;
    const summary = await activityDetectionService.getDailySummary(hubId, new Date());

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/activity/week
 * Get weekly activity summary
 */
router.get('/activity/week', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const hubResult = await DatabaseService.query(
      `SELECT id FROM hubs WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    if (hubResult.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No hub configured',
      });
    }

    const hubId = hubResult.rows[0].id;
    const summary = await activityDetectionService.getWeeklySummary(hubId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/activity/recent
 * Get recent activity events
 */
router.get('/activity/recent', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { limit = 20 } = req.query;

    const result = await DatabaseService.query(
      `SELECT ae.*, d.name as device_name
       FROM activity_events ae
       JOIN hubs h ON ae.hub_id = h.id
       LEFT JOIN devices d ON ae.device_id = d.id
       WHERE h.user_id = $1
       ORDER BY ae.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        roomName: row.room_name,
        deviceName: row.device_name,
        isAnomaly: row.is_anomaly,
        timestamp: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// HOME STATUS ENDPOINT
// =====================

/**
 * GET /api/v1/care/home-status
 * Get current home status for dashboard
 */
router.get('/home-status', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    // Get hub and devices
    const hubResult = await DatabaseService.query(
      `SELECT h.*,
              (SELECT COUNT(*) FROM devices d WHERE d.hub_id = h.id AND d.status = 'online') as devices_online
       FROM hubs h
       WHERE h.user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (hubResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          hubConfigured: false,
        },
      });
    }

    const hub = hubResult.rows[0];

    // Get front door status
    const doorResult = await DatabaseService.query(
      `SELECT state
       FROM devices
       WHERE hub_id = $1
         AND (device_category = 'door_sensor' OR device_category = 'smart_lock')
         AND (metadata->>'location' ILIKE '%front%' OR name ILIKE '%front%')
       LIMIT 1`,
      [hub.id]
    );

    // Get temperature
    const tempResult = await DatabaseService.query(
      `SELECT state
       FROM devices
       WHERE hub_id = $1 AND device_category = 'temperature_sensor'
       LIMIT 1`,
      [hub.id]
    );

    // Get lights on count
    const lightsResult = await DatabaseService.query(
      `SELECT COUNT(*) as count
       FROM devices
       WHERE hub_id = $1
         AND device_category = 'smart_plug'
         AND (state->>'power')::boolean = true`,
      [hub.id]
    );

    // Get last activity
    const activityResult = await DatabaseService.query(
      `SELECT room_name, created_at
       FROM activity_events
       WHERE hub_id = $1 AND event_type = 'motion_detected'
       ORDER BY created_at DESC
       LIMIT 1`,
      [hub.id]
    );

    const doorState = doorResult.rows[0]?.state || {};
    const frontDoorStatus = doorState.locked ? 'locked' : (doorState.open ? 'open' : 'unlocked');

    res.json({
      success: true,
      data: {
        hubConfigured: true,
        hubStatus: hub.status,
        hubBattery: hub.battery_level,
        isOnBattery: hub.is_on_battery,
        devicesOnline: parseInt(hub.devices_online),
        frontDoor: frontDoorStatus,
        temperature: tempResult.rows[0]?.state?.temperature,
        lightsOn: parseInt(lightsResult.rows[0]?.count) || 0,
        lastActivity: activityResult.rows[0] ? {
          room: activityResult.rows[0].room_name,
          time: activityResult.rows[0].created_at,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================
// MEDICATION ENDPOINTS
// =====================

/**
 * GET /api/v1/care/medications
 * Get medication schedules
 */
router.get('/medications', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const result = await DatabaseService.query(
      `SELECT * FROM medication_schedules
       WHERE user_id = $1 AND is_active = true
       ORDER BY scheduled_times->0`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.medication_name,
        dosage: row.dosage,
        instructions: row.instructions,
        scheduledTimes: row.scheduled_times,
        daysOfWeek: row.days_of_week,
        reminderEnabled: row.reminder_enabled,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/care/medications/today
 * Get today's medication schedule with status
 */
router.get('/medications/today', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const today = new Date();
    const dayOfWeek = today.getDay();

    const result = await DatabaseService.query(
      `SELECT ms.*, ml.status as log_status, ml.taken_at
       FROM medication_schedules ms
       LEFT JOIN medication_logs ml ON ms.id = ml.schedule_id
         AND ml.scheduled_time::date = CURRENT_DATE
       WHERE ms.user_id = $1
         AND ms.is_active = true
         AND ms.days_of_week ? $2
       ORDER BY ms.scheduled_times->0`,
      [userId, dayOfWeek.toString()]
    );

    // Expand scheduled times
    const medications: any[] = [];
    for (const row of result.rows) {
      for (const time of row.scheduled_times) {
        medications.push({
          id: row.id,
          name: row.medication_name,
          dosage: row.dosage,
          scheduledTime: time,
          status: row.log_status || 'pending',
          takenAt: row.taken_at,
        });
      }
    }

    // Sort by scheduled time
    medications.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    res.json({
      success: true,
      data: medications,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/care/medications/:id/taken
 * Mark medication as taken
 */
router.post('/medications/:id/taken', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { scheduledTime, method = 'manual' } = req.body;

    // Verify medication belongs to user
    const scheduleResult = await DatabaseService.query(
      `SELECT id FROM medication_schedules WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (scheduleResult.rows.length === 0) {
      throw new AppError('Medication schedule not found', 404);
    }

    // Create or update medication log
    await DatabaseService.query(
      `INSERT INTO medication_logs (schedule_id, scheduled_time, taken_at, status, detection_method)
       VALUES ($1, $2, NOW(), 'taken', $3)
       ON CONFLICT (schedule_id, scheduled_time)
       DO UPDATE SET taken_at = NOW(), status = 'taken', detection_method = $3`,
      [id, scheduledTime || new Date(), method]
    );

    res.json({
      success: true,
      message: 'Medication marked as taken',
    });
  } catch (error) {
    next(error);
  }
});

// Helper function
async function notifyFamilyOfCheckIn(userId: string, checkInId: string): Promise<void> {
  // Get family members
  const familyResult = await DatabaseService.query(
    `SELECT * FROM family_members
     WHERE user_id = $1 AND notification_preferences->>'check_in' = 'true'`,
    [userId]
  );

  // Update check-in record
  await DatabaseService.query(
    `UPDATE check_ins SET family_notified = true WHERE id = $1`,
    [checkInId]
  );

  // In production, send push notifications via WebSocket or push service
  // For now, just log
  if (familyResult.rows.length > 0) {
    console.log(`Check-in notification would be sent to ${familyResult.rows.length} family members`);
  }
}

export default router;
