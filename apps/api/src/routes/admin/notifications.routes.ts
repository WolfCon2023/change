/**
 * Notification Admin Routes
 * API endpoints for managing and testing email notifications
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, authorize, validate } from '../../middleware/index.js';
import { emailService } from '../../services/email.service.js';
import { notificationService } from '../../services/notification.service.js';
import { schedulerService } from '../../services/scheduler.service.js';
import { PrimaryRole } from '@change/shared';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize([PrimaryRole.IT_ADMIN]));

/**
 * POST /admin/notifications/test-email
 * Send a test email to verify SMTP configuration
 */
const testEmailSchema = z.object({
  email: z.string().email('Valid email required'),
});

router.post(
  '/test-email',
  validate(testEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      console.log(`[Notifications] Test email requested for: ${email}`);
      
      const success = await emailService.sendTestEmail(email);
      
      res.json({
        success: true,
        data: {
          sent: success,
          message: success 
            ? 'Test email sent successfully. Check your inbox.' 
            : 'SMTP not configured or email failed to send. Check server logs.',
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
 * POST /admin/notifications/trigger-check
 * Manually trigger the compliance reminder check
 */
router.post(
  '/trigger-check',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[Notifications] Manual notification check triggered by admin');
      
      const result = await schedulerService.triggerNotificationCheck();
      
      res.json({
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed,
          skipped: result.skipped,
          details: result.details,
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
 * POST /admin/notifications/send-reminder
 * Send an immediate reminder for a specific compliance item
 */
const sendReminderSchema = z.object({
  profileId: z.string().min(1, 'Profile ID required'),
  complianceItemId: z.string().min(1, 'Compliance item ID required'),
});

router.post(
  '/send-reminder',
  validate(sendReminderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { profileId, complianceItemId } = req.body;
      
      console.log(`[Notifications] Immediate reminder requested for profile ${profileId}, item ${complianceItemId}`);
      
      const result = await notificationService.sendImmediateReminder(profileId, complianceItemId);
      
      res.json({
        success: result.success,
        data: {
          message: result.message,
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
 * GET /admin/notifications/status
 * Get the scheduler status
 */
router.get(
  '/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = schedulerService.getStatus();
      
      res.json({
        success: true,
        data: {
          schedulerRunning: status.isRunning,
          smtpConfigured: !!(process.env['SMTP_HOST'] && process.env['SMTP_USER']),
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
