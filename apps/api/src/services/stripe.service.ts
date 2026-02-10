/**
 * Stripe Service
 * Handles all Stripe-related operations for subscription billing
 */

import Stripe from 'stripe';
import { config } from '../config/index.js';
import { Tenant, ITenant } from '../db/models/tenant.model.js';
import { User } from '../db/models/user.model.js';

// Plan configuration
export const PLAN_HIERARCHY = ['free', 'starter', 'professional', 'enterprise'] as const;
export type PlanType = typeof PLAN_HIERARCHY[number];

export interface PlanConfig {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    documentsPerMonth: number;
    maxUsers: number;
    advisorSupport: 'none' | 'email' | 'priority' | 'dedicated';
    customTemplates: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    description: 'Get started with basic features',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 3 documents per month',
      'Basic document templates',
      'Email support',
    ],
    limits: {
      documentsPerMonth: 3,
      maxUsers: 1,
      advisorSupport: 'none',
      customTemplates: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  starter: {
    name: 'Starter',
    description: 'Perfect for small businesses',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      'Up to 20 documents per month',
      'All document templates',
      'Email support',
      '1 user included',
    ],
    limits: {
      documentsPerMonth: 20,
      maxUsers: 1,
      advisorSupport: 'email',
      customTemplates: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  professional: {
    name: 'Professional',
    description: 'For growing businesses',
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      'Unlimited documents',
      'All document templates',
      'Priority advisor support',
      'Up to 5 users',
      'API access',
    ],
    limits: {
      documentsPerMonth: -1, // Unlimited
      maxUsers: 5,
      advisorSupport: 'priority',
      customTemplates: false,
      apiAccess: true,
      whiteLabel: false,
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      'Unlimited documents',
      'All document templates',
      'Dedicated advisor support',
      'Unlimited users',
      'API access',
      'Custom templates',
      'White-label options',
    ],
    limits: {
      documentsPerMonth: -1, // Unlimited
      maxUsers: -1, // Unlimited
      advisorSupport: 'dedicated',
      customTemplates: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
};

class StripeService {
  private stripe: Stripe | null = null;

  private getStripe(): Stripe {
    if (!this.stripe) {
      if (!config.stripe.secretKey) {
        throw new Error('Stripe secret key is not configured');
      }
      this.stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2024-12-18.acacia',
      });
    }
    return this.stripe;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!config.stripe.secretKey;
  }

  /**
   * Create a Stripe customer for a tenant
   */
  async createCustomer(tenant: ITenant, userEmail: string): Promise<string> {
    const stripe = this.getStripe();

    const customer = await stripe.customers.create({
      email: userEmail,
      name: tenant.name,
      metadata: {
        tenantId: tenant._id.toString(),
        tenantSlug: tenant.slug,
      },
    });

    // Update tenant with Stripe customer ID
    await Tenant.findByIdAndUpdate(tenant._id, {
      'subscription.stripeCustomerId': customer.id,
    });

    return customer.id;
  }

  /**
   * Get or create Stripe customer for tenant
   */
  async getOrCreateCustomer(tenantId: string, userEmail: string): Promise<string> {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.subscription?.stripeCustomerId) {
      return tenant.subscription.stripeCustomerId;
    }

    return this.createCustomer(tenant, userEmail);
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    tenantId: string,
    userEmail: string,
    plan: 'starter' | 'professional' | 'enterprise',
    interval: 'monthly' | 'annual',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const stripe = this.getStripe();

    // Get the price ID based on plan and interval
    const priceId = this.getPriceId(plan, interval);
    if (!priceId) {
      // Log which price IDs are configured for debugging
      console.error('Stripe price configuration:', {
        plan,
        interval,
        configuredPrices: {
          starterMonthly: config.stripe.prices.starterMonthly ? 'set' : 'missing',
          starterAnnual: config.stripe.prices.starterAnnual ? 'set' : 'missing',
          professionalMonthly: config.stripe.prices.professionalMonthly ? 'set' : 'missing',
          professionalAnnual: config.stripe.prices.professionalAnnual ? 'set' : 'missing',
          enterpriseMonthly: config.stripe.prices.enterpriseMonthly ? 'set' : 'missing',
          enterpriseAnnual: config.stripe.prices.enterpriseAnnual ? 'set' : 'missing',
        },
      });
      throw new Error(`Price not configured for ${plan} ${interval}. Please set STRIPE_${plan.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID environment variable.`);
    }

    // Get or create customer
    const customerId = await this.getOrCreateCustomer(tenantId, userEmail);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: config.stripe.trialDays,
        metadata: {
          tenantId,
          plan,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        plan,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create a customer portal session for managing subscription
   */
  async createPortalSession(tenantId: string, returnUrl: string): Promise<string> {
    const stripe = this.getStripe();

    const tenant = await Tenant.findById(tenantId);
    if (!tenant?.subscription?.stripeCustomerId) {
      throw new Error('No Stripe customer found for this tenant');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription details from Stripe
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const stripe = this.getStripe();
    return stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(tenantId: string): Promise<void> {
    const stripe = this.getStripe();

    const tenant = await Tenant.findById(tenantId);
    if (!tenant?.subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(tenant.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await Tenant.findByIdAndUpdate(tenantId, {
      'subscription.cancelAtPeriodEnd': true,
    });
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(tenantId: string): Promise<void> {
    const stripe = this.getStripe();

    const tenant = await Tenant.findById(tenantId);
    if (!tenant?.subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    await stripe.subscriptions.update(tenant.subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await Tenant.findByIdAndUpdate(tenantId, {
      'subscription.cancelAtPeriodEnd': false,
    });
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }
  }

  /**
   * Construct webhook event from payload
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const stripe = this.getStripe();
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
  }

  /**
   * Get available plans with pricing
   */
  getPlans(): Array<{
    id: PlanType;
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    limits: PlanConfig['limits'];
  }> {
    return Object.entries(PLANS).map(([id, plan]) => ({
      id: id as PlanType,
      ...plan,
    }));
  }

  /**
   * Check if a tenant has access to a feature based on their plan
   */
  async checkPlanAccess(tenantId: string, requiredPlan: PlanType): Promise<boolean> {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return false;

    const currentPlan = tenant.subscription?.plan || 'free';
    const currentPlanIndex = PLAN_HIERARCHY.indexOf(currentPlan as PlanType);
    const requiredPlanIndex = PLAN_HIERARCHY.indexOf(requiredPlan);

    return currentPlanIndex >= requiredPlanIndex;
  }

  /**
   * Get tenant's plan limits
   */
  async getPlanLimits(tenantId: string): Promise<PlanConfig['limits']> {
    const tenant = await Tenant.findById(tenantId);
    const plan = (tenant?.subscription?.plan || 'free') as PlanType;
    return PLANS[plan].limits;
  }

  // Private helper methods

  private getPriceId(plan: string, interval: 'monthly' | 'annual'): string {
    const prices = config.stripe.prices;
    const key = `${plan}${interval === 'monthly' ? 'Monthly' : 'Annual'}` as keyof typeof prices;
    return prices[key] || '';
  }

  private getPlanFromPriceId(priceId: string): PlanType {
    const prices = config.stripe.prices;
    
    if (priceId === prices.starterMonthly || priceId === prices.starterAnnual) {
      return 'starter';
    }
    if (priceId === prices.professionalMonthly || priceId === prices.professionalAnnual) {
      return 'professional';
    }
    if (priceId === prices.enterpriseMonthly || priceId === prices.enterpriseAnnual) {
      return 'enterprise';
    }
    return 'free';
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) return;

    // The subscription will be handled by the subscription.created event
    console.log(`Checkout completed for tenant ${tenantId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      // Try to find tenant by customer ID
      const tenant = await Tenant.findOne({
        'subscription.stripeCustomerId': subscription.customer as string,
      });
      if (!tenant) return;
      await this.updateTenantSubscription(tenant._id.toString(), subscription);
    } else {
      await this.updateTenantSubscription(tenantId, subscription);
    }
  }

  private async updateTenantSubscription(tenantId: string, subscription: Stripe.Subscription): Promise<void> {
    const priceId = subscription.items.data[0]?.price.id;
    const plan = this.getPlanFromPriceId(priceId);

    let status: ITenant['subscription']['status'] = 'active';
    if (subscription.status === 'trialing') {
      status = 'trialing';
    } else if (subscription.status === 'past_due') {
      status = 'past_due';
    } else if (subscription.status === 'canceled') {
      status = 'canceled';
    } else if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
      status = 'incomplete';
    }

    await Tenant.findByIdAndUpdate(tenantId, {
      subscription: {
        plan,
        status,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const tenant = await Tenant.findOne({
      'subscription.stripeSubscriptionId': subscription.id,
    });
    if (!tenant) return;

    // Downgrade to free plan
    await Tenant.findByIdAndUpdate(tenant._id, {
      subscription: {
        plan: 'free',
        status: 'canceled',
        stripeCustomerId: tenant.subscription?.stripeCustomerId,
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const tenant = await Tenant.findOne({
      'subscription.stripeCustomerId': invoice.customer as string,
    });
    if (!tenant) return;

    await Tenant.findByIdAndUpdate(tenant._id, {
      'subscription.status': 'past_due',
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const tenant = await Tenant.findOne({
      'subscription.stripeCustomerId': invoice.customer as string,
    });
    if (!tenant) return;

    // Only update if currently past_due
    if (tenant.subscription?.status === 'past_due') {
      await Tenant.findByIdAndUpdate(tenant._id, {
        'subscription.status': 'active',
      });
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
