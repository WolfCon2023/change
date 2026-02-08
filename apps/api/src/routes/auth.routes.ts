import { Router } from 'express';
import { z } from 'zod';
import { loginRequestSchema, registerRequestSchema, refreshTokenRequestSchema } from '@change/shared';
import { AuthService } from '../services/auth.service.js';
import { validate, authenticate } from '../middleware/index.js';
import { User } from '../db/models/index.js';
import { UnauthorizedError, BadRequestError } from '../middleware/error-handler.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// Change password validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  validate(loginRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(
        req.body,
        req.ip ?? req.socket.remoteAddress,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshTokenRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await AuthService.refreshToken(req.body.refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.getUserById(req.user!.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: user.toPublicJSON(),
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.userId;
      
      // Get user with password
      const user = await User.findById(userId).select('+passwordHash');
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw new BadRequestError('Current password is incorrect');
      }
      
      // Check new password is different
      const isSame = await user.comparePassword(newPassword);
      if (isSame) {
        throw new BadRequestError('New password must be different from current password');
      }
      
      // Update password (pre-save hook will hash it)
      user.passwordHash = newPassword;
      user.passwordChangedAt = new Date();
      user.mustChangePassword = false;
      await user.save();
      
      res.json({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Logout user (client should clear tokens)
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a full implementation, you would invalidate the refresh token here
      // For now, we just acknowledge the logout
      
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
