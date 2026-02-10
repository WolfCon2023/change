/**
 * Stripe Webhook Routes
 * Handles incoming webhook events from Stripe
 * 
 * IMPORTANT: This route must receive raw body data, not parsed JSON.
 * The express.raw() middleware should be applied to this route.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { stripeService } from '../../services/stripe.service.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 * 
 * Events handled:
 * - checkout.session.completed - When a checkout is completed
 * - customer.subscription.created - When a subscription is created
 * - customer.subscription.updated - When a subscription is modified
 * - customer.subscription.deleted - When a subscription is canceled
 * - invoice.payment_failed - When a payment fails
 * - invoice.paid - When an invoice is successfully paid
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      console.warn('Stripe webhook received but Stripe is not configured');
      return res.status(200).json({ received: true, warning: 'Stripe not configured' });
    }

    // Get the Stripe signature header
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      console.error('Stripe webhook missing signature');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Verify webhook signature and construct event
    let event;
    try {
      event = stripeService.constructWebhookEvent(
        req.body, // Should be raw buffer
        signature
      );
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    // Log the event for debugging
    console.log(`Stripe webhook received: ${event.type} (${event.id})`);

    // Handle the event
    await stripeService.handleWebhookEvent(event);

    // Acknowledge receipt of the event
    res.status(200).json({ received: true, eventId: event.id, type: event.type });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    // Still return 200 to prevent Stripe from retrying
    res.status(200).json({ received: true, error: error.message });
  }
});

export default router;
