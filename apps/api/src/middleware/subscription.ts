/**
 * Subscription Middleware
 * Feature gating based on subscription plans
 */

import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../db/models/tenant.model.js';
import { PLANS, PLAN_HIERARCHY, PlanType } from '../services/stripe.service.js';

/**
 * Middleware to require a minimum subscription plan
 * @param requiredPlan - The minimum plan required to access the route
 */
export function requirePlan(requiredPlan: PlanType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Tenant required',
          },
        });
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
      }

      const currentPlan = (tenant.subscription?.plan || 'free') as PlanType;
      const currentPlanIndex = PLAN_HIERARCHY.indexOf(currentPlan);
      const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);

      if (currentPlanIndex < requiredPlanIndex) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_UPGRADE_REQUIRED',
            message: `This feature requires the ${PLANS[requiredPlan].name} plan or higher`,
            requiredPlan,
            currentPlan,
          },
        });
      }

      // Attach plan info to request for convenience
      req.subscription = {
        plan: currentPlan,
        limits: PLANS[currentPlan].limits,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check specific feature access
 * @param feature - The feature to check access for
 */
export function checkFeatureAccess(feature: keyof typeof PLANS['free']['limits']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Tenant required',
          },
        });
      }

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
      }

      const currentPlan = (tenant.subscription?.plan || 'free') as PlanType;
      const limits = PLANS[currentPlan].limits;
      const featureValue = limits[feature];

      // For boolean features
      if (typeof featureValue === 'boolean') {
        if (!featureValue) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FEATURE_NOT_AVAILABLE',
              message: `The ${feature} feature is not available on your current plan`,
              currentPlan,
              upgrade: getUpgradePlanForFeature(feature),
            },
          });
        }
      }

      // Attach plan info to request for convenience
      req.subscription = {
        plan: currentPlan,
        limits,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to load subscription info without blocking
 * Useful for routes that need plan info but don't require a specific plan
 */
export async function loadSubscription(req: Request, _res: Response, next: NextFunction) {
  try {
    const tenantId = req.user?.tenantId;

    if (tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (tenant) {
        const currentPlan = (tenant.subscription?.plan || 'free') as PlanType;
        req.subscription = {
          plan: currentPlan,
          limits: PLANS[currentPlan].limits,
        };
      }
    }

    next();
  } catch (error) {
    // Don't block on subscription loading errors
    next();
  }
}

/**
 * Get the minimum plan that provides a specific feature
 */
function getUpgradePlanForFeature(feature: keyof typeof PLANS['free']['limits']): PlanType | null {
  for (const plan of PLAN_HIERARCHY) {
    const featureValue = PLANS[plan].limits[feature];
    if (typeof featureValue === 'boolean' && featureValue) {
      return plan;
    }
    if (typeof featureValue === 'number' && featureValue !== 0) {
      return plan;
    }
  }
  return null;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      subscription?: {
        plan: PlanType;
        limits: typeof PLANS['free']['limits'];
      };
    }
  }
}
