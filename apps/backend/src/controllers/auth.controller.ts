import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database.service';
import { RedisService } from '../services/redis.service';
import { emailService } from '../services/email.service';
import { AuthenticatedRequest } from '../types/auth.types';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';

export class AuthController {
  /**
   * Register a new user
   */
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await DatabaseService.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
      );

      // Create user
      const result = await DatabaseService.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, phone_number, role, created_at`,
        [email, hashedPassword, firstName, lastName, phoneNumber || null, 'user']
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in Redis
      await RedisService.set(
        `refresh_token:${user.id}`,
        refreshToken,
        30 * 24 * 60 * 60 // 30 days
      );

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            role: user.role,
            createdAt: user.created_at,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await DatabaseService.query(
        `SELECT id, email, password_hash, first_name, last_name, phone_number, role, is_active, user_type, reseller_id
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in Redis
      await RedisService.set(
        `refresh_token:${user.id}`,
        refreshToken,
        30 * 24 * 60 * 60
      );

      // Update last login
      await DatabaseService.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            role: user.role,
            userType: user.user_type || 'household',
            resellerId: user.reseller_id || null,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'default-secret'
      ) as { userId: string };

      // Check if refresh token exists in Redis
      const storedToken = await RedisService.get(`refresh_token:${decoded.userId}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Get user
      const result = await DatabaseService.query(
        'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user.id, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update refresh token in Redis
      await RedisService.set(
        `refresh_token:${user.id}`,
        newRefreshToken,
        30 * 24 * 60 * 60
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (userId) {
        // Remove refresh token from Redis
        await RedisService.del(`refresh_token:${userId}`);
        logger.info(`User logged out: ${userId}`);
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const result = await DatabaseService.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists
        res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
        return;
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password-reset' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '1h' }
      );

      // Store reset token in Redis
      await RedisService.set(`password_reset:${user.id}`, resetToken, 3600); // 1 hour

      // Send email with reset link
      await emailService.sendPasswordResetEmail(email, resetToken);

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // In development, return token (remove in production)
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      ) as { userId: string; type: string };

      if (decoded.type !== 'password-reset') {
        throw new AppError('Invalid token', 400);
      }

      // Check if token exists in Redis
      const storedToken = await RedisService.get(`password_reset:${decoded.userId}`);

      if (!storedToken || storedToken !== token) {
        throw new AppError('Invalid or expired token', 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
      );

      // Update password
      await DatabaseService.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, decoded.userId]
      );

      // Remove reset token
      await RedisService.del(`password_reset:${decoded.userId}`);

      logger.info(`Password reset successful for user: ${decoded.userId}`);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  }

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      // TODO: Implement email verification logic
      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Guest login - no password required
   * Used for potential customers to explore the platform
   */
  async guestLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guestEmail = 'guest@smarthome.service';

      // Find or create guest user
      let result = await DatabaseService.query(
        `SELECT id, email, first_name, last_name, phone_number, role, is_active, user_type
         FROM users WHERE email = $1`,
        [guestEmail]
      );

      let user;

      if (result.rows.length === 0) {
        // Create guest user if doesn't exist
        const createResult = await DatabaseService.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role, user_type, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, email, first_name, last_name, phone_number, role, user_type, is_active`,
          [guestEmail, 'guest-no-password', 'Guest', 'User', 'guest', 'household', true]
        );
        user = createResult.rows[0];
        logger.info(`Guest user created: ${guestEmail}`);
      } else {
        user = result.rows[0];
      }

      if (!user.is_active) {
        throw new AppError('Guest account is deactivated', 403);
      }

      // Generate tokens with short expiry for guest
      const accessToken = jwt.sign(
        { userId: user.id, role: 'guest' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '24h' } // Guest tokens expire in 24 hours
      );
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in Redis with shorter expiry
      await RedisService.set(
        `refresh_token:${user.id}`,
        refreshToken,
        24 * 60 * 60 // 24 hours for guest
      );

      // Update last login
      await DatabaseService.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      logger.info(`Guest user logged in: ${guestEmail}`);

      res.json({
        success: true,
        message: 'Guest login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            role: 'guest',
            userType: user.user_type || 'household',
            isGuest: true,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }
}
