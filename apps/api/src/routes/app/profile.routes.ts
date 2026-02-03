/**
 * Profile Routes
 * Business profile management endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusinessProfile, Person, BusinessArchetype } from '../../db/models/index.js';
import { USState, isValidStateCode, getStatePortal, STATE_CODES } from '@change/shared';

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
    
    // Build update object with readiness flags
    const updateObj: Record<string, unknown> = { ...updateData };
    
    // Auto-update readiness flags based on what was updated
    if (updateData.businessAddress) {
      // Check if address is complete (all required fields)
      const addr = updateData.businessAddress;
      if (addr.street1 && addr.city && addr.state && addr.zipCode) {
        updateObj['readinessFlags.addressVerified'] = true;
      }
    }
    
    if (updateData.registeredAgent) {
      // Check if registered agent is complete
      const agent = updateData.registeredAgent;
      if (agent.name && agent.address?.street1 && agent.address?.city && agent.address?.state && agent.address?.zipCode) {
        updateObj['readinessFlags.registeredAgentSet'] = true;
      }
    }
    
    // Update profile
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { $set: updateObj },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    // Recalculate profile completeness
    const flags = profile.readinessFlags || {};
    const flagsSet = Object.values(flags).filter(Boolean).length;
    const totalFlags = 11;
    const profileCompleteness = Math.round((flagsSet / totalFlags) * 100);
    
    // Update completeness if changed
    if (profile.profileCompleteness !== profileCompleteness) {
      await BusinessProfile.updateOne(
        { _id: profile._id },
        { $set: { profileCompleteness } }
      );
    }
    
    res.json({
      success: true,
      data: {
        id: profile._id.toString(),
        profileCompleteness,
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

// Owner validation schema
const ownerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  ownershipPercentage: z.number().min(0).max(100),
  email: z.string().email().optional(),
});

const addOwnersSchema = z.object({
  owners: z.array(ownerSchema).min(1),
});

// Map frontend title to Person role type
function titleToRoleType(title: string): 'owner' | 'member' | 'manager' | 'officer' | 'director' {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('director')) return 'director';
  if (lowerTitle.includes('officer') || lowerTitle.includes('ceo') || lowerTitle.includes('president')) return 'officer';
  if (lowerTitle.includes('manager') || lowerTitle.includes('managing')) return 'manager';
  if (lowerTitle.includes('member')) return 'member';
  return 'owner';
}

/**
 * POST /app/profile/owners
 * Add or replace owners/officers
 */
router.post('/owners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const validation = addOwnersSchema.safeParse(req.body);
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
    
    const { owners } = validation.data;
    
    // Validate total ownership equals 100%
    const totalOwnership = owners.reduce((sum, o) => sum + o.ownershipPercentage, 0);
    if (totalOwnership !== 100) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_OWNERSHIP', 
          message: `Total ownership must equal 100%, got ${totalOwnership}%`,
        },
      });
    }
    
    const profile = await BusinessProfile.findOne({ tenantId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    // Delete existing owners for this profile
    await Person.deleteMany({ 
      tenantId, 
      businessProfileId: profile._id,
    });
    
    // Create new owner records with proper schema
    const ownerDocs = owners.map(owner => ({
      tenantId,
      businessProfileId: profile._id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email || `${owner.firstName.toLowerCase()}.${owner.lastName.toLowerCase()}@placeholder.local`,
      ownershipPercentage: owner.ownershipPercentage,
      roles: [{
        type: titleToRoleType(owner.title),
        title: owner.title,
        startDate: new Date(),
      }],
      isSigningAuthority: owner.ownershipPercentage >= 25,
      isPrimaryContact: false,
    }));
    
    // Set first owner as primary contact
    if (ownerDocs.length > 0) {
      ownerDocs[0].isPrimaryContact = true;
    }
    
    await Person.insertMany(ownerDocs);
    
    // Update readiness flag
    await BusinessProfile.updateOne(
      { _id: profile._id },
      { $set: { 'readinessFlags.ownersAdded': true } }
    );
    
    res.json({
      success: true,
      data: {
        ownersCount: owners.length,
        readinessFlags: { ...profile.readinessFlags, ownersAdded: true },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/profile/formation-status
 * Update formation status (SOS filing complete)
 */
router.post('/formation-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status } = req.body;
    
    if (!['pending', 'filed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid formation status' },
      });
    }
    
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { 
        $set: { 
          formationStatus: status,
          'readinessFlags.sosFilingComplete': status === 'filed' || status === 'approved',
        } 
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
        formationStatus: profile.formationStatus,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/profile/ein-status
 * Update EIN status
 */
router.post('/ein-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status, einNumber } = req.body;
    
    if (!['pending', 'applied', 'received'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid EIN status' },
      });
    }
    
    const updateData: Record<string, unknown> = { 
      einStatus: status,
      'readinessFlags.einReceived': status === 'received',
    };
    
    if (einNumber) {
      updateData.einNumber = einNumber;
    }
    
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
        einStatus: profile.einStatus,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/profile/formation-state
 * Update business formation state with validation against registry
 */
router.put('/formation-state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { stateCode } = req.body;
    
    if (!stateCode || typeof stateCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_STATE', message: 'State code is required' },
      });
    }
    
    const upperCode = stateCode.toUpperCase();
    
    // Validate against registry
    if (!isValidStateCode(upperCode)) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_STATE_CODE', 
          message: `Invalid state code: ${stateCode}. Must be a valid US state or DC.`,
          validCodes: STATE_CODES,
        },
      });
    }
    
    // Get portal info for response
    const portal = getStatePortal(upperCode);
    
    const profile = await BusinessProfile.findOneAndUpdate(
      { tenantId },
      { 
        $set: { 
          formationState: upperCode,
          'readinessFlags.stateSelected': true,
        } 
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
        formationState: profile.formationState,
        statePortal: portal,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /app/profile/state-portal
 * Get the state filing portal info for the current profile's formation state
 */
router.get('/state-portal', async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    if (!profile.formationState) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_STATE', message: 'Formation state not set on profile' },
      });
    }
    
    const portal = getStatePortal(profile.formationState);
    
    if (!portal) {
      return res.status(404).json({
        success: false,
        error: { code: 'PORTAL_NOT_FOUND', message: 'State portal not found for formation state' },
      });
    }
    
    res.json({
      success: true,
      data: {
        formationState: profile.formationState,
        portal,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// OPERATIONS ENDPOINTS
// =============================================================================

/**
 * POST /app/profile/banking-status
 * Update business banking status
 */
router.post('/banking-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status, bankAccount } = req.body;
    
    if (!['not_started', 'researching', 'application_submitted', 'account_opened', 'verified'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid banking status' },
      });
    }
    
    const updateData: Record<string, unknown> = { 
      bankingStatus: status,
      'readinessFlags.bankAccountOpened': status === 'account_opened' || status === 'verified',
    };
    
    if (bankAccount) {
      updateData.bankAccount = {
        bankName: bankAccount.bankName,
        accountType: bankAccount.accountType,
        lastFourDigits: bankAccount.lastFourDigits,
        openedDate: bankAccount.openedDate ? new Date(bankAccount.openedDate) : new Date(),
        verifiedAt: status === 'verified' ? new Date() : undefined,
      };
    }
    
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
        bankingStatus: profile.bankingStatus,
        bankAccount: profile.bankAccount,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/profile/operating-agreement-status
 * Update operating agreement status
 */
router.post('/operating-agreement-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status, operatingAgreement } = req.body;
    
    if (!['not_started', 'drafting', 'review', 'signed', 'filed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid operating agreement status' },
      });
    }
    
    const updateData: Record<string, unknown> = { 
      operatingAgreementStatus: status,
      'readinessFlags.operatingAgreementSigned': status === 'signed' || status === 'filed',
    };
    
    if (operatingAgreement) {
      updateData.operatingAgreement = {
        type: operatingAgreement.type,
        signedDate: operatingAgreement.signedDate ? new Date(operatingAgreement.signedDate) : undefined,
        signatories: operatingAgreement.signatories || [],
      };
    }
    
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
        operatingAgreementStatus: profile.operatingAgreementStatus,
        operatingAgreement: profile.operatingAgreement,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /app/profile/compliance-calendar-status
 * Update compliance calendar status
 */
router.post('/compliance-calendar-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status, complianceItems } = req.body;
    
    if (!['not_started', 'setup_in_progress', 'active'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Invalid compliance calendar status' },
      });
    }
    
    const updateData: Record<string, unknown> = { 
      complianceCalendarStatus: status,
      'readinessFlags.complianceCalendarSetup': status === 'active',
    };
    
    if (complianceItems && Array.isArray(complianceItems)) {
      updateData.complianceItems = complianceItems.map((item: any) => ({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        description: item.description,
        dueDate: new Date(item.dueDate),
        frequency: item.frequency,
        category: item.category,
        status: item.status || 'pending',
        completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
        reminderDays: item.reminderDays || 30,
      }));
    }
    
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
        complianceCalendarStatus: profile.complianceCalendarStatus,
        complianceItems: profile.complianceItems,
        readinessFlags: profile.readinessFlags,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /app/profile/compliance-item/:itemId
 * Update a single compliance item
 */
router.put('/compliance-item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { itemId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    const { status, completedAt } = req.body;
    
    const profile = await BusinessProfile.findOne({ tenantId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business profile not found' },
      });
    }
    
    const items = profile.complianceItems || [];
    const itemIndex = items.findIndex((i: any) => i.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Compliance item not found' },
      });
    }
    
    // Update the item
    if (status) {
      items[itemIndex].status = status;
    }
    if (status === 'completed') {
      items[itemIndex].completedAt = completedAt ? new Date(completedAt) : new Date();
    }
    
    await BusinessProfile.updateOne(
      { _id: profile._id },
      { $set: { complianceItems: items } }
    );
    
    res.json({
      success: true,
      data: {
        item: items[itemIndex],
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
