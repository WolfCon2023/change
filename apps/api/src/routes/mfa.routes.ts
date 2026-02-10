/**
 * MFA Routes
 * Handles Two-Factor Authentication setup, verification, and management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, validate } from '../middleware/index.js';
import { mfaService } from '../services/mfa.service.js';

const router = Router();

// Validation schemas
const verifyTokenSchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must contain only digits'),
});

const disableMfaSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * GET /mfa/status
 * Get current MFA status for authenticated user
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await mfaService.getMfaStatus(req.user!.userId);

      res.json({
        success: true,
        data: status,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /mfa/setup
 * Initiate MFA setup - generates secret and QR code
 */
router.post(
  '/setup',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mfaService.initiateMfaSetup(req.user!.userId);

      res.json({
        success: true,
        data: {
          qrCodeUrl: result.qrCodeUrl,
          manualEntryKey: result.manualEntryKey,
          backupCodes: result.backupCodes,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /mfa/verify-setup
 * Complete MFA setup by verifying the first code from authenticator app
 */
router.post(
  '/verify-setup',
  authenticate,
  validate(verifyTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      const result = await mfaService.completeMfaSetup(req.user!.userId, token);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'MFA_VERIFY_FAILED', message: result.message },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      res.json({
        success: true,
        data: { message: result.message },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /mfa/disable
 * Disable MFA (requires password verification)
 */
router.post(
  '/disable',
  authenticate,
  validate(disableMfaSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body;
      const result = await mfaService.disableMfa(req.user!.userId, password);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'MFA_DISABLE_FAILED', message: result.message },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      res.json({
        success: true,
        data: { message: result.message },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
