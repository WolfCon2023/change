/**
 * Setup Routes
 * Business setup wizard API endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusinessProfile, BusinessArchetype, Person, AuditLog } from '../../db/models/index.js';
import { BusinessType, USState, AuditAction, FormationStatus, EINStatus, BusinessAppAuditAction } from '@change/shared';

const router = Router();

// Validation schemas
const startSetupSchema = z.object({
  businessName: z.string().min(1).max(200),
  email: z.string().email(),
});

const selectArchetypeSchema = z.object({
  archetypeKey: z.string().min(1),
});

const selectEntityTypeSchema = z.object({
  entityType: z.enum(['llc', 'corporation', 'sole_proprietorship', 'partnership', 'nonprofit', 'cooperative']),
});

const selectStateSchema = z.object({
  state: z.string().length(2).toUpperCase(),
});

const completeSetupSchema = z.object({
  businessName: z.string().min(1).max(200),
  dbaName: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
});

/**
 * GET /app/setup/status
 * Get current setup progress for the tenant
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    // Find existing business profile
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    
    if (!profile) {
      return res.json({
        success: true,
        data: {
          hasStarted: false,
          isComplete: false,
          currentStep: 'welcome',
          progress: 0,
          readinessFlags: {
            profileComplete: false,
            entitySelected: false,
            stateSelected: false,
            archetypeSelected: false,
            addressVerified: false,
            registeredAgentSet: false,
            ownersAdded: false,
            sosReadyToFile: false,
            einReadyToApply: false,
            documentsGenerated: false,
            advisorAssigned: false,
          },
          blockers: ['No business profile created yet'],
          nextAction: {
            label: 'Start Business Setup',
            action: 'start_setup',
            description: 'Begin by telling us about your business',
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    // Calculate progress and current step
    const readinessFlags = profile.readinessFlags || {};
    let currentStep = 'welcome';
    let progress = 0;
    const blockers: string[] = [];
    
    // Determine current step based on what's missing
    if (!profile.archetypeKey) {
      currentStep = 'archetype';
      progress = 10;
      blockers.push('Select a business archetype');
    } else if (!profile.businessType) {
      currentStep = 'entity_type';
      progress = 25;
      blockers.push('Select an entity type');
    } else if (!profile.formationState) {
      currentStep = 'state';
      progress = 40;
      blockers.push('Select your formation state');
    } else if (!profile.businessAddress?.street1) {
      currentStep = 'business_info';
      progress = 55;
      blockers.push('Complete business address');
    } else if (profile.formationStatus === 'not_started' || profile.formationStatus === 'in_progress') {
      currentStep = 'formation';
      progress = 70;
      blockers.push('Complete business formation');
    } else {
      currentStep = 'complete';
      progress = 100;
    }
    
    // Check for additional blockers
    if (profile.archetypeKey && !profile.businessType) {
      blockers.push('Entity type not selected');
    }
    if (!readinessFlags.ownersAdded) {
      blockers.push('Add at least one owner/officer');
    }
    
    // Determine next action
    let nextAction = {
      label: 'Continue Setup',
      action: 'continue_setup',
      description: 'Complete your business setup',
    };
    
    if (currentStep === 'archetype') {
      nextAction = {
        label: 'Select Business Type',
        action: 'select_archetype',
        description: 'Choose the archetype that best describes your business',
      };
    } else if (currentStep === 'entity_type') {
      nextAction = {
        label: 'Select Entity Type',
        action: 'select_entity_type',
        description: 'Choose your legal entity structure (LLC, Corporation, etc.)',
      };
    } else if (currentStep === 'state') {
      nextAction = {
        label: 'Select State',
        action: 'select_state',
        description: 'Choose your state of formation',
      };
    } else if (currentStep === 'formation') {
      nextAction = {
        label: 'Continue Formation',
        action: 'formation',
        description: 'Complete the formation process',
      };
    }
    
    res.json({
      success: true,
      data: {
        hasStarted: true,
        isComplete: currentStep === 'complete',
        currentStep,
        progress,
        archetypeKey: profile.archetypeKey,
        entityType: profile.businessType,
        state: profile.formationState,
        businessProfileId: profile._id.toString(),
        readinessFlags,
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
 * POST /app/setup/start
 * Start the business setup wizard
 */
router.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = startSetupSchema.safeParse(req.body);
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
    
    const { businessName, email } = validation.data;
    
    // Check if profile already exists
    let profile = await BusinessProfile.findOne({ tenantId });
    
    if (profile) {
      // Update existing profile
      profile.businessName = businessName;
      profile.email = email;
      await profile.save();
    } else {
      // Create new profile
      profile = await BusinessProfile.create({
        tenantId,
        businessName,
        email,
        businessType: BusinessType.LLC, // Default, will be changed
        formationState: USState.DE, // Default, will be changed
        isExistingBusiness: false,
        formationStatus: 'not_started',
        einStatus: 'not_started',
        readinessFlags: {},
      });
    }
    
    // Create audit log
    await AuditLog.create({
      tenantId,
      userId,
      userEmail: email,
      userRole: req.user?.role || 'client_owner',
      action: AuditAction.BUSINESS_PROFILE_CREATED,
      resourceType: 'business_profile',
      resourceId: profile._id.toString(),
      newState: { businessName, email },
    });
    
    res.status(201).json({
      success: true,
      data: {
        businessProfileId: profile._id.toString(),
        currentStep: 'archetype',
        progress: 10,
        nextAction: {
          label: 'Select Business Type',
          action: 'select_archetype',
          description: 'Choose the archetype that best describes your business',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/setup/archetype
 * Select business archetype
 */
router.put('/archetype', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = selectArchetypeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      });
    }
    
    const { archetypeKey } = validation.data;
    
    // Verify archetype exists
    const archetype = await BusinessArchetype.findOne({ key: archetypeKey, isActive: true });
    if (!archetype) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ARCHETYPE', message: 'Archetype not found' },
      });
    }
    
    // Update profile
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { 
        archetypeKey,
        $set: { 'readinessFlags.archetypeSelected': true },
      },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found. Start setup first.' },
      });
    }
    
    res.json({
      success: true,
      data: {
        archetypeKey,
        archetypeName: archetype.name,
        recommendedEntityTypes: archetype.recommendedEntityTypes,
        currentStep: 'entity_type',
        progress: 25,
        nextAction: {
          label: 'Select Entity Type',
          action: 'select_entity_type',
          description: `Recommended for ${archetype.name}: ${archetype.recommendedEntityTypes.join(', ')}`,
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/setup/entity-type
 * Select entity type
 */
router.put('/entity-type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = selectEntityTypeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid entity type' },
      });
    }
    
    const { entityType } = validation.data;
    
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { 
        businessType: entityType,
        $set: { 'readinessFlags.entitySelected': true },
      },
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
        entityType,
        currentStep: 'state',
        progress: 40,
        nextAction: {
          label: 'Select Formation State',
          action: 'select_state',
          description: 'Choose the state where you will form your business',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/setup/state
 * Select formation state
 */
router.put('/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = selectStateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid state code' },
      });
    }
    
    const { state } = validation.data;
    
    // Verify state is valid
    if (!Object.values(USState).includes(state as any)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Invalid US state code' },
      });
    }
    
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { 
        formationState: state,
        $set: { 'readinessFlags.stateSelected': true },
      },
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
        state,
        currentStep: 'business_info',
        progress: 55,
        nextAction: {
          label: 'Complete Business Information',
          action: 'complete_info',
          description: 'Provide your business address and contact details',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/setup/complete
 * Complete the setup wizard and start formation workflow
 */
router.post('/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = completeSetupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      });
    }
    
    const { businessName, dbaName, email, phone } = validation.data;
    
    // Verify profile exists and has required fields
    const profile = await BusinessProfile.findOne({ tenantId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    if (!profile.archetypeKey || !profile.businessType || !profile.formationState) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INCOMPLETE_SETUP', 
          message: 'Please complete archetype, entity type, and state selection first',
        },
      });
    }
    
    // Update profile
    profile.businessName = businessName;
    profile.dbaName = dbaName;
    profile.email = email;
    profile.phone = phone;
    profile.formationStatus = 'in_progress' as any;
    profile.setupCompletedAt = new Date();
    await profile.save();
    
    // Create audit log
    await AuditLog.create({
      tenantId,
      userId,
      userEmail: email,
      userRole: req.user?.role || 'client_owner',
      action: AuditAction.BUSINESS_PROFILE_UPDATED,
      resourceType: 'business_profile',
      resourceId: profile._id.toString(),
      newState: { setupCompleted: true },
    });
    
    res.json({
      success: true,
      data: {
        businessProfileId: profile._id.toString(),
        setupComplete: true,
        progress: 100,
        nextStep: 'formation',
        nextAction: {
          label: 'Start Business Formation',
          action: 'start_formation',
          route: '/app/formation',
          description: 'Begin the formation process for your business',
        },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
