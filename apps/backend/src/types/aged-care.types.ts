// Device Categories for Aged Care
export type DeviceCategory =
  | 'motion_sensor'
  | 'door_sensor'
  | 'emergency_button'
  | 'bed_sensor'
  | 'smart_plug'
  | 'smoke_detector'
  | 'co_detector'
  | 'water_sensor'
  | 'temperature_sensor'
  | 'video_doorbell'
  | 'voice_assistant'
  | 'wearable_pendant'
  | 'medicine_cabinet'
  | 'smart_lock'
  | 'camera'
  | 'other';

// Activity Event Types
export type ActivityEventType =
  | 'motion_detected'
  | 'motion_stopped'
  | 'door_opened'
  | 'door_closed'
  | 'button_pressed'
  | 'bed_occupied'
  | 'bed_vacant'
  | 'appliance_on'
  | 'appliance_off'
  | 'smoke_detected'
  | 'co_detected'
  | 'water_leak'
  | 'fall_detected'
  | 'temperature_alert'
  | 'battery_low'
  | 'device_offline';

// Alert Types
export type AlertType =
  | 'emergency_button'
  | 'fall_detected'
  | 'no_morning_activity'
  | 'extended_bathroom'
  | 'no_activity'
  | 'wandering'
  | 'no_eating'
  | 'medication_missed'
  | 'smoke_detected'
  | 'co_detected'
  | 'water_leak'
  | 'device_offline'
  | 'hub_offline'
  | 'battery_critical'
  | 'custom';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled' | 'escalated';

// Check-in Types
export type CheckInType = 'manual_app' | 'manual_hub' | 'voice' | 'auto_detected' | 'reminder_response';
export type CheckInStatus = 'ok' | 'help_needed' | 'missed' | 'late';

// Hub Status
export type HubStatus = 'online' | 'offline' | 'updating' | 'error';

// Hub Configuration
export interface HubConfiguration {
  check_in_time: string;
  night_mode_start: string;
  night_mode_end: string;
  alert_sensitivity: 'low' | 'normal' | 'high';
  voice_enabled: boolean;
  privacy_mode: boolean;
  bathroom_timeout_minutes?: number;
  no_activity_hours?: number;
  morning_activity_deadline?: string;
}

// MQTT Message Types from Hub
export interface HubStatusMessage {
  hubId: string;
  serialNumber: string;
  status: HubStatus;
  firmwareVersion: string;
  batteryLevel?: number;
  isOnBattery: boolean;
  wifiStrength: number;
  timestamp: string;
}

export interface DeviceEventMessage {
  hubId: string;
  deviceId: string;
  deviceCategory: DeviceCategory;
  eventType: ActivityEventType;
  roomName?: string;
  sensorData: Record<string, any>;
  batteryLevel?: number;
  timestamp: string;
}

export interface EmergencyMessage {
  hubId: string;
  userId: string;
  source: 'pendant' | 'hub_button' | 'voice' | 'app' | 'fall_sensor';
  location?: string;
  timestamp: string;
}

export interface CheckInMessage {
  hubId: string;
  userId: string;
  type: CheckInType;
  status: CheckInStatus;
  timestamp: string;
}

// API Response Types
export interface Hub {
  id: string;
  userId: string;
  serialNumber: string;
  name: string;
  firmwareVersion?: string;
  status: HubStatus;
  lastSeenAt?: Date;
  batteryLevel?: number;
  isOnBattery: boolean;
  wifiStrength?: number;
  configuration: HubConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyUserId?: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  isEmergencyContact: boolean;
  notificationPreferences: {
    check_in: boolean;
    emergency: boolean;
    activity_alerts: boolean;
    daily_summary: boolean;
    push_enabled: boolean;
    sms_enabled: boolean;
    email_enabled: boolean;
  };
  priorityOrder: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityEvent {
  id: string;
  hubId: string;
  deviceId?: string;
  eventType: ActivityEventType;
  roomName?: string;
  sensorData: Record<string, any>;
  isAnomaly: boolean;
  anomalyScore?: number;
  processed: boolean;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  userId: string;
  hubId?: string;
  checkInType: CheckInType;
  status: CheckInStatus;
  scheduledTime?: string;
  actualTime: Date;
  notes?: string;
  familyNotified: boolean;
  createdAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  hubId?: string;
  activityEventId?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message?: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  escalationLevel: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationSchedule {
  id: string;
  userId: string;
  medicationName: string;
  dosage?: string;
  instructions?: string;
  scheduledTimes: string[];
  daysOfWeek: number[];
  reminderEnabled: boolean;
  cabinetSensorId?: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationLog {
  id: string;
  scheduleId: string;
  scheduledTime: Date;
  takenAt?: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  detectionMethod?: 'manual' | 'cabinet_sensor' | 'voice' | 'reminder_ack';
  notes?: string;
  createdAt: Date;
}

// Activity Pattern Types
export interface ActivityBaseline {
  id: string;
  hubId: string;
  dayOfWeek: number;
  hourOfDay: number;
  roomName?: string;
  avgMotionEvents: number;
  stdMotionEvents: number;
  avgDurationMinutes: number;
  typicalDevices: string[];
  sampleCount: number;
  lastUpdated: Date;
}

export interface DailyActivitySummary {
  date: string;
  firstActivity?: Date;
  lastActivity?: Date;
  totalMotionEvents: number;
  roomsVisited: string[];
  checkInStatus?: CheckInStatus;
  medicationsCompleted: number;
  medicationsScheduled: number;
  alertsTriggered: number;
  anomaliesDetected: number;
}

// Alert Thresholds Configuration
export interface AlertThresholds {
  motion_sensor: {
    no_motion_minutes: number;
    bathroom_timeout_minutes: number;
  };
  door_sensor: {
    open_too_long_minutes: number;
    night_exit_alert: boolean;
  };
  bed_sensor: {
    night_absence_minutes: number;
    morning_deadline: string;
  };
  smart_plug: {
    appliance_on_too_long_minutes: number;
  };
}

// WebSocket Event Types for Real-time Updates
export interface WebSocketEvent {
  type: 'activity' | 'alert' | 'check_in' | 'hub_status' | 'device_status';
  userId: string;
  data: any;
  timestamp: string;
}

// Family Dashboard Data
export interface FamilyDashboardData {
  residentName: string;
  overallStatus: 'ok' | 'attention' | 'alert';
  lastCheckIn?: CheckIn;
  lastActivity?: ActivityEvent;
  homeStatus: {
    frontDoor: 'locked' | 'unlocked' | 'open';
    temperature?: number;
    lightsOn: number;
    lastMotionRoom?: string;
    lastMotionTime?: Date;
  };
  todaysSummary: {
    checkedIn: boolean;
    medicationsCompleted: number;
    medicationsTotal: number;
    alertsCount: number;
  };
  weekSummary: {
    checkInsCompleted: number;
    checkInsTotal: number;
    medicationCompliance: number;
    unusualEvents: number;
  };
  activeAlerts: Alert[];
}
