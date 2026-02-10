/**
 * Billing Routes
 * Subscription management and Stripe integration endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/index.js';
import { stripeService, PLANS, PlanType } from '../../services/stripe.service.js';
import { Tenant } from '../../db/models/tenant.model.js';
import { User } from '../../db/models/user.model.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * GET /billing
 * Get current subscription status for the tenant
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tenant ID required' },
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
      });
    }

    const subscription = tenant.subscription || {
      plan: 'free',
      status: 'active',
    };

    const planConfig = PLANS[subscription.plan as PlanType] || PLANS.free;

    res.json({
      success: true,
      data: {
        subscription: {
          plan: subscription.plan,
          planName: planConfig.name,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEnd: subscription.trialEnd,
        },
        limits: planConfig.limits,
        features: planConfig.features,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /billing/plans
 * Get available subscription plans
 */
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = stripeService.getPlans();

    res.json({
      success: true,
      data: {
        plans: plans.filter(p => p.id !== 'free'), // Don't show free as an option
        trialDays: config.stripe.trialDays,
        stripeConfigured: stripeService.isConfigured(),
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// Checkout session validation schema
const checkoutSchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
  interval: z.enum(['monthly', 'annual']),
});

/**
 * POST /billing/checkout
 * Create a Stripe checkout session
 */
router.post(
  '/checkout',
  validate(checkoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.userId;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Tenant and user required' },
        });
      }

      if (!stripeService.isConfigured()) {
        return res.status(503).json({
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Payment processing is not configured' },
        });
      }

      const { plan, interval } = req.body;

      // Get user email
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      // Create checkout session
      const { sessionId, url } = await stripeService.createCheckoutSession(
        tenantId,
        user.email,
        plan,
        interval,
        `${config.appUrl}/app/billing?success=true`,
        `${config.appUrl}/app/billing?canceled=true`
      );

      res.json({
        success: true,
        data: {
          sessionId,
          url,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /billing/portal
 * Create a Stripe customer portal session
 */
router.post('/portal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tenant required' },
      });
    }

    if (!stripeService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Payment processing is not configured' },
      });
    }

    const url = await stripeService.createPortalSession(
      tenantId,
      `${config.appUrl}/app/billing`
    );

    res.json({
      success: true,
      data: { url },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /billing/cancel
 * Cancel subscription at period end
 */
router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tenant required' },
      });
    }

    await stripeService.cancelSubscription(tenantId);

    res.json({
      success: true,
      data: { message: 'Subscription will be canceled at the end of the billing period' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /billing/reactivate
 * Reactivate a canceled subscription
 */
router.post('/reactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tenant required' },
      });
    }

    await stripeService.reactivateSubscription(tenantId);

    res.json({
      success: true,
      data: { message: 'Subscription reactivated' },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
