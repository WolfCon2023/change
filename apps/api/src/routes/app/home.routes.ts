/**
 * Home Routes
 * Today view and dashboard data
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { BusinessProfile, BusinessArchetype, Task, WorkflowInstance } from '../../db/models/index.js';

const router = Router();

/**
 * GET /app/home
 * Get today view data: next action, progress, blockers
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;
    
    // Debug logging
    console.log('[home.routes] Request user:', {
      hasUser: !!req.user,
      userId: req.user?.userId,
      tenantId: req.user?.tenantId,
      email: req.user?.email,
    });
    
    if (!tenantId) {
      console.error('[home.routes] NO_TENANT error - user object:', JSON.stringify(req.user));
      return res.status(400).json({
        success: false,
        error: { 
          code: 'NO_TENANT', 
          message: 'User must belong to a tenant. Please log out and log back in.',
          debug: {
            hasUser: !!req.user,
            hasUserId: !!userId,
            hasTenantId: !!tenantId,
          }
        },
      });
    }
    
    // Get business profile
    const profile = await BusinessProfile.findOne({ tenantId }).lean();
    
    // If no profile, return setup prompt
    if (!profile) {
      return res.json({
        success: true,
        data: {
          hasSetup: false,
          progress: {
            overall: 0,
            setup: 0,
            formation: 0,
            operations: 0,
          },
          nextAction: {
            id: 'start-setup',
            type: 'milestone',
            title: 'Start Your Business Journey',
            description: 'Begin by setting up your business profile and selecting your business type',
            priority: 'high',
            action: 'navigate',
            route: '/app/setup',
            buttonLabel: 'Get Started',
          },
          blockers: [],
          tasks: [],
          approvals: [],
          alerts: [
            {
              id: 'welcome',
              type: 'info',
              title: 'Welcome to CHANGE',
              message: 'This platform will guide you through forming and operating your business.',
            },
          ],
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    
    // Get archetype info
    let archetype = null;
    if (profile.archetypeKey) {
      archetype = await BusinessArchetype.findOne({ key: profile.archetypeKey })
        .select('key name icon')
        .lean();
    }
    
    // Get active workflow
    const activeWorkflow = await WorkflowInstance.findOne({
      tenantId,
      businessProfileId: profile._id,
      status: { $in: ['not_started', 'in_progress', 'pending_review'] },
    }).lean();
    
    // Get pending tasks
    const pendingTasks = await Task.find({
      tenantId,
      status: { $in: ['pending', 'in_progress'] },
    })
      .sort({ priority: -1, dueDate: 1 })
      .limit(5)
      .lean();
    
    // Calculate progress
    const flags = profile.readinessFlags || {};
    const setupProgress = calculateSetupProgress(profile);
    const formationProgress = calculateFormationProgress(profile);
    const operationsProgress = calculateOperationsProgress(profile);
    const overallProgress = Math.round((setupProgress + formationProgress + operationsProgress) / 3);
    
    // Determine blockers
    const blockers: Array<{ id: string; type: string; title: string; description: string; route?: string }> = [];
    
    if (!flags.archetypeSelected) {
      blockers.push({
        id: 'archetype',
        type: 'setup',
        title: 'Business Archetype Required',
        description: 'Select a business archetype to get personalized guidance',
        route: '/app/setup?step=archetype',
      });
    }
    
    if (!flags.entitySelected) {
      blockers.push({
        id: 'entity',
        type: 'setup',
        title: 'Entity Type Required',
        description: 'Choose your legal entity structure',
        route: '/app/setup?step=entity',
      });
    }
    
    if (!flags.stateSelected) {
      blockers.push({
        id: 'state',
        type: 'setup',
        title: 'Formation State Required',
        description: 'Select the state where you will form your business',
        route: '/app/setup?step=state',
      });
    }
    
    if (!flags.addressVerified && setupProgress >= 50) {
      blockers.push({
        id: 'address',
        type: 'formation',
        title: 'Business Address Required',
        description: 'Add your principal business address',
        route: '/app/formation',
      });
    }
    
    if (!flags.registeredAgentSet && setupProgress >= 50) {
      blockers.push({
        id: 'agent',
        type: 'formation',
        title: 'Registered Agent Required',
        description: 'Designate a registered agent for your business',
        route: '/app/formation',
      });
    }
    
    // Determine next action
    let nextAction = determineNextAction(profile, flags, setupProgress, activeWorkflow);
    
    // Transform tasks
    const tasks = pendingTasks.map(t => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
      category: t.category,
    }));
    
    res.json({
      success: true,
      data: {
        hasSetup: true,
        business: {
          name: profile.businessName,
          type: profile.businessType,
          state: profile.formationState,
          archetype: archetype ? {
            key: archetype.key,
            name: archetype.name,
            icon: archetype.icon,
          } : null,
        },
        progress: {
          overall: overallProgress,
          setup: setupProgress,
          formation: formationProgress,
          operations: operationsProgress,
        },
        nextAction,
        blockers,
        tasks,
        approvals: [], // Will be populated when approval system is implemented
        alerts: [],
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Calculate setup progress percentage
 */
function calculateSetupProgress(profile: any): number {
  let progress = 0;
  
  if (profile.businessName) progress += 15;
  if (profile.email) progress += 10;
  if (profile.archetypeKey) progress += 25;
  if (profile.businessType) progress += 25;
  if (profile.formationState) progress += 25;
  
  return Math.min(progress, 100);
}

/**
 * Calculate formation progress percentage
 */
function calculateFormationProgress(profile: any): number {
  if (!profile.archetypeKey || !profile.businessType || !profile.formationState) {
    return 0;
  }
  
  let progress = 0;
  const flags = profile.readinessFlags || {};
  
  // Address and Registered Agent (20% each)
  if (flags.addressVerified) progress += 20;
  if (flags.registeredAgentSet) progress += 20;
  
  // Owners added (10%)
  if (flags.ownersAdded) progress += 10;
  
  // Formation filed (25%)
  if (profile.formationStatus === 'filed' || profile.formationStatus === 'approved') progress += 25;
  
  // EIN received (25%)
  if (profile.einStatus === 'received') progress += 25;
  
  return Math.min(progress, 100);
}

/**
 * Calculate operations progress percentage
 */
function calculateOperationsProgress(profile: any): number {
  // Operations requires formation to be complete
  if (profile.einStatus !== 'received' && 
      profile.formationStatus !== 'filed' && 
      profile.formationStatus !== 'approved') {
    return 0;
  }
  
  let progress = 0;
  const flags = profile.readinessFlags || {};
  
  // Bank account opened (33%)
  if (flags.bankAccountOpened) progress += 33;
  
  // Operating agreement signed (33%)
  if (flags.operatingAgreementSigned) progress += 33;
  
  // Compliance calendar set up (34%)
  if (flags.complianceCalendarSetup) progress += 34;
  
  return Math.min(progress, 100);
}

/**
 * Determine the next best action for the user
 */
function determineNextAction(profile: any, flags: any, setupProgress: number, activeWorkflow: any) {
  // Setup not complete
  if (setupProgress < 100) {
    if (!profile.archetypeKey) {
      return {
        id: 'select-archetype',
        type: 'milestone',
        title: 'Select Your Business Type',
        description: 'Choose the archetype that best describes your business to get personalized guidance',
        priority: 'high',
        action: 'navigate',
        route: '/app/setup?step=archetype',
        buttonLabel: 'Select Archetype',
      };
    }
    
    if (!profile.businessType) {
      return {
        id: 'select-entity',
        type: 'milestone',
        title: 'Choose Your Entity Structure',
        description: 'Select LLC, Corporation, or another entity type',
        priority: 'high',
        action: 'navigate',
        route: '/app/setup?step=entity',
        buttonLabel: 'Select Entity Type',
      };
    }
    
    if (!profile.formationState) {
      return {
        id: 'select-state',
        type: 'milestone',
        title: 'Select Formation State',
        description: 'Choose the state where your business will be formed',
        priority: 'high',
        action: 'navigate',
        route: '/app/setup?step=state',
        buttonLabel: 'Select State',
      };
    }
    
    return {
      id: 'complete-setup',
      type: 'milestone',
      title: 'Complete Business Setup',
      description: 'Finish setting up your business profile',
      priority: 'high',
      action: 'navigate',
      route: '/app/setup',
      buttonLabel: 'Complete Setup',
    };
  }
  
  // Setup complete, check formation status
  if (profile.formationStatus === 'not_started' || profile.formationStatus === 'in_progress') {
    if (!flags.addressVerified) {
      return {
        id: 'add-address',
        type: 'task',
        title: 'Add Business Address',
        description: 'Provide your principal business address for formation documents',
        priority: 'high',
        action: 'navigate',
        route: '/app/formation',
        buttonLabel: 'Add Address',
      };
    }
    
    if (!flags.registeredAgentSet) {
      return {
        id: 'set-agent',
        type: 'task',
        title: 'Set Up Registered Agent',
        description: 'Designate a registered agent to receive legal documents',
        priority: 'high',
        action: 'navigate',
        route: '/app/formation',
        buttonLabel: 'Set Agent',
      };
    }
    
    if (!flags.ownersAdded) {
      return {
        id: 'add-owners',
        type: 'task',
        title: 'Add Owners and Officers',
        description: 'Add the people who will own and manage your business',
        priority: 'high',
        action: 'navigate',
        route: '/app/formation',
        buttonLabel: 'Add People',
      };
    }
    
    return {
      id: 'continue-formation',
      type: 'milestone',
      title: 'Continue Formation Process',
      description: 'Complete the remaining formation steps',
      priority: 'high',
      action: 'navigate',
      route: '/app/formation',
      buttonLabel: 'Continue',
    };
  }
  
  // Formation filed, waiting for EIN
  if (profile.formationStatus === 'filed' || profile.formationStatus === 'approved') {
    if (profile.einStatus === 'not_started') {
      return {
        id: 'start-ein',
        type: 'milestone',
        title: 'Apply for EIN',
        description: 'Get your Employer Identification Number from the IRS',
        priority: 'high',
        action: 'navigate',
        route: '/app/formation',
        buttonLabel: 'Start EIN Application',
      };
    }
    
    if (profile.einStatus === 'pending' || profile.einStatus === 'application_submitted') {
      return {
        id: 'ein-pending',
        type: 'waiting',
        title: 'EIN Application Pending',
        description: 'Your EIN application has been submitted. Upload confirmation when received.',
        priority: 'medium',
        action: 'navigate',
        route: '/app/formation',
        buttonLabel: 'Upload Confirmation',
      };
    }
  }
  
  // Everything complete
  return {
    id: 'view-dashboard',
    type: 'info',
    title: 'Business Formation Complete',
    description: 'Your business is formed. View your dashboard to start operations.',
    priority: 'low',
    action: 'navigate',
    route: '/app/dashboards',
    buttonLabel: 'View Dashboard',
  };
}

export default router;
