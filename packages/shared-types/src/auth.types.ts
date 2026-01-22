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
