import { DatabaseService } from './database.service';
import logger from '../utils/logger';
import {
  ActivityEvent,
  ActivityEventType,
  AlertType,
  DailyActivitySummary,
} from '../types/aged-care.types';

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  reason?: string;
  suggestedAlert?: AlertType;
}

interface RoomActivity {
  roomName: string;
  lastMotion: Date;
  motionCount: number;
  avgDuration: number;
}

class ActivityDetectionService {
  // Threshold constants (configurable per hub)
  private readonly DEFAULT_NO_MOTION_ALERT_HOURS = 12;
  private readonly DEFAULT_BATHROOM_TIMEOUT_MINUTES = 30;
  private readonly DEFAULT_NIGHT_HOURS_START = 22;
  private readonly DEFAULT_NIGHT_HOURS_END = 6;
  private readonly DEFAULT_MORNING_DEADLINE_HOUR = 10;

  /**
   * Process incoming activity event and check for anomalies
   */
  async processEvent(event: {
    hubId: string;
    deviceId?: string;
    eventType: ActivityEventType;
    roomName?: string;
    sensorData: Record<string, any>;
    timestamp: string;
  }): Promise<{ eventId: string; anomaly: AnomalyDetectionResult }> {
    // Get hub configuration
    const hubConfig = await this.getHubConfiguration(event.hubId);

    // Detect anomalies
    const anomaly = await this.detectAnomaly(event, hubConfig);

    // Store the event
    const eventId = await this.storeActivityEvent(event, anomaly);

    // Update device last activity
    if (event.deviceId) {
      await this.updateDeviceLastActivity(event.deviceId);
    }

    return { eventId, anomaly };
  }

  /**
   * Detect if an event represents an anomaly
   */
  private async detectAnomaly(
    event: {
      hubId: string;
      eventType: ActivityEventType;
      roomName?: string;
      sensorData: Record<string, any>;
      timestamp: string;
    },
    hubConfig: any
  ): Promise<AnomalyDetectionResult> {
    const eventTime = new Date(event.timestamp);
    const hour = eventTime.getHours();
    const dayOfWeek = eventTime.getDay();

    // Get baseline for this time/day/room
    const baseline = await this.getBaseline(
      event.hubId,
      dayOfWeek,
      hour,
      event.roomName
    );

    let anomalyScore = 0;
    let reason: string | undefined;
    let suggestedAlert: AlertType | undefined;

    // Check for specific anomaly patterns
    switch (event.eventType) {
      case 'motion_detected':
        // Nighttime activity anomaly
        if (this.isNighttime(hour, hubConfig)) {
          if (event.roomName?.toLowerCase() === 'front door' ||
              event.roomName?.toLowerCase() === 'back door') {
            anomalyScore = 0.8;
            reason = 'Unusual nighttime door activity';
            suggestedAlert = 'wandering';
          } else {
            // General nighttime activity - log but lower score
            anomalyScore = 0.3;
            reason = 'Nighttime activity detected';
          }
        }
        break;

      case 'door_opened':
        // Front door at night
        if (this.isNighttime(hour, hubConfig) &&
            (event.roomName?.toLowerCase().includes('front') ||
             event.roomName?.toLowerCase().includes('back'))) {
          anomalyScore = 0.9;
          reason = 'Exit door opened at night';
          suggestedAlert = 'wandering';
        }
        break;

      case 'fall_detected':
        anomalyScore = 1.0;
        reason = 'Potential fall detected';
        suggestedAlert = 'fall_detected';
        break;

      case 'smoke_detected':
        anomalyScore = 1.0;
        reason = 'Smoke detected';
        suggestedAlert = 'smoke_detected';
        break;

      case 'co_detected':
        anomalyScore = 1.0;
        reason = 'Carbon monoxide detected';
        suggestedAlert = 'co_detected';
        break;

      case 'water_leak':
        anomalyScore = 0.9;
        reason = 'Water leak detected';
        suggestedAlert = 'water_leak';
        break;

      case 'battery_low':
        anomalyScore = 0.5;
        reason = 'Device battery low';
        suggestedAlert = 'battery_critical';
        break;

      case 'device_offline':
        anomalyScore = 0.6;
        reason = 'Device went offline';
        suggestedAlert = 'device_offline';
        break;
    }

    // Compare against baseline if available
    if (baseline && !anomalyScore) {
      const expectedEvents = baseline.avgMotionEvents;
      const stdDev = baseline.stdMotionEvents || 1;

      // If this hour typically has very low activity, any activity might be notable
      if (expectedEvents < 0.5 && event.eventType === 'motion_detected') {
        anomalyScore = Math.min(0.4, anomalyScore);
        reason = reason || 'Unusual activity for this time';
      }
    }

    return {
      isAnomaly: anomalyScore >= 0.5,
      anomalyScore,
      reason,
      suggestedAlert,
    };
  }

  /**
   * Check for extended inactivity
   */
  async checkInactivity(hubId: string): Promise<{
    hasAlert: boolean;
    alertType?: AlertType;
    message?: string;
    lastActivity?: Date;
  }> {
    const hubConfig = await this.getHubConfiguration(hubId);
    const now = new Date();
    const hour = now.getHours();

    // Get last activity
    const result = await DatabaseService.query(
      `SELECT created_at, event_type, room_name
       FROM activity_events
       WHERE hub_id = $1
         AND event_type IN ('motion_detected', 'door_opened', 'appliance_on')
       ORDER BY created_at DESC
       LIMIT 1`,
      [hubId]
    );

    if (result.rows.length === 0) {
      return { hasAlert: false };
    }

    const lastActivity = new Date(result.rows[0].created_at);
    const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    // Check for extended bathroom time
    const bathroomResult = await DatabaseService.query(
      `SELECT created_at
       FROM activity_events
       WHERE hub_id = $1
         AND room_name ILIKE '%bathroom%'
         AND event_type = 'motion_detected'
       ORDER BY created_at DESC
       LIMIT 1`,
      [hubId]
    );

    if (bathroomResult.rows.length > 0) {
      const lastBathroomMotion = new Date(bathroomResult.rows[0].created_at);
      const minutesInBathroom = (now.getTime() - lastBathroomMotion.getTime()) / (1000 * 60);
      const bathroomTimeout = hubConfig?.bathroom_timeout_minutes || this.DEFAULT_BATHROOM_TIMEOUT_MINUTES;

      // Check if there's been motion elsewhere since
      const otherMotion = await DatabaseService.query(
        `SELECT created_at
         FROM activity_events
         WHERE hub_id = $1
           AND room_name NOT ILIKE '%bathroom%'
           AND event_type = 'motion_detected'
           AND created_at > $2
         LIMIT 1`,
        [hubId, lastBathroomMotion]
      );

      if (otherMotion.rows.length === 0 && minutesInBathroom > bathroomTimeout) {
        return {
          hasAlert: true,
          alertType: 'extended_bathroom',
          message: `No movement detected for ${Math.round(minutesInBathroom)} minutes since bathroom activity`,
          lastActivity,
        };
      }
    }

    // Check for no morning activity
    if (hour >= this.DEFAULT_MORNING_DEADLINE_HOUR && hour < 12) {
      const morningStart = new Date(now);
      morningStart.setHours(6, 0, 0, 0);

      const morningActivity = await DatabaseService.query(
        `SELECT created_at
         FROM activity_events
         WHERE hub_id = $1
           AND created_at >= $2
           AND event_type IN ('motion_detected', 'door_opened', 'appliance_on')
         LIMIT 1`,
        [hubId, morningStart]
      );

      if (morningActivity.rows.length === 0) {
        return {
          hasAlert: true,
          alertType: 'no_morning_activity',
          message: `No morning activity detected since ${morningStart.toLocaleTimeString()}`,
          lastActivity,
        };
      }
    }

    // Check for general inactivity
    const inactivityThreshold = hubConfig?.no_activity_hours || this.DEFAULT_NO_MOTION_ALERT_HOURS;
    if (hoursSinceActivity > inactivityThreshold) {
      return {
        hasAlert: true,
        alertType: 'no_activity',
        message: `No activity detected for ${Math.round(hoursSinceActivity)} hours`,
        lastActivity,
      };
    }

    // Check for no eating (fridge not opened)
    const fridgeResult = await DatabaseService.query(
      `SELECT created_at
       FROM activity_events ae
       JOIN devices d ON ae.device_id = d.id
       WHERE ae.hub_id = $1
         AND (d.metadata->>'location' ILIKE '%fridge%' OR d.metadata->>'location' ILIKE '%refrigerator%')
         AND ae.event_type = 'door_opened'
         AND ae.created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [hubId]
    );

    if (fridgeResult.rows.length === 0 && hour >= 18) {
      return {
        hasAlert: true,
        alertType: 'no_eating',
        message: 'Refrigerator has not been opened in 24 hours',
        lastActivity,
      };
    }

    return { hasAlert: false, lastActivity };
  }

  /**
   * Update activity baseline from historical data
   */
  async updateBaseline(hubId: string): Promise<void> {
    logger.info(`Updating activity baseline for hub ${hubId}`);

    // Calculate baselines for each day/hour/room combination
    const result = await DatabaseService.query(
      `INSERT INTO activity_baselines (hub_id, day_of_week, hour_of_day, room_name, avg_motion_events, std_motion_events, sample_count, last_updated)
       SELECT
         $1 as hub_id,
         EXTRACT(DOW FROM created_at)::int as day_of_week,
         EXTRACT(HOUR FROM created_at)::int as hour_of_day,
         room_name,
         COUNT(*)::decimal / GREATEST(COUNT(DISTINCT DATE(created_at)), 1) as avg_motion_events,
         COALESCE(STDDEV(sub.daily_count), 0) as std_motion_events,
         COUNT(DISTINCT DATE(created_at)) as sample_count,
         NOW() as last_updated
       FROM activity_events ae
       LEFT JOIN LATERAL (
         SELECT DATE(created_at) as day, COUNT(*) as daily_count
         FROM activity_events
         WHERE hub_id = $1
           AND event_type = 'motion_detected'
           AND EXTRACT(DOW FROM created_at) = EXTRACT(DOW FROM ae.created_at)
           AND EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM ae.created_at)
           AND room_name = ae.room_name
         GROUP BY DATE(created_at)
       ) sub ON true
       WHERE ae.hub_id = $1
         AND ae.event_type = 'motion_detected'
         AND ae.created_at > NOW() - INTERVAL '30 days'
       GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at), room_name
       ON CONFLICT (hub_id, day_of_week, hour_of_day, room_name)
       DO UPDATE SET
         avg_motion_events = EXCLUDED.avg_motion_events,
         std_motion_events = EXCLUDED.std_motion_events,
         sample_count = EXCLUDED.sample_count,
         last_updated = NOW()`,
      [hubId]
    );

    logger.info(`Baseline updated for hub ${hubId}`);
  }

  /**
   * Get daily activity summary for family dashboard
   */
  async getDailySummary(hubId: string, date: Date): Promise<DailyActivitySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get activity stats
    const activityResult = await DatabaseService.query(
      `SELECT
         MIN(created_at) as first_activity,
         MAX(created_at) as last_activity,
         COUNT(*) as total_events,
         COUNT(DISTINCT room_name) as rooms_visited,
         array_agg(DISTINCT room_name) as room_names,
         SUM(CASE WHEN is_anomaly THEN 1 ELSE 0 END) as anomalies
       FROM activity_events
       WHERE hub_id = $1
         AND created_at BETWEEN $2 AND $3
         AND event_type = 'motion_detected'`,
      [hubId, startOfDay, endOfDay]
    );

    // Get check-in status
    const checkInResult = await DatabaseService.query(
      `SELECT status
       FROM check_ins ci
       JOIN hubs h ON ci.hub_id = h.id
       WHERE h.id = $1
         AND ci.created_at BETWEEN $2 AND $3
       ORDER BY ci.created_at DESC
       LIMIT 1`,
      [hubId, startOfDay, endOfDay]
    );

    // Get medication compliance
    const medResult = await DatabaseService.query(
      `SELECT
         COUNT(*) as scheduled,
         SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as completed
       FROM medication_logs ml
       JOIN medication_schedules ms ON ml.schedule_id = ms.id
       JOIN hubs h ON ms.user_id = h.user_id
       WHERE h.id = $1
         AND ml.scheduled_time BETWEEN $2 AND $3`,
      [hubId, startOfDay, endOfDay]
    );

    // Get alerts
    const alertResult = await DatabaseService.query(
      `SELECT COUNT(*) as alert_count
       FROM alerts
       WHERE hub_id = $1
         AND created_at BETWEEN $2 AND $3`,
      [hubId, startOfDay, endOfDay]
    );

    const activity = activityResult.rows[0];
    const med = medResult.rows[0];

    return {
      date: date.toISOString().split('T')[0],
      firstActivity: activity.first_activity ? new Date(activity.first_activity) : undefined,
      lastActivity: activity.last_activity ? new Date(activity.last_activity) : undefined,
      totalMotionEvents: parseInt(activity.total_events) || 0,
      roomsVisited: activity.room_names?.filter((r: string) => r) || [],
      checkInStatus: checkInResult.rows[0]?.status,
      medicationsCompleted: parseInt(med.completed) || 0,
      medicationsScheduled: parseInt(med.scheduled) || 0,
      alertsTriggered: parseInt(alertResult.rows[0]?.alert_count) || 0,
      anomaliesDetected: parseInt(activity.anomalies) || 0,
    };
  }

  /**
   * Get weekly summary for family dashboard
   */
  async getWeeklySummary(hubId: string): Promise<{
    checkInsCompleted: number;
    checkInsTotal: number;
    medicationCompliance: number;
    unusualEvents: number;
    dailySummaries: DailyActivitySummary[];
  }> {
    const summaries: DailyActivitySummary[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      summaries.push(await this.getDailySummary(hubId, date));
    }

    const checkInsCompleted = summaries.filter(s => s.checkInStatus === 'ok').length;
    const totalMedScheduled = summaries.reduce((sum, s) => sum + s.medicationsScheduled, 0);
    const totalMedCompleted = summaries.reduce((sum, s) => sum + s.medicationsCompleted, 0);
    const unusualEvents = summaries.reduce((sum, s) => sum + s.anomaliesDetected, 0);

    return {
      checkInsCompleted,
      checkInsTotal: 7,
      medicationCompliance: totalMedScheduled > 0
        ? Math.round((totalMedCompleted / totalMedScheduled) * 100)
        : 100,
      unusualEvents,
      dailySummaries: summaries,
    };
  }

  private async storeActivityEvent(
    event: {
      hubId: string;
      deviceId?: string;
      eventType: ActivityEventType;
      roomName?: string;
      sensorData: Record<string, any>;
      timestamp: string;
    },
    anomaly: AnomalyDetectionResult
  ): Promise<string> {
    const result = await DatabaseService.query(
      `INSERT INTO activity_events (hub_id, device_id, event_type, room_name, sensor_data, is_anomaly, anomaly_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        event.hubId,
        event.deviceId || null,
        event.eventType,
        event.roomName || null,
        JSON.stringify(event.sensorData),
        anomaly.isAnomaly,
        anomaly.anomalyScore,
        event.timestamp,
      ]
    );

    return result.rows[0].id;
  }

  private async updateDeviceLastActivity(deviceId: string): Promise<void> {
    await DatabaseService.query(
      `UPDATE devices SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [deviceId]
    );
  }

  private async getHubConfiguration(hubId: string): Promise<any> {
    const result = await DatabaseService.query(
      `SELECT configuration FROM hubs WHERE id = $1`,
      [hubId]
    );
    return result.rows[0]?.configuration || {};
  }

  private async getBaseline(
    hubId: string,
    dayOfWeek: number,
    hourOfDay: number,
    roomName?: string
  ): Promise<any> {
    const result = await DatabaseService.query(
      `SELECT * FROM activity_baselines
       WHERE hub_id = $1 AND day_of_week = $2 AND hour_of_day = $3
         AND (room_name = $4 OR ($4 IS NULL AND room_name IS NULL))`,
      [hubId, dayOfWeek, hourOfDay, roomName || null]
    );
    return result.rows[0];
  }

  private isNighttime(hour: number, config: any): boolean {
    const nightStart = config?.night_mode_start
      ? parseInt(config.night_mode_start.split(':')[0])
      : this.DEFAULT_NIGHT_HOURS_START;
    const nightEnd = config?.night_mode_end
      ? parseInt(config.night_mode_end.split(':')[0])
      : this.DEFAULT_NIGHT_HOURS_END;

    if (nightStart > nightEnd) {
      // Night spans midnight
      return hour >= nightStart || hour < nightEnd;
    }
    return hour >= nightStart && hour < nightEnd;
  }
}

export const activityDetectionService = new ActivityDetectionService();
