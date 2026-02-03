/**
 * Profile Routes
 * Business profile management endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusinessProfile, Person, BusinessArchetype } from '../../db/models/index.js';
import { USState } from '@change/shared';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  dbaName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  businessAddress: z.object({
    street1: z.string().max(200),
    street2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('USA'),
  }).optional(),
  mailingAddress: z.object({
    street1: z.string().max(200),
    street2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().default('USA'),
  }).optional(),
  registeredAgent: z.object({
    type: z.enum(['self', 'commercial', 'individual']),
    name: z.string().max(200),
    address: z.object({
      street1: z.string().max(200),
      street2: z.string().max(200).optional(),
      city: z.string().max(100),
      state: z.string().length(2),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      country: z.string().default('USA'),
    }),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
  }).optional(),
  naicsCode: z.string().max(6).optional(),
  sicCode: z.string().max(4).optional(),
});

/**
 * GET /app/profile
 * Get current business profile with archetype data
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    
    if (!profile) {
      return res.json({
        success: true,
        data: null,
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    // Get archetype details if set
    let archetypeData = null;
    if (profile.archetypeKey) {
      const archetype = await BusinessArchetype.findOne({ key: profile.archetypeKey })
        .select('key name description icon recommendedEntityTypes')
        .lean();
      if (archetype) {
        archetypeData = {
          key: archetype.key,
          name: archetype.name,
          description: archetype.description,
          icon: archetype.icon,
        };
      }
    }
    
    // Get owners count
    const ownersCount = await Person.countDocuments({ 
      tenantId, 
      businessProfileId: profile._id,
    });
    
    // Transform response
    const transformed = {
      ...profile,
      id: profile._id.toString(),
      _id: undefined,
      archetype: archetypeData,
      ownersCount,
    };
    
    res.json({
      success: true,
      data: transformed,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/profile
 * Update business profile
 */
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid input',
          details: validation.error.errors,
        },
      });
    }
    
    const updateData = validation.data;
    
    // Update profile
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    res.json({
      success: true,
      data: {
        id: profile._id.toString(),
        profileCompleteness: profile.profileCompleteness,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/profile/readiness
 * Get readiness status with blockers
 */
router.get('/readiness', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    
    if (!profile) {
      return res.json({
        success: true,
        data: {
          ready: false,
          progress: 0,
          blockers: ['No business profile created'],
          nextAction: {
            label: 'Start Setup',
            action: 'start_setup',
            route: '/app/setup',
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    const flags = profile.readinessFlags || {};
    const blockers: string[] = [];
    
    // Check each readiness flag and add blockers
    if (!flags.archetypeSelected) blockers.push('Select a business archetype');
    if (!flags.entitySelected) blockers.push('Select an entity type');
    if (!flags.stateSelected) blockers.push('Select your formation state');
    if (!flags.addressVerified) blockers.push('Add and verify business address');
    if (!flags.registeredAgentSet) blockers.push('Set up a registered agent');
    if (!flags.ownersAdded) blockers.push('Add at least one owner or officer');
    
    // Calculate overall readiness
    const flagsSet = Object.values(flags).filter(Boolean).length;
    const totalFlags = 11; // Total readiness flags
    const progress = Math.round((flagsSet / totalFlags) * 100);
    
    // Determine next action
    let nextAction = {
      label: 'Continue Setup',
      action: 'continue',
      route: '/app/setup',
    };
    
    if (blockers.length === 0) {
      nextAction = {
        label: 'Start Formation',
        action: 'formation',
        route: '/app/formation',
      };
    } else if (blockers.includes('Select a business archetype')) {
      nextAction = {
        label: 'Select Archetype',
        action: 'archetype',
        route: '/app/setup?step=archetype',
      };
    }
    
    res.json({
      success: true,
      data: {
        ready: blockers.length === 0,
        progress,
        flags,
        blockers,
        nextAction,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/profile/people
 * Get owners and officers
 */
router.get('/people', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const profile = await BusinessProfile.findOne({ tenantId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    const people = await Person.find({ 
      tenantId, 
      businessProfileId: profile._id,
    }).lean();
    
    const transformed = people.map(p => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
    }));
    
    res.json({
      success: true,
      data: transformed,
      meta: { 
        timestamp: new Date().toISOString(),
        count: transformed.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
