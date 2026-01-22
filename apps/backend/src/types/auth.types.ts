import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Device {
  id: string;
  user_id: string;
  room_id?: string;
  name: string;
  type: string;
  protocol: string;
  status: 'online' | 'offline' | 'unknown';
  state: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Room {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: Record<string, unknown>;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
