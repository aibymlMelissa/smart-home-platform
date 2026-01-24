import { DatabaseService } from './database.service';
import { websocketService } from './websocket.service';
import { emailService } from './email.service';
import logger from '../utils/logger';
import {
  Alert,
  AlertType,
  AlertSeverity,
  AlertStatus,
  FamilyMember,
} from '../types/aged-care.types';

interface CreateAlertParams {
  userId: string;
  hubId?: string;
  activityEventId?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message?: string;
  metadata?: Record<string, any>;
}

interface AlertNotification {
  alertId: string;
  familyMemberId: string;
  channel: 'push' | 'sms' | 'email' | 'voice_call';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

class AlertService {
  private readonly ESCALATION_INTERVALS_MS = [
    0,           // Level 0: Immediate
    5 * 60000,   // Level 1: 5 minutes
    15 * 60000,  // Level 2: 15 minutes
    30 * 60000,  // Level 3: 30 minutes
  ];

  /**
   * Create a new alert and notify family members
   */
  async createAlert(params: CreateAlertParams): Promise<Alert> {
    const {
      userId,
      hubId,
      activityEventId,
      alertType,
      severity,
      title,
      message,
      metadata,
    } = params;

    // Check for duplicate active alerts
    const existingAlert = await this.checkDuplicateAlert(userId, alertType);
    if (existingAlert) {
      logger.info(`Duplicate alert suppressed: ${alertType} for user ${userId}`);
      return existingAlert;
    }

    // Create the alert
    const result = await DatabaseService.query(
      `INSERT INTO alerts (user_id, hub_id, activity_event_id, alert_type, severity, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        hubId || null,
        activityEventId || null,
        alertType,
        severity,
        title,
        message || null,
        JSON.stringify(metadata || {}),
      ]
    );

    const alert = this.mapAlertRow(result.rows[0]);
    logger.warn(`Alert created: ${alertType} - ${title}`, { alertId: alert.id, userId, severity });

    // Notify via WebSocket for real-time updates
    this.broadcastAlertToFamily(userId, alert);

    // Send notifications to family members
    await this.notifyFamilyMembers(alert);

    return alert;
  }

  /**
   * Get active alerts for a user
   */
  async getActiveAlerts(userId: string): Promise<Alert[]> {
    const result = await DatabaseService.query(
      `SELECT * FROM alerts
       WHERE user_id = $1 AND status = 'active'
       ORDER BY severity DESC, created_at DESC`,
      [userId]
    );

    return result.rows.map(this.mapAlertRow);
  }

  /**
   * Get alert history with pagination
   */
  async getAlertHistory(
    userId: string,
    options: { limit?: number; offset?: number; status?: AlertStatus }
  ): Promise<{ alerts: Alert[]; total: number }> {
    const { limit = 20, offset = 0, status } = options;

    let query = `SELECT * FROM alerts WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await DatabaseService.query(query, params);

    const countResult = await DatabaseService.query(
      `SELECT COUNT(*) FROM alerts WHERE user_id = $1${status ? ' AND status = $2' : ''}`,
      status ? [userId, status] : [userId]
    );

    return {
      alerts: result.rows.map(this.mapAlertRow),
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert> {
    const result = await DatabaseService.query(
      `UPDATE alerts
       SET status = 'acknowledged',
           acknowledged_by = $2,
           acknowledged_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [alertId, acknowledgedBy]
    );

    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = this.mapAlertRow(result.rows[0]);
    logger.info(`Alert acknowledged: ${alertId}`, { acknowledgedBy });

    // Notify family of acknowledgment
    await this.notifyFamilyOfAcknowledgment(alert, acknowledgedBy);

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<Alert> {
    const result = await DatabaseService.query(
      `UPDATE alerts
       SET status = 'resolved',
           resolved_by = $2,
           resolved_at = NOW(),
           resolution_notes = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [alertId, resolvedBy, resolutionNotes || null]
    );

    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = this.mapAlertRow(result.rows[0]);
    logger.info(`Alert resolved: ${alertId}`, { resolvedBy, resolutionNotes });

    // Notify family of resolution
    await this.notifyFamilyOfResolution(alert, resolvedBy);

    return alert;
  }

  /**
   * Cancel an alert (false alarm)
   */
  async cancelAlert(alertId: string, cancelledBy: string, reason?: string): Promise<Alert> {
    const result = await DatabaseService.query(
      `UPDATE alerts
       SET status = 'cancelled',
           resolved_by = $2,
           resolved_at = NOW(),
           resolution_notes = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [alertId, cancelledBy, reason || 'Cancelled by user']
    );

    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = this.mapAlertRow(result.rows[0]);
    logger.info(`Alert cancelled: ${alertId}`, { cancelledBy, reason });

    // Notify family of cancellation
    this.broadcastAlertUpdateToFamily(alert.userId, alert, 'cancelled');

    return alert;
  }

  /**
   * Escalate unacknowledged alerts
   */
  async escalateUnacknowledgedAlerts(): Promise<void> {
    // Find alerts that need escalation
    const result = await DatabaseService.query(
      `SELECT * FROM alerts
       WHERE status = 'active'
         AND severity IN ('high', 'critical')
         AND escalation_level < 3
         AND created_at < NOW() - INTERVAL '5 minutes' * (escalation_level + 1)`,
      []
    );

    for (const row of result.rows) {
      const alert = this.mapAlertRow(row);
      await this.escalateAlert(alert);
    }
  }

  /**
   * Handle emergency alert (highest priority)
   */
  async handleEmergency(
    userId: string,
    hubId: string,
    source: string,
    location?: string
  ): Promise<Alert> {
    const alert = await this.createAlert({
      userId,
      hubId,
      alertType: 'emergency_button',
      severity: 'critical',
      title: 'EMERGENCY - Help Requested',
      message: `Emergency button pressed via ${source}${location ? ` in ${location}` : ''}`,
      metadata: { source, location },
    });

    // For emergencies, immediately attempt to call primary emergency contact
    await this.initiateEmergencyCall(userId);

    return alert;
  }

  /**
   * Notify family members based on their preferences
   */
  private async notifyFamilyMembers(alert: Alert): Promise<void> {
    // Get family members with notification preferences
    const familyResult = await DatabaseService.query(
      `SELECT * FROM family_members
       WHERE user_id = $1
       ORDER BY
         CASE WHEN is_emergency_contact THEN 0 ELSE 1 END,
         priority_order`,
      [alert.userId]
    );

    const notificationType = this.getNotificationTypeForAlert(alert.alertType);

    for (const row of familyResult.rows) {
      const member = this.mapFamilyMemberRow(row);
      const prefs = member.notificationPreferences;

      // Check if member should receive this type of notification
      if (!this.shouldNotifyMember(member, alert, notificationType)) {
        continue;
      }

      // Determine channels to use
      const channels: ('push' | 'sms' | 'email' | 'voice_call')[] = [];

      if (prefs.push_enabled) channels.push('push');
      if (prefs.sms_enabled && member.phone) channels.push('sms');
      if (prefs.email_enabled && member.email) channels.push('email');

      // For critical alerts, always try SMS and voice
      if (alert.severity === 'critical') {
        if (member.phone && !channels.includes('sms')) {
          channels.push('sms');
        }
      }

      // Send via each channel
      for (const channel of channels) {
        await this.sendNotification(alert, member, channel);
      }
    }
  }

  private shouldNotifyMember(
    member: FamilyMember,
    alert: Alert,
    notificationType: string
  ): boolean {
    const prefs = member.notificationPreferences;

    // Always notify for emergencies if member is emergency contact
    if (alert.severity === 'critical' && member.isEmergencyContact) {
      return true;
    }

    // Check notification preference
    switch (notificationType) {
      case 'emergency':
        return prefs.emergency;
      case 'check_in':
        return prefs.check_in;
      case 'activity':
        return prefs.activity_alerts;
      default:
        return prefs.activity_alerts;
    }
  }

  private getNotificationTypeForAlert(alertType: AlertType): string {
    const emergencyTypes: AlertType[] = [
      'emergency_button',
      'fall_detected',
      'smoke_detected',
      'co_detected',
    ];

    if (emergencyTypes.includes(alertType)) {
      return 'emergency';
    }

    return 'activity';
  }

  private async sendNotification(
    alert: Alert,
    member: FamilyMember,
    channel: 'push' | 'sms' | 'email' | 'voice_call'
  ): Promise<void> {
    // Create notification record
    const notifResult = await DatabaseService.query(
      `INSERT INTO alert_notifications (alert_id, family_member_id, channel, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [alert.id, member.id, channel]
    );

    const notificationId = notifResult.rows[0].id;

    try {
      switch (channel) {
        case 'push':
          await this.sendPushNotification(alert, member);
          break;
        case 'sms':
          await this.sendSmsNotification(alert, member);
          break;
        case 'email':
          await this.sendEmailNotification(alert, member);
          break;
        case 'voice_call':
          await this.initiateVoiceCall(alert, member);
          break;
      }

      // Update notification status
      await DatabaseService.query(
        `UPDATE alert_notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [notificationId]
      );
    } catch (error) {
      logger.error(`Failed to send ${channel} notification:`, error);
      await DatabaseService.query(
        `UPDATE alert_notifications
         SET status = 'failed', error_message = $2
         WHERE id = $1`,
        [notificationId, (error as Error).message]
      );
    }
  }

  private async sendPushNotification(alert: Alert, member: FamilyMember): Promise<void> {
    // WebSocket push to connected clients
    if (member.familyUserId) {
      websocketService.sendToUser(member.familyUserId, {
        type: 'alert',
        data: alert,
      });
    }
    logger.debug(`Push notification sent to ${member.name}`);
  }

  private async sendSmsNotification(alert: Alert, member: FamilyMember): Promise<void> {
    // In production, integrate with Twilio or similar
    logger.info(`SMS would be sent to ${member.phone}: ${alert.title}`);
    // await twilioService.sendSms(member.phone, `SafeHome Alert: ${alert.title}`);
  }

  private async sendEmailNotification(alert: Alert, member: FamilyMember): Promise<void> {
    if (!member.email) return;

    const residentResult = await DatabaseService.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [alert.userId]
    );
    const resident = residentResult.rows[0];
    const residentName = `${resident.first_name} ${resident.last_name}`;
    const dashboardUrl = `${process.env.FRONTEND_URL}/family/${alert.userId}`;

    const severityColors: Record<string, string> = {
      low: '#3B82F6',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColors[alert.severity] || '#3B82F6'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .alert-box { background: white; border-left: 4px solid ${severityColors[alert.severity] || '#3B82F6'}; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SafeHome Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${member.name},</p>
            <p>An alert has been triggered for <strong>${residentName}</strong>.</p>
            <div class="alert-box">
              <h3 style="margin: 0 0 10px 0;">${alert.title}</h3>
              <p style="margin: 0; color: #666;">${alert.message || ''}</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                Severity: ${alert.severity.toUpperCase()} | Time: ${alert.createdAt.toLocaleString()}
              </p>
            </div>
            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">View Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SafeHome. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to: member.email,
      subject: `SafeHome Alert: ${alert.title}`,
      html,
    });
  }

  private async initiateVoiceCall(alert: Alert, member: FamilyMember): Promise<void> {
    // In production, integrate with Twilio voice
    logger.info(`Voice call would be initiated to ${member.phone} for emergency`);
  }

  private async initiateEmergencyCall(userId: string): Promise<void> {
    const result = await DatabaseService.query(
      `SELECT * FROM family_members
       WHERE user_id = $1 AND is_emergency_contact = true
       ORDER BY priority_order
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length > 0) {
      const member = this.mapFamilyMemberRow(result.rows[0]);
      logger.warn(`Initiating emergency call to ${member.name} at ${member.phone}`);
      // In production, immediately initiate voice call
    }
  }

  private async escalateAlert(alert: Alert): Promise<void> {
    const newLevel = alert.escalationLevel + 1;

    await DatabaseService.query(
      `UPDATE alerts
       SET escalation_level = $2, status = 'escalated', updated_at = NOW()
       WHERE id = $1`,
      [alert.id, newLevel]
    );

    logger.warn(`Alert escalated to level ${newLevel}: ${alert.id}`);

    // Get next priority family member
    const result = await DatabaseService.query(
      `SELECT * FROM family_members
       WHERE user_id = $1
       ORDER BY priority_order
       OFFSET $2
       LIMIT 1`,
      [alert.userId, newLevel]
    );

    if (result.rows.length > 0) {
      const member = this.mapFamilyMemberRow(result.rows[0]);

      // For escalation, use SMS and voice
      if (member.phone) {
        await this.sendSmsNotification(alert, member);
        if (alert.severity === 'critical' && newLevel >= 2) {
          await this.initiateVoiceCall(alert, member);
        }
      }
    }
  }

  private async checkDuplicateAlert(
    userId: string,
    alertType: AlertType
  ): Promise<Alert | null> {
    const result = await DatabaseService.query(
      `SELECT * FROM alerts
       WHERE user_id = $1
         AND alert_type = $2
         AND status = 'active'
         AND created_at > NOW() - INTERVAL '15 minutes'
       LIMIT 1`,
      [userId, alertType]
    );

    return result.rows.length > 0 ? this.mapAlertRow(result.rows[0]) : null;
  }

  private broadcastAlertToFamily(userId: string, alert: Alert): void {
    websocketService.broadcastToRoom(`family:${userId}`, {
      type: 'alert:new',
      data: alert,
    });
  }

  private broadcastAlertUpdateToFamily(
    userId: string,
    alert: Alert,
    action: string
  ): void {
    websocketService.broadcastToRoom(`family:${userId}`, {
      type: `alert:${action}`,
      data: alert,
    });
  }

  private async notifyFamilyOfAcknowledgment(
    alert: Alert,
    acknowledgedBy: string
  ): Promise<void> {
    const acknowledgerResult = await DatabaseService.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [acknowledgedBy]
    );
    const acknowledger = acknowledgerResult.rows[0];
    const name = `${acknowledger.first_name} ${acknowledger.last_name}`;

    this.broadcastAlertUpdateToFamily(alert.userId, {
      ...alert,
      metadata: { ...alert.metadata, acknowledgedByName: name },
    }, 'acknowledged');
  }

  private async notifyFamilyOfResolution(
    alert: Alert,
    resolvedBy: string
  ): Promise<void> {
    const resolverResult = await DatabaseService.query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [resolvedBy]
    );
    const resolver = resolverResult.rows[0];
    const name = `${resolver.first_name} ${resolver.last_name}`;

    this.broadcastAlertUpdateToFamily(alert.userId, {
      ...alert,
      metadata: { ...alert.metadata, resolvedByName: name },
    }, 'resolved');
  }

  private mapAlertRow(row: any): Alert {
    return {
      id: row.id,
      userId: row.user_id,
      hubId: row.hub_id,
      activityEventId: row.activity_event_id,
      alertType: row.alert_type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      status: row.status,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolutionNotes: row.resolution_notes,
      escalationLevel: row.escalation_level,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapFamilyMemberRow(row: any): FamilyMember {
    return {
      id: row.id,
      userId: row.user_id,
      familyUserId: row.family_user_id,
      name: row.name,
      relationship: row.relationship,
      phone: row.phone,
      email: row.email,
      isEmergencyContact: row.is_emergency_contact,
      notificationPreferences: row.notification_preferences || {
        check_in: true,
        emergency: true,
        activity_alerts: true,
        daily_summary: false,
        push_enabled: true,
        sms_enabled: true,
        email_enabled: false,
      },
      priorityOrder: row.priority_order,
      avatar: row.avatar,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const alertService = new AlertService();
